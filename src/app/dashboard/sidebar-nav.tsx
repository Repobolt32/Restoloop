'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Ticket,
  BarChart2,
  ScanLine,
  Settings,
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

  return (
    <nav style={{ flex: 1, padding: '16px 12px' }}>
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
    </nav>
  )
}
