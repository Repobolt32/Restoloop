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

  // Calculate live numbers for the billing panel preview
  const enteredBillAmount = Number(billAmount) || 0
  const isRedeemed = !!result?.success

  return (
    <div className="p-8 max-w-5xl mx-auto font-body">
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
        Process guest visits, calculate discounts, and register redemptions.
      </p>

      {/* Two column layout on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">

        {/* Left Column: Form (3/5 width) */}
        <div className="md:col-span-3 bg-white border border-[--color-border] rounded-2xl p-8 shadow-md">
          <p className="section-label mb-5">Step 1 — Enter Transaction details</p>

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
                  onChange={(e) => {
                    setBillAmount(e.target.value)
                    if (result) setResult(null)
                  }}
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
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  if (result) setResult(null)
                }}
                placeholder="e.g. WELCOME10"
                required
                disabled={isPending}
                autoComplete="off"
                spellCheck={false}
                className="w-full px-4 py-3.5 border border-[--color-border] rounded-xl text-base font-mono tracking-widest text-[--color-foreground] bg-white focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/15 transition-all disabled:opacity-75"
              />
            </div>

            {/* Error Message */}
            {result?.error && (
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-red-800 text-sm font-bold flex items-center gap-2 animate-fade-in" aria-live="polite">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {result.error}
              </div>
            )}

            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={isPending || !billAmount || !code}
                className="btn-primary disabled:opacity-50"
              >
                Redeem
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Billing Summary (2/5 width) — Always Present */}
        <div className="md:col-span-2 space-y-4">
          <div
            className={`rounded-2xl overflow-hidden shadow-md border transition-all duration-300 ${isRedeemed
                ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-[--color-border] bg-white'
              }`}
          >
            {/* Summary Header */}
            <div className={`px-6 py-4 flex items-center justify-between transition-colors duration-300 ${isRedeemed ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-[--color-foreground]'
              }`}>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 shrink-0" />
                <span className="font-black uppercase tracking-widest text-xs">
                  {isRedeemed ? 'Redemption Invoice 🎉' : 'Billing Summary'}
                </span>
              </div>
              {isRedeemed && (
                <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md animate-bounce">
                  Success!
                </span>
              )}
            </div>

            {/* Breakdown Content */}
            <div className="p-6 space-y-4">

              {/* Customer Info (Redeemed state only) */}
              {isRedeemed && result && (
                <div className="flex justify-between items-center pb-3 border-b border-emerald-100 animate-fade-in">
                  <span className="text-xs font-bold text-[--color-grey-500] uppercase tracking-wider">Customer</span>
                  <span className="text-sm font-black text-[--color-foreground]">{result.customer?.name || 'Anonymous Guest'}</span>
                </div>
              )}

              {/* Coupon Code Row (Redeemed state only) */}
              {isRedeemed && result && (
                <div className="flex justify-between items-center pb-3 border-b border-emerald-100 animate-fade-in">
                  <span className="text-xs font-bold text-[--color-grey-500] uppercase tracking-wider">Coupon Code</span>
                  <span className="font-mono text-xs font-black bg-emerald-100/60 px-2 py-0.5 rounded text-emerald-900">{result.code}</span>
                </div>
              )}

              {/* Bill Total (Always Present) */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[--color-grey-500] uppercase tracking-wider">Bill Total</span>
                <span className={`text-sm font-black transition-opacity duration-300 ${enteredBillAmount > 0 ? 'text-[--color-foreground]' : 'text-[--color-grey-300]'}`}>
                  {enteredBillAmount > 0
                    ? `₹${(isRedeemed && result?.billAmountCents ? result.billAmountCents / 100 : enteredBillAmount).toFixed(2)}`
                    : '₹0.00'
                  }
                </span>
              </div>

              {/* Discount Row (Always Present) */}
              <div className="flex justify-between items-center">
                <span className={`text-xs font-bold flex items-center gap-1 uppercase tracking-wider ${isRedeemed ? 'text-red-600 font-extrabold' : 'text-[--color-grey-500]'}`}>
                  <Percent className="w-3.5 h-3.5" />
                  {isRedeemed ? `Discount (${result?.discountPercent}%)` : 'Discount'}
                </span>
                <span className={`text-sm font-black transition-all ${isRedeemed ? 'text-red-600' : 'text-[--color-grey-300]'}`}>
                  {isRedeemed && result?.discountAmountCents
                    ? `−₹${(result.discountAmountCents / 100).toFixed(2)}`
                    : '— —'
                  }
                </span>
              </div>

              {/* Payable Amount Divider */}
              <div className={`border-t pt-4 ${isRedeemed ? 'border-emerald-200' : 'border-[--color-border]'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black uppercase tracking-wider text-[--color-foreground]">You Pay</span>
                  <span className={`text-2xl font-black tabular-nums transition-all ${isRedeemed
                      ? 'text-green-600 text-3xl font-extrabold'
                      : enteredBillAmount > 0 ? 'text-[--color-foreground]' : 'text-[--color-grey-300]'
                    }`}>
                    {isRedeemed && result?.billAmountCents && result?.discountAmountCents
                      ? `₹${((result.billAmountCents - result.discountAmountCents) / 100).toFixed(2)}`
                      : enteredBillAmount > 0
                        ? `₹${enteredBillAmount.toFixed(2)}`
                        : '₹0.00'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Info bar */}
            <div className={`px-6 py-3 border-t text-[10px] font-bold text-center uppercase tracking-wider transition-colors duration-300 ${isRedeemed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                : 'bg-gray-50 text-[--color-grey-400] border-gray-100'
              }`}>
              {isRedeemed
                ? '🎉 Coupon Redeemed Successfully!'
                : enteredBillAmount > 0
                  ? 'Coupon discount will apply on validation'
                  : 'Enter bill amount to begin'
              }
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
