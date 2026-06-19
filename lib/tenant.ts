import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/lib/database.types';
import type { Tenant } from './restoloop.types';

/**
 * Robust multi-tenant helper to retrieve a user's active tenant instance.
 * Resilient against PGRST116 errors when a developer account owns multiple tenants.
 * Selects the oldest tenant by created_at ascending.
 */
export async function getTenantForUser(supabase: SupabaseClient<Database>, userId: string): Promise<Tenant | null> {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
        return null;
    }

    if (data.length > 1) {
        console.warn(`[Tenant] User ${userId} owns multiple tenants (${data.length}). Using oldest instance by created_at: ${data[0].id}`);
    }

    return data[0];
}
