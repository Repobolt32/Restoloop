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
    
    // Client-side phone format validation check (+91XXXXXXXXXX)
    const phone = formData.get('phone') as string
    if (!/^\+91\d{10}$/.test(phone)) {
      setError('WhatsApp number must start with +91 followed by 10 digits.')
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
        <h1 className="text-2xl font-black tracking-tight text-[--color-foreground] font-display uppercase mb-2">You&apos;re Registered!</h1>
        <p className="text-[--color-grey-600] text-sm mb-8 font-bold leading-relaxed">
          Tap the button below to open WhatsApp and claim your welcome discount code at <strong className="text-[--color-foreground]">{restaurantName}</strong>.
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest py-3.5 px-6 rounded-xl transition duration-200 inline-flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-900/10 cursor-pointer"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.57 2.015 14.1 1.01 11.479 1.01c-5.442 0-9.866 4.372-9.87 9.802 0 1.934.507 3.826 1.47 5.514L2.094 20l3.963-1.039c1.6.877 3.325 1.34 5.093 1.343zm12.19-7.065c-.328-.164-1.945-.96-2.247-1.07-.302-.109-.522-.164-.74.164-.219.329-.85 1.07-1.041 1.29-.192.219-.384.246-.712.082-1.194-.597-1.974-1.055-2.756-2.396-.206-.353-.021-.544.153-.718.156-.156.328-.384.493-.575.164-.192.219-.329.328-.549.11-.22.055-.411-.027-.575-.082-.164-.74-1.78-.988-2.382-.24-.58-.51-.502-.7-.512-.178-.01-.384-.01-.59-.01-.205 0-.54.077-.822.384-.282.308-1.078 1.054-1.078 2.57s1.103 2.983 1.257 3.189c.154.205 2.17 3.313 5.258 4.646.734.317 1.309.507 1.758.65.74.235 1.414.202 1.947.122.593-.089 1.945-.794 2.219-1.56.275-.767.275-1.424.192-1.56-.083-.137-.302-.219-.63-.383z" />
          </svg>
          Open WhatsApp
        </a>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md bg-white border border-[--color-border] rounded-2xl p-8 shadow-md">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-[--color-foreground] font-display uppercase mb-1">Join the Club</h1>
        <p className="text-xs font-bold text-[--color-grey-500] leading-relaxed">
          Sign up to receive exclusive offers and a welcome coupon from <span className="text-[--color-foreground] font-extrabold">{restaurantName}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            placeholder="+919876543210"
            required
            className="w-full bg-white border border-[--color-border] focus:border-[--color-primary] rounded-xl px-4 py-3 text-sm text-[--color-foreground] placeholder-[--color-grey-300] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 transition duration-150"
          />
          <p className="text-[--color-grey-400] text-[10px] font-bold">Must include country code, e.g. +91XXXXXXXXXX</p>
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
