import { createServiceClient } from '~/lib/supabase/server';
import { generateCouponCode, generateExpiryDate } from './coupons';
import type { Customer, Tenant } from './restoloop.types';
import { sendThirdPartyMessage } from './whatsapp';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/lib/database.types';

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
            .from('tenants')
            .select('*');

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

        // Track total sends across all tenants for single platform credit deduction (Bug 5)
        let totalSent = 0;

        for (const tenant of tenants) {
            let availableCredits = tenant.credits_balance;

            // ═══════════════════════════════════════════════════════
            // 1. Process Winbacks
            // ═══════════════════════════════════════════════════════
            const { data: winbackCustomers, error: winbackErr } = await supabase
                .from('customers')
                .select('*')
                .eq('tenant_id', tenant.id)
                .gte('last_visit', winbackStart)
                .lte('last_visit', winbackEnd);

            if (!winbackErr && winbackCustomers && winbackCustomers.length > 0) {
                // Bug 4 fix: Batch duplicate-check (1 query instead of N)
                const { data: existingWinbackCoupons } = await supabase
                    .from('coupons')
                    .select('customer_id')
                    .eq('type', 'winback')
                    .eq('tenant_id', tenant.id)
                    .gte('created_at', winbackStart)
                    .in('customer_id', winbackCustomers.map(c => c.id));

                const existingWinbackIds = new Set(
                    (existingWinbackCoupons || []).map((c: { customer_id: string }) => c.customer_id)
                );

                // Filter eligible customers (no duplicates)
                const eligibleWinbacks = winbackCustomers
                    .filter(c => !existingWinbackIds.has(c.id));

                // Split: those we can send vs blocked by credit limit
                const toSend = eligibleWinbacks.slice(0, availableCredits);
                const blocked = eligibleWinbacks.slice(availableCredits);

                // Log blocked messages (credits exhausted)
                for (const customer of blocked) {
                    await supabase.from('message_log').insert({
                        tenant_id: tenant.id,
                        customer_id: customer.id,
                        status: 'blocked',
                        sent_at: new Date().toISOString()
                    });
                }

                // Bug 4 fix: Parallelize sendCampaign calls with Promise.allSettled
                if (toSend.length > 0) {
                    const settled = await Promise.allSettled(
                        toSend.map(customer => sendCampaign(supabase, tenant, customer, 'winback'))
                    );

                    for (const result of settled) {
                        if (result.status === 'fulfilled') {
                            availableCredits--;
                            results.winbackSent++;
                            totalSent++;
                        } else {
                            console.error('Failed to send winback:', result.reason);
                            results.errors++;
                        }
                    }
                }

                // Update tenant credits for next section
                tenant.credits_balance = availableCredits;
            }

            // ═══════════════════════════════════════════════════════
            // 2. Process Birthdays
            // ═══════════════════════════════════════════════════════
            const { data: allCustomers, error: bdayErr } = await supabase
                .from('customers')
                .select('*')
                .eq('tenant_id', tenant.id)
                .not('birthday', 'is', null);

            if (!bdayErr && allCustomers) {
                const birthdayCustomers = allCustomers
                    .filter(c => c.birthday && c.birthday.includes(todayMonthDay));

                if (birthdayCustomers.length > 0) {
                    // Bug 4 fix: Batch duplicate-check (1 query instead of N)
                    const { data: existingBdayCoupons } = await supabase
                        .from('coupons')
                        .select('customer_id')
                        .eq('type', 'bday')
                        .eq('tenant_id', tenant.id)
                        .gte('created_at', `${todayStr.substring(0, 4)}-01-01T00:00:00.000Z`)
                        .in('customer_id', birthdayCustomers.map(c => c.id));

                const existingBdayIds = new Set(
                    (existingBdayCoupons || []).map((c: { customer_id: string }) => c.customer_id)
                );

                    const eligibleBdays = birthdayCustomers
                        .filter(c => !existingBdayIds.has(c.id));

                    const toSend = eligibleBdays.slice(0, availableCredits);
                    const blocked = eligibleBdays.slice(availableCredits);

                    for (const customer of blocked) {
                        await supabase.from('message_log').insert({
                            tenant_id: tenant.id,
                            customer_id: customer.id,
                            status: 'blocked',
                            sent_at: new Date().toISOString()
                        });
                    }

                    // Bug 4 fix: Parallelize sendCampaign calls with Promise.allSettled
                    if (toSend.length > 0) {
                        const settled = await Promise.allSettled(
                            toSend.map(customer => sendCampaign(supabase, tenant, customer, 'bday'))
                        );

                        for (const result of settled) {
                            if (result.status === 'fulfilled') {
                                availableCredits--;
                                results.bdaySent++;
                                totalSent++;
                            } else {
                                console.error('Failed to send bday:', result.reason);
                                results.errors++;
                            }
                        }
                    }

                    tenant.credits_balance = availableCredits;
                }
            }

            // ═══════════════════════════════════════════════════════
            // 3. Process 15-Day Welcome Reminders (v1 Outreach Campaign)
            // ═══════════════════════════════════════════════════════
            const { data: welcomeCoupons, error: welcomeErr } = await supabase
                .from('coupons')
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
                .lte('created_at', reminderEnd);

            if (!welcomeErr && welcomeCoupons && welcomeCoupons.length > 0) {
                // Bug 4 fix: Batch duplicate-check (1 query instead of N)
                const { data: existingLogs } = await supabase
                    .from('message_log')
                    .select('coupon_id')
                    .in('coupon_id', welcomeCoupons.map((c: { id: string }) => c.id));

                const existingLogCouponIds = new Set(
                    (existingLogs || []).map((l: { coupon_id: string | null }) => l.coupon_id)
                );

                // Filter eligible coupons (no duplicates + has customer info)
                const eligibleReminders = welcomeCoupons
                    .filter((coupon) => {
                        if (existingLogCouponIds.has(coupon.id)) return false;
                        const customerInfo = Array.isArray(coupon.customers) ? coupon.customers[0] : coupon.customers;
                        return customerInfo && customerInfo.phone;
                    });

                const toSend = eligibleReminders.slice(0, availableCredits);
                const blocked = eligibleReminders.slice(availableCredits);

                // Log blocked
                for (const coupon of blocked) {
                    const customerInfo = Array.isArray(coupon.customers) ? coupon.customers[0] : coupon.customers;
                    await supabase.from('message_log').insert({
                        tenant_id: tenant.id,
                        customer_id: customerInfo.id,
                        coupon_id: coupon.id,
                        status: 'blocked',
                        sent_at: new Date().toISOString()
                    });
                }

                // Bug 4 fix: Parallelize reminder sends with Promise.allSettled
                if (toSend.length > 0) {
                    const settled = await Promise.allSettled(
                        toSend.map(async (coupon) => {
                            const customerInfo = Array.isArray(coupon.customers) ? coupon.customers[0] : coupon.customers;
                            const customerName = customerInfo.name || 'Friend';
                            const reminderText = `*Hey ${customerName}!* 🍕\n\nYour welcome coupon code *${coupon.code}* for *${tenant.name}* is still active!\n\n🎫 *Code: ${coupon.code}*\n💰 *Discount: ₹${coupon.discount} OFF*\n\nDon't let it expire! Visit us soon to claim your discount. See you soon!`;
                            
                            const sendRes = await sendThirdPartyMessage(customerInfo.phone, reminderText);
                            
                            const messageStatus = sendRes.success ? 'sent' : 'failed';
                            const nowTime = new Date().toISOString();

                            // Log message send
                            await supabase.from('message_log').insert({
                                tenant_id: tenant.id,
                                customer_id: customerInfo.id,
                                coupon_id: coupon.id,
                                status: messageStatus,
                                sent_at: nowTime
                            });

                            if (!sendRes.success) {
                                throw new Error(`Failed to send reminder to customer ${customerInfo.id}`);
                            }
                        })
                    );

                    for (const result of settled) {
                        if (result.status === 'fulfilled') {
                            availableCredits--;
                            results.reminderSent++;
                            totalSent++;
                        } else {
                            console.error('Failed to send reminder:', result.reason);
                            results.errors++;
                        }
                    }
                }
            }

            // Update tenant credits in DB once after all campaigns for this tenant
            const creditsUsed = tenant.credits_balance - availableCredits;
            if (creditsUsed > 0) {
                await supabase
                    .from('tenants')
                    .update({ credits_balance: availableCredits })
                    .eq('id', tenant.id);
            }
        }

        // Bug 5 fix: Single atomic platform credit deduction via RPC (not N individual queries)
        if (totalSent > 0) {
            await supabase.rpc('decrement_platform_credits', { amount: totalSent });
        }

    } catch (e) {
        console.error('Error processing campaigns:', e);
        results.errors++;
    }

    return results;
}

async function sendCampaign(supabase: SupabaseClient<Database>, tenant: Tenant, customer: Customer, type: 'winback' | 'bday') {
    const code = generateCouponCode();
    // Use 7 days expiry for campaigns
    const expiresAt = generateExpiryDate(7);
    const discount = type === 'winback' ? tenant.coupon_winback : tenant.coupon_bday;
    const now = new Date().toISOString();

    // 1. Create Coupon
    const { data: coupon, error: couponErr } = await supabase
        .from('coupons')
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
        .from('message_log')
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

    // Bug 5 fix: Tenant and platform credit deduction removed from here.
    // Tenant credits are updated once per tenant in processCampaigns().
    // Platform credits are deducted once via decrement_platform_credits RPC at the end.
}
