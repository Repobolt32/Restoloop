/**
 * Restoloop Database Types
 *
 * Bug 7 fix: These are now type aliases for the Supabase Database types.
 * This ensures bidirectional assignability — Supabase query results flow
 * into these types without any `as` casts, and schema changes are caught
 * at compile time.
 */
import type { Tables } from '~/lib/database.types';

// Core table row types — derived from database.types.ts
export type Tenant = Tables<'tenants'>;
export type Customer = Tables<'customers'>;
export type Coupon = Tables<'coupons'>;
export type MessageLog = Tables<'message_log'>;
export type PlatformCredits = Tables<'platform_credits'>;

// Narrow string-literal union helpers (kept for UI-level type narrowing)
export type CouponType = 'welcome' | 'bday' | 'winback';
export type CouponStatus = 'pending' | 'sent' | 'redeemed' | 'expired';
export type MessageStatus = 'sent' | 'failed' | 'delivered' | 'blocked';
