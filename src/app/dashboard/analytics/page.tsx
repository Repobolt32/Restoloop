import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Gift, MessageSquare, TrendingUp } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!restaurant) redirect('/dashboard/create')

  const [{ data: customers }, { data: coupons }, { data: logs }] = await Promise.all([
    supabase.from('customers').select('id, opt_in_status, created_at, last_visit_at').eq('restaurant_id', restaurant.id),
    supabase.from('coupons').select('id, type, status, expires_at, created_at').eq('restaurant_id', restaurant.id),
    supabase.from('message_logs').select('id, type, status, direction, created_at').eq('restaurant_id', restaurant.id),
  ])

  // Customer Growth (last 6 months, by month)
  const months: { label: string; start: Date; end: Date }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    months.push({ label: start.toLocaleString('en-IN', { month: 'short' }), start, end })
  }

  const growthData = months.map(m => ({
    label: m.label,
    count: (customers || []).filter(c => {
      const d = new Date(c.created_at)
      return d >= m.start && d <= m.end
    }).length,
  }))

  const maxGrowth = Math.max(...growthData.map(d => d.count), 1)

  // Campaign Breakdown
  const campaignTypes = ['welcome_reminder', 'birthday_campaign', 'winback_campaign', 'expiry_reminder'] as const
  const campaignLabels: Record<string, string> = {
    welcome_reminder: 'Welcome',
    birthday_campaign: 'Birthday',
    winback_campaign: 'Winback',
    expiry_reminder: 'Expiry',
  }
  const campaignBreakdown = campaignTypes.map(type => {
    const typeLogs = (logs || []).filter(l => l.type === type)
    return {
      type,
      label: campaignLabels[type],
      sent: typeLogs.filter(l => l.status === 'sent').length,
      failed: typeLogs.filter(l => l.status === 'failed').length,
    }
  })
  const totalCampaignSent = campaignBreakdown.reduce((sum, c) => sum + c.sent, 0)

  // Customer Health Segments
  const now = Date.now()
  const segments = {
    active: (customers || []).filter(c => c.last_visit_at && (now - new Date(c.last_visit_at).getTime()) < 30 * 86400000).length,
    atRisk: (customers || []).filter(c => c.last_visit_at && (now - new Date(c.last_visit_at).getTime()) >= 30 * 86400000 && (now - new Date(c.last_visit_at).getTime()) < 60 * 86400000).length,
    lapsed: (customers || []).filter(c => c.last_visit_at && (now - new Date(c.last_visit_at).getTime()) >= 60 * 86400000).length,
    neverVisited: (customers || []).filter(c => !c.last_visit_at).length,
  }

  // Coupon Stats
  const couponStats = {
    total: coupons?.length ?? 0,
    redeemed: coupons?.filter(c => c.status === 'redeemed').length ?? 0,
    expired: coupons?.filter(c => c.status === 'expired' || new Date(c.expires_at) < new Date()).length ?? 0,
    active: coupons?.filter(c => c.status === 'sent' && new Date(c.expires_at) >= new Date()).length ?? 0,
  }
  const redemptionRate = couponStats.total > 0 ? Math.round((couponStats.redeemed / couponStats.total) * 100) : 0
  const totalCustomers = customers?.length ?? 0

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl font-black tracking-tight text-[--color-foreground] mb-1 uppercase">
        Analytics
      </h1>
      <p className="section-label mb-8">Customer growth, campaign performance, and health overview.</p>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MiniStat icon={<Users className="w-4 h-4" />} label="Total Customers" value={String(totalCustomers)} />
        <MiniStat icon={<Gift className="w-4 h-4" />} label="Coupons Issued" value={String(couponStats.total)} />
        <MiniStat icon={<MessageSquare className="w-4 h-4" />} label="Campaigns Sent" value={String(totalCampaignSent)} />
        <MiniStat icon={<TrendingUp className="w-4 h-4" />} label="Redemption Rate" value={`${redemptionRate}%`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Customer Growth Bar Chart */}
        <div className="glass-card p-6">
          <h2 className="section-label mb-6">Customer Growth</h2>
          <div className="flex items-end gap-3 h-48" aria-label="Customer growth over the last 6 months">
            {growthData.map(d => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-black font-mono text-[--color-foreground]">{d.count}</span>
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${Math.max((d.count / maxGrowth) * 160, 4)}px`,
                    background: 'var(--color-primary)',
                    opacity: d.count === 0 ? 0.15 : 1,
                    transition: 'height 300ms ease',
                  }}
                />
                <span className="text-[10px] font-bold text-[--color-grey-500]">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Breakdown */}
        <div className="glass-card p-6">
          <h2 className="section-label mb-6">Campaign Breakdown</h2>
          <div className="space-y-4">
            {campaignBreakdown.map(c => {
              const pct = totalCampaignSent > 0 ? Math.round((c.sent / totalCampaignSent) * 100) : 0
              return (
                <div key={c.type}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold text-[--color-foreground]">{c.label}</span>
                    <span className="text-xs font-black font-mono text-[--color-foreground]">{c.sent} sent</span>
                  </div>
                  <div className="h-2 bg-[--color-grey-100] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: 'var(--color-primary)', transition: 'width 300ms ease' }}
                    />
                  </div>
                </div>
              )
            })}
            {totalCampaignSent === 0 && (
              <p className="text-xs font-bold text-[--color-grey-400] text-center py-4">No campaigns sent yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Customer Health */}
        <div className="glass-card p-6">
          <h2 className="section-label mb-6">Customer Health</h2>
          <div className="space-y-3">
            <HealthRow label="Active (< 30 days)" count={segments.active} color="#22c55e" total={totalCustomers} />
            <HealthRow label="At Risk (30–60 days)" count={segments.atRisk} color="#f59e0b" total={totalCustomers} />
            <HealthRow label="Lapsed (60+ days)" count={segments.lapsed} color="#dc2626" total={totalCustomers} />
            <HealthRow label="Never Visited" count={segments.neverVisited} color="var(--color-grey-300)" total={totalCustomers} />
          </div>
          {totalCustomers === 0 && (
            <p className="text-xs font-bold text-[--color-grey-400] text-center py-4">No customers yet.</p>
          )}
        </div>

        {/* Coupon Performance */}
        <div className="glass-card p-6">
          <h2 className="section-label mb-6">Coupon Performance</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatBox value={String(couponStats.active)} label="Active" color="var(--color-foreground)" />
            <StatBox value={String(couponStats.redeemed)} label="Redeemed" color="#16a34a" />
            <StatBox value={String(couponStats.expired)} label="Expired" color="#dc2626" />
            <StatBox value={`${redemptionRate}%`} label="Redemption" color="var(--color-accent)" />
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-2 text-[--color-grey-400]">{icon}</div>
      <p className="text-2xl font-black font-mono text-[--color-foreground]">{value}</p>
      <p className="section-label mt-1">{label}</p>
    </div>
  )
}

function HealthRow({ label, count, color, total }: { label: string; count: number; color: string; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-bold text-[--color-foreground]">{label}</span>
        <span className="text-xs font-black font-mono text-[--color-foreground]">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-[--color-grey-100] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: 'width 300ms ease' }} />
      </div>
    </div>
  )
}

function StatBox({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center p-4 bg-[--color-background] rounded-xl">
      <p className="text-2xl font-black font-mono" style={{ color }}>{value}</p>
      <p className="section-label mt-1">{label}</p>
    </div>
  )
}
