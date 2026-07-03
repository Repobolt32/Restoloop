'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useTransition } from 'react'
import { maskPhone } from '@/lib/utils'
import { addCustomerAction, deleteCustomerAction } from './actions'
import { UserPlus, Search, Trash2, X } from 'lucide-react'

type Segment = 'all' | 'new' | 'active' | 'at-risk' | 'lapsed' | 'birthday' | 'opted-out'

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'new',       label: 'New' },
  { key: 'active',    label: 'Active' },
  { key: 'at-risk',   label: 'At Risk' },
  { key: 'lapsed',    label: 'Lapsed' },
  { key: 'birthday',  label: 'Birthday' },
  { key: 'opted-out', label: 'Opted Out' },
]

type Customer = {
  id: string
  name: string | null
  phone: string
  opt_in_status: string
  last_visit_at: string | null
  created_at: string
  birthday_month: number | null
  birthday_day: number | null
  segments: Segment[]
}

const SEGMENT_STYLES: Record<Segment, string> = {
  all:         'bg-gray-100 text-gray-700',
  new:         'bg-blue-100 text-blue-800',
  active:      'bg-emerald-100 text-emerald-800',
  'at-risk':   'bg-amber-100 text-amber-800',
  lapsed:      'bg-red-100 text-red-800',
  birthday:    'bg-pink-100 text-pink-800',
  'opted-out': 'bg-gray-100 text-gray-500',
}

const SEGMENT_LABELS: Record<Segment, string> = {
  all: 'All', new: 'New', active: 'Active', 'at-risk': 'At Risk',
  lapsed: 'Lapsed', birthday: 'Birthday', 'opted-out': 'Out',
}

