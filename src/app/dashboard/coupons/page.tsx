'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type CouponRow = {
  id: string
  code: string
  type: string
  discount_cents: number
  status: string
  expires_at: string
  customers: { phone: string } | null
}

const FILTER_TYPES = ['all', 'welcome', 'birthday', 'winback'] as const
type FilterType = typeof FILTER_TYPES[number]

function maskPhone(phone: string) {
  return phone.slice(0, -4) + '****'
}

function formatCents(cents: number) {
  return '₹' + (cents / 100).toFixed(2)
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('coupons')
      .select('id, code, type, discount_cents, status, expires_at, customers(phone)')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('type', filter)
    }

    const { data } = await query
    setCoupons((data as unknown as CouponRow[]) || [])
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase client is stable (module-level singleton)
  }, [filter])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  return (
    <div className="p-8 max-w-[900px]">
      <h1
        data-testid="coupons-heading"
        className="text-3xl font-black tracking-tight text-[--color-foreground] mb-1 font-display uppercase"
      >
        Coupons
      </h1>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent] mb-8">
        Manage issued coupons
      </p>

      {/* Filter chips */}
      <div
        data-testid="filter-chips"
        className="flex gap-2 mb-6 flex-wrap"
      >
        {FILTER_TYPES.map((type) => {
          const isActive = filter === type
          return (
            <button
              key={type}
              id={`filter-${type}`}
              data-testid={`filter-${type}`}
              onClick={() => setFilter(type)}
              className={`filter-chip capitalize ${
                isActive ? 'bg-[--color-primary] border-[--color-primary] text-white' : ''
              }`}
            >
              {type}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p className="text-sm font-bold text-[--color-grey-500]">Loading…</p>
      ) : coupons.length === 0 ? (
        <div className="bg-white border border-[--color-border] rounded-2xl p-12 text-center shadow-md">
          <p className="text-sm font-bold text-[--color-grey-500]">
            {filter === 'all' ? 'No coupons issued yet.' : `No ${filter} coupons found.`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[--color-border] rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table
              data-testid="coupons-table"
              className="w-full border-collapse text-left"
            >
              <thead>
                <tr className="border-b border-[--color-border] bg-[--color-grey-50]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Code</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Discount</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-600]">Expires</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon, i) => (
                  <tr
                    key={coupon.id}
                    className={`border-b border-[--color-border] last:border-b-0 hover:bg-[--color-grey-50] transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-[--color-grey-50]/30'
                    }`}
                  >
                    <td className="px-6 py-4 font-mono text-sm font-black text-[--color-foreground]">
                      {coupon.code}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-[--color-foreground]">
                      {coupon.customers?.phone ? maskPhone(coupon.customers.phone) : <span className="opacity-40 font-normal">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <TypeBadge type={coupon.type} />
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-[--color-accent]">
                      {formatCents(coupon.discount_cents)}
                    </td>
                    <td className="px-6 py-4">
                      <CouponStatusBadge status={coupon.status} />
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[--color-grey-500]">
                      {new Date(coupon.expires_at).toLocaleDateString('en-IN')}
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

function TypeBadge({ type }: { type: string }) {
  const isWelcome = type === 'welcome'
  const isBirthday = type === 'birthday'
  const isWinback = type === 'winback'

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
        isWelcome
          ? 'bg-blue-50 text-blue-700 border-blue-100'
          : isBirthday
          ? 'bg-amber-50 text-amber-700 border-amber-100'
          : isWinback
          ? 'bg-purple-50 text-purple-700 border-purple-100'
          : 'bg-red-50 text-red-700 border-red-100'
      }`}
    >
      {type}
    </span>
  )
}

function CouponStatusBadge({ status }: { status: string }) {
  const isSent = status === 'sent'
  const isRedeemed = status === 'redeemed'

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
        isRedeemed
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
          : isSent
          ? 'bg-amber-50 text-amber-700 border-amber-100'
          : 'bg-red-50 text-red-700 border-red-100'
      }`}
    >
      {status}
    </span>
  )
}
