import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '~/lib/supabase/server';

const leadSchema = z.object({
    tenantId: z.string().uuid(),
    name: z.string().min(2, 'Name is too short'),
    phone: z.string().regex(/^\+91\d{10}$/, 'Must be a valid Indian (+91) phone number'),
    birthday: z.string().optional(),
    favouriteDish: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = leadSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid data', details: result.error.errors },
                { status: 400 }
            );
        }

        const data = result.data;
        const supabase = await createServiceClient();

        // 1. Insert lead into `customers` table
        const { data: customerData, error: insertError } = await supabase
            .from('customers')
            .insert({
                tenant_id: data.tenantId,
                name: data.name,
                phone: data.phone,
                birthday: data.birthday ? data.birthday : null,
                food_pref: data.favouriteDish ? data.favouriteDish : null,
                last_visit: new Date().toISOString(),
            })
            .select()
            .single();

        if (insertError || !customerData) {
            console.error('Supabase customer insert error:', insertError);
            // Handle unique constraint violations (e.g., phone number already exists for this tenant)
            if (insertError && insertError.code === '23505') {
                return NextResponse.json({ error: 'You have already signed up for this restaurant.' }, { status: 400 });
            }
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // 2. Fetch tenant coupon configuration to know WELCOME50 amount
        const { data: tenant } = await supabase
            .from('tenants')
            .select('coupon_welcome, name')
            .eq('id', data.tenantId)
            .single();

        const discountAmount = tenant?.coupon_welcome || 50;

        // 3. Issue the welcome coupon immediately (valid for 30 days to support the 15-day outreach reminder)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const generatedCouponCode = `W50-${randomSuffix}`;

        const { error: couponError } = await supabase
            .from('coupons')
            .insert({
                tenant_id: data.tenantId,
                customer_id: customerData.id,
                code: generatedCouponCode,
                type: 'welcome',
                discount: discountAmount,
                expires_at: expiresAt.toISOString(),
                status: 'sent'
            });

        if (couponError) {
            console.error('Coupon issue error:', couponError);
        }

        // 4. Compile the WhatsApp Click-to-Chat URL (Option B)
        const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '919999999999';
        const restaurantName = tenant?.name || 'Restaurant';
        const messageText = `Hi ${restaurantName}! I just registered on Restoloop. My Welcome Coupon Code is *${generatedCouponCode}* for ₹${discountAmount} OFF! Please save this code for my first visit.`;
        const waUrl = `https://wa.me/${supportPhone.replace('+', '').replace(/\s/g, '')}?text=${encodeURIComponent(messageText)}`;

        return NextResponse.json({
            success: true,
            message: 'Lead captured completely',
            waUrl,
            couponCode: generatedCouponCode,
            discount: discountAmount
        }, { status: 200 });


    } catch (err) {
        console.error('API /leads error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
