import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServiceClient } from '~/lib/supabase/server';
import { generateCouponCode, generateExpiryDate } from '~/lib/coupons';
import { sendWelcomeMessage } from '~/lib/whatsapp';

/**
 * POST /api/leads
 * Public endpoint — no auth required (customers are not Supabase users).
 * Uses service role client since it's called server-side and bypasses RLS for the insert.
 *
 * Body: { slug, name, phone, birthday? }
 */
export async function POST(req: NextRequest) {
    let body: { slug?: string; name?: string; phone?: string; birthday?: string };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { slug, name, phone, birthday } = body;

    // ── Validation ──────────────────────────────────────────────────────────────
    if (!slug || !name || !phone) {
        return NextResponse.json(
            { error: 'slug, name, and phone are required' },
            { status: 400 },
        );
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim().replace(/\D/g, ''); // strip non-digits

    if (trimmedName.length < 2) {
        return NextResponse.json(
            { error: 'Name must be at least 2 characters' },
            { status: 400 },
        );
    }

    // Accept 10-digit (Indian local) or 12-digit (91XXXXXXXXXX) format
    if (!/^(91)?\d{10}$/.test(trimmedPhone)) {
        return NextResponse.json(
            { error: 'Please enter a valid 10-digit Indian mobile number' },
            { status: 400 },
        );
    }

    const supabase = createSupabaseServiceClient();

    // ── 1. Resolve slug → tenant ─────────────────────────────────────────────────
    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, coupon_welcome, credits_balance')
        .eq('slug', slug)
        .single();

    if (tenantError || !tenant) {
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // ── 2. Check tenant credits ──────────────────────────────────────────────────
    if (tenant.credits_balance <= 0) {
        return NextResponse.json(
            { error: 'Service temporarily unavailable' },
            { status: 503 },
        );
    }

    // ── 3. Dedup: check if phone already exists for this tenant ─────────────────
    const phoneForStorage = trimmedPhone.length === 10
        ? `91${trimmedPhone}`
        : trimmedPhone;

    const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('phone', phoneForStorage)
        .single();

    if (existingCustomer) {
        return NextResponse.json(
            { error: 'This phone number is already registered. Visit us to redeem your welcome coupon!' },
            { status: 409 },
        );
    }

    // ── 4. Insert customer ───────────────────────────────────────────────────────
    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
            tenant_id: tenant.id,
            name: trimmedName,
            phone: phoneForStorage,
            birthday: birthday ?? null,
            last_visit: new Date().toISOString(),
        })
        .select('id')
        .single();

    if (customerError || !customer) {
        console.error('[leads] Customer insert error:', customerError);
        return NextResponse.json({ error: 'Failed to save. Please try again.' }, { status: 500 });
    }

    // ── 5. Generate coupon ───────────────────────────────────────────────────────
    const couponCode = generateCouponCode();
    const expiresAt = generateExpiryDate(7); // welcome coupon valid 7 days

    const { error: couponError } = await supabase.from('coupons').insert({
        tenant_id: tenant.id,
        customer_id: customer.id,
        type: 'welcome',
        code: couponCode,
        discount: tenant.coupon_welcome,
        status: 'sent',
        expires_at: expiresAt,
    });

    if (couponError) {
        console.error('[leads] Coupon insert error:', couponError);
        // Non-fatal — customer saved, continue
    }

    // ── 7. Fire Live WhatsApp message ────────────────────────────────────────────
    const waResult = await sendWelcomeMessage({
        phone: phoneForStorage,
        name: trimmedName,
        restaurantName: tenant.name,
        couponCode,
        discount: tenant.coupon_welcome,
    });

    if (waResult.success) {
        // ── 6. Deduct credits (tenant wallet AND platform wallet) ────────────────
        await supabase
            .from('tenants')
            .update({ credits_balance: tenant.credits_balance - 1 })
            .eq('id', tenant.id);

        const { data: platformData } = await supabase
            .from('platform_credits')
            .select('id, balance')
            .limit(1)
            .single();

        if (platformData) {
            await supabase
                .from('platform_credits')
                .update({ balance: platformData.balance - 1 })
                .eq('id', platformData.id);
        }
    }

    // Log message result
    await supabase.from('message_log').insert({
        tenant_id: tenant.id,
        customer_id: customer.id,
        coupon_id: null, // will be set when we have the coupon id
        wa_message_id: waResult.success ? waResult.messageId : null,
        status: waResult.success ? 'sent' : 'failed',
    });

    return NextResponse.json(
        {
            success: true,
            couponCode,
            discount: tenant.coupon_welcome,
            restaurantName: tenant.name,
        },
        { status: 201 },
    );
}

