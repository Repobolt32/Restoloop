import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tenant } from './restoloop.types';

/**
 * Robust multi-tenant helper to retrieve a user's active tenant instance.
 * Resilient against PGRST116 errors when a developer account owns multiple tenants.
 * Selects the oldest tenant by created_at ascending.
 */
export async function getTenantForUser(supabase: SupabaseClient, userId: string): Promise<Tenant | null> {
    const { data, error } = await supabase
        .from('tenants' as any)
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true }) as any;

    if (error || !data || data.length === 0) {
        return null;
    }

    if (data.length > 1) {
        console.warn(`[Tenant] User ${userId} owns multiple tenants (${data.length}). Using oldest instance by created_at: ${data[0].id}`);
    }

    return data[0] as Tenant;
}
