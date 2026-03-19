import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServiceClient } from '~/lib/supabase/server';
import { sendWelcomeMessage } from '~/lib/whatsapp';

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
        const supabase = createSupabaseServiceClient();

        // 1. Insert lead into `customers` table
        const { data: customerData, error: insertError } = await supabase
            .from('customers' as any)
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
        const customer = customerData as { id: string } | null;

        if (insertError || !customer) {
            console.error('Supabase customer insert error:', insertError);
            // Handle unique constraint violations (e.g., phone number already exists for this tenant)
            if (insertError && insertError.code === '23505') {
                return NextResponse.json({ error: 'You have already signed up for this restaurant.' }, { status: 400 });
            }
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // 2. Fetch tenant coupon configuration to know WELCOME50 amount
        const { data: tenantData } = await supabase
            .from('tenants' as any)
            .select('coupon_welcome, name')
            .eq('id', data.tenantId)
            .single();
        const tenant = tenantData as { coupon_welcome: number; name: string } | null;

        const discountAmount = tenant?.coupon_welcome || 50;

        // 3. Issue the WELCOME50 coupon immediately
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        const { error: couponError } = await supabase
            .from('coupons' as any)
            .insert({
                tenant_id: data.tenantId,
                customer_id: customer.id,
                code: 'WELCOME50',
                type: 'welcome',
                discount: discountAmount,
                expires_at: expiresAt.toISOString(),
                status: 'active'
            });

        if (couponError) {
            console.error('Coupon issue error:', couponError);
        }

        // 4. Trigger Meta Cloud API WhatsApp Welcome Message
        const waResult = await sendWelcomeMessage({
            phone: data.phone,
            name: data.name,
            restaurantName: tenant?.name || 'Restoloop Beta',
            couponCode: 'WELCOME50',
            discount: discountAmount
        });

        if (!waResult.success) {
            console.error('WhatsApp failed:', waResult.error);
        } else {
            console.log('WhatsApp delivered! ID:', waResult.messageId);
        }

        return NextResponse.json({ success: true, message: 'Lead captured completely' }, { status: 200 });

    } catch (err) {
        console.error('API /leads error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
