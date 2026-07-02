'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useTransition } from 'react'
import { maskPhone } from '@/lib/utils'
import { createCouponAction, disableCouponAction, deleteCouponAction } from './actions'

type CouponRow = {
  id: string
  code: string
  type: string
  discount_cents: number
  status: string
  expires_at: string
  enabled: boolean
  customers: { phone: string } | null
}

const FILTER_TYPES = ['all', 'welcome', 'birthday', 'winback', 'manual'] as const
type FilterType = typeof FILTER_TYPES[number]

function formatCents(cents: number) {
  return '₹' + (cents / 100).toFixed(2)
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('coupons')
      .select('id, code, type, discount_cents, status, expires_at, enabled, customers(phone)')
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

  const handleDisable = (couponId: string) => {
    startTransition(async () => {
      await disableCouponAction(couponId)
      fetchCoupons()
    })
  }

  const handleDelete = (couponId: string) => {
    startTransition(async () => {
      await deleteCouponAction(couponId)
      fetchCoupons()
    })
  }

  const handleCreate = async (formData: FormData) => {
    startTransition(async () => {
      await createCouponAction(formData)
      fetchCoupons()
    })
  }

  return (
    <div className="p-8 max-w-[960px]">
      <h1
        data-testid="coupons-heading"
        className="font-display text-3xl font-black tracking-tight text-[--color-foreground] mb-1 uppercase"
      >
        Coupons
      </h1>
      <p className="section-label mb-8">Manage issued coupons</p>

      {/* Create Manual Coupon */}
      <div className="glass-card p-6 mb-6">
        <p className="section-label mb-4">Create Manual Coupon</p>
        <form action={handleCreate} className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="customer_id" className="section-label mb-1 block">
              Customer ID
            </label>
            <input
              id="customer_id"
              type="text"
              name="customer_id"
              placeholder="Paste customer UUID"
              required
              className="border border-[--color-border] rounded-xl px-4 py-3 text-sm font-mono focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20 min-w-[260px]"
            />
          </div>
          <div>
            <label htmlFor="discount_cents" className="section-label mb-1 block">
              Discount (₹)
            </label>
            <input
              id="discount_cents"
              type="number"
              name="discount_cents"
              placeholder="50"
              required
              min={1}
              className="border border-[--color-border] rounded-xl px-4 py-3 text-sm font-bold focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20 w-28"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary disabled:opacity-50"
          >
            Create Coupon
          </button>
        </form>
      </div>

      {/* Filter chips */}
      <div data-testid="filter-chips" className="flex gap-2 mb-6 flex-wrap">
        {FILTER_TYPES.map((type) => {
          const isActive = filter === type
          return (
            <button
              key={type}
              id={`filter-${type}`}
              data-testid={`filter-${type}`}
              onClick={() => setFilter(type)}
              className={`filter-chip capitalize ${isActive ? 'bg-[--color-primary] border-[--color-primary] text-white' : ''}`}
            >
              {type}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p className="text-sm font-bold text-[--color-grey-500]">Loading…</p>
      ) : coupons.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-sm font-bold text-[--color-grey-500]">
            {filter === 'all' ? 'No coupons issued yet.' : `No ${filter} coupons found.`}
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table
              data-testid="coupons-table"
              className="w-full border-collapse text-left"
            >
              <thead>
                <tr className="border-b border-[--color-border] bg-[--color-background]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">Code</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">Discount</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">Expires</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[--color-grey-500]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon, i) => (
                  <tr
                    key={coupon.id}
                    className={`border-b border-[--color-border] last:border-b-0 transition-colors ${
                      coupon.enabled === false ? 'opacity-50' : ''
                    } ${i % 2 === 0 ? 'dash-table-row-even' : 'dash-table-row-odd'}`}
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
                    <td className="px-6 py-4">
                      {coupon.status === 'sent' && coupon.enabled !== false ? (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleDisable(coupon.id)}
                            disabled={isPending}
                            data-testid={`disable-coupon-${coupon.code}`}
                            className="text-[10px] font-black uppercase tracking-widest text-[--color-accent] hover:text-[--color-accent-dark] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Disable
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            disabled={isPending}
                            data-testid={`delete-coupon-${coupon.code}`}
                            className="text-[10px] font-black uppercase tracking-widest text-[--color-primary] hover:text-[--color-primary-dark] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      ) : coupon.enabled === false ? (
                        <span className="text-[9px] font-black uppercase tracking-widest text-[--color-grey-400]">
                          Disabled
                        </span>
                      ) : null}
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
  const cls =
    type === 'welcome' ? 'badge-welcome' :
    type === 'birthday' ? 'badge-birthday' :
    type === 'winback' ? 'badge-winback' :
    type === 'expiry_reminder' ? 'badge-expiry' :
    'badge-manual'

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${cls}`}>
      {type.replace('_', ' ')}
    </span>
  )
}

function CouponStatusBadge({ status }: { status: string }) {
  const cls = status === 'redeemed'
    ? 'badge-redeemed'
    : status === 'sent'
    ? 'badge-pending'
    : 'badge-failed'

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${cls}`}>
      {status}
    </span>
  )
}
