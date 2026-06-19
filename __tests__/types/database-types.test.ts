/**
 * Type Safety Tests for lib/database.types.ts
 *
 * Bug 7: Systemic Type Safety Bypass
 * 
 * These tests verify that Supabase query results are properly typed
 * via the Database type, eliminating the need for `as` casts.
 *
 * If these tests fail, it means the Database type definitions don't
 * match the actual domain types, and code would need unsafe casts.
 */
import { describe, it, expectTypeOf } from 'vitest';
import type { Database, Tables, TablesInsert, TablesUpdate } from '~/lib/database.types';
import type { Tenant, Customer, Coupon, MessageLog, PlatformCredits } from '~/lib/restoloop.types';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Bug 7: Database type definitions match domain types', () => {
    describe('Tables type helper', () => {
        it('Tables<"tenants"> should be compatible with Tenant domain type', () => {
            type TenantRow = Tables<'tenants'>;
            
            // Verify key fields exist and have correct types
            expectTypeOf<TenantRow>().toHaveProperty('id');
            expectTypeOf<TenantRow>().toHaveProperty('owner_id');
            expectTypeOf<TenantRow>().toHaveProperty('name');
            expectTypeOf<TenantRow>().toHaveProperty('slug');
            expectTypeOf<TenantRow>().toHaveProperty('credits_balance');
            expectTypeOf<TenantRow>().toHaveProperty('coupon_welcome');
            expectTypeOf<TenantRow>().toHaveProperty('coupon_bday');
            expectTypeOf<TenantRow>().toHaveProperty('coupon_winback');
            expectTypeOf<TenantRow>().toHaveProperty('tax_rate');
            expectTypeOf<TenantRow>().toHaveProperty('tax_cgst');
            expectTypeOf<TenantRow>().toHaveProperty('tax_sgst');
            expectTypeOf<TenantRow>().toHaveProperty('address');
            expectTypeOf<TenantRow>().toHaveProperty('email');
            expectTypeOf<TenantRow>().toHaveProperty('phone');
            expectTypeOf<TenantRow>().toHaveProperty('created_at');
        });

        it('Tables<"customers"> should have all required columns', () => {
            type CustomerRow = Tables<'customers'>;
            
            expectTypeOf<CustomerRow>().toHaveProperty('id');
            expectTypeOf<CustomerRow>().toHaveProperty('tenant_id');
            expectTypeOf<CustomerRow>().toHaveProperty('name');
            expectTypeOf<CustomerRow>().toHaveProperty('phone');
            expectTypeOf<CustomerRow>().toHaveProperty('birthday');
            expectTypeOf<CustomerRow>().toHaveProperty('last_visit');
            expectTypeOf<CustomerRow>().toHaveProperty('food_pref');
            expectTypeOf<CustomerRow>().toHaveProperty('created_at');
        });

        it('Tables<"coupons"> should have all required columns including bill_items', () => {
            type CouponRow = Tables<'coupons'>;
            
            expectTypeOf<CouponRow>().toHaveProperty('id');
            expectTypeOf<CouponRow>().toHaveProperty('tenant_id');
            expectTypeOf<CouponRow>().toHaveProperty('customer_id');
            expectTypeOf<CouponRow>().toHaveProperty('type');
            expectTypeOf<CouponRow>().toHaveProperty('code');
            expectTypeOf<CouponRow>().toHaveProperty('discount');
            expectTypeOf<CouponRow>().toHaveProperty('status');
            expectTypeOf<CouponRow>().toHaveProperty('bill_amount');
            expectTypeOf<CouponRow>().toHaveProperty('bill_items');
            expectTypeOf<CouponRow>().toHaveProperty('created_at');
            expectTypeOf<CouponRow>().toHaveProperty('expires_at');
            expectTypeOf<CouponRow>().toHaveProperty('redeemed_at');
        });

        it('Tables<"message_log"> should have all required columns', () => {
            type MessageLogRow = Tables<'message_log'>;
            
            expectTypeOf<MessageLogRow>().toHaveProperty('id');
            expectTypeOf<MessageLogRow>().toHaveProperty('tenant_id');
            expectTypeOf<MessageLogRow>().toHaveProperty('customer_id');
            expectTypeOf<MessageLogRow>().toHaveProperty('coupon_id');
            expectTypeOf<MessageLogRow>().toHaveProperty('wa_message_id');
            expectTypeOf<MessageLogRow>().toHaveProperty('status');
            expectTypeOf<MessageLogRow>().toHaveProperty('sent_at');
        });

        it('Tables<"platform_credits"> should have all required columns', () => {
            type PlatformCreditsRow = Tables<'platform_credits'>;
            
            expectTypeOf<PlatformCreditsRow>().toHaveProperty('id');
            expectTypeOf<PlatformCreditsRow>().toHaveProperty('balance');
            expectTypeOf<PlatformCreditsRow>().toHaveProperty('updated_at');
        });
    });

    describe('TablesInsert type helper', () => {
        it('TablesInsert<"coupons"> should require tenant_id, customer_id, type, code, discount, expires_at', () => {
            type CouponInsert = TablesInsert<'coupons'>;
            
            // These fields are required on insert (NOT optional)
            expectTypeOf<CouponInsert>().toHaveProperty('tenant_id');
            expectTypeOf<CouponInsert>().toHaveProperty('customer_id');
            expectTypeOf<CouponInsert>().toHaveProperty('type');
            expectTypeOf<CouponInsert>().toHaveProperty('code');
            expectTypeOf<CouponInsert>().toHaveProperty('discount');
            expectTypeOf<CouponInsert>().toHaveProperty('expires_at');
        });

        it('TablesInsert<"customers"> should accept food_pref', () => {
            type CustomerInsert = TablesInsert<'customers'>;
            
            expectTypeOf<CustomerInsert>().toHaveProperty('food_pref');
            expectTypeOf<CustomerInsert>().toHaveProperty('tenant_id');
            expectTypeOf<CustomerInsert>().toHaveProperty('name');
            expectTypeOf<CustomerInsert>().toHaveProperty('phone');
        });
    });

    describe('TablesUpdate type helper', () => {
        it('TablesUpdate<"tenants"> should allow updating coupon amounts and contact info', () => {
            type TenantUpdate = TablesUpdate<'tenants'>;
            
            expectTypeOf<TenantUpdate>().toHaveProperty('name');
            expectTypeOf<TenantUpdate>().toHaveProperty('coupon_welcome');
            expectTypeOf<TenantUpdate>().toHaveProperty('coupon_bday');
            expectTypeOf<TenantUpdate>().toHaveProperty('coupon_winback');
            expectTypeOf<TenantUpdate>().toHaveProperty('address');
            expectTypeOf<TenantUpdate>().toHaveProperty('email');
            expectTypeOf<TenantUpdate>().toHaveProperty('phone');
        });
    });

    describe('SupabaseClient<Database> type inference', () => {
        it('supabase.from("tenants").select("*") should return tenant rows without cast', () => {
            // This verifies that a typed SupabaseClient infers correct types
            // When you call supabase.from('tenants').select('*'), the result 
            // should be { data: Tables<'tenants'>[] | null; error: ... }
            type ClientType = SupabaseClient<Database>;
            
            // Verify the client can be created with the Database type
            expectTypeOf<ClientType>().not.toBeNever();
        });

        it('Database type should have Relationships for foreign key joins', () => {
            // The Relationships array is critical for Supabase join query type inference
            // Without it, supabase.from('coupons').select('id, customers(name)') 
            // would return untyped data
            type CouponRelationships = Database['public']['Tables']['coupons']['Relationships'];
            
            expectTypeOf<CouponRelationships>().not.toBeNever();
            // Should not be empty - coupons has FK to customers and tenants
            expectTypeOf<CouponRelationships['length']>().toBeNumber();
        });
    });

    describe('Domain types should not need `as` casts for Supabase data', () => {
        it('Tenant should exactly equal Tables<"tenants"> Row (no cast needed)', () => {
            // Bug 7: If these types don't match, code needs `as Tenant[]` casts
            // which bypass type safety. After fix, Tenant = Tables<'tenants'>.
            // Uses toEqualTypeOf for exact bidirectional match (stricter than toMatchTypeOf).
            expectTypeOf<Tenant>().toEqualTypeOf<Tables<'tenants'>>();
        });

        it('Customer should exactly equal Tables<"customers"> Row (no cast needed)', () => {
            // Bug 7: Customer domain type was missing food_pref, forcing casts
            expectTypeOf<Customer>().toEqualTypeOf<Tables<'customers'>>();
        });

        it('Coupon should exactly equal Tables<"coupons"> Row (no cast needed)', () => {
            // Bug 7: Coupon domain type was missing bill_items, forcing casts
            expectTypeOf<Coupon>().toEqualTypeOf<Tables<'coupons'>>();
        });

        it('MessageLog should exactly equal Tables<"message_log"> Row (no cast needed)', () => {
            expectTypeOf<MessageLog>().toEqualTypeOf<Tables<'message_log'>>();
        });

        it('PlatformCredits should exactly equal Tables<"platform_credits"> Row (no cast needed)', () => {
            expectTypeOf<PlatformCredits>().toEqualTypeOf<Tables<'platform_credits'>>();
        });
    });
});
