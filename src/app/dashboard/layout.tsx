import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SidebarNav } from './sidebar-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (user.email === 'admin@restoloop.com') {
    redirect('/admin')
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, credits, plan, trial_activated_at, trial_expires_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()


  const plan = restaurant?.plan ?? 'free'
  const trialActivatedAt = restaurant?.trial_activated_at
  const trialExpiresAt = restaurant?.trial_expires_at
  const credits = restaurant?.credits ?? 0
  const creditPct = Math.min(100, Math.round((credits / 1000) * 100))

  let isTrialActive = false
  let trialDaysLeft = 0

  if (plan === 'trial' && trialExpiresAt) {
    const expiryDate = new Date(trialExpiresAt)
    const now = new Date()
    isTrialActive = expiryDate >= now
    if (isTrialActive) {
      trialDaysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }
  }

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
        <SidebarNav />

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
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header containing progress widget */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '24px 32px 0 32px',
          }}
        >
          <Link
            href="/dashboard/settings"
            data-testid="header-trial-widget"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '9999px',
              background: 'white',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            {isTrialActive ? (
              <>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⚡ Trial Plan
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', background: 'var(--color-primary)', padding: '2px 8px', borderRadius: '9999px', fontFamily: 'var(--font-mono)' }}>
                  {trialDaysLeft}d left
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: credits < 200 ? 'var(--color-destructive)' : 'var(--color-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {credits < 200 ? '⚠️ Low Credits' : '🪙 Credits'}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', background: credits < 200 ? 'var(--color-destructive)' : 'var(--color-foreground)', padding: '2px 8px', borderRadius: '9999px', fontFamily: 'var(--font-mono)' }}>
                  {credits}
                </span>
                {credits < 200 && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-destructive)', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '4px' }}>
                    Please top up
                  </span>
                )}
              </>
            )}
          </Link>
        </header>
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>

    </div>
  )
}

