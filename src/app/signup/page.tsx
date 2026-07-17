'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUpUser } from './actions'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const result = await signUpUser({ email, password })
    if (result.error) {
      setError(result.error)
      return
    }
    router.push('/login')
  }

  async function handleGoogleSignup() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen bg-[--color-background] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white border border-[--color-border] rounded-2xl p-8 shadow-md w-full max-w-md flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[--color-foreground] font-display uppercase mb-1">
            Sign Up
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent]">
            Get started with Restoloop
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 text-xs font-bold">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-[--color-grey-600]">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border border-[--color-border] rounded-lg px-4 py-3 text-sm focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 w-full font-bold text-[--color-foreground]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-[--color-grey-600]">Password</label>
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

        <button
          type="submit"
          className="bg-black hover:bg-gray-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest py-3.5 w-full transition-colors cursor-pointer"
        >
          Sign Up
        </button>

        <div className="relative flex items-center py-1">
          <div className="flex-1 border-t border-[--color-border]" />
          <span className="mx-3 text-[10px] font-black uppercase tracking-wider text-[--color-grey-400]">or</span>
          <div className="flex-1 border-t border-[--color-border]" />
        </div>

        <button
          type="button"
          id="google-signup-btn"
          onClick={handleGoogleSignup}
          className="flex items-center justify-center gap-3 border border-[--color-border] rounded-xl py-3.5 w-full font-black text-[10px] uppercase tracking-widest text-[--color-foreground] hover:bg-[--color-grey-50] transition-colors cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-xs font-bold text-[--color-grey-500] mt-2">
          Already have an account?{' '}
          <Link href="/login" className="text-[--color-primary] hover:text-[--color-primary-dark] transition-colors underline uppercase tracking-wider text-[10px] font-black ml-1">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
