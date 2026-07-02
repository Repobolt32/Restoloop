import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function maskPhone(phone: string) {
  return phone.slice(0, -4) + '****'
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
    <div className="p-8 max-w-[900px]">
      {/* Header */}
      <h1
        data-testid="restaurant-name"
        className="text-3xl font-black tracking-tight text-[--color-foreground] mb-1 font-display uppercase"
      >
        {restaurant.name}
      </h1>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent] mb-8">
        Dashboard Overview
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <StatCard label="Total Guests" value={String(customerCount)} href="/dashboard/customers" />
        <StatCard label="Credits Remaining" value={String(credits)} href="#" />
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <QuickNavCard href="/dashboard/customers" title="Active Guests" description="View all registered customers" />
        <QuickNavCard href="/dashboard/coupons" title="Coupons" description="Manage issued coupons" />
        <QuickNavCard href="/dashboard/validate" title="Validate Coupon" description="Redeem and validate customer coupons" />
        <QuickNavCard href="/dashboard/settings" title="Settings" description="Manage restaurant and buy credits" />
      </div>

      {/* Credits progress */}
      <section className="bg-white border border-[--color-border] rounded-2xl p-6 shadow-md mb-8">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--color-foreground] mb-4 font-display">
          Credits
        </h2>
        <div className="flex justify-between items-end mb-3">
          <span className="text-3xl font-black text-[--color-accent] font-mono">
            {credits}
          </span>
          <span className="text-xs font-bold text-[--color-grey-500]">
            / 1000 credits
          </span>
        </div>
        <svg width="100%" height="10" role="progressbar" aria-valuenow={credits} aria-valuemin={0} aria-valuemax={1000} aria-label={`${credits} of 1000 credits`}>
          <rect x="0" y="0" width="100%" height="10" rx="5" fill="var(--color-border)" />
          <rect x="0" y="0" width={`${creditPct}%`} height="10" rx="5" fill="var(--color-accent)" style={{ transition: 'width 600ms ease' }} />
        </svg>
      </section>

      {/* Recent Activity Feed */}
      <section
        data-testid="recent-activity"
        className="bg-white border border-[--color-border] rounded-2xl p-6 shadow-md"
      >
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--color-foreground] mb-4 font-display">
          Recent Activity
        </h2>

        {!recentLogs || recentLogs.length === 0 ? (
          <p className="text-sm font-bold text-[--color-grey-500]">
            No activity yet. Customers will appear here once they interact.
          </p>
        ) : (
          <ul className="list-none p-0 m-0 flex flex-col gap-3">
            {recentLogs.map((log) => {
              const phone = (log.customers as unknown as { phone: string } | null)?.phone
              return (
                <li
                  key={log.id}
                  className="flex items-center gap-3 pb-3 border-b border-[--color-border] text-sm font-bold last:border-b-0 last:pb-0"
                >
                  <span className="font-mono text-[--color-foreground] min-w-[120px]">
                    {phone ? maskPhone(phone) : 'Unknown'}
                  </span>
                  <span className="text-[--color-grey-500] flex-1">
                    → Outbound ({log.type})
                  </span>
                  <StatusBadge status={log.status} />
                  <span className="text-[10px] text-[--color-grey-500] white-space-nowrap">
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
      className="dash-stat-card group"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-grey-500] mb-1">
        {label}
      </p>
      <p className="text-3xl font-black text-[--color-primary] font-display">
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
      <h3 className="text-sm font-black uppercase tracking-wider text-[--color-foreground] mb-1">
        {title}
      </h3>
      <p className="text-xs font-bold text-[--color-grey-500] leading-relaxed">
        {description}
      </p>
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isSent = status === 'sent'
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
        isSent
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
          : 'bg-red-50 text-red-700 border-red-100'
      }`}
    >
      {status}
    </span>
  )
}
