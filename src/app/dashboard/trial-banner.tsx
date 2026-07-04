'use client'

import { useState } from 'react'
import Script from 'next/script'

interface TrialBannerProps {
  plan: string
  trialActivatedAt: string | null
  trialExpiresAt: string | null
  ownerId: string
  email: string
  restaurantName: string
}

export function TrialBanner({
  plan,
  trialActivatedAt,
  trialExpiresAt,
  ownerId,
  email,
  restaurantName,
}: TrialBannerProps) {
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [showSandbox, setShowSandbox] = useState(false)
  const [sandboxOrderId, setSandboxOrderId] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const isMock = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === 'mock' || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

  const handleClaimTrial = async () => {
    setPaymentSuccess(null)
    setPaymentError(null)
    setIsPaymentLoading(true)

    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseType: 'trial' }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to initiate order')
      }

      const { orderId } = await res.json()

      if (isMock) {
        setSandboxOrderId(orderId)
        setShowSandbox(true)
      } else {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: 59900,
          currency: 'INR',
          name: 'Restoloop',
          description: '21-Day Unlimited Trial Plan',
          order_id: orderId,
          handler: async () => {
            setPaymentSuccess('Trial successfully activated! Please refresh.')
            window.location.reload()
          },
          prefill: {
            email: email || '',
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
      console.error('Razorpay trial error:', err)
      setPaymentError(err.message || 'Payment initiation failed.')
    } finally {
      setIsPaymentLoading(false)
    }
  }

  const handleSandboxSuccess = async () => {
    if (!sandboxOrderId) return
    setShowSandbox(false)

    try {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_mock_trial_${Date.now()}`,
              amount: 59900,
              currency: 'INR',
              notes: {
                purchaseType: 'trial',
                userId: ownerId,
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
        setPaymentSuccess('Trial successfully activated! Please refresh.')
        window.location.reload()
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

  // Calculate banner state
  const isTrialPlan = plan === 'trial'
  const hasTrialActivated = !!trialActivatedAt
  
  let daysLeft = 0
  let isExpired = false

  if (hasTrialActivated && trialExpiresAt) {
    const expiryDate = new Date(trialExpiresAt)
    const now = new Date()
    isExpired = expiryDate < now
    if (!isExpired) {
      daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }
  }

  // Render states
  const showNotStarted = plan === 'free' && !hasTrialActivated
  const showActive = isTrialPlan && !isExpired
  const showExpired = (isTrialPlan && isExpired) || (plan === 'free' && hasTrialActivated)

  return (
    <div className="mb-8 relative">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Live Region Alerts */}
      <div aria-live="polite" className="mb-4 space-y-2">
        {paymentSuccess && (
          <div data-testid="trial-payment-success-alert" className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 text-sm font-bold flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{paymentSuccess}</span>
          </div>
        )}
        {paymentError && (
          <div data-testid="trial-payment-error-alert" className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 text-sm font-bold flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{paymentError}</span>
          </div>
        )}
      </div>

      {showNotStarted && (
        <div data-testid="not-started-trial-banner" className="bg-gradient-to-r from-rose-900 to-amber-600 rounded-2xl p-6 shadow-md text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-black uppercase tracking-tight mb-2">Claim 21-Day Unlimited Growth Trial!</h2>
            <p className="text-sm font-medium opacity-90 max-w-2xl">
              Get unlimited campaign message sends, unlock your enrollment QR code, and accelerate your restaurant&apos;s retention for just ₹599.
            </p>
          </div>
          <button
            data-testid="claim-trial-btn"
            onClick={handleClaimTrial}
            disabled={isPaymentLoading}
            className="shrink-0 bg-white text-rose-900 hover:bg-gray-100 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-colors shadow-md disabled:opacity-50"
          >
            {isPaymentLoading ? 'Processing...' : 'Claim Trial (₹599)'}
          </button>
        </div>
      )}

      {showActive && (
        <div data-testid="active-trial-banner" className="bg-emerald-800 rounded-2xl p-6 shadow-md text-white">
          <h2 className="font-display text-xl font-black uppercase tracking-tight mb-1">Unlimited Growth Trial Active</h2>
          <p className="text-sm font-medium opacity-90">
            You have <span className="font-black text-amber-300 font-mono">{daysLeft}</span> days remaining on your trial. All marketing campaign automations are actively running.
          </p>
        </div>
      )}

      {showExpired && (
        <div data-testid="expired-trial-banner" className="bg-rose-900 rounded-2xl p-6 shadow-md text-white">
          <h2 className="font-display text-xl font-black uppercase tracking-tight mb-1">Your Growth Trial Has Ended</h2>
          <p className="text-sm font-medium opacity-90">
            Campaign messaging is currently paused. Please select a pricing plan or purchase message credits under Settings to reactivate.
          </p>
        </div>
      )}

      {/* Sandbox Payment Simulator Modal Overlay */}
      {showSandbox && sandboxOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs" data-testid="sandbox-modal">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-[90%] mx-auto text-black">
            <h3 className="font-display text-2xl font-black text-gray-900 mb-2 uppercase">
              Razorpay Sandbox
            </h3>
            <p className="text-xs font-bold text-gray-500 mb-6">
              This sandbox modal simulates Razorpay&apos;s checkout flow for the Trial Plan.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm space-y-2 font-bold">
              <div className="flex justify-between">
                <span className="text-gray-500">Order ID:</span>
                <span className="font-mono text-gray-900">{sandboxOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Package:</span>
                <span className="text-gray-900">21-Day Unlimited Trial</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-900">Total Price:</span>
                <span className="text-amber-700 font-black text-base font-display">₹599.00</span>
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
