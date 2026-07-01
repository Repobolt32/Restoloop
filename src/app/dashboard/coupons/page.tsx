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

const TH_STYLE: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontFamily: 'var(--font-display)',
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: '#FFFFFF',
  background: 'var(--color-foreground)',
  whiteSpace: 'nowrap',
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
    <div style={{ padding: '2rem' }}>
      <h1
        data-testid="coupons-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          color: 'var(--color-foreground)',
          marginBottom: '1.5rem',
        }}
      >
        Coupons
      </h1>

      {/* Filter chips */}
      <div
        data-testid="filter-chips"
        style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}
      >
        {FILTER_TYPES.map((type) => {
          const isActive = filter === type
          return (
            <button
              key={type}
              id={`filter-${type}`}
              data-testid={`filter-${type}`}
              onClick={() => setFilter(type)}
              style={{
                padding: '6px 18px',
                borderRadius: '9999px',
                border: isActive ? 'none' : '1.5px solid var(--color-accent)',
                background: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--color-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 200ms, color 200ms, border-color 200ms',
                textTransform: 'capitalize',
              }}
            >
              {type}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-foreground)', opacity: 0.5 }}>Loading…</p>
      ) : coupons.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-foreground)', opacity: 0.5 }}>
            {filter === 'all' ? 'No coupons issued yet.' : `No ${filter} coupons found.`}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              data-testid="coupons-table"
              style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}
            >
              <thead>
                <tr>
                  <th style={TH_STYLE}>Code</th>
                  <th style={TH_STYLE}>Customer</th>
                  <th style={TH_STYLE}>Type</th>
                  <th style={TH_STYLE}>Discount</th>
                  <th style={TH_STYLE}>Status</th>
                  <th style={TH_STYLE}>Expires</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon, i) => (
                  <tr
                    key={coupon.id}
                    style={{
                      background: i % 2 === 0 ? '#FFFFFF' : 'var(--color-background)',
                      transition: 'background 200ms',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-border)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#FFFFFF' : 'var(--color-background)' }}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-foreground)', fontWeight: 600 }}>
                      {coupon.code}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-foreground)' }}>
                      {coupon.customers?.phone ? maskPhone(coupon.customers.phone) : <span style={{ opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                      <TypeBadge type={coupon.type} />
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                      {formatCents(coupon.discount_cents)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <CouponStatusBadge status={coupon.status} />
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--color-foreground)', opacity: 0.7 }}>
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
  const colors: Record<string, React.CSSProperties> = {
    welcome:  { background: '#DBEAFE', color: '#1E40AF' },
    birthday: { background: '#FEF3C7', color: '#92400E' },
    winback:  { background: '#F3E8FF', color: '#6B21A8' },
  }
  const s = colors[type] ?? { background: 'var(--color-muted)', color: 'var(--color-foreground)' }
  return (
    <span style={{ ...s, display: 'inline-block', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
      {type}
    </span>
  )
}

function CouponStatusBadge({ status }: { status: string }) {
  const isSent = status === 'sent'
  const isRedeemed = status === 'redeemed'
  const bg = isRedeemed ? '#DCFCE7' : isSent ? '#FEF9C3' : '#FEE2E2'
  const color = isRedeemed ? '#166534' : isSent ? '#854D0E' : '#991B1B'
  return (
    <span style={{ background: bg, color, display: 'inline-block', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
      {status}
    </span>
  )
}
