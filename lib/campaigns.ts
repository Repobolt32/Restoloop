import { createServiceClient } from '~/lib/supabase/server';
import { generateCouponCode, generateExpiryDate } from './coupons';
import { Customer, Tenant } from './restoloop.types';
import { sendThirdPartyMessage } from './whatsapp';

export async function processCampaigns() {
    const supabase = await createServiceClient();
    const results = {
        winbackSent: 0,
        bdaySent: 0,
        reminderSent: 0,
        errors: 0
    };

    try {
        // Fetch all tenants
        const { data: tenants, error: tenantsError } = await supabase
            .from('tenants' as any)
            .select('*') as any;

        if (tenantsError) throw tenantsError;

        if (!tenants || tenants.length === 0) {
            console.log('No tenants with positive credits found.');
            return results;
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0]!;

        // Winback target (exactly 45 days ago)
        const winbackTarget = new Date(now);
        winbackTarget.setDate(winbackTarget.getDate() - 45);
        const winbackDateStr = winbackTarget.toISOString().split('T')[0]!;
        const winbackStart = `${winbackDateStr}T00:00:00.000Z`;
        const winbackEnd = `${winbackDateStr}T23:59:59.999Z`;

        // 15-Day Welcome Coupon reminder target (exactly 15 days ago)
        const reminderTarget = new Date(now);
        reminderTarget.setDate(reminderTarget.getDate() - 15);
        const reminderDateStr = reminderTarget.toISOString().split('T')[0]!;
        const reminderStart = `${reminderDateStr}T00:00:00.000Z`;
        const reminderEnd = `${reminderDateStr}T23:59:59.999Z`;

        const todayMonthDay = todayStr.substring(5); // "MM-DD"

        for (const tenant of tenants as Tenant[]) {
            // 1. Process Winbacks
            const { data: winbackCustomers, error: winbackErr } = await supabase
                .from('customers' as any)
                .select('*')
                .eq('tenant_id', tenant.id)
                .gte('last_visit', winbackStart)
                .lte('last_visit', winbackEnd) as any;

            if (!winbackErr && winbackCustomers) {
                // Determine how many we can process based on available credits
                let availableCredits = tenant.credits_balance;
                for (const customer of (winbackCustomers as Customer[])) {
                    // Check if a winback coupon was already sent recently (to avoid duplicates)
                    const { data: existingCoupon } = await supabase
                        .from('coupons' as any)
                        .select('id')
                        .eq('customer_id', customer.id)
                        .eq('type', 'winback')
                        .gte('created_at', winbackStart)
                        .limit(1);

                    if (existingCoupon && existingCoupon.length > 0) continue;

                    if (availableCredits <= 0) {
                        await supabase.from('message_log' as any).insert({
                            tenant_id: tenant.id,
                            customer_id: customer.id,
                            status: 'blocked',
                            sent_at: new Date().toISOString()
                        });
                        continue;
                    }

                    try {
                        await sendCampaign(supabase, tenant, customer, 'winback');
                        availableCredits--;
                        results.winbackSent++;
                    } catch (e) {
                        console.error(`Failed to send winback to customer ${customer.id}`, e);
                        results.errors++;
                    }
                }
                // Update the tenant's remaining credits memory for the next loop
                tenant.credits_balance = availableCredits;
            }

            // 2. Process Birthdays
            const { data: allCustomers, error: bdayErr } = await supabase
                .from('customers' as any)
                .select('*')
                .eq('tenant_id', tenant.id)
                .not('birthday', 'is', null) as any;

            if (!bdayErr && allCustomers) {
                let availableCredits = tenant.credits_balance;
                for (const customer of (allCustomers as Customer[])) {
                    if (customer.birthday && customer.birthday.includes(todayMonthDay)) {
                        // Check duplicate for this year
                        const { data: existingCoupon } = await supabase
                            .from('coupons' as any)
                            .select('id')
                            .eq('customer_id', customer.id)
                            .eq('type', 'bday')
                            .gte('created_at', `${todayStr.substring(0, 4)}-01-01T00:00:00.000Z`) // generated this year
                            .limit(1);

                        if (existingCoupon && existingCoupon.length > 0) continue;

                        if (availableCredits <= 0) {
                            await supabase.from('message_log' as any).insert({
                                tenant_id: tenant.id,
                                customer_id: customer.id,
                                status: 'blocked',
                                sent_at: new Date().toISOString()
                            });
                            continue;
                        }

                        try {
                            await sendCampaign(supabase, tenant, customer, 'bday');
                            availableCredits--;
                            results.bdaySent++;
                        } catch (e) {
                            console.error(`Failed to send bday to customer ${customer.id}`, e);
                            results.errors++;
                        }
                    }
                }
            }

            // 3. Process 15-Day Welcome Reminders (v1 Outreach Campaign)
            const { data: welcomeCoupons, error: welcomeErr } = await supabase
                .from('coupons' as any)
                .select(`
                    id,
                    code,
                    discount,
                    created_at,
                    customer_id,
                    customers ( id, name, phone )
                `)
                .eq('tenant_id', tenant.id)
                .eq('type', 'welcome')
                .eq('status', 'sent')
                .gte('created_at', reminderStart)
                .lte('created_at', reminderEnd) as any;

            if (!welcomeErr && welcomeCoupons) {
                let availableCredits = tenant.credits_balance;
                for (const coupon of welcomeCoupons) {
                    const customerInfo = Array.isArray(coupon.customers) ? coupon.customers[0] : coupon.customers;
                    if (!customerInfo || !customerInfo.phone) continue;

                    // Double-check duplicate reminder send
                    const { data: existingLog } = await supabase
                        .from('message_log' as any)
                        .select('id')
                        .eq('coupon_id', coupon.id)
                        .limit(1);

                    if (existingLog && existingLog.length > 0) continue;

                    if (availableCredits <= 0) {
                        await supabase.from('message_log' as any).insert({
                            tenant_id: tenant.id,
                            customer_id: customerInfo.id,
                            coupon_id: coupon.id,
                            status: 'blocked',
                            sent_at: new Date().toISOString()
                        });
                        continue;
                    }

                    try {
                        const customerName = customerInfo.name || 'Friend';
                        const reminderText = `*Hey ${customerName}!* 🍕\n\nYour welcome coupon code *${coupon.code}* for *${tenant.name}* is still active!\n\n🎫 *Code: ${coupon.code}*\n💰 *Discount: ₹${coupon.discount} OFF*\n\nDon't let it expire! Visit us soon to claim your discount. See you soon!`;
                        
                        const sendRes = await sendThirdPartyMessage(customerInfo.phone, reminderText);
                        
                        let messageStatus = sendRes.success ? 'sent' : 'failed';
                        const nowTime = new Date().toISOString();

                        // Log message send
                        await supabase.from('message_log' as any).insert({
                            tenant_id: tenant.id,
                            customer_id: customerInfo.id,
                            coupon_id: coupon.id,
                            status: messageStatus,
                            sent_at: nowTime
                        });

                        if (sendRes.success) {
                            availableCredits--;
                            results.reminderSent++;

                            // Deduct from tenant credits balance in DB
                            await supabase
                                .from('tenants' as any)
                                .update({ credits_balance: availableCredits })
                                .eq('id', tenant.id);

                            // Deduct from central platform wallet
                            const { data: platformData } = await supabase
                                .from('platform_credits' as any)
                                .select('id, balance')
                                .limit(1)
                                .single() as any;
                            if (platformData) {
                                await supabase
                                    .from('platform_credits' as any)
                                    .update({ balance: platformData.balance - 1 })
                                    .eq('id', platformData.id);
                            }
                        } else {
                            results.errors++;
                        }
                    } catch (e) {
                        console.error(`Failed to send 15-day reminder to customer ${customerInfo.id}`, e);
                        results.errors++;
                    }
                }
                tenant.credits_balance = availableCredits;
            }
        }

    } catch (e) {
        console.error('Error processing campaigns:', e);
        results.errors++;
    }

    return results;
}

