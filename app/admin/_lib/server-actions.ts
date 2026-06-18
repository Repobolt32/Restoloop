'use server';

import { createServiceClient } from '~/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addCredits(tenantId: string, amount: number) {
    const adminId = process.env.SUPER_ADMIN_USER_ID;
    if (!adminId) throw new Error('System not configured for admin actions.');

    const supabase = await createServiceClient();

    const { data: tenant } = (await supabase
        .from('tenants' as any)
        .select('credits_balance')
        .eq('id', tenantId)
        .single()) as { data: { credits_balance: number } | null };

    if (!tenant) throw new Error('Tenant not found');

    const newBalance = tenant.credits_balance + amount;

    const { error } = await supabase
        .from('tenants' as any)
        .update({ credits_balance: newBalance })
        .eq('id', tenantId);

    if (error) throw new Error('Failed to update credits');

    revalidatePath('/admin');
    return { success: true, newBalance };
}
