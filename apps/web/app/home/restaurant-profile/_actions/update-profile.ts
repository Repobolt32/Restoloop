'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '~/lib/supabase/server';
import { generateUniqueSlug } from '~/lib/slug';

export type UpdateProfileState = {
    success?: boolean;
    error?: string;
    slug?: string;
};

/**
 * Server action: Save or update restaurant profile.
 * - On first save: generates a unique, immutable slug.
 * - On subsequent saves: updates name, tax_rate, coupon defaults only.
 */
export async function updateRestaurantProfile(
    _prevState: UpdateProfileState,
    formData: FormData,
): Promise<UpdateProfileState> {
    const supabase = createSupabaseServerClient();

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
        return { error: 'Not authenticated' };
    }

    const userId = authData.user.id;
    const name = (formData.get('name') as string)?.trim();
    const taxRate = parseFloat(formData.get('tax_rate') as string) || 5.0;
    const couponWelcome = parseInt(formData.get('coupon_welcome') as string) || 50;
    const couponBday = parseInt(formData.get('coupon_bday') as string) || 38;
    const couponWinback = parseInt(formData.get('coupon_winback') as string) || 30;
    const address = (formData.get('address') as string)?.trim() || '';
    const email = (formData.get('email') as string)?.trim() || '';
    const phone = (formData.get('phone') as string)?.trim() || '';

    if (!name) {
        return { error: 'Restaurant name is required' };
    }

    // Check if tenant already exists
    const { data: existing } = await supabase
        .from('tenants')
        .select('id, slug')
        .eq('owner_id', userId)
        .single();

    if (existing) {
        // Update — slug is immutable, never update it
        const { error } = await supabase
            .from('tenants')
            .update({
                name,
                tax_rate: taxRate,
                coupon_welcome: couponWelcome,
                coupon_bday: couponBday,
                coupon_winback: couponWinback,
                address,
                email,
                phone
            })
            .eq('owner_id', userId);

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
                .single();
            return !!data;
        });

        const { error: tenantError } = await supabase
            .from('tenants')
            .insert({
                owner_id: userId,
                name,
                slug,
                tax_rate: taxRate,
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
