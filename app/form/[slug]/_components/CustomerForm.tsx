'use client';

import { useState } from 'react';

interface Props {
    slug: string;
    restaurantName: string;
    welcomeDiscount: number;
}

type FormState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; couponCode: string; discount: number }
    | { status: 'error'; message: string };

export function CustomerForm({ slug, welcomeDiscount }: Props) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [birthday, setBirthday] = useState('');
    const [state, setState] = useState<FormState>({ status: 'idle' });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setState({ status: 'loading' });

        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, name, phone, birthday: birthday || undefined }),
            });

            const data = await res.json();

            if (!res.ok) {
                setState({ status: 'error', message: data.error ?? 'Something went wrong. Please try again.' });
                return;
            }

            setState({ status: 'success', couponCode: data.couponCode, discount: data.discount });
        } catch {
            setState({ status: 'error', message: 'Network error. Please check your connection and try again.' });
        }
    }

    // ── Success state ────────────────────────────────────────────────────────────
    if (state.status === 'success') {
        return (
            <div className="py-4 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-4xl">
                    🎉
                </div>
                <h2 className="text-xl font-bold text-gray-900">You&apos;re in!</h2>
                <p className="mt-2 text-gray-500">
                    Your welcome coupon is on its way via WhatsApp.
                </p>

                <div className="mt-6 rounded-xl bg-orange-50 p-5">
                    <p className="text-sm font-medium text-orange-600 uppercase tracking-wider">Your Coupon Code</p>
                    <p className="mt-2 text-4xl font-bold tracking-widest text-orange-500 font-mono">
                        {state.couponCode}
                    </p>
                    <p className="mt-2 text-gray-600">
                        ₹{state.discount} off your next visit
                    </p>
                </div>

                <p className="mt-6 text-xs text-gray-400">
                    Show this code at the restaurant. Valid for 7 days.
                </p>
            </div>
        );
    }

    // ── Form state ───────────────────────────────────────────────────────────────
    const isLoading = state.status === 'loading';

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Your Name <span className="text-red-500">*</span>
                </label>
                <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
                />
            </div>

            {/* Phone */}
            <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                    WhatsApp Number <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                    <span className="flex items-center rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 select-none">
                        🇮🇳 +91
                    </span>
                    <input
                        id="phone"
                        type="tel"
                        required
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        disabled={isLoading}
                        className="w-full rounded-r-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
                    />
                </div>
                <p className="mt-1 text-xs text-gray-400">We&apos;ll send your coupon to this number</p>
            </div>

            {/* Birthday (optional) */}
            <div>
                <label htmlFor="birthday" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Birthday{' '}
                    <span className="text-gray-400 font-normal">(optional — get a birthday coupon! 🎂)</span>
                </label>
                <input
                    id="birthday"
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
                />
            </div>

            {/* Error message */}
            {state.status === 'error' && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {state.message}
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={isLoading || phone.length !== 10 || name.trim().length < 2}
                className="w-full rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                        </svg>
                        Registering...
                    </span>
                ) : (
                    `Claim ₹${welcomeDiscount} Welcome Coupon →`
                )}
            </button>
        </form>
    );
}
