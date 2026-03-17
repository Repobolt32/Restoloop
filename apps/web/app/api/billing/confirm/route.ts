import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '~/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = createSupabaseServerClient();

        // 1. Verify Authentication & Get Tenant
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
            return NextResponse.json({
                error: 'UNAUTHORIZED',
                message: 'Must be signed in to confirm billing.'
            }, { status: 401 });
        }

        const userId = authData.user.id;
        const { data: tenant } = await supabase
            .from('tenants' as any)
            .select('id, credits_balance')
            .eq('owner_id', userId)
            .single() as any;

        if (!tenant) {
            return NextResponse.json({
                error: 'NOT_FOUND',
                message: 'Restaurant profile not found.'
            }, { status: 404 });
        }

        // 2. Parse Request
        const body = await request.json();
        const code = body.code?.trim().toUpperCase();

        // Accept the detailed breakdown
        const billAmount = parseFloat(body.billAmount); // final total
        const subtotal = parseFloat(body.subtotal) || 0;
        const discountAmount = parseFloat(body.discountAmount) || 0;
        const taxAmount = parseFloat(body.taxAmount) || 0;
        const items = body.items || [];

        if (isNaN(billAmount) || billAmount < 0 || items.length === 0) {
            return NextResponse.json({
                error: 'VALIDATION_ERROR',
                message: 'Positive bill amount and at least one item are required.'
            }, { status: 400 });
        }

        let couponId = null;
        let customerId = null;
        let couponDeductionOccurred = false;

        // 3. Handle Optional Coupon Logic
        if (code) {
            // MVP safety check - fail fast if 0 credits
            if (tenant.credits_balance <= 0) {
                return NextResponse.json({
                    error: 'INSUFFICIENT_CREDITS',
                    message: 'You have 0 credits. Cannot process coupon redemption.'
                }, { status: 402 });
            }

            const { data: coupon, error: couponError } = await supabase
                .from('coupons' as any)
                .select('id, status, expires_at, customer_id')
                .eq('code', code)
                .eq('tenant_id', tenant.id)
                .single() as any;

            if (couponError || !coupon) {
                return NextResponse.json({
                    error: 'NOT_FOUND',
                    message: 'Invalid coupon code.'
                }, { status: 404 });
            }

            if (coupon.status === 'redeemed') {
                return NextResponse.json({
                    error: 'COUPON_REDEEMED',
                    message: 'This coupon has already been redeemed.'
                }, { status: 400 });
            }

            const now = new Date();
            const expiry = new Date(coupon.expires_at);
            if (now > expiry || coupon.status === 'expired') {
                return NextResponse.json({
                    error: 'COUPON_EXPIRED',
                    message: 'This coupon has expired.'
                }, { status: 400 });
            }

            couponId = coupon.id;
            customerId = coupon.customer_id;

            // Mark coupon as redeemed
            const { error: updateCouponError } = await supabase
                .from('coupons' as any)
                .update({
                    status: 'redeemed',
                    redeemed_at: now.toISOString()
                })
                .eq('id', coupon.id)
                .eq('status', 'sent');

            if (updateCouponError) {
                throw new Error(`Failed to update coupon status: ${updateCouponError.message}`);
            }

            // Deduct 1 credit
            const { error: updateTenantError } = await supabase
                .from('tenants' as any)
                .update({ credits_balance: tenant.credits_balance - 1 })
                .eq('id', tenant.id);

            if (!updateTenantError) {
                couponDeductionOccurred = true;
            }
        }

        // 4. Create the Bill Record
        const { error: insertBillError } = await supabase
            .from('bills' as any)
            .insert({
                tenant_id: tenant.id,
                coupon_id: couponId,
                customer_id: customerId,
                subtotal: subtotal,
                discount_amount: discountAmount,
                tax_amount: taxAmount,
                final_total: billAmount,
                items: items,
                created_at: new Date().toISOString()
            });

        if (insertBillError) {
            console.error('Failed to create bill:', insertBillError);
            throw new Error('Failed to record billing transaction');
        }

        // 5. Return Success
        return NextResponse.json({
            success: true,
            message: couponId ? 'Bill processed and coupon redeemed.' : 'Bill processed successfully.',
            remainingCredits: couponDeductionOccurred ? tenant.credits_balance - 1 : tenant.credits_balance
        }, { status: 200 });

    } catch (e: any) {
        console.error('Billing confirm error:', e);
        return NextResponse.json({
            error: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred during confirmation.'
        }, { status: 500 });
    }
}
