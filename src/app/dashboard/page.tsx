import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function maskPhone(phone: string) {
  return phone.slice(0, -4) + '****'
}

function formatCents(cents: number) {
  return '₹' + (cents / 100).toFixed(2)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!restaurant) redirect('/dashboard/create')

  const [{ data: customers }, { data: recentLogs }] = await Promise.all([
    supabase
      .from('customers')
      .select('id')
      .eq('restaurant_id', restaurant.id),
    supabase
      .from('message_logs')
      .select('id, type, status, created_at, customers(phone)')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const customerCount = customers?.length ?? 0
  const credits = restaurant.credits ?? 0
  const creditPct = Math.min(100, Math.round((credits / 1000) * 100))

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      {/* Header */}
      <h1
        data-testid="restaurant-name"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          color: 'var(--color-foreground)',
          marginBottom: '0.25rem',
        }}
      >
        {restaurant.name}
      </h1>
      <p style={{ color: 'var(--color-foreground)', opacity: 0.5, marginBottom: '2rem', fontFamily: 'var(--font-body)' }}>
        Dashboard Overview
      </p>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Guests" value={String(customerCount)} href="/dashboard/customers" />
        <StatCard label="Credits Remaining" value={String(credits)} href="#" />
      </div>

      {/* Quick nav cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <QuickNavCard href="/dashboard/customers" title="Active Guests" description="View all registered customers" />
        <QuickNavCard href="/dashboard/coupons" title="Coupons" description="Manage issued coupons" />
        <QuickNavCard href="/dashboard/validate" title="Validate Coupon" description="Redeem and validate customer coupons" />
        <QuickNavCard href="/dashboard/settings" title="Settings" description="Manage restaurant and buy credits" />
      </div>

      {/* Credits progress */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-foreground)', marginBottom: '1rem' }}>
          Credits
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-foreground)' }}>
            {credits}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-foreground)', opacity: 0.5, alignSelf: 'flex-end' }}>
            / 1000 credits
          </span>
        </div>
        <svg width="100%" height="10" role="progressbar" aria-valuenow={credits} aria-valuemin={0} aria-valuemax={1000} aria-label={`${credits} of 1000 credits`}>
          <rect x="0" y="0" width="100%" height="10" rx="5" fill="var(--color-border)" />
          <rect x="0" y="0" width={`${creditPct}%`} height="10" rx="5" fill="#22C55E" style={{ transition: 'width 600ms ease' }} />
        </svg>
      </section>

      {/* Recent Activity Feed */}
      <section
        data-testid="recent-activity"
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-foreground)', marginBottom: '1rem' }}>
          Recent Activity
        </h2>

        {!recentLogs || recentLogs.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-foreground)', opacity: 0.5, fontSize: '0.875rem' }}>
            No activity yet. Customers will appear here once they interact.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentLogs.map((log) => {
              const phone = (log.customers as unknown as { phone: string } | null)?.phone
              return (
                <li
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--color-border)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                  }}
                >
                  <span style={{ fontFamily: 'monospace', color: 'var(--color-foreground)', minWidth: '120px' }}>
                    {phone ? maskPhone(phone) : 'Unknown'}
                  </span>
                  <span style={{ color: 'var(--color-foreground)', opacity: 0.6, flex: 1 }}>
                    → Outbound ({log.type})
                  </span>
                  <StatusBadge status={log.status} />
                  <span style={{ color: 'var(--color-foreground)', opacity: 0.4, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        background: '#FFFFFF',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        boxShadow: 'var(--shadow-sm)',
        textDecoration: 'none',
        transition: 'box-shadow 200ms, transform 200ms',
        cursor: 'pointer',
      }}
      className="dash-stat-card"
    >
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-foreground)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-primary)', fontWeight: 700 }}>
        {value}
      </p>
    </Link>
  )
}

function QuickNavCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="dash-quick-card"
    >
      <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '0.25rem' }}>
        {title}
      </h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-foreground)', opacity: 0.55 }}>
        {description}
      </p>
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isSent = status === 'sent'
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        background: isSent ? '#DCFCE7' : '#FEE2E2',
        color: isSent ? '#166534' : '#991B1B',
      }}
    >
      {status}
    </span>
  )
}
