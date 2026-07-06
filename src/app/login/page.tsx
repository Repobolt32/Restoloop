'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password')
      return
    }
    if (data.user?.email === 'admin@restoloop.com') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[--color-background] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white border border-[--color-border] rounded-2xl p-8 shadow-md w-full max-w-md flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[--color-foreground] font-display uppercase mb-1">
            Log In
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent]">
            Welcome back to Restoloop
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
          Log In
        </button>

        <p className="text-center text-xs font-bold text-[--color-grey-500] mt-2">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[--color-primary] hover:text-[--color-primary-dark] transition-colors underline uppercase tracking-wider text-[10px] font-black ml-1">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  )
}
