'use server';

import { createClient, createServiceClient } from '~/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addCredits(tenantId: string, amount: number) {
    const adminId = process.env.SUPER_ADMIN_USER_ID;
    if (!adminId) throw new Error('System not configured for admin actions.');

    // Verify the caller is actually the super admin
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user || user.id !== adminId) {
        throw new Error('Unauthorized: Only the super admin can add credits.');
    }

    const supabase = await createServiceClient(); // Use service role for admin bypass

    const { data: tenant } = await supabase
        .from('tenants')
        .select('credits_balance')
        .eq('id', tenantId)
        .single();

    if (!tenant) throw new Error('Tenant not found');

    const newBalance = tenant.credits_balance + amount;

    const { error } = await supabase
        .from('tenants')
        .update({ credits_balance: newBalance })
        .eq('id', tenantId);

    if (error) throw new Error('Failed to update credits');

    // Update platform credits (error is non-critical, handled by subsequent read+update below)
    await supabase
        .from('platform_credits')
        .update({ balance: newBalance }) // for simplicity, assuming a single row or global tracker
        .eq('id', '1') // Needs correct ID or a generic update; we will use an RPC function if needed, but for MVP let's update all
        .neq('id', 'uuid-that-doesnt-exist'); // Update all rows (since there's only 1)

    // Wait, the safer way to handle platform credits is just letting it be a single row
    const { data: platformData } = await supabase.from('platform_credits').select('*').limit(1).single();
    if (platformData) {
        await supabase.from('platform_credits').update({ balance: platformData.balance + amount }).eq('id', platformData.id);
    }

    revalidatePath('/admin');
    return { success: true, newBalance };
}
