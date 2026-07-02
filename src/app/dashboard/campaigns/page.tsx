import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  MessageSquare,
  Cake,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'
import { maskPhone } from '@/lib/utils'

type CampaignType = 'welcome_reminder' | 'birthday_campaign' | 'winback_campaign' | 'expiry_reminder'

const CAMPAIGN_TYPES: CampaignType[] = ['welcome_reminder', 'birthday_campaign', 'winback_campaign']

const TYPE_META: Record<CampaignType, { label: string; class: string; icon: React.ReactNode }> = {
  welcome_reminder: {
    label: 'Welcome Reminder',
    class: 'badge-welcome',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
  },
  birthday_campaign: {
    label: 'Birthday',
    class: 'badge-birthday',
    icon: <Cake className="w-3.5 h-3.5" />,
  },
  winback_campaign: {
    label: 'Winback',
    class: 'badge-winback',
    icon: <RotateCcw className="w-3.5 h-3.5" />,
  },
  expiry_reminder: {
    label: 'Expiry',
    class: 'badge-expiry',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
}

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!restaurant) redirect('/dashboard/create')

  // Fetch campaign message logs with customer data
  const { data: logs } = await supabase
    .from('message_logs')
    .select('id, type, status, error, created_at, customer_id, customers(name, phone)')
    .eq('restaurant_id', restaurant.id)
    .eq('direction', 'outbound')
    .in('type', CAMPAIGN_TYPES)
    .order('created_at', { ascending: false })
    .limit(100)

  // Compute stats
  const stats = CAMPAIGN_TYPES.map((type) => {
    const typeLogs = (logs || []).filter((l) => l.type === type)
    const sent = typeLogs.filter((l) => l.status === 'sent').length
    const failed = typeLogs.filter((l) => l.status === 'failed').length
    const blocked = typeLogs.filter((l) => l.status === 'blocked_no_credits').length
    return { type, total: typeLogs.length, sent, failed, blocked }
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black tracking-tight text-[--color-foreground] mb-1 font-display uppercase">
        Campaigns
      </h1>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent] mb-8">
        Automated WhatsApp campaign history and performance.
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((s) => {
          const meta = TYPE_META[s.type]
          return (
            <div
              key={s.type}
              className="bg-white border border-[--color-border] rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center justify-center p-1.5 rounded-lg border ${meta.class}`}>
                  {meta.icon}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-grey-500]">
                  {meta.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-[--color-foreground]">{s.total}</span>
                <span className="text-[10px] font-bold text-[--color-grey-500]">sent</span>
              </div>
              <div className="flex gap-3 mt-3 border-t border-[--color-grey-100] pt-2.5">
                <span className="text-[10px] font-bold text-emerald-600">{s.sent} delivered</span>
                {s.failed > 0 && <span className="text-[10px] font-bold text-red-600">{s.failed} failed</span>}
                {s.blocked > 0 && <span className="text-[10px] font-bold text-purple-600">{s.blocked} blocked</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Campaign Log Table */}
      <div className="bg-white border border-[--color-border] rounded-2xl overflow-hidden shadow-md">
        <div className="px-6 py-4 border-b border-[--color-border]">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--color-foreground] font-display">
            Recent Campaign Activity
          </h2>
        </div>

        {!logs || logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-bold text-[--color-grey-500]">
              No campaigns have run yet. Campaigns fire daily at 10:00 AM IST.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[--color-border] bg-[--color-grey-50]">
                  <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">
                    Sent
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const meta = TYPE_META[log.type as CampaignType] || TYPE_META.welcome_reminder
                  const customer = log.customers as unknown as { name: string | null; phone: string } | null
                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-[--color-border] hover:bg-[--color-grey-50] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[--color-grey-50]/30'}`}
                    >
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 ${meta.class} text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-0.5 border`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-bold font-mono text-[--color-foreground]">
                        {customer?.phone ? maskPhone(customer.phone) : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-6 py-3 text-xs font-bold text-[--color-grey-500]">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
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
  }
  return (
    <span className={`${badgeClass} inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
