'use client'

import { useState } from 'react'
import { submitIntakeForm } from './actions'

interface IntakeFormProps {
  slug: string
  restaurantName: string
}

export default function IntakeForm({ slug, restaurantName }: IntakeFormProps) {
  const [waUrl, setWaUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    
    // Client-side phone format validation check (10 to 15 digits supporting US and international)
    const phone = formData.get('phone') as string
    const normalizedPhone = phone.replace(/\D/g, '')
    if (!/^\d{10,15}$/.test(normalizedPhone)) {
      setError('Please enter a valid WhatsApp number (10 to 15 digits).')
      setLoading(false)
      return
    }

    try {
      const result = await submitIntakeForm(slug, formData)
      if (result.success && result.waUrl) {
        setWaUrl(result.waUrl)
      } else {
        setError(result.error || 'Failed to submit form')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (waUrl) {
    return (
      <div className="w-full max-w-md bg-white border border-[--color-border] rounded-2xl p-8 shadow-md text-center">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-black text-[--color-foreground] uppercase mb-2">Almost Done!</h2>
        <p className="text-[--color-grey-500] text-sm font-bold leading-relaxed mb-6">
          Click the button below to send your confirmation message on WhatsApp and receive your coupon.
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            // Reset form status so they can sign up again later if needed
            setWaUrl('')
          }}
          className="inline-block w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest py-4 transition-colors shadow-md text-center"
        >
          Send WhatsApp Confirmation
        </a>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md bg-white border border-[--color-border] rounded-2xl p-8 shadow-md">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-[--color-foreground] font-display uppercase mb-1">{restaurantName}</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent]">Join Our Loyalty Club</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm font-bold px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-black uppercase tracking-wider text-[--color-grey-600]">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="John Doe"
            required
            className="w-full bg-white border border-[--color-border] focus:border-[--color-primary] rounded-xl px-4 py-3 text-sm text-[--color-foreground] placeholder-[--color-grey-300] font-bold focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 transition duration-150"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-xs font-black uppercase tracking-wider text-[--color-grey-600]">
            WhatsApp Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="15551734928"
            required
            className="w-full bg-white border border-[--color-border] focus:border-[--color-primary] rounded-xl px-4 py-3 text-sm text-[--color-foreground] placeholder-[--color-grey-300] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 transition duration-150"
          />
          <p className="text-[--color-grey-400] text-[10px] font-bold">Enter your WhatsApp number with country code (e.g. 15551734928)</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="birthdayMonth" className="text-xs font-black uppercase tracking-wider text-[--color-grey-600]">
              Birth Month
            </label>
            <select
              id="birthdayMonth"
              name="birthdayMonth"
              defaultValue=""
              className="w-full bg-white border border-[--color-border] focus:border-[--color-primary] rounded-xl px-4 py-3 text-sm text-[--color-foreground] font-bold focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 transition duration-150 appearance-none cursor-pointer"
            >
              <option value="" disabled className="text-slate-400">Month</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="birthdayDay" className="text-xs font-black uppercase tracking-wider text-[--color-grey-600]">
              Birth Day
            </label>
            <select
              id="birthdayDay"
              name="birthdayDay"
              defaultValue=""
              className="w-full bg-white border border-[--color-border] focus:border-[--color-primary] rounded-xl px-4 py-3 text-sm text-[--color-foreground] font-bold focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 transition duration-150 appearance-none cursor-pointer"
            >
              <option value="" disabled className="text-slate-400">Day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="foodPreference" className="text-xs font-black uppercase tracking-wider text-[--color-grey-600]">
            Food Preference <span className="text-[--color-grey-400] lowercase font-normal">(optional)</span>
          </label>
          <select
            id="foodPreference"
            name="foodPreference"
            defaultValue=""
            className="w-full bg-white border border-[--color-border] focus:border-[--color-primary] rounded-xl px-4 py-3 text-sm text-[--color-foreground] font-bold focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 transition duration-150 appearance-none cursor-pointer"
          >
            <option value="" disabled className="text-slate-400">Preference</option>
            <option value="Veg">Vegetarian</option>
            <option value="Non-Veg">Non-Vegetarian</option>
            <option value="Both">Both / Any</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-3.5 font-bold leading-relaxed">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#E65C00] hover:bg-[#C84B00] active:bg-[#E65C00] disabled:bg-[#E65C00] text-white font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl transition duration-200 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Registering...
            </>
          ) : (
            'Get WhatsApp Coupon'
          )}
        </button>
      </form>
    </div>
  )
}
