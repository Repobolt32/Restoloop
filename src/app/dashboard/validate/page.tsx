'use client'

import { validateCoupon } from './actions'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Receipt, Percent, IndianRupee, CheckCircle2, AlertCircle } from 'lucide-react'

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

  // Live preview — shown whenever bill amount is entered
  const billCentsPreview = Number(billAmount) > 0 ? Math.round(Number(billAmount) * 100) : 0
  // We don't know discount % before redemption, so show placeholder dashes
  const hasPreview = billCentsPreview > 0 && !result?.success

  return (
    <div className="p-8 max-w-xl mx-auto font-body">
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

      <h1 className="font-display text-3xl font-black tracking-tight text-[--color-foreground] mb-1 uppercase">
        POS Billing
      </h1>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent] mb-8">
        Enter the bill total, paste the customer coupon code, and redeem.
      </p>

      <div className="grid grid-cols-1 gap-6">
        {/* Input Form card */}
        <div className="bg-white border border-[--color-border] rounded-2xl p-8 shadow-md">
          <p className="section-label mb-5">Step 1 — Enter Bill Details</p>
          <form onSubmit={handleValidate} className="flex flex-col gap-5">
            {/* Bill Amount */}
            <div className="flex flex-col gap-2">
              <label htmlFor="bill-amount" className="section-label">
                Final Bill Amount (₹)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-grey-400]" />
                <input
                  id="bill-amount"
                  type="number"
                  value={billAmount}
                  onChange={(e) => { setBillAmount(e.target.value); setResult(null) }}
                  placeholder="0.00"
                  required
                  min={1}
                  step={0.01}
                  disabled={isPending}
                  className="w-full pl-10 pr-4 py-3.5 border border-[--color-border] rounded-xl text-lg font-black text-[--color-foreground] bg-white focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/15 transition-all disabled:opacity-75"
                />
              </div>
            </div>

            {/* Coupon Code */}
            <div className="flex flex-col gap-2">
              <label htmlFor="coupon-code" className="section-label">
                Customer Coupon Code
              </label>
              <input
                id="coupon-code"
                name="code"
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null) }}
                placeholder="Paste code here, e.g. W10-ABCDEF"
                required
                disabled={isPending}
                autoComplete="off"
                spellCheck={false}
                className="w-full px-4 py-3.5 border border-[--color-border] rounded-xl text-base font-mono tracking-widest text-[--color-foreground] bg-white focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/15 transition-all disabled:opacity-75"
              />
            </div>

            {/* Error state */}
            {result?.error && (
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-red-800 text-sm font-bold flex items-center gap-2" aria-live="polite">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {result.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !billAmount || !code}
              className="w-full bg-[--color-accent] text-white py-4 px-6 rounded-xl font-black text-sm uppercase tracking-widest border-0 cursor-pointer transition-all hover:opacity-90 hover:-translate-y-px active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              {isPending ? 'Processing…' : 'Validate & Redeem'}
            </button>
          </form>
        </div>

        {/* ── Payable Price Card — always shown when bill amount is entered ── */}
        {(hasPreview || result?.success) && (
          <div
            aria-live="polite"
            className={`rounded-2xl overflow-hidden shadow-md border transition-all ${
              result?.success
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-[--color-border] bg-white'
            }`}
          >
            {/* Card header */}
            <div className={`px-6 py-4 flex items-center justify-between ${
              result?.success ? 'bg-emerald-500' : 'bg-[--color-primary]'
            }`}>
              <div className="flex items-center gap-2">
                {result?.success
                  ? <CheckCircle2 className="w-5 h-5 text-white" />
                  : <Receipt className="w-5 h-5 text-white" />
                }
                <span className="text-white font-black uppercase tracking-widest text-sm">
                  {result?.success ? 'Coupon Redeemed!' : 'Payable Amount'}
                </span>
              </div>
              {result?.success && result.code && (
                <span className="bg-white/20 text-white font-mono text-xs font-black px-2.5 py-1 rounded-lg">
                  {result.code}
                </span>
              )}
            </div>

            {/* Breakdown rows */}
            <div className="p-6 space-y-3">
              {/* Customer row — only after redemption */}
              {result?.success && (
                <div className="flex justify-between items-center pb-3 border-b border-emerald-200">
                  <span className="text-sm font-bold text-[--color-grey-600]">Customer</span>
                  <span className="text-sm font-black text-[--color-foreground]">
                    {result.customer?.name || 'Anonymous'}
                  </span>
                </div>
              )}

              {/* Bill amount */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-[--color-grey-600]">Bill Total</span>
                <span className="text-sm font-black text-[--color-foreground]">
                  ₹{result?.success
                    ? ((result.billAmountCents ?? 0) / 100).toFixed(2)
                    : Number(billAmount).toFixed(2)
                  }
                </span>
              </div>

              {/* Discount row */}
              <div className="flex justify-between items-center">
                <span className={`text-sm font-bold flex items-center gap-1 ${result?.success ? 'text-emerald-700' : 'text-[--color-grey-400]'}`}>
                  <Percent className="w-3 h-3" />
                  {result?.success
                    ? `Discount (${result.discountPercent}%)`
                    : 'Discount (coupon %)'
                  }
                </span>
                <span className={`text-sm font-black ${result?.success ? 'text-emerald-700' : 'text-[--color-grey-400]'}`}>
                  {result?.success
                    ? `−₹${((result.discountAmountCents ?? 0) / 100).toFixed(2)}`
                    : '— —'
                  }
                </span>
              </div>

              {/* Divider */}
              <div className={`border-t pt-3 ${result?.success ? 'border-emerald-200' : 'border-[--color-border]'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-base font-black text-[--color-foreground]">You Pay</span>
                  <span className={`text-3xl font-black tabular-nums ${result?.success ? 'text-emerald-600' : 'text-[--color-primary]'}`}>
                    {result?.success
                      ? `₹${(((result.billAmountCents ?? 0) - (result.discountAmountCents ?? 0)) / 100).toFixed(2)}`
                      : `₹${Number(billAmount).toFixed(2)}`
                    }
                  </span>
                </div>
                {!result?.success && (
                  <p className="text-[10px] font-bold text-[--color-grey-400] mt-1.5 text-right">
                    Discount applied after coupon validation
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
