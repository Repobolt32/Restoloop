'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { maskPhone } from '@/lib/utils'
import Link from 'next/link'

type Coupon = {
  id: string
  code: string
  type: string
  discount_cents: number
  status: string
  expires_at: string
  customer_phone: string
}

const FILTERS = ['All', 'Welcome', 'Birthday', 'Winback'] as const

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [filter, setFilter] = useState<string>('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!restaurant) { window.location.href = '/dashboard/create'; return }

      const { data } = await supabase
        .from('coupons')
        .select('id, code, type, discount_cents, status, expires_at, customer_id')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })

      const custIds = [...new Set((data || []).map(c => c.customer_id).filter(Boolean))]
      const phoneMap: Record<string, string> = {}
      if (custIds.length > 0) {
        const { data: custs } = await supabase
          .from('customers')
          .select('id, phone')
          .in('id', custIds)
        custs?.forEach(c => { phoneMap[c.id] = c.phone })
      }

      const flat: Coupon[] = (data || []).map((c) => ({
        id: c.id,
        code: c.code,
        type: c.type,
        discount_cents: c.discount_cents,
        status: c.status,
        expires_at: c.expires_at,
        customer_phone: c.customer_id ? phoneMap[c.customer_id] || '—' : '—',
      }))

      setCoupons(flat)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'All'
    ? coupons
    : coupons.filter((c) => c.type.toLowerCase() === filter.toLowerCase())

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Dashboard
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              filter === f
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left text-sm text-gray-600">
              <th className="p-3 font-medium">Code</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Discount</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Expires</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  {filter === 'All' ? 'No coupons yet.' : `No ${filter.toLowerCase()} coupons.`}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{c.code}</td>
                  <td className="p-3 font-mono text-sm">{maskPhone(c.customer_phone)}</td>
                  <td className="p-3 capitalize">{c.type}</td>
                  <td className="p-3">₹{(c.discount_cents / 100).toFixed(0)}</td>
                  <td className="p-3">
                    <span className={
                      c.status === 'redeemed' ? 'text-green-600' :
                      c.status === 'expired' ? 'text-red-500' :
                      'text-yellow-600'
                    }>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {new Date(c.expires_at).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
