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
                message: 'Must be signed in to validate coupons.'
            }, { status: 401 });
        }

        const userId = authData.user.id;
        const { data: tenant } = await supabase
            .from('tenants' as any)
            .select('id, tax_cgst, tax_sgst')
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

        if (!code) {
            return NextResponse.json({
                error: 'VALIDATION_ERROR',
                message: 'Coupon code is required.'
            }, { status: 400 });
        }

        // 3. Look up the coupon linked to this tenant
        const { data: coupon, error: couponError } = await supabase
            .from('coupons' as any)
            .select(`
                id,
                code,
                discount,
                status,
                expires_at,
                customers ( name, phone )
            `)
            .eq('code', code)
            .eq('tenant_id', tenant.id)
            .single() as any;

        if (couponError || !coupon) {
            return NextResponse.json({
                error: 'NOT_FOUND',
                message: 'Invalid coupon code or does not belong to this restaurant.'
            }, { status: 404 });
        }

        // 4. Validate Coupon Status
        if (coupon.status === 'redeemed') {
            return NextResponse.json({
                error: 'COUPON_REDEEMED',
                message: 'This coupon has already been redeemed.'
            }, { status: 400 });
        }

        if (coupon.status === 'expired') {
            return NextResponse.json({
                error: 'COUPON_EXPIRED',
                message: 'This coupon has expired.'
            }, { status: 400 });
        }

        // 5. Validate Expiry Date
        const now = new Date();
        const expiry = new Date(coupon.expires_at);

        if (now > expiry) {
            return NextResponse.json({
                error: 'COUPON_EXPIRED',
                message: 'This coupon has expired (date passed).'
            }, { status: 400 });
        }

        // 6. Success
        const customerInfo = Array.isArray(coupon.customers) ? coupon.customers[0] : coupon.customers;

        return NextResponse.json({
            id: coupon.id,
            code: coupon.code,
            discount: coupon.discount,
            customerName: customerInfo?.name || 'Unknown',
            customerPhone: customerInfo?.phone || 'Unknown',
            taxCGST: tenant.tax_cgst,
            taxSGST: tenant.tax_sgst
        }, { status: 200 });

    } catch (e: any) {
        console.error('Coupon validation error:', e);
        return NextResponse.json({
            error: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred during validation.'
        }, { status: 500 });
    }
}
