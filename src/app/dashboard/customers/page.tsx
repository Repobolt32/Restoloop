import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { maskPhone } from '@/lib/utils'
import Link from 'next/link'

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

function getSegments(customer: {
  opt_in_status: string
  last_visit_at: string | null
  created_at: string
  birthday_month: number | null
  birthday_day: number | null
}, now: Date): Segment[] {
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
    if (
      kolkata.getMonth() + 1 === customer.birthday_month &&
      kolkata.getDate() === customer.birthday_day
    ) {
      result.push('birthday')
    }
  }

  return result
}

interface PageProps {
  searchParams: Promise<{ segment?: string }>
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const { segment: rawSegment } = await searchParams
  const activeSegment: Segment = SEGMENTS.some(s => s.key === rawSegment)
    ? (rawSegment as Segment)
    : 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!restaurant) redirect('/dashboard/create')

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, opt_in_status, last_visit_at, created_at, birthday_month, birthday_day')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })

  const now = new Date()

  const customersWithSegments = (customers ?? []).map(c => ({
    ...c,
    segments: getSegments(c, now),
  }))

  const filtered = activeSegment === 'all'
    ? customersWithSegments
    : customersWithSegments.filter(c => c.segments.includes(activeSegment))

  const segmentCounts = SEGMENTS.map(s => ({
    ...s,
    count: s.key === 'all'
      ? customersWithSegments.length
      : customersWithSegments.filter(c => c.segments.includes(s.key)).length,
  }))

  return (
    <div className="p-8 max-w-[900px]">
      <h1
        data-testid="customers-heading"
        className="text-3xl font-black tracking-tight text-[--color-foreground] mb-1 font-display uppercase"
      >
        Active Guests
      </h1>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent] mb-6">
        {filtered.length} customer{filtered.length !== 1 ? 's' : ''}{activeSegment !== 'all' ? ` · ${activeSegment}` : ''}
      </p>

      {/* Segment Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6" data-testid="segment-chips">
        {segmentCounts.map(s => {
          const isActive = activeSegment === s.key
          return (
            <Link
              key={s.key}
              href={s.key === 'all' ? '/dashboard/customers' : `/dashboard/customers?segment=${s.key}`}
              data-testid={`segment-${s.key}`}
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
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-[--color-border] rounded-2xl p-12 text-center shadow-md">
          <p className="text-sm font-bold text-[--color-grey-500]">
            {activeSegment === 'all'
              ? 'No guests yet. Share your QR code to get started.'
              : `No ${activeSegment} customers found.`}
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
                          <SegmentBadge key={s} segment={s} />
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
                  </tr>
                ))}
              </tbody>
            </table>
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
  lapsed: 'Lapsed', birthday: 'Birthday 🎂', 'opted-out': 'Out',
}

function SegmentBadge({ segment }: { segment: Segment }) {
  return (
    <span className={`${SEGMENT_STYLES[segment]} text-[8px] font-black uppercase tracking-widest rounded-full px-2 py-0.5`}>
      {SEGMENT_LABELS[segment]}
    </span>
  )
}
