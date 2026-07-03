'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useTransition } from 'react'
import { MessageSquare, Cake, RotateCcw, AlertCircle, Settings2, History } from 'lucide-react'
import { maskPhone } from '@/lib/utils'
import { updateCampaignSettings } from './actions'

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

type Tab = 'history' | 'settings'

export default function CampaignsPage() {
  const [tab, setTab] = useState<Tab>('history')
  const [restaurant, setRestaurant] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: rest } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (rest) {
      setRestaurant(rest)

      const { data: logData } = await supabase
        .from('message_logs')
        .select('id, type, status, error, created_at, customer_id, customers(name, phone)')
        .eq('restaurant_id', rest.id)
        .eq('direction', 'outbound')
        .in('type', CAMPAIGN_TYPES)
        .order('created_at', { ascending: false })
        .limit(100)

      setLogs(logData || [])
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const stats = CAMPAIGN_TYPES.map((type) => {
    const typeLogs = logs.filter((l) => l.type === type)
    const sent = typeLogs.filter((l) => l.status === 'sent').length
    const failed = typeLogs.filter((l) => l.status === 'failed').length
    const blocked = typeLogs.filter((l) => l.status === 'blocked_no_credits').length
    return { type, total: typeLogs.length, sent, failed, blocked }
  })

  const handleSaveSettings = (formData: FormData) => {
    startTransition(async () => {
      await updateCampaignSettings(formData)
      setSaveMsg('Campaign settings saved!')
      await fetchData()
      setTimeout(() => setSaveMsg(null), 3000)
    })
  }

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex items-center justify-center min-h-[50vh]">
        <p className="text-[--color-grey-500] font-bold animate-pulse">Loading campaigns…</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black tracking-tight text-[--color-foreground] mb-1 font-display uppercase">
        Campaigns
      </h1>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent] mb-6">
        Automated WhatsApp campaign history and configuration.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-[--color-grey-100] rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            tab === 'history'
              ? 'bg-white shadow-sm text-[--color-foreground]'
              : 'text-[--color-grey-500] hover:text-[--color-foreground]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          History
        </button>
        <button
          onClick={() => setTab('settings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            tab === 'settings'
              ? 'bg-white shadow-sm text-[--color-foreground]'
              : 'text-[--color-grey-500] hover:text-[--color-foreground]'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Settings
        </button>
      </div>

      {tab === 'history' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((s) => {
              const meta = TYPE_META[s.type]
              return (
                <div key={s.type} className="bg-white rounded-2xl p-5 shadow-md">
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
          <div className="bg-white rounded-2xl overflow-hidden shadow-md">
            <div className="px-6 py-4">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[--color-foreground] font-display">
                Recent Campaign Activity
              </h2>
            </div>
            {logs.length === 0 ? (
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
                      <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">Type</th>
                      <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">Customer</th>
                      <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">Status</th>
                      <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => {
                      const meta = TYPE_META[log.type as CampaignType] || TYPE_META.welcome_reminder
                      const customer = log.customers as unknown as { name: string | null; phone: string } | null
                      return (
                        <tr key={log.id} className={`border-b border-[--color-border] hover:bg-[--color-grey-50] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[--color-grey-50]/30'}`}>
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
                            {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'settings' && restaurant && (
        <form action={handleSaveSettings} className="space-y-8">
          {saveMsg && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 text-sm font-bold">
              {saveMsg}
            </div>
          )}

          {/* Discount Percentages */}
          <section className="bg-white rounded-2xl p-8 shadow-md">
            <h2 className="font-display text-xl font-black text-[--color-foreground] mb-2 uppercase">
              Campaign Discounts
            </h2>
            <p className="section-label mb-6">Set default discount percentage for each campaign type.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label htmlFor="welcome_discount_percent" className="section-label mb-1 block">Welcome Discount (%)</label>
                <input
                  id="welcome_discount_percent"
                  name="welcome_discount_percent"
                  type="number"
                  min={1}
                  max={100}
                  required
                  defaultValue={restaurant.welcome_discount_percent ?? 10}
                  className="w-full border border-[--color-border] rounded-xl px-4 py-3 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20"
                />
              </div>
              <div>
                <label htmlFor="birthday_discount_percent" className="section-label mb-1 block">Birthday Discount (%)</label>
                <input
                  id="birthday_discount_percent"
                  name="birthday_discount_percent"
                  type="number"
                  min={1}
                  max={100}
                  required
                  defaultValue={restaurant.birthday_discount_percent ?? 15}
                  className="w-full border border-[--color-border] rounded-xl px-4 py-3 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20"
                />
              </div>
              <div>
                <label htmlFor="winback_discount_percent" className="section-label mb-1 block">Winback Discount (%)</label>
                <input
                  id="winback_discount_percent"
                  name="winback_discount_percent"
                  type="number"
                  min={1}
                  max={100}
                  required
                  defaultValue={restaurant.winback_discount_percent ?? 20}
                  className="w-full border border-[--color-border] rounded-xl px-4 py-3 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20"
                />
              </div>
            </div>
          </section>

          {/* Campaign Toggles & Timing */}
          <section className="bg-white rounded-2xl p-8 shadow-md">
            <h2 className="font-display text-xl font-black text-[--color-foreground] mb-2 uppercase">
              Campaign Settings
            </h2>
            <p className="section-label mb-6">Enable or disable each campaign, and configure timing.</p>
            <div className="space-y-4 mb-6">
              <ToggleRow name="welcome_reminder_enabled" label="Welcome Reminder" description={`Sends ${restaurant.welcome_reminder_days ?? 25} days after signup`} defaultChecked={restaurant.welcome_reminder_enabled ?? true} />
              <ToggleRow name="birthday_campaign_enabled" label="Birthday Campaign" description="Sends on customer's birthday" defaultChecked={restaurant.birthday_campaign_enabled ?? true} />
              <ToggleRow name="winback_campaign_enabled" label="Winback Campaign" description={`Sends after ${restaurant.winback_days ?? 40} days of inactivity`} defaultChecked={restaurant.winback_campaign_enabled ?? true} />
              <ToggleRow name="expiry_reminder_enabled" label="Expiry Reminder" description={`Sends ${restaurant.expiry_reminder_days ?? 1} day(s) before coupon expiry`} defaultChecked={restaurant.expiry_reminder_enabled ?? true} />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[--color-border] mb-6">
              <div>
                <label htmlFor="welcome_reminder_days" className="section-label mb-1 block">Welcome (days)</label>
                <input id="welcome_reminder_days" type="number" name="welcome_reminder_days" defaultValue={restaurant.welcome_reminder_days ?? 25} min={1} max={90} className="w-full border border-[--color-border] rounded-xl px-3 py-2 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20" />
              </div>
              <div>
                <label htmlFor="winback_days" className="section-label mb-1 block">Winback (days)</label>
                <input id="winback_days" type="number" name="winback_days" defaultValue={restaurant.winback_days ?? 40} min={1} max={180} className="w-full border border-[--color-border] rounded-xl px-3 py-2 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20" />
              </div>
              <div>
                <label htmlFor="expiry_reminder_days" className="section-label mb-1 block">Expiry (days before)</label>
                <input id="expiry_reminder_days" type="number" name="expiry_reminder_days" defaultValue={restaurant.expiry_reminder_days ?? 1} min={1} max={7} className="w-full border border-[--color-border] rounded-xl px-3 py-2 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20" />
              </div>
            </div>

            <div>
              <label htmlFor="whatsapp_prefill_message" className="section-label mb-1 block">WhatsApp Prefill Message</label>
              <p className="text-xs font-bold text-[--color-grey-500] mb-2">Pre-written message customers send when scanning your QR code.</p>
              <input id="whatsapp_prefill_message" type="text" name="whatsapp_prefill_message" defaultValue={restaurant.whatsapp_prefill_message ?? 'Hi, I would like to join your loyalty club!'} maxLength={200} className="w-full border border-[--color-border] rounded-xl px-4 py-3 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20" />
            </div>
          </section>

          <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-50">
            {isPending ? 'Saving…' : 'Save Campaign Settings'}
          </button>
        </form>
      )}
    </div>
  )
}

function ToggleRow({ name, label, description, defaultChecked }: { name: string; label: string; description: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div>
        <p className="text-sm font-bold text-[--color-foreground]">{label}</p>
        <p className="text-xs font-bold text-[--color-grey-500]">{description}</p>
      </div>
      <div className="relative ml-4 shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="sr-only peer" />
        <div className="w-12 h-6 bg-[--color-grey-200] peer-checked:bg-emerald-500 rounded-full transition-colors" />
        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-6 pointer-events-none" />
      </div>
    </label>
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