async function sendCampaign(supabase: any, tenant: Tenant, customer: Customer, type: 'winback' | 'bday') {
    const code = generateCouponCode();
    // Use 7 days expiry for campaigns
    const expiresAt = generateExpiryDate(7);
    const discount = type === 'winback' ? tenant.coupon_winback : tenant.coupon_bday;
    const now = new Date().toISOString();

    // 1. Create Coupon
    const { data: coupon, error: couponErr } = await supabase
        .from('coupons' as any)
        .insert({
            tenant_id: tenant.id,
            customer_id: customer.id,
            type: type,
            code,
            discount,
            status: 'sent',
            expires_at: expiresAt
        })
        .select('id')
        .single();

    if (couponErr) throw couponErr;

    // 2. Transmit via Meta Cloud API
    let messageStatus = 'sent';
    const waPhoneId = process.env.WA_PHONE_ID;
    const waToken = process.env.WA_TOKEN;

    if (waPhoneId && waToken && customer.phone) {
        try {
            const response = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${waToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: customer.phone,
                    type: "template",
                    template: {
                        name: type === 'winback' ? 'winback_coupon' : 'birthday_coupon',
                        language: { code: "en_US" },
                        components: [
                            {
                                type: "body",
                                parameters: [
                                    { type: "text", text: discount.toString() },
                                    { type: "text", text: code }
                                ]
                            }
                        ]
                    }
                })
            });

            if (!response.ok) {
                const errBody = await response.text();
                console.error('WhatsApp API sending failed:', errBody);
                messageStatus = 'failed';
            }
        } catch (apiErr) {
            console.error('Failed to reach WhatsApp API:', apiErr);
            messageStatus = 'failed';
        }
    } else {
        console.warn('Missing WA credentials or customer phone. Simulating send based on mock.');
    }

    // 3. Insert Message Log
    const { error: msgErr } = await supabase
        .from('message_log' as any)
        .insert({
            tenant_id: tenant.id,
            customer_id: customer.id,
            coupon_id: coupon.id,
            status: messageStatus, // Now using actual live status (sent/failed)
            sent_at: now
        });

    if (msgErr) {
        console.error('Failed to write message log', msgErr);
    }

    if (messageStatus === 'sent') {
        // 4. Deduct Credit Database
        const { error: creditErr } = await supabase
            .from('tenants' as any)
            .update({ credits_balance: tenant.credits_balance - 1 })
            .eq('id', tenant.id);

        if (creditErr) {
            console.error('Failed to deduct tenant credit during campaign', creditErr);
            throw creditErr;
        }

        const { data: platformData } = await supabase.from('platform_credits' as any).select('id, balance').limit(1).single() as any;
        if (platformData) {
            await supabase.from('platform_credits' as any).update({ balance: platformData.balance - 1 }).eq('id', platformData.id);
        }
    }
}
