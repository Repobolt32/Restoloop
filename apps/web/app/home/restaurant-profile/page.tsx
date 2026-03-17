import { createSupabaseServerClient } from '~/lib/supabase/server';
import { ProfileForm } from './_components/ProfileForm';
import { StitchPortal } from '~/components/stitch/StitchPortal';
import { Settings } from 'lucide-react';

export const metadata = {
    title: 'Restaurant Profile — Restoloop',
    description: 'Set up your restaurant details, tax rate, and coupon defaults.',
};

export default async function RestaurantProfilePage() {
    const supabase = createSupabaseServerClient();

    const { data: tenant } = await supabase
        .from('tenants')
        .select('name, slug, tax_rate, coupon_welcome, coupon_bday, coupon_winback, address, email, phone')
        .single();

    return (
        <StitchPortal>
            {/* Page Header - Professional Terminal Style */}
            <header className="mb-14 flex items-end justify-between border-b border-white/5 pb-10">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <p className="text-xs font-black tracking-[0.4em] text-neutral-500 uppercase">
                            Brand Configuration Protocol
                        </p>
                    </div>
                    <h1 className="text-7xl font-black tracking-tighter text-[#FF6B00] leading-none drop-shadow-[0_0_30px_rgba(255,107,0,0.2)]">
                        Profile <span className="text-white">.</span>
                    </h1>
                </div>

                <div className="text-right hidden md:block">
                    <h3 className="text-sm font-black tracking-[0.4em] text-white uppercase mb-2">IDENTITY NODE</h3>
                    <p className="text-base font-medium text-neutral-400">Restoloop Core — Instance_01</p>
                </div>
            </header>

            <div className="max-w-4xl">
                <ProfileForm
                    defaultValues={
                        tenant
                            ? {
                                name: tenant.name,
                                slug: tenant.slug,
                                taxRate: tenant.tax_rate,
                                couponWelcome: tenant.coupon_welcome,
                                couponBday: tenant.coupon_bday,
                                couponWinback: tenant.coupon_winback,
                                address: tenant.address,
                                email: tenant.email,
                                phone: tenant.phone,
                            }
                            : undefined
                    }
                />
            </div>
        </StitchPortal>
    );
}
