import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, credits')
    .eq('owner_id', user.id)
    .maybeSingle()

  const credits = restaurant?.credits ?? 0
  const creditPct = Math.min(100, Math.round((credits / 1000) * 100))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* Sidebar */}
      <aside
        data-testid="dashboard-sidebar"
        style={{
          width: '288px',
          flexShrink: 0,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-grey-100)',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--color-grey-100)' }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 900,
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
            }}
          >
            Restoloop
          </span>
          {restaurant && (
            <p style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--color-grey-800)',
              marginTop: '6px',
              fontFamily: 'var(--font-body)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {restaurant.name}
            </p>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <NavLink href="/dashboard" label="Overview" />
          <NavLink href="/dashboard/customers" label="Guests" />
          <NavLink href="/dashboard/campaigns" label="Campaigns" />
          <NavLink href="/dashboard/coupons" label="Coupons" />
          <NavLink href="/dashboard/analytics" label="Analytics" />
          <NavLink href="/dashboard/validate" label="Validate" />
          <NavLink href="/dashboard/settings" label="Settings" />
        </nav>

        {/* Credits indicator */}
        <div
          data-testid="credits-indicator"
          style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--color-grey-100)',
          }}
        >
          <p className="section-label" style={{ marginBottom: '8px' }}>
            Credits
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              color: 'var(--color-grey-800)',
              fontFamily: 'var(--font-mono)',
            }}>
              {credits}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--color-grey-400)',
              alignSelf: 'flex-end',
            }}>
              / 1000
            </span>
          </div>
          <svg width="100%" height="6" role="progressbar" aria-valuenow={credits} aria-valuemin={0} aria-valuemax={1000}>
            <rect x="0" y="0" width="100%" height="6" rx="3" fill="var(--color-grey-100)" />
            <rect x="0" y="0" width={`${creditPct}%`} height="6" rx="3" fill="var(--color-accent)" />
          </svg>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, animation: 'fade-in 0.2s ease-out' }}>
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="dash-nav-link"
    >
      {label}
    </Link>
  )
}
