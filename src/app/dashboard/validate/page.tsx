'use client'

import { validateCoupon } from './actions'
import { useState, useTransition } from 'react'
import Link from 'next/link'

export default function ValidatePage() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<{
    success?: boolean
    error?: string
    customer?: { name: string | null; phone: string } | null
    discount?: number
    code?: string
  } | null>(null)

  const [isPending, startTransition] = useTransition()

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending) return

    startTransition(async () => {
      const res = await validateCoupon(code)
      setResult(res)
      if (res.success) {
        setCode('')
      }
    })
  }
  return (
    <div className="p-8 max-w-xl mx-auto font-body">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[--color-grey-500] hover:text-[--color-primary] mb-6 cursor-pointer transition-colors"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Dashboard
      </Link>

      <h1 className="font-display text-3xl font-black tracking-tight text-[--color-foreground] mb-1 text-wrap-balance uppercase">
        Validate Coupon
      </h1>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent] mb-8">
        Scan or enter a guest&apos;s coupon code to redeem it.
      </p>

      {/* Form card container */}
      <div className="bg-white border border-[--color-border] rounded-2xl p-8 shadow-md">
        <form onSubmit={handleValidate} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="coupon-code"
              className="text-sm font-semibold text-foreground"
            >
              Coupon Code
            </label>
            <input
              id="coupon-code"
              name="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., WELCOME10…"
              required
              disabled={isPending}
              autoComplete="off"
              spellCheck={false}
              className="w-full px-4 py-3 border border-border rounded-lg text-base font-mono tracking-wider text-foreground bg-white focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 transition-all duration-200 disabled:opacity-75"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-accent text-white py-3 px-6 rounded-lg font-semibold text-base border-0 cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-px active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isPending ? 'Validating…' : 'Validate & Redeem'}
          </button>
        </form>

        {/* Live Region for Screen Readers & Announcements */}
        <div aria-live="polite" className="mt-6">
          {result?.error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-800 text-sm font-medium flex items-center gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{result.error}</span>
            </div>
          )}

          {result?.success && (
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-lg text-emerald-800 text-sm">
              <div className="flex items-center gap-2 font-bold text-base mb-3 text-emerald-900">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="shrink-0"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Coupon Redeemed!</span>
              </div>
              <div className="flex flex-col gap-1.5 pl-7">
                <p><strong>Code:</strong> <span className="font-mono bg-emerald-100/50 px-1.5 py-0.5 rounded text-xs">{result.code}</span></p>
                <p><strong>Customer:</strong> {result.customer?.name || 'Anonymous'}</p>
                <p><strong>Discount Applied:</strong> ₹{(result.discount! / 100).toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
