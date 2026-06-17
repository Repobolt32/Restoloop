'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '~/lib/supabase/server';
import { generateUniqueSlug } from '~/lib/slug';
import { getTenantForUser } from '~/lib/tenant';

export type UpdateProfileState = {
    success?: boolean;
    error?: string;
    slug?: string;
};

/**
 * Server action: Save or update restaurant profile.
 * - On first save: generates a unique, immutable slug.
 * - On subsequent saves: updates name, coupon defaults only.
 */
export async function updateRestaurantProfile(
    _prevState: UpdateProfileState,
    formData: FormData,
): Promise<UpdateProfileState> {
    const supabase = await createClient() as any;

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
        return { error: 'Not authenticated' };
    }

    const userId = authData.user.id;
    const name = (formData.get('name') as string)?.trim();
    const couponWelcome = parseInt(formData.get('coupon_welcome') as string) || 50;
    const couponBday = parseInt(formData.get('coupon_bday') as string) || 38;
    const couponWinback = parseInt(formData.get('coupon_winback') as string) || 30;
    const address = (formData.get('address') as string)?.trim() || '';
    const email = (formData.get('email') as string)?.trim() || '';
    const phone = (formData.get('phone') as string)?.trim() || '';

    if (!name) {
        return { error: 'Restaurant name is required' };
    }

    // Check if tenant already exists using robust multi-tenant helper
    const existing = await getTenantForUser(supabase, userId);

    if (existing) {
        // Update — slug is immutable, never update it
        const { error } = await supabase
            .from('tenants')
            .update({
                name,
                coupon_welcome: couponWelcome,
                coupon_bday: couponBday,
                coupon_winback: couponWinback,
                address,
                email,
                phone
            })
            .eq('id', existing.id);

        if (error) return { error: error.message };

        revalidatePath('/home/restaurant-profile');
        return { success: true, slug: existing.slug };
    } else {
        // First-time creation: generate slug
        const slug = await generateUniqueSlug(name, async (candidate) => {
            const { data } = await supabase
                .from('tenants')
                .select('id')
                .eq('slug', candidate)
                .limit(1);
            return !!(data && data.length > 0);
        });

        const { error: tenantError } = await supabase
            .from('tenants')
            .insert({
                owner_id: userId,
                name,
                slug,
                coupon_welcome: couponWelcome,
                coupon_bday: couponBday,
                coupon_winback: couponWinback,
                address,
                email,
                phone,
                credits_balance: 0, // Default to 0 to require manual activation
            });

        if (tenantError) return { error: tenantError.message };

        revalidatePath('/home/restaurant-profile');
        return { success: true, slug };
    }
}
