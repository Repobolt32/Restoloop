'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { updateDiscountsAction } from './actions'

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loadingItem, setLoadingItem] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  // Sandbox modal state
  const [showSandbox, setShowSandbox] = useState(false)
  const [sandboxOrder, setSandboxOrder] = useState<{
    orderId: string
    amount: number
    credits: number
    purchaseType: 'trial' | 'plan' | 'recharge'
    planName?: string
    packName?: string
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
        .order('created_at', { ascending: false })
        .limit(1)
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const handleRecharge = async (packName: 'starter' | 'growth' | 'power') => {
    setPaymentSuccess(null)
    setPaymentError(null)
    setLoadingItem(packName)
    
    try {
      const config = {
        starter: { amount: 1500, credits: 500 },
        growth: { amount: 3000, credits: 1000 },
        power: { amount: 6000, credits: 2000 },
      }[packName]

      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseType: 'recharge', packName }),
      })
      
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to create order')
      }
      
      const { orderId } = await res.json()
      const isMock = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === 'mock' || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      
      if (isMock) {
        setSandboxOrder({
          orderId,
          amount: config.amount,
          credits: config.credits,
          purchaseType: 'recharge',
          packName,
        })
        setShowSandbox(true)
      } else {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: config.amount * 100,
          currency: 'INR',
          name: 'Restoloop',
          description: `${packName.toUpperCase()} Credits Recharge`,
          order_id: orderId,
          handler: async (response: any) => {
            setPaymentSuccess(`Successfully purchased ${config.credits} credits!`)
            fetchRestaurant()
          },
          prefill: {
            email: restaurant?.email || '',
          },
          theme: {
            color: '#E65C00',
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
      console.error('Razorpay recharge error:', err)
      setPaymentError(err.message || 'Payment initiation failed.')
    } finally {
      setLoadingItem(null)
    }
  }

  const handlePayToUnlock = async () => {
    setPaymentSuccess(null)
    setPaymentError(null)
    setLoadingItem('trial')
    
    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseType: 'trial' }),
      })
      
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to create order')
      }
      
      const { orderId } = await res.json()
      const isMock = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === 'mock' || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      
      if (isMock) {
        setSandboxOrder({
          orderId,
          amount: 599,
          credits: 0,
          purchaseType: 'trial',
        })
        setShowSandbox(true)
      } else {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: 59900,
          currency: 'INR',
          name: 'Restoloop',
          description: '21-Day Unlimited Trial Plan',
          order_id: orderId,
          handler: async (response: any) => {
            setPaymentSuccess('Trial successfully activated! Please refresh.')
            fetchRestaurant()
          },
          prefill: {
            email: restaurant?.email || '',
          },
          theme: {
            color: '#E65C00',
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
    } finally {
      setLoadingItem(null)
    }
  }

  const handleSandboxSuccess = async () => {
    if (!sandboxOrder || !restaurant) return
    setShowSandbox(false)
    
    try {
      let notes: any = {
        userId: restaurant.owner_id,
        purchaseType: sandboxOrder.purchaseType,
      }
      
      if (sandboxOrder.purchaseType === 'plan') {
        notes.planName = sandboxOrder.planName
        notes.credits = sandboxOrder.credits.toString()
      } else if (sandboxOrder.purchaseType === 'recharge') {
        notes.packName = sandboxOrder.packName
        notes.credits = sandboxOrder.credits.toString()
      } else {
        notes.credits = sandboxOrder.credits.toString()
      }

      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_mock_${Date.now()}`,
              amount: sandboxOrder.amount * 100,
              currency: 'INR',
              notes
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
        setPaymentSuccess(
          sandboxOrder.purchaseType === 'trial'
            ? 'Trial successfully activated!'
            : sandboxOrder.purchaseType === 'plan'
            ? `Successfully upgraded to ${sandboxOrder.planName?.toUpperCase()} plan!`
            : `Successfully purchased ${sandboxOrder.credits} credits!`
        )
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

  const now = new Date()
  const isExpired = restaurant.plan === 'expired' || 
                    (restaurant.plan_expires_at && new Date(restaurant.plan_expires_at) < now) ||
                    (restaurant.plan === 'trial' && restaurant.trial_expires_at && new Date(restaurant.trial_expires_at) < now)
  const isGated = restaurant.plan === 'free' || isExpired

  // Expiry display helper
  const expiryDate = restaurant.plan_expires_at || restaurant.trial_expires_at
  const expiryDisplay = expiryDate 
    ? new Date(expiryDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })
    : 'Never'

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8" id="billing">
        {/* Card 1: Current Plan Card */}
        <div className="bg-white rounded-2xl p-8 shadow-md flex flex-col justify-between border border-[--color-border]">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-display text-xl font-black text-[--color-foreground] uppercase">Current Plan</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                restaurant.plan === 'trial' ? 'badge-pending' :
                restaurant.plan === 'free' ? 'badge-cancelled' :
                isExpired ? 'badge-failed' : 'badge-sent'
              }`} data-testid="plan-status-badge">
                {restaurant.plan} {isExpired && '(Expired)'}
              </span>
            </div>

            <div className="flex justify-between items-baseline mb-4">
              <span className="text-3xl font-black text-[--color-primary] font-mono" data-testid="credits-value">
                {restaurant.credits}
              </span>
              <span className="text-[--color-grey-500] text-sm font-bold">Credits Balance</span>
            </div>

            <div className="text-xs font-bold text-[--color-grey-600] space-y-1 mb-6">
              <p>Status: <span className={isExpired ? 'text-red-600' : 'text-emerald-600'}>{isExpired ? 'Expired' : 'Active'}</span></p>
              <p>Expiry: <span>{expiryDisplay}</span></p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/pricing"
              className="flex-1 bg-black hover:bg-gray-800 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-center no-underline transition-all block"
            >
              Upgrade Plan
            </Link>
            <button
              onClick={() => scrollToSection('recharge-credits')}
              className="flex-1 bg-transparent hover:bg-gray-50 text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-gray-200 cursor-pointer transition-all"
            >
              Buy Credits
            </button>
          </div>
        </div>

        {/* Restaurant Details Card */}
        <div className="bg-white rounded-2xl p-8 shadow-md border border-[--color-border]">
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

      {/* Recharge Credits Card */}
      <div className="bg-white rounded-2xl p-8 shadow-md border border-[--color-border] mb-8" id="recharge-credits">
        <h2 className="font-display text-xl font-black text-[--color-foreground] mb-2 uppercase">Recharge Credits</h2>
        <p className="text-xs font-bold text-[--color-grey-500] mb-6">Top up additional messages anytime. Flat ₹3/credit. Unused credits rollover forever.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'starter', name: 'Starter', price: '₹1,500', credits: 500 },
            { id: 'growth', name: 'Growth', price: '₹3,000', credits: 1000 },
            { id: 'power', name: 'Power', price: '₹6,000', credits: 2000 },
          ].map((pack) => {
            const isRechargeDisabled = restaurant.plan === 'free' || isExpired
            const isThisLoading = loadingItem === pack.id
            return (
              <div key={pack.id} className="p-6 rounded-xl border border-[--color-border] flex flex-col justify-between">
                <div>
                  <span className="font-display font-black text-sm uppercase text-[--color-foreground] block mb-1">{pack.name}</span>
                  <p className="text-2xl font-black font-mono text-[--color-primary] mb-1">{pack.price}</p>
                  <p className="text-xs font-bold text-gray-700 mb-6">🪙 {pack.credits} Credits</p>
                </div>

                <div className="relative group">
                  <button
                    disabled={isRechargeDisabled || !!loadingItem}
                    onClick={() => handleRecharge(pack.id as any)}
                    className={`w-full py-3 rounded-xl font-black text-[9px] uppercase tracking-widest border-0 cursor-pointer transition-all ${
                      isThisLoading
                        ? 'bg-amber-600 text-white animate-pulse'
                        : 'bg-black text-white hover:bg-gray-800'
                    } ${
                      isRechargeDisabled ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                    data-testid={`recharge-${pack.id}`}
                  >
                    {isThisLoading ? 'Processing...' : 'Buy Pack'}
                  </button>
                  {isRechargeDisabled && (
                    <div className="absolute left-1/2 -translate-x-1/2 -top-10 scale-0 group-hover:scale-100 transition-all bg-gray-900 text-white text-[9px] py-1.5 px-3 rounded shadow-lg whitespace-nowrap z-20 font-bold">
                      Requires active paid or trial plan
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* QR Code Card */}
      <div className="bg-white rounded-2xl p-8 shadow-md mb-8 relative overflow-hidden border border-[--color-border]">
        <h2 className="font-display text-xl font-black text-[--color-foreground] mb-4 uppercase">
          Enrollment QR Code
        </h2>
        <p className="text-sm text-[--color-grey-800] mb-6 font-bold">
          Print this QR code on tables, receipts, or the entrance. Customers scan it to join your loyalty club.
        </p>
        
        <div className="relative">
          {/* Blurred layer when gated */}
          <div className={`flex flex-col items-center gap-4 ${isGated ? 'blur-sm pointer-events-none select-none' : ''}`}>
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
              href={isGated ? undefined : qrDataUrl}
              download={`${restaurant.slug}-qr.png`}
              className="bg-[--color-primary] hover:bg-[--color-primary-dark] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer inline-flex items-center gap-2 font-bold"
              data-testid="download-qr-btn"
            >
              Download QR Code
            </a>
          </div>

          {/* Gated Unlock Overlay */}
          {isGated && (
            <div 
              data-testid="qr-lock-overlay"
              className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 text-center p-4 z-10"
            >
              <div className="max-w-xs bg-white border border-[--color-border] rounded-2xl p-6 shadow-lg flex flex-col items-center gap-4 text-black">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[--color-primary]" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <p className="text-xs font-bold text-gray-800">
                  Pay ₹599 to unlock unlimited campaign sends and get your table QR Code.
                </p>
                <button
                  data-testid="pay-to-unlock-btn"
                  onClick={handlePayToUnlock}
                  disabled={!!loadingItem}
                  className="bg-[--color-primary] hover:bg-[--color-primary-dark] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer font-bold shadow-md disabled:opacity-50"
                >
                  {loadingItem === 'trial' ? 'Processing...' : 'Pay to Unlock'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sandbox Payment Simulator Modal Overlay */}
      {showSandbox && sandboxOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs" data-testid="sandbox-modal">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-[90%] mx-auto animate-fade-in text-black">
            <h3 className="font-display text-2xl font-black text-gray-900 mb-2 uppercase">
              Razorpay Sandbox
            </h3>
            <p className="text-xs font-bold text-gray-500 mb-6">
              This sandbox modal simulates Razorpay&apos;s checkout flow. Selecting a choice below fires the respective outcome event back to our system endpoints.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm space-y-2 font-bold">
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt Code:</span>
                <span className="font-mono text-gray-900">{sandboxOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Simulated Package:</span>
                <span className="text-gray-900">
                  {sandboxOrder.purchaseType === 'trial'
                    ? '21-Day Unlimited Trial'
                    : sandboxOrder.purchaseType === 'plan'
                    ? `${sandboxOrder.planName?.toUpperCase()} Plan Upgrade`
                    : `${sandboxOrder.credits} Credits Top-up`}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-900">Total Price:</span>
                <span className="text-amber-700 font-black text-base font-display">₹{sandboxOrder.amount}.00</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 font-bold">
              <button
                data-testid="sandbox-simulate-success"
                onClick={handleSandboxSuccess}
                className="w-full bg-amber-700 text-white py-3.5 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-0 cursor-pointer transition-all hover:bg-amber-800"
              >
                Simulate Success
              </button>
              <button
                data-testid="sandbox-simulate-fail"
                onClick={handleSandboxCancel}
                className="w-full bg-transparent text-gray-600 py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 cursor-pointer transition-all hover:bg-gray-50"
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
