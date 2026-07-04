import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { searchCouponsAction, forceRedeemCouponAction, reactivateCouponAction } from './actions'

interface PageProps {
  searchParams: Promise<{ q?: string; success?: string }>
}

export default async function GlobalCouponPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (user.email !== 'admin@restoloop.com') redirect('/dashboard')

  let coupons: any[] = []
  if (sp.q) {
    coupons = await searchCouponsAction(sp.q)
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-8 font-body text-[var(--color-foreground)]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight text-[var(--color-foreground)] uppercase">
              Global Coupon Finder
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] mt-1">
              Search any coupon across all restaurants
            </p>
          </div>
          <Link href="/admin"
            className="px-4 py-2 border border-[var(--color-accent)] text-[var(--color-accent)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-border)] transition-colors cursor-pointer">
            Back to Admin
          </Link>
        </div>

        {sp.success && (
          <div className="mb-6 p-4 rounded-xl border border-green-200 bg-green-50 text-green-800 text-sm flex items-center font-bold">
            <svg className="w-5 h-5 mr-3 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Coupon successfully {sp.success}!
          </div>
        )}

        <form method="GET" className="mb-6">
          <div className="flex gap-3">
            <input type="text" name="q" defaultValue={sp.q || ''}
              placeholder="Search coupon code..."
              data-testid="coupon-search-input"
              className="flex-1 px-4 py-3 bg-white border border-[var(--color-border)] rounded-xl font-bold text-sm outline-none focus:border-[var(--color-primary)]" />
            <button type="submit" data-testid="coupon-search-btn"
              className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors cursor-pointer">
              Search
            </button>
          </div>
        </form>

        {coupons.length > 0 && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)]">Code</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)]">Type</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)]">Status</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)]">Customer</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)]">Restaurant</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)]">Expires</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-grey-600)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon: any) => (
                    <tr key={coupon.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-grey-50)] transition-colors text-sm font-bold">
                      <td className="p-4 font-mono text-xs">{coupon.code}</td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 bg-amber-50 text-amber-700">
                          {coupon.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          coupon.status === 'redeemed' ? 'border-gray-200 bg-gray-50 text-gray-700' :
                          coupon.status === 'sent' ? 'border-green-200 bg-green-50 text-green-700' :
                          'border-red-200 bg-red-50 text-red-700'
                        }`}>
                          {coupon.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs">{coupon.customers?.name || '-'}</td>
                      <td className="p-4 text-xs">{coupon.restaurants?.name || '-'}</td>
                      <td className="p-4 text-xs text-[var(--color-grey-500)]">
                        {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '-'}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {coupon.status !== 'redeemed' && (
                          <form action={forceRedeemCouponAction} className="inline-block">
                            <input type="hidden" name="couponId" value={coupon.id} />
                            <button type="submit" data-testid={`redeem-btn-${coupon.code}`}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer">
                              Force Redeem
                            </button>
                          </form>
                        )}
                        {coupon.status === 'redeemed' && (
                          <form action={reactivateCouponAction} className="inline-block">
                            <input type="hidden" name="couponId" value={coupon.id} />
                            <button type="submit" data-testid={`reactivate-btn-${coupon.code}`}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer">
                              Reactivate
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sp.q && coupons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm font-bold text-[var(--color-grey-500)]">No coupons found for &quot;{sp.q}&quot;</p>
          </div>
        )}
      </div>
    </div>
  )
}
