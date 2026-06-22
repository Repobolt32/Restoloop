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
        // Fetch all tenants - select only needed columns
        const { data: tenants, error: tenantsError } = await supabase
            .from('tenants' as any)
            .select('id, name, credits_balance, coupon_winback, coupon_bday, slug') as any;

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

        // Track credits used per tenant for atomic batch decrement
        const creditsUsedPerTenant = new Map<string, number>();

        for (const tenant of tenants as Tenant[]) {
            let creditsUsed = 0;
            let availableCredits = tenant.credits_balance;

            // 1. Process Winbacks - batch query with specific columns
            const { data: winbackCustomers, error: winbackErr } = await supabase
                .from('customers' as any)
                .select('id, name, phone')
                .eq('tenant_id', tenant.id)
                .gte('last_visit', winbackStart)
                .lte('last_visit', winbackEnd) as any;

            if (!winbackErr && winbackCustomers && winbackCustomers.length > 0) {
                // Batch check for existing winback coupons
                const customerIds = winbackCustomers.map((c: any) => c.id);
                const { data: existingCoupons } = await supabase
                    .from('coupons' as any)
                    .select('customer_id')
                    .in('customer_id', customerIds)
                    .eq('type', 'winback')
                    .gte('created_at', winbackStart);

                const alreadySent = new Set((existingCoupons || []).map((c: any) => c.customer_id));

                for (const customer of (winbackCustomers as Customer[])) {
                    if (alreadySent.has(customer.id)) continue;

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
                        creditsUsed++;
                        results.winbackSent++;
                    } catch (e) {
                        console.error(`Failed to send winback to customer ${customer.id}`, e);
                        results.errors++;
                    }
                }
            }

            // 2. Process Birthdays - batch query with specific columns
            const { data: allCustomers, error: bdayErr } = await supabase
                .from('customers' as any)
                .select('id, name, phone, birthday')
                .eq('tenant_id', tenant.id)
                .not('birthday', 'is', null) as any;

            if (!bdayErr && allCustomers) {
                const birthdayCustomers = (allCustomers as Customer[]).filter(
                    c => c.birthday && c.birthday.includes(todayMonthDay)
                );

                if (birthdayCustomers.length > 0) {
                    // Batch check for existing bday coupons this year
                    const customerIds = birthdayCustomers.map(c => c.id);
                    const yearStart = `${todayStr.substring(0, 4)}-01-01T00:00:00.000Z`;
                    const { data: existingCoupons } = await supabase
                        .from('coupons' as any)
                        .select('customer_id')
                        .in('customer_id', customerIds)
                        .eq('type', 'bday')
                        .gte('created_at', yearStart);

                    const alreadySent = new Set((existingCoupons || []).map((c: any) => c.customer_id));

                    for (const customer of birthdayCustomers) {
                        if (alreadySent.has(customer.id)) continue;

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
                            creditsUsed++;
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

            if (!welcomeErr && welcomeCoupons && welcomeCoupons.length > 0) {
                // Batch check for existing message logs
                const couponIds = welcomeCoupons.map((c: any) => c.id);
                const { data: existingLogs } = await supabase
                    .from('message_log' as any)
                    .select('coupon_id')
                    .in('coupon_id', couponIds);

                const alreadySent = new Set((existingLogs || []).map((l: any) => l.coupon_id));

                for (const coupon of welcomeCoupons) {
                    const customerInfo = Array.isArray(coupon.customers) ? coupon.customers[0] : coupon.customers;
                    if (!customerInfo || !customerInfo.phone) continue;

                    if (alreadySent.has(coupon.id)) continue;

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
                        const reminderText = `*Hey ${customerName}!* \n\nYour welcome coupon code *${coupon.code}* for *${tenant.name}* is still active!\n\n*Code: ${coupon.code}*\n*Discount: \u20B9${coupon.discount} OFF*\n\nDon't let it expire! Visit us soon to claim your discount. See you soon!`;
                        
                        const sendRes = await sendThirdPartyMessage(customerInfo.phone, reminderText);
                        
                        let messageStatus: string;
                        if ('simulated' in sendRes && sendRes.simulated) {
                            messageStatus = 'simulated';
                        } else if (sendRes.success) {
                            messageStatus = 'sent';
                        } else {
                            messageStatus = 'failed';
                        }
                        
                        const nowTime = new Date().toISOString();

                        // Log message send
                        await supabase.from('message_log' as any).insert({
                            tenant_id: tenant.id,
                            customer_id: customerInfo.id,
                            coupon_id: coupon.id,
                            status: messageStatus,
                            sent_at: nowTime
                        });

                        // Only deduct credits for real sends, not simulated ones
                        if (sendRes.success && !('simulated' in sendRes)) {
                            availableCredits--;
                            creditsUsed++;
                            results.reminderSent++;
                        } else if (!sendRes.success && !('simulated' in sendRes)) {
                            results.errors++;
                        }
                    } catch (e) {
                        console.error(`Failed to send 15-day reminder to customer ${customerInfo.id}`, e);
                        results.errors++;
                    }
                }
            }

            // Track total credits used for this tenant
            if (creditsUsed > 0) {
                creditsUsedPerTenant.set(tenant.id, creditsUsed);
            }
        }

        // Issue #20: Atomic tenant credit decrement via RPC
        // Each tenant's credits are decremented atomically in a single DB operation
        // This prevents race conditions from concurrent cron runs
        for (const [tenantId, count] of creditsUsedPerTenant) {
            const { data: decResult, error: decErr } = await supabase
                .rpc('decrement_tenant_credits', { p_tenant_id: tenantId, p_count: count });
            
            if (decErr) {
                console.error(`Failed to decrement credits for tenant ${tenantId}:`, decErr);
            } else if (!decResult || decResult.length === 0) {
                console.warn(`Insufficient credits for tenant ${tenantId} (concurrent spend detected). Messages were sent but credits could not be deducted.`);
            }
        }

        // Issue #19: Batch platform credit decrement (single RPC call)
        const totalSent = results.winbackSent + results.bdaySent + results.reminderSent;
        if (totalSent > 0) {
            const { error: platformErr } = await supabase
                .rpc('decrement_platform_credits_batch', { count: totalSent });
            
            if (platformErr) {
                console.error('Failed to decrement platform credits:', platformErr);
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
    let messageStatus = 'failed'; // Default to failed; only set 'sent' on confirmed delivery
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
                }),
                signal: AbortSignal.timeout(10000)
            });

            if (response.ok) {
                messageStatus = 'sent';
            } else {
                const errBody = await response.text();
                console.error('WhatsApp API sending failed:', errBody);
            }
        } catch (apiErr) {
            console.error('Failed to reach WhatsApp API:', apiErr);
        }
    } else {
        console.warn('Missing WA credentials or customer phone. Marking message as failed.');
    }

    // 3. Insert Message Log
    const { error: msgErr } = await supabase
        .from('message_log' as any)
        .insert({
            tenant_id: tenant.id,
            customer_id: customer.id,
            coupon_id: coupon.id,
            status: messageStatus,
            sent_at: now
        });

    if (msgErr) {
        console.error('Failed to write message log', msgErr);
    }

    // Note: Credit deduction now happens at the end via batch updates + atomic RPC
}
