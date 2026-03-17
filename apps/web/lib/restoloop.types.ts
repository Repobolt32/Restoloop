/**
 * Restoloop Database Types
 * Typed representations of all Restoloop Supabase tables.
 */

export interface Tenant {
    id: string;
    owner_id: string;
    name: string;
    slug: string;
    credits_balance: number;
    coupon_welcome: number;
    coupon_bday: number;
    coupon_winback: number;
    tax_rate: number;
    created_at: string;
}

export interface Customer {
    id: string;
    tenant_id: string;
    name: string;
    phone: string;
    birthday: string | null;
    last_visit: string;
    created_at: string;
}

export type CouponType = 'welcome' | 'bday' | 'winback';
export type CouponStatus = 'pending' | 'sent' | 'redeemed' | 'expired';

export interface Coupon {
    id: string;
    tenant_id: string;
    customer_id: string;
    type: CouponType;
    code: string;
    discount: number;
    status: CouponStatus;
    bill_amount: number | null;
    created_at: string;
    expires_at: string;
    redeemed_at: string | null;
}

export type MessageStatus = 'sent' | 'failed' | 'delivered' | 'blocked';

export interface MessageLog {
    id: string;
    tenant_id: string;
    customer_id: string;
    coupon_id: string | null;
    wa_message_id: string | null;
    status: MessageStatus;
    sent_at: string;
}

export interface PlatformCredits {
    id: string;
    balance: number;
    updated_at: string;
}
