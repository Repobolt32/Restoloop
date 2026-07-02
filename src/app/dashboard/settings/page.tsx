'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useTransition, useCallback } from 'react'
import Script from 'next/script'
import Link from 'next/link'

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  // Sandbox modal state
  const [showSandbox, setShowSandbox] = useState(false)
  const [sandboxOrder, setSandboxOrder] = useState<{
    orderId: string
    amount: number
    credits: number
  } | null>(null)

  const supabase = createClient()

  const fetchRestaurant = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()
        
      if (data) {
        setRestaurant(data)
      }
    } catch (err) {
      console.error('Error fetching restaurant:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchRestaurant()
  }, [fetchRestaurant])

  useEffect(() => {
    if (!restaurant) return
    const formUrl = `${window.location.origin}/form/${restaurant.slug}`
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(formUrl, {
        width: 256,
        margin: 2,
        color: { dark: '#450a0a', light: '#ffffff' },
      }).then((url: string) => setQrDataUrl(url))
    })
  }, [restaurant])

  const handleTopUp = async (credits: number) => {
    setPaymentSuccess(null)
    setPaymentError(null)
    
    startTransition(async () => {
      try {
        const amount = credits * 1 // ₹1 per credit
        
        const res = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, credits }),
        })
        
        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || 'Failed to create order')
        }
        
        const { orderId } = await res.json()
        
        const isMock = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === 'mock' || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        
        if (isMock) {
          setSandboxOrder({ orderId, amount, credits })
          setShowSandbox(true)
        } else {
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: amount * 100,
            currency: 'INR',
            name: 'Restoloop',
            description: `${credits} credits top-up`,
            order_id: orderId,
            handler: async (response: any) => {
              setPaymentSuccess(`Successfully purchased ${credits} credits!`)
              fetchRestaurant()
            },
            prefill: {
              email: restaurant?.email || '',
            },
            theme: {
              color: '#A16207',
            },
            modal: {
              ondismiss: function() {
                setPaymentError('Payment cancelled by user.')
              }
            }
          }
          
          const rzp = new (window as any).Razorpay(options)
          rzp.open()
        }
      } catch (err: any) {
        console.error('Razorpay checkout error:', err)
        setPaymentError(err.message || 'Payment initiation failed.')
      }
    })
  }

  const handleSandboxSuccess = async () => {
    if (!sandboxOrder || !restaurant) return
    setShowSandbox(false)
    
    try {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_mock_${Date.now()}`,
              amount: sandboxOrder.amount * 100,
              currency: 'INR',
              notes: {
                credits: sandboxOrder.credits.toString(),
                userId: restaurant.owner_id
              }
            }
          }
        }
      }
      
      const res = await fetch('/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': 'sig_mock'
        },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        setPaymentSuccess(`Successfully purchased ${sandboxOrder.credits} credits!`)
        fetchRestaurant()
      } else {
        const errData = await res.json()
        setPaymentError(errData.error || 'Failed to simulate payment capture on server')
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Sandbox simulator error')
    }
  }

  const handleSandboxCancel = () => {
    setShowSandbox(false)
    setPaymentError('Payment cancelled by user.')
  }

  const handleCopyUrl = () => {
    if (!restaurant) return
    const url = `${window.location.origin}/form/${restaurant.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
        <p className="text-[--color-grey-500] font-bold animate-pulse">Loading settings…</p>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <p className="text-[--color-foreground] font-bold">No restaurant found. Please create one first.</p>
      </div>
    )
  }

  const creditPct = Math.min(100, Math.round((restaurant.credits / 1000) * 100))

  return (
    <div className="p-8 max-w-4xl mx-auto relative">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Back Link */}
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
        Settings
      </h1>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent] mb-8">
        Manage your restaurant account and top up message credits.
      </p>

      {/* Live Region Alerts */}
      <div aria-live="polite" className="mb-6">
        {paymentSuccess && (
          <div data-testid="payment-success-alert" className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 text-sm font-medium flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{paymentSuccess}</span>
          </div>
        )}
        {paymentError && (
          <div data-testid="payment-error-alert" className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 text-sm font-medium flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{paymentError}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Credits Management Card */}
        <div className="bg-white border border-[--color-border] rounded-2xl p-8 shadow-md flex flex-col justify-between">
          <div>
            <h2 className="font-display text-xl font-black text-[--color-foreground] mb-4 uppercase">Message Credits</h2>
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-3xl font-black text-[--color-primary] font-mono" data-testid="credits-value">{restaurant.credits}</span>
              <span className="text-[--color-grey-500] text-sm font-bold">/ 1000 credits</span>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <svg width="100%" height="8" role="progressbar" aria-valuenow={restaurant.credits} aria-valuemin={0} aria-valuemax={1000} aria-label={`${restaurant.credits} of 1000 credits`}>
                <rect x="0" y="0" width="100%" height="8" rx="4" fill="var(--color-border)" />
                <rect x="0" y="0" width={`${creditPct}%`} height="8" rx="4" fill="var(--color-accent)" style={{ transition: 'width 600ms ease' }} />
              </svg>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-[--color-grey-600]">Choose a package to top up (₹1 per credit):</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                data-testid="top-up-100"
                onClick={() => handleTopUp(100)}
                disabled={isPending}
                className="bg-black hover:bg-gray-800 text-white py-3 px-2 rounded-xl font-black text-[9px] uppercase tracking-widest border-0 cursor-pointer transition-all disabled:opacity-50"
              >
                100 cr<br />(₹100)
              </button>
              <button
                data-testid="top-up-500"
                onClick={() => handleTopUp(500)}
                disabled={isPending}
                className="bg-black hover:bg-gray-800 text-white py-3 px-2 rounded-xl font-black text-[9px] uppercase tracking-widest border-0 cursor-pointer transition-all disabled:opacity-50"
              >
                500 cr<br />(₹500)
              </button>
              <button
                data-testid="top-up-1000"
                onClick={() => handleTopUp(1000)}
                disabled={isPending}
                className="bg-black hover:bg-gray-800 text-white py-3 px-2 rounded-xl font-black text-[9px] uppercase tracking-widest border-0 cursor-pointer transition-all disabled:opacity-50"
              >
                1000 cr<br />(₹1000)
              </button>
            </div>
          </div>
        </div>

        {/* Restaurant Details Card */}
        <div className="bg-white border border-[--color-border] rounded-2xl p-8 shadow-md">
          <h2 className="font-display text-xl font-black text-[--color-foreground] mb-4 uppercase">Restaurant Details</h2>
          <div className="space-y-4 text-sm font-bold">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[--color-grey-500]">Name</p>
              <p className="text-[--color-foreground] mt-0.5" data-testid="settings-restaurant-name">{restaurant.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[--color-grey-500]">WhatsApp Number</p>
              <p className="text-[--color-foreground] font-mono mt-0.5">{restaurant.whatsapp_number}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[--color-grey-500]">Public Intake Form URL</p>
              <div className="flex gap-2 items-center mt-1">
                <input
                  type="text"
                  readOnly
                  data-testid="public-form-url"
                  value={`${window.location.origin}/form/${restaurant.slug}`}
                  className="bg-[--color-grey-50] text-[--color-grey-800] font-mono text-xs px-3 py-2.5 rounded-lg border border-[--color-border] flex-1 outline-none font-bold"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-4 py-2 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Card */}
      <div className="bg-white border border-[--color-border] rounded-2xl p-8 shadow-md mb-8">
        <h2 className="font-display text-xl font-black text-[--color-foreground] mb-4 uppercase">
          Enrollment QR Code
        </h2>
        <p className="text-sm text-[--color-grey-800] mb-6 font-bold">
          Print this QR code on tables, receipts, or the entrance. Customers scan it to join your loyalty club.
        </p>
        <div className="flex flex-col items-center gap-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code for ${restaurant.name} intake form`}
              className="w-48 h-48 rounded-xl border border-[--color-border]"
              data-testid="qr-code-image"
            />
          ) : (
            <div className="w-48 h-48 rounded-xl bg-[--color-grey-50] animate-pulse" />
          )}
          <a
            href={qrDataUrl}
            download={`${restaurant.slug}-qr.png`}
            className="bg-[--color-primary] hover:bg-[--color-primary-dark] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer inline-flex items-center gap-2 font-bold"
            data-testid="download-qr-btn"
          >
            Download QR Code
          </a>
        </div>
      </div>

      {/* Sandbox Payment Simulator Modal Overlay */}
      {showSandbox && sandboxOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs" data-testid="sandbox-modal">
          <div className="bg-white border border-[--color-border] rounded-2xl p-8 shadow-2xl max-w-md w-[90%] mx-auto animate-fade-in">
            <h3 className="font-display text-2xl font-black text-[--color-foreground] mb-2 uppercase">
              Razorpay Sandbox
            </h3>
            <p className="text-xs font-bold text-[--color-grey-500] mb-6">
              This sandbox modal simulates Razorpay&apos;s checkout flow. Selecting a choice below fires the respective outcome event back to our system endpoints.
            </p>

            <div className="bg-[--color-grey-50] border border-[--color-border] rounded-xl p-4 mb-6 text-sm space-y-2 font-bold">
              <div className="flex justify-between">
                <span className="text-[--color-grey-500]">Receipt Code:</span>
                <span className="font-mono text-[--color-foreground]">{sandboxOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[--color-grey-500]">Simulated Package:</span>
                <span className="text-[--color-foreground]">{sandboxOrder.credits} Credits</span>
              </div>
              <div className="flex justify-between border-t border-[--color-border] pt-2 mt-2">
                <span className="text-[--color-foreground]">Total Price:</span>
                <span className="text-[--color-primary] font-black text-base font-display">₹{sandboxOrder.amount}.00</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 font-bold">
              <button
                data-testid="sandbox-simulate-success"
                onClick={handleSandboxSuccess}
                className="w-full bg-[--color-accent] text-white py-3.5 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-0 cursor-pointer transition-all hover:bg-[--color-accent-dark]"
              >
                Simulate Success
              </button>
              <button
                data-testid="sandbox-simulate-fail"
                onClick={handleSandboxCancel}
                className="w-full bg-transparent text-[--color-grey-600] py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[--color-border] cursor-pointer transition-all hover:bg-[--color-grey-50]"
              >
                Simulate Failure / Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
