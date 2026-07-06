'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Ticket,
  BarChart2,
  ScanLine,
  Settings,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',           label: 'Overview',   icon: LayoutDashboard, exact: true },
  { href: '/dashboard/customers', label: 'Guests',     icon: Users },
  { href: '/dashboard/campaigns', label: 'Campaigns',  icon: Megaphone },
  { href: '/dashboard/coupons',   label: 'Coupons',    icon: Ticket },
  { href: '/dashboard/analytics', label: 'Analytics',  icon: BarChart2 },
  { href: '/dashboard/validate',  label: 'POS Billing', icon: ScanLine },
  { href: '/dashboard/settings',  label: 'Settings',   icon: Settings },
]

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column' }}>
      <div>
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              data-active={isActive ? 'true' : undefined}
              className="dash-nav-link"
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>

      <button
        onClick={handleSignOut}
        data-testid="nav-sign-out"
        className="dash-nav-link w-full text-left"
        style={{ marginTop: 'auto', border: 'none', background: 'transparent' }}
      >
        <LogOut className="w-4 h-4 shrink-0" />
        <span>Sign Out</span>
      </button>
    </nav>
  )
}
