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
          width: '240px',
          flexShrink: 0,
          background: '#F9FAFB',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              letterSpacing: '0.02em',
            }}
          >
            Restoloop
          </span>
          {restaurant && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-foreground)', opacity: 0.6, marginTop: '4px', fontFamily: 'var(--font-body)' }}>
              {restaurant.name}
            </p>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <NavLink href="/dashboard" label="Overview" />
          <NavLink href="/dashboard/customers" label="Guests" />
          <NavLink href="/dashboard/coupons" label="Coupons" />
          <NavLink href="/dashboard/validate" label="Validate Coupon" />
          <NavLink href="/dashboard/settings" label="Settings" />
        </nav>

        {/* Credits indicator */}
        <div
          data-testid="credits-indicator"
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-foreground)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Credits
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-foreground)' }}>{credits}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-foreground)', opacity: 0.5 }}>/ 1000</span>
          </div>
          {/* SVG progress bar */}
          <svg width="100%" height="8" role="progressbar" aria-valuenow={credits} aria-valuemin={0} aria-valuemax={1000}>
            <rect x="0" y="0" width="100%" height="8" rx="4" fill="var(--color-border)" />
            <rect x="0" y="0" width={`${creditPct}%`} height="8" rx="4" fill="#22C55E" />
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
