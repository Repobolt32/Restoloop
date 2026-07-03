import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Zap, Gift, TrendingUp, UserCheck } from 'lucide-react'
import { maskPhone } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!restaurant) redirect('/dashboard/create')

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [{ data: customers }, { data: recentLogs }, { data: allCoupons }, { data: retainedData }, { data: monthlyCoupons }] = await Promise.all([
    supabase
      .from('customers')
      .select('id, last_visit_at')
      .eq('restaurant_id', restaurant.id),
    supabase
      .from('message_logs')
      .select('id, type, status, direction, created_at, customers(phone)')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('coupons')
      .select('id, type, status')
      .eq('restaurant_id', restaurant.id),
    supabase
      .from('coupons')
      .select('customer_id')
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'redeemed'),
    supabase
      .from('coupons')
      .select('bill_amount_cents, discount_amount_cents')
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'redeemed')
      .gte('redeemed_at', startOfMonth.toISOString()),
  ])

  const customerCount = customers?.length ?? 0
  const credits = restaurant.credits ?? 0
  const totalCoupons = allCoupons?.length ?? 0
  const redeemedCoupons = allCoupons?.filter(c => c.status === 'redeemed').length ?? 0
  const redemptionRate = totalCoupons > 0 ? Math.round((redeemedCoupons / totalCoupons) * 100) : 0
  const activeCustomers = customers?.filter(c => {
    if (!c.last_visit_at) return false
    return new Date(c.last_visit_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }).length ?? 0

  // Unique retained customers (ever redeemed a coupon)
  const retainedCount = new Set((retainedData || []).map(c => c.customer_id)).size

  // Monthly revenue = bill_amount_cents - discount_amount_cents summed
  const monthlyRevenueCents = (monthlyCoupons || []).reduce(
    (sum, c) => sum + ((c.bill_amount_cents ?? 0) - (c.discount_amount_cents ?? 0)),
    0
  )
  const monthlyRevenueDisplay = monthlyRevenueCents > 0
    ? `₹${(monthlyRevenueCents / 100).toFixed(0)}`
    : '₹0'

  return (
    <div className="p-8 max-w-6xl mx-auto">
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

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Retained Customers"
          value={String(retainedCount)}
          sub={`${activeCustomers} active (30d)`}
          href="/dashboard/customers"
          icon={<UserCheck className="w-5 h-5 text-[--color-accent]" />}
        />
        <StatCard
          label="Revenue This Month"
          value={monthlyRevenueDisplay}
          sub="from coupon redemptions"
          href="/dashboard/validate"
          icon={<Zap className="w-5 h-5 text-[--color-accent]" />}
        />
        <StatCard
          label="Coupons Sent"
          value={String(totalCoupons)}
          sub={`${redeemedCoupons} redeemed`}
          href="/dashboard/coupons"
          icon={<Gift className="w-5 h-5 text-[--color-accent]" />}
        />
        <StatCard
          label="Redemption Rate"
          value={`${redemptionRate}%`}
          sub="of all coupons"
          href="/dashboard/coupons"
          icon={<TrendingUp className="w-5 h-5 text-[--color-accent]" />}
        />
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <QuickNavCard href="/dashboard/customers" title="Active Guests" description="View all registered customers" />
        <QuickNavCard href="/dashboard/coupons" title="Coupons" description="Manage issued coupons" />
        <QuickNavCard href="/dashboard/analytics" title="Analytics" description="Growth charts and campaign stats" />
        <QuickNavCard href="/dashboard/validate" title="Validate Coupon" description="Redeem and validate customer coupons" />
        <QuickNavCard href="/dashboard/settings" title="Settings" description="Manage restaurant and buy credits" />
      </div>

      {/* Campaign Performance */}
      <section className="bg-white rounded-2xl p-6 shadow-md mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--color-foreground] font-display">
            Campaign Performance
          </h2>
          <Link
            href="/dashboard/campaigns"
            className="text-[10px] font-black uppercase tracking-widest text-[--color-accent] hover:underline cursor-pointer"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {['welcome_reminder', 'birthday_campaign', 'winback_campaign', 'expiry_reminder'].map((type) => {
            const count = (recentLogs || []).filter((l) => l.type === type).length
            const labels: Record<string, string> = {
              welcome_reminder: 'Welcome',
              birthday_campaign: 'Birthday',
              winback_campaign: 'Winback',
              expiry_reminder: 'Expiry',
            }
            return (
              <div key={type} className="p-3 bg-[--color-grey-50] border border-[--color-grey-100] rounded-xl">
                <p className="text-2xl font-black font-mono text-[--color-primary]">{count}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-[--color-grey-500] mt-1">
                  {labels[type]}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Recent Activity Feed */}
      <section
        data-testid="recent-activity"
        className="bg-white rounded-2xl p-6 shadow-md"
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
            {recentLogs.slice(0, 10).map((log) => {
              const phone = (log.customers as unknown as { phone: string } | null)?.phone
              const isOutbound = log.direction === 'outbound'
              return (
                <li
                  key={log.id}
                  className="flex items-center gap-3 pb-3 border-b border-[--color-border] text-sm font-bold last:border-b-0 last:pb-0"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isOutbound ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {isOutbound ? '↑' : '↓'}
                  </span>
                  <span className="font-mono text-[--color-foreground] min-w-[120px]">
                    {phone ? maskPhone(phone) : 'Unknown'}
                  </span>
                  <span className="text-[--color-grey-500] flex-1">
                    {isOutbound ? 'Outbound' : 'Inbound'} ({log.type.replace(/_/g, ' ')})
                  </span>
                  <StatusBadge status={log.status} />
                  <span className="text-[10px] text-[--color-grey-500] whitespace-nowrap">
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

function StatCard({
  label,
  value,
  sub,
  href,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="dash-stat-card block">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-grey-500]">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-black text-[--color-primary] font-display uppercase">{value}</p>
      <p className="text-[10px] font-bold text-[--color-grey-500] mt-1">{sub}</p>
    </Link>
  )
}

function QuickNavCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="dash-quick-card block">
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
  let badgeClass = 'bg-gray-100 text-gray-800 border-gray-200'
  if (status === 'sent' || status === 'success' || status === 'delivered') {
    badgeClass = 'badge-sent'
  } else if (status === 'failed') {
    badgeClass = 'badge-failed'
  } else if (status === 'blocked_no_credits') {
    badgeClass = 'badge-blocked'
  } else if (status === 'redeemed') {
    badgeClass = 'badge-redeemed'
  }
  return (
    <span className={`${badgeClass} inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
