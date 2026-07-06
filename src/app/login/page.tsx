'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get('error')
    const messageParam = searchParams.get('message')
    if (errorParam) {
      setError(errorParam)
    }
    if (messageParam) {
      setMessage(messageParam)
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.status === 400 && error.message.toLowerCase().includes('confirm')) {
        setError('Please verify your email address first.')
      } else if (error.status === 429) {
        setError('Too many attempts. Please try again later.')
      } else {
        setError('Invalid email or password')
      }
      return
    }

    if (data?.user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single()

      if (roleData?.role === 'superadmin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } else {
      router.push('/dashboard')
    }
  }

  return (
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

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 text-xs font-bold">
          {message}
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
        <div className="flex justify-between items-center">
          <label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-[--color-grey-600]">Password</label>
          <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-wider text-[--color-primary] hover:underline">
            Forgot password?
          </Link>
        </div>
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
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[--color-background] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-sm font-bold text-[--color-foreground]">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
