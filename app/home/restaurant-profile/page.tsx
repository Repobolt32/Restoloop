import { createClient } from '~/lib/supabase/server';
import { getTenantForUser } from '~/lib/tenant';
import { ProfileForm } from './_components/ProfileForm';
import { Settings } from 'lucide-react';

export const metadata = {
    title: 'Profile — Restoloop',
    description: 'Set up your restaurant details and coupon values.',
};

export default async function RestaurantProfilePage() {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const tenant = authData?.user ? await getTenantForUser(supabase, authData.user.id) : null;

    return (
        <>
            <header className="mb-10 flex items-end justify-between border-b border-white/5 pb-6">
                <div>
                    <p className="text-xs font-bold tracking-widest text-neutral-500 uppercase mb-2">
                        Settings
                    </p>
                    <h1 className="text-3xl font-bold text-white">
                        Profile
                    </h1>
                </div>
            </header>

            <div className="max-w-4xl">
                <ProfileForm
                    defaultValues={
                        tenant
                            ? {
                                name: tenant.name,
                                slug: tenant.slug,
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
        </>
    );
}
