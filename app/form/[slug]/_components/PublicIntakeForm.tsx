'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { PartyPopper, Phone, User, Calendar, Utensils, ArrowRight, CheckCircle2 } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
    birthday: z.string().optional(),
    favouriteDish: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function PublicIntakeForm({ tenantId, restaurantName }: { tenantId: string; restaurantName: string }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [successData, setSuccessData] = useState<{ waUrl: string; couponCode: string; discount: number } | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            // Append +91 constraint to backend gracefully 
            const payload = {
                tenantId,
                name: data.name,
                phone: `+91${data.phone}`,
                birthday: data.birthday || undefined,
                favouriteDish: data.favouriteDish || undefined,
            };

            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Failed to submit form');
            }

            setSuccessData({
                waUrl: result.waUrl,
                couponCode: result.couponCode,
                discount: result.discount
            });
            setIsSuccess(true);
            toast.success('Registration successful!');
        } catch (err: any) {
            toast.error(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess && successData) {
        return (
            <div className="bg-[#111] border border-[#25D366]/20 rounded-[2rem] p-8 md:p-12 text-center shadow-2xl shadow-green-500/10">
                <div className="w-20 h-20 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <CheckCircle2 className="w-10 h-10 text-[#25D366]" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-4">Registration Successful!</h2>
                <p className="text-neutral-400 font-medium mb-8 leading-relaxed max-w-sm mx-auto">
                    To claim your <span className="text-white font-bold">₹{successData.discount} OFF</span> coupon, click the button below to send the prefilled code to WhatsApp. This saves it directly in your chat history!
                </p>
                
                <div className="mb-8">
                    <a
                        href={successData.waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20BA5A] text-black font-black text-sm py-5 px-6 rounded-2xl transition-all uppercase tracking-[0.2em] shadow-lg shadow-green-500/20 active:scale-95"
                    >
                        💬 Save Coupon on WhatsApp
                    </a>
                </div>

                <p className="text-xs text-neutral-600 font-black tracking-[0.2em] uppercase">
                    {restaurantName} welcomes you.
                </p>
            </div>
        );
    }


    return (
        <div className="bg-[#111] border border-white/5 rounded-[2rem] p-6 md:p-10 shadow-2xl w-full">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#FF6B00]/10 rounded-2xl mb-4">
                    <PartyPopper className="w-6 h-6 text-[#FF6B00]" />
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase mb-2">
                    Unlock ₹50 Off
                </h1>
                <p className="text-sm font-medium text-neutral-400">
                    Enter your WhatsApp number to claim your instant welcome coupon for <span className="text-white font-bold">{restaurantName}</span>.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-black tracking-[0.2em] text-neutral-400 uppercase ml-1">
                        <User className="w-3 h-3 text-[#FF6B00]" /> Your Name
                    </label>
                    <input
                        {...register('name')}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white placeholder-neutral-600 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-colors"
                        placeholder="Rahul Sharma"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-black tracking-[0.2em] text-neutral-400 uppercase ml-1">
                        <Phone className="w-3 h-3 text-[#FF6B00]" /> WhatsApp Number
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <span className="text-neutral-500 font-bold border-r border-white/10 pr-3">+91</span>
                        </div>
                        <input
                            {...register('phone')}
                            type="tel"
                            className="w-full bg-black border border-white/10 rounded-xl pl-16 pr-4 py-4 text-white placeholder-neutral-600 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-colors"
                            placeholder="9876543210"
                            maxLength={10}
                        />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-neutral-500 uppercase ml-1">
                            <Calendar className="w-3 h-3 text-neutral-600" /> Birthday (Optional)
                        </label>
                        <input
                            {...register('birthday')}
                            type="date"
                            className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-neutral-300 focus:outline-none focus:border-white/20 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-neutral-500 uppercase ml-1">
                            <Utensils className="w-3 h-3 text-neutral-600" /> Favourite Dish (Optional)
                        </label>
                        <input
                            {...register('favouriteDish')}
                            className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-neutral-300 placeholder-neutral-700 focus:outline-none focus:border-white/20 transition-colors"
                            placeholder="e.g. Butter Chicken"
                        />
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#FF6B00] hover:bg-[#E65A00] text-black font-black text-sm py-5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black animate-spin rounded-full" />
                        ) : (
                            <>
                                Claim My Coupon <ArrowRight className="w-4 h-4 ml-1" />
                            </>
                        )}
                    </button>
                </div>
                <p className="text-center text-[10px] text-neutral-600 font-medium pt-2">
                    By submitting, you agree to receive promotional messages via WhatsApp.
                </p>
            </form>
        </div>
    );
}
