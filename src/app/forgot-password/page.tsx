'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message || 'Failed to send password reset email')
      return
    }

    setMessage('Password reset email sent! Please check your inbox.')
  }

  return (
    <div className="min-h-screen bg-[--color-background] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white border border-[--color-border] rounded-2xl p-8 shadow-md w-full max-w-md flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[--color-foreground] font-display uppercase mb-1">
            Reset Password
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent]">
            Send recovery link
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 text-xs font-bold">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 text-xs font-bold">
            {message}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-[--color-grey-600]">Email Address</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border border-[--color-border] rounded-lg px-4 py-3 text-sm focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 w-full font-bold text-[--color-foreground]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest py-3.5 w-full transition-colors cursor-pointer"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <p className="text-center text-xs font-bold text-[--color-grey-500] mt-2">
          Back to{' '}
          <Link href="/login" className="text-[--color-primary] hover:text-[--color-primary-dark] transition-colors underline uppercase tracking-wider text-[10px] font-black ml-1">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
