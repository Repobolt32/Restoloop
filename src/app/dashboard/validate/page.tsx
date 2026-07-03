'use client'

import { validateCoupon } from './actions'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Receipt, Percent, IndianRupee } from 'lucide-react'

export default function ValidatePage() {
  const [code, setCode] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [result, setResult] = useState<{
    success?: boolean
    error?: string
    customer?: { name: string | null; phone: string } | null
    discountPercent?: number
    discountAmountCents?: number
    billAmountCents?: number
    code?: string
  } | null>(null)

  const [isPending, startTransition] = useTransition()

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending) return

    const billCents = Math.round(Number(billAmount) * 100)
    if (!billCents || billCents <= 0) return

    startTransition(async () => {
      const res = await validateCoupon(code, billCents)
      setResult(res)
      if (res.success) {
        setCode('')
        setBillAmount('')
      }
    })
  }

  // Live calculation preview before submitting
  const previewDiscount = code && billAmount && !result?.success
    ? null // only show after redemption
    : null

  return (
    <div className="p-8 max-w-lg mx-auto font-body">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[--color-grey-500] hover:text-[--color-primary] mb-6 cursor-pointer transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Dashboard
      </Link>

      <h1 className="font-display text-3xl font-black tracking-tight text-[--color-foreground] mb-1 text-wrap-balance uppercase">
        POS Billing
      </h1>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent] mb-8">
        Enter bill amount and coupon code to calculate and apply the discount.
      </p>

      {/* Form card */}
      <div className="bg-white border border-[--color-border] rounded-2xl p-8 shadow-md">
        <form onSubmit={handleValidate} className="flex flex-col gap-6">
          {/* Bill Amount */}
          <div className="flex flex-col gap-2">
            <label htmlFor="bill-amount" className="section-label">
              Bill Amount (₹)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-grey-400]" />
              <input
                id="bill-amount"
                type="number"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                placeholder="0.00"
                required
                min={1}
                step={0.01}
                disabled={isPending}
                className="w-full pl-10 pr-4 py-3 border border-[--color-border] rounded-xl text-base font-bold text-[--color-foreground] bg-white focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/15 transition-all disabled:opacity-75"
              />
            </div>
          </div>

          {/* Coupon Code */}
          <div className="flex flex-col gap-2">
            <label htmlFor="coupon-code" className="section-label">
              Coupon Code
            </label>
            <input
              id="coupon-code"
              name="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., W10-ABCDEF"
              required
              disabled={isPending}
              autoComplete="off"
              spellCheck={false}
              className="w-full px-4 py-3 border border-[--color-border] rounded-xl text-base font-mono tracking-wider text-[--color-foreground] bg-white focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/15 transition-all disabled:opacity-75"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[--color-accent] text-white py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-widest border-0 cursor-pointer transition-all hover:opacity-90 hover:-translate-y-px active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            {isPending ? 'Processing…' : 'Validate & Redeem'}
          </button>
        </form>

        {/* Results */}
        <div aria-live="polite" className="mt-6">
          {result?.error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 text-sm font-medium flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{result.error}</span>
            </div>
          )}

          {result?.success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="bg-emerald-500 px-5 py-4 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="text-white font-black uppercase tracking-widest text-sm">Coupon Redeemed!</span>
              </div>

              {/* Billing breakdown */}
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[--color-grey-600]">Customer</span>
                  <span className="text-sm font-black text-[--color-foreground]">{result.customer?.name || 'Anonymous'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[--color-grey-600]">Code</span>
                  <span className="font-mono text-xs font-black bg-emerald-100 px-2 py-0.5 rounded text-emerald-900">{result.code}</span>
                </div>
                <div className="border-t border-emerald-200 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[--color-grey-600]">Bill Amount</span>
                    <span className="text-sm font-black text-[--color-foreground]">₹{((result.billAmountCents ?? 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Discount ({result.discountPercent}%)
                    </span>
                    <span className="text-sm font-black text-emerald-700">−₹{((result.discountAmountCents ?? 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-emerald-200 pt-2">
                    <span className="text-base font-black text-[--color-foreground]">You Pay</span>
                    <span className="text-xl font-black text-[--color-accent]">
                      ₹{(((result.billAmountCents ?? 0) - (result.discountAmountCents ?? 0)) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
