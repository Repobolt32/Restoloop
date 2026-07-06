'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message || 'Failed to update password')
      return
    }

    router.push('/login?message=Password updated successfully! Please log in with your new password.')
  }

  return (
    <div className="min-h-screen bg-[--color-background] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white border border-[--color-border] rounded-2xl p-8 shadow-md w-full max-w-md flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[--color-foreground] font-display uppercase mb-1">
            New Password
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent]">
            Set your new password
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 text-xs font-bold">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-[--color-grey-600]">New Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-[--color-border] rounded-lg px-4 py-3 text-sm focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 w-full font-bold text-[--color-foreground]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-wider text-[--color-grey-600]">Confirm New Password</label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="border border-[--color-border] rounded-lg px-4 py-3 text-sm focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 w-full font-bold text-[--color-foreground]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest py-3.5 w-full transition-colors cursor-pointer"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
