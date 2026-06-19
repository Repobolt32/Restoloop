'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { toShortSlug } from '~/lib/slug';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
    Store,
    Ticket,
    Copy,
    ExternalLink,
    Save,
    Info,
    ChevronRight,
    QrCode,
    Zap,
    Clock
} from 'lucide-react';

import { updateRestaurantProfile, type UpdateProfileState } from '../_actions/update-profile';
import { QrFlyerCard } from './QrFlyerCard';
import { QrFlyerPrintView } from './QrFlyerPrintView';

interface ProfileFormProps {
    defaultValues?: {
        name?: string;
        taxRate?: number;
        taxCgst?: number;
        taxSgst?: number;
        couponWelcome?: number;
        couponBday?: number;
        couponWinback?: number;
        slug?: string;
        address?: string | null;
        email?: string | null;
        phone?: string | null;
    };
}

const initialState: UpdateProfileState = {};

export function ProfileForm({ defaultValues }: ProfileFormProps) {
    const [state, formAction, isPending] = useActionState(updateRestaurantProfile, initialState);

    const [nameVal, setNameVal] = useState(defaultValues?.name ?? '');

    useEffect(() => {
        if (state.success) {
            toast.success('Profile updated successfully.');
        }
        if (state.error) {
            toast.error(state.error);
        }
    }, [state]);

    const activeSlug = state.slug || defaultValues?.slug || toShortSlug(nameVal);
    const formUrl = activeSlug ? `https://restoloop.app/form/${activeSlug}` : null;
    const isSlugLocked = !!(state.slug || defaultValues?.slug);

    const InputLabel = ({ children, htmlFor, icon: Icon }: { children: React.ReactNode, htmlFor: string, icon: any }) => (
        <div className="flex items-center gap-2 mb-4 ml-1">
            <Icon className="w-3 h-3 text-[#FF6B00]" />
            <label htmlFor={htmlFor} className="text-xs font-black tracking-[0.4em] text-white uppercase">
                {children}
            </label>
        </div>
    );

    return (
        <form action={formAction} className="space-y-10 pb-20">
            {/* Identity Configuration */}
            <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-10">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                        <Store className="w-5 h-5 text-[#FF6B00]" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight uppercase">Restaurant Details</h3>
                        <p className="text-sm text-neutral-500 font-medium">Set your restaurant name and contact info.</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="grid gap-2">
                        <InputLabel htmlFor="name" icon={Store}>Restaurant Name</InputLabel>
                        <Input
                            id="name"
                            name="name"
                            required
                            placeholder="e.g. The Golden Spoon"
                            defaultValue={defaultValues?.name ?? ''}
                            onChange={(e) => setNameVal(e.target.value)}
                            className="bg-white/5 border-white/10 text-2xl font-mono tracking-widest text-white focus:border-orange-500/60 focus:bg-white/[0.08] placeholder:text-neutral-800 uppercase rounded-2xl px-8 py-6 h-auto"
                        />
                        {activeSlug && (
                            <div className="flex items-center gap-2 mt-4 px-1">
                                <Info className="w-3 h-3 text-neutral-700" />
                                <span className="text-xs font-medium text-neutral-600">
                                    Public link: <span className="text-white font-mono uppercase tracking-widest bg-white/5 px-2 py-1 rounded">restoloop.app/form/{activeSlug}</span>
                                </span>
                                {isSlugLocked && (
                                    <span className="text-[10px] font-black text-[#FF6B00]/40 uppercase tracking-widest ml-1">
                                        Fixed
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 pt-4">
                        <div className="space-y-2">
                            <InputLabel htmlFor="address" icon={Store}>Address</InputLabel>
                            <Input
                                id="address"
                                name="address"
                                placeholder="e.g. 123 Main St, New Delhi"
                                defaultValue={defaultValues?.address ?? ''}
                                className="bg-white/5 border-white/10 text-2xl font-mono tracking-widest text-white focus:border-orange-500/60 focus:bg-white/[0.08] placeholder:text-neutral-800 uppercase rounded-2xl px-8 py-6 h-auto"
                            />
                        </div>
                        <div className="space-y-2">
                            <InputLabel htmlFor="email" icon={Store}>Email</InputLabel>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="e.g. hello@restaurant.com"
                                defaultValue={defaultValues?.email ?? ''}
                                className="bg-white/5 border-white/10 text-2xl font-mono tracking-widest text-white focus:border-orange-500/60 focus:bg-white/[0.08] placeholder:text-neutral-800 uppercase rounded-2xl px-8 py-6 h-auto"
                            />
                        </div>
                        <div className="space-y-2">
                            <InputLabel htmlFor="phone" icon={Store}>Phone</InputLabel>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="e.g. +91 98765 43210"
                                defaultValue={defaultValues?.phone ?? ''}
                                className="bg-white/5 border-white/10 text-2xl font-mono tracking-widest text-white focus:border-orange-500/60 focus:bg-white/[0.08] placeholder:text-neutral-800 uppercase rounded-2xl px-8 py-6 h-auto"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Loyalty Incentives */}
            <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-10">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight uppercase">Incentive Engine</h3>
                        <p className="text-sm text-neutral-500 font-medium">Automatic coupon values for customer retention campaigns.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <InputLabel htmlFor="coupon_welcome" icon={Zap}>Welcome Payout</InputLabel>
                        <Input
                            id="coupon_welcome"
                            name="coupon_welcome"
                            type="number"
                            min="1"
                            placeholder="50"
                            defaultValue={defaultValues?.couponWelcome ?? 50}
                            className="bg-white/5 border-white/10 text-2xl font-mono tracking-widest text-white focus:border-orange-500/60 focus:bg-white/[0.08] placeholder:text-neutral-800 uppercase rounded-2xl px-8 py-6 h-auto"
                        />
                    </div>
                    <div className="space-y-2">
                        <InputLabel htmlFor="coupon_bday" icon={ChevronRight}>Birthday Gift</InputLabel>
                        <Input
                            id="coupon_bday"
                            name="coupon_bday"
                            type="number"
                            min="1"
                            placeholder="38"
                            defaultValue={defaultValues?.couponBday ?? 38}
                            className="bg-white/5 border-white/10 text-2xl font-mono tracking-widest text-white focus:border-orange-500/60 focus:bg-white/[0.08] placeholder:text-neutral-800 uppercase rounded-2xl px-8 py-6 h-auto"
                        />
                    </div>
                    <div className="space-y-2">
                        <InputLabel htmlFor="coupon_winback" icon={Clock}>Win-back Bonus</InputLabel>
                        <Input
                            id="coupon_winback"
                            name="coupon_winback"
                            type="number"
                            min="1"
                            placeholder="30"
                            defaultValue={defaultValues?.couponWinback ?? 30}
                            className="bg-white/5 border-white/10 text-2xl font-mono tracking-widest text-white focus:border-orange-500/60 focus:bg-white/[0.08] placeholder:text-neutral-800 uppercase rounded-2xl px-8 py-6 h-auto"
                        />
                    </div>
                </div>
            </div>

            {/* Public Endpoint */}
            {
                formUrl && (
                    <div className="bg-orange-600/5 border border-orange-500/20 overflow-hidden relative group rounded-xl">
                        {/* Decorative glow like the North Star summary card */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 blur-3xl rounded-full" />

                        <div className="p-10 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 rounded-[2rem] bg-[#FF6B00] flex items-center justify-center shadow-2xl shadow-orange-500/40 transform group-hover:rotate-3 transition-transform">
                                    <QrCode className="w-10 h-10 text-black" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-white tracking-widest uppercase mb-1">Customer Intake Terminal</h4>
                                    <p className="text-sm text-neutral-500 font-medium max-w-xs">Your public check-in form is live and ready.</p>
                                    <div className="mt-4 flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mt-0.5" />
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 group/link cursor-pointer hover:bg-black/60 transition-colors"
                                            onClick={() => {
                                                navigator.clipboard.writeText(formUrl);
                                                toast.success('Check-in link copied.');
                                            }}
                                        >
                                            <code className="text-sm font-medium text-neutral-300 transition-colors group-hover/link:text-[#FF6B00]">
                                                {formUrl.toLowerCase()}
                                            </code>
                                            <Copy className="w-3.5 h-3.5 text-neutral-500 group-hover/link:text-[#FF6B00] transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <a
                                    href={formUrl}
                                    target="_blank"
                                    className="bg-[#FF6B00] text-black font-black text-xs h-14 px-10 rounded-xl flex items-center gap-3 shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em]"
                                >
                                    Open Form <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* QR Flyer Generator */}
            <QrFlyerCard slug={activeSlug || undefined} />

            {/* Hidden print view */}
            <QrFlyerPrintView
              restaurantName={nameVal || defaultValues?.name || ''}
              slug={activeSlug || ''}
              couponValue={defaultValues?.couponWelcome ?? 0}
            />

            <div className="pt-12 border-t border-white/5 flex justify-end">
                <Button
                    type="submit"
                    disabled={isPending}
                    variant="default"
                    size="lg"
                    className="min-w-[300px] !rounded-[2rem]"
                >
                    {isPending ? (
                        <>
                            <div className="w-5 h-5 border-3 border-black/20 border-t-black animate-spin rounded-full mr-3" />
                            Syncing Protocol...
                        </>
                    ) : (
                        <>
                            Save Changes <Save className="w-5 h-5 ml-3" />
                        </>
                    )}
                </Button>
            </div>
        </form >
    );
}
