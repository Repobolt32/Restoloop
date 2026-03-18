import { NextResponse } from 'next/response';
import { z } from 'zod';
import { createSupabaseServerClient } from '~/lib/supabase/server';

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
        const supabase = createSupabaseServerClient();

        // 1. Insert lead into `customers` table
        const { data: customer, error: insertError } = await supabase
            .from('customers')
            .insert({
                tenant_id: data.tenantId,
                name: data.name,
                phone: data.phone,
                birthday: data.birthday ? data.birthday : null,
                food_pref: data.favouriteDish ? data.favouriteDish : null,
                visit_count: 1,
                last_visit: new Date().toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            console.error('Supabase customer insert error:', insertError);
            // Handle unique constraint violations (e.g., phone number already exists for this tenant)
            if (insertError.code === '23505') {
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

        // 3. Issue the WELCOME50 coupon immediately
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        const { error: couponError } = await supabase
            .from('coupons')
            .insert({
                tenant_id: data.tenantId,
                customer_id: customer.id,
                code: 'WELCOME50',
                type: 'welcome',
                discount_amount: discountAmount,
                expires_at: expiresAt.toISOString(),
                status: 'active'
            });

        if (couponError) {
            console.error('Coupon issue error:', couponError);
        }

        // 4. TODO (Day 3): Trigger Meta Cloud API WhatsApp Welcome Message
        // sendWhatsAppMessage(data.phone, 'welcome_template', ...);

        return NextResponse.json({ success: true, message: 'Lead captured completely' }, { status: 200 });

    } catch (err) {
        console.error('API /leads error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