function getSegments(customer: { opt_in_status: string; last_visit_at: string | null; created_at: string; birthday_month: number | null; birthday_day: number | null }, now: Date): Segment[] {
  if (customer.opt_in_status === 'opted_out') return ['opted-out']

  const result: Segment[] = []
  const daysSinceCreated = (now.getTime() - new Date(customer.created_at).getTime()) / 86400000

  if (daysSinceCreated <= 7) result.push('new')

  if (customer.last_visit_at) {
    const daysSinceVisit = (now.getTime() - new Date(customer.last_visit_at).getTime()) / 86400000
    if (daysSinceVisit < 30)      result.push('active')
    else if (daysSinceVisit < 60) result.push('at-risk')
    else                          result.push('lapsed')
  } else if (!result.includes('new')) {
    result.push('new')
  }

  if (customer.birthday_month && customer.birthday_day) {
    const kolkata = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    if (kolkata.getMonth() + 1 === customer.birthday_month && kolkata.getDate() === customer.birthday_day) {
      result.push('birthday')
    }
  }

  return result
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSegment, setActiveSegment] = useState<Segment>('all')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!restaurant) return

    const { data } = await supabase
      .from('customers')
      .select('id, name, phone, opt_in_status, last_visit_at, created_at, birthday_month, birthday_day')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false })

    const now = new Date()
    setCustomers((data || []).map(c => ({ ...c, segments: getSegments(c, now) })))
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const handleDelete = (id: string) => {
    if (!confirm('Delete this guest? Their coupons will also be removed.')) return
    startTransition(async () => {
      await deleteCustomerAction(id)
      await fetchCustomers()
    })
  }

  const handleAdd = async (formData: FormData) => {
    setAddError(null)
    startTransition(async () => {
      const res = await addCustomerAction(formData)
      if (res?.error) {
        setAddError(res.error)
      } else {
        setShowAddModal(false)
        await fetchCustomers()
      }
    })
  }

  const filtered = customers
    .filter(c => activeSegment === 'all' || c.segments.includes(activeSegment))
    .filter(c => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        c.name?.toLowerCase().includes(q) ||
        c.phone.includes(q)
      )
    })

  const segmentCounts = SEGMENTS.map(s => ({
    ...s,
    count: s.key === 'all'
      ? customers.length
      : customers.filter(c => c.segments.includes(s.key)).length,
  }))

  return (
    <div className="p-8 max-w-[960px]">
      <div className="flex items-start justify-between mb-1">
        <h1 data-testid="customers-heading" className="text-3xl font-black tracking-tight text-[--color-foreground] font-display uppercase">
          Active Guests
        </h1>
        <button
          onClick={() => { setShowAddModal(true); setAddError(null) }}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add Guest
        </button>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent] mb-6">
        {filtered.length} guest{filtered.length !== 1 ? 's' : ''}{activeSegment !== 'all' ? ` · ${activeSegment}` : ''}
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-grey-400]" />
        <input
          type="text"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-[--color-border] rounded-xl text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20"
        />
      </div>

      {/* Segment Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6" data-testid="segment-chips">
        {segmentCounts.map(s => {
          const isActive = activeSegment === s.key
          return (
            <button
              key={s.key}
              data-testid={`segment-${s.key}`}
              onClick={() => setActiveSegment(s.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[--color-primary] text-white'
                  : 'bg-white border border-[--color-border] text-[--color-grey-600] hover:border-[--color-primary] hover:text-[--color-primary]'
              }`}
            >
              {s.label}
              <span className={`${isActive ? 'bg-white/20' : 'bg-[--color-grey-100]'} px-1.5 py-0.5 rounded-full text-[9px]`}>
                {s.count}
              </span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <p className="text-sm font-bold text-[--color-grey-500] animate-pulse">Loading guests…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[--color-border] rounded-2xl p-12 text-center shadow-md">
          <p className="text-sm font-bold text-[--color-grey-500]">
            {search ? 'No guests match your search.' : activeSegment === 'all' ? 'No guests yet. Share your QR code to get started.' : `No ${activeSegment} customers found.`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[--color-border] rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table data-testid="customers-table" className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[--color-border] bg-[--color-grey-50]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Name</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Phone</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Segment</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Last Visit</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Joined</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer, i) => (
                  <tr
                    key={customer.id}
                    className={`border-b border-[--color-border] last:border-b-0 hover:bg-[--color-grey-50] transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-[--color-grey-50]/30'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-[--color-foreground]">
                      {customer.name || <span className="opacity-40 font-normal">—</span>}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-[--color-foreground]">
                      {maskPhone(customer.phone)}
                    </td>
                    <td className="px-6 py-4">
                      <OptInBadge status={customer.opt_in_status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {customer.segments.map(s => (
                          <span key={s} className={`${SEGMENT_STYLES[s]} text-[8px] font-black uppercase tracking-widest rounded-full px-2 py-0.5`}>
                            {SEGMENT_LABELS[s]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[--color-grey-500]">
                      {customer.last_visit_at
                        ? new Date(customer.last_visit_at).toLocaleDateString('en-IN')
                        : <span className="opacity-40 font-normal">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[--color-grey-500]">
                      {new Date(customer.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(customer.id)}
                        disabled={isPending}
                        title="Delete guest"
                        data-testid={`delete-customer-${customer.id}`}
                        className="text-[--color-grey-400] hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" data-testid="add-guest-modal">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-[90%] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-black text-[--color-foreground] uppercase">Add Guest</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[--color-grey-400] hover:text-[--color-foreground] transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm font-bold px-4 py-3 rounded-xl mb-5">
                {addError}
              </div>
            )}

            <form action={handleAdd} className="space-y-5">
              <div>
                <label htmlFor="add-name" className="section-label mb-1 block">Name *</label>
                <input id="add-name" name="name" type="text" required placeholder="Customer name" className="w-full border border-[--color-border] rounded-xl px-4 py-3 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20" />
              </div>
              <div>
                <label htmlFor="add-phone" className="section-label mb-1 block">Phone (E.164, no +) *</label>
                <input id="add-phone" name="phone" type="text" required placeholder="919876543210" maxLength={12} className="w-full border border-[--color-border] rounded-xl px-4 py-3 text-sm font-mono font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="add-bday-month" className="section-label mb-1 block">Birth Month</label>
                  <input id="add-bday-month" name="birthday_month" type="number" min={1} max={12} placeholder="1-12" className="w-full border border-[--color-border] rounded-xl px-4 py-3 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20" />
                </div>
                <div>
                  <label htmlFor="add-bday-day" className="section-label mb-1 block">Birth Day</label>
                  <input id="add-bday-day" name="birthday_day" type="number" min={1} max={31} placeholder="1-31" className="w-full border border-[--color-border] rounded-xl px-4 py-3 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 border border-[--color-border] rounded-xl py-3 text-sm font-black uppercase tracking-widest text-[--color-grey-600] hover:bg-[--color-grey-50] transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="flex-1 btn-primary disabled:opacity-50">
                  {isPending ? 'Adding…' : 'Add Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function OptInBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    opted_in:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    opted_out: 'bg-red-50 text-red-700 border-red-100',
    pending:   'bg-amber-50 text-amber-700 border-amber-100',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status] ?? 'bg-gray-50 text-gray-700 border-gray-100'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
