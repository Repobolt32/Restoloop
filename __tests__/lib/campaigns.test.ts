import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules before importing campaigns
vi.mock('~/lib/supabase/server', () => ({
    createServiceClient: vi.fn(),
}));

vi.mock('~/lib/coupons', () => ({
    generateCouponCode: vi.fn(() => 'MOCK-CODE'),
    generateExpiryDate: vi.fn(() => '2026-12-31T23:59:59.999Z'),
}));

vi.mock('~/lib/whatsapp', () => ({
    sendThirdPartyMessage: vi.fn(),
}));

import { processCampaigns } from '~/lib/campaigns';

// Helper: build a default coupons table mock that handles all query chains
function createCouponsMock(options: {
    existingWinback?: any[];
    existingBday?: any[];
    welcomeCoupons?: any[];
    insertCoupon?: any;
} = {}) {
    const {
        existingWinback = [],
        existingBday = [],
        welcomeCoupons = [],
        insertCoupon = { id: 'coupon-1' },
    } = options;

    // Query chains on coupons table:
    // 1. Winback existing check: .select().in('customer_id', [...]).eq('type','winback').gte(...)
    // 2. Bday existing check:   .select().in('customer_id', [...]).eq('type','bday').gte(...)
    // 3. Welcome coupons:       .select().eq('tenant_id',...).eq('type','welcome').eq('status','sent').gte(...).lte(...)
    // 4. Coupon insert:         .insert({...}).select('id').single()
    return {
        select: vi.fn().mockReturnValue({
            // .select().eq() — used by welcome coupons query AND bday/winchack checks
            // Must return object with both .gte() (winback/bday path) and .eq() (welcome path)
            eq: vi.fn().mockReturnValue({
                // .select().eq().gte() — winback/bday date range
                gte: vi.fn().mockReturnValue({
                    lte: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
                // .select().eq().eq() — welcome coupons (tenant_id, type)
                eq: vi.fn().mockReturnValue({
                    // .select().eq().eq().eq() — welcome coupons (status)
                    eq: vi.fn().mockReturnValue({
                        gte: vi.fn().mockReturnValue({
                            lte: vi.fn().mockResolvedValue({ data: welcomeCoupons, error: null }),
                        }),
                    }),
                }),
            }),
            // .select().in() — batch existing coupon checks
            in: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    gte: vi.fn().mockResolvedValue({ data: [...existingWinback, ...existingBday], error: null }),
                }),
            }),
        }),
        insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: insertCoupon,
                    error: null,
                }),
            }),
        }),
    };
}

describe('sendCampaign - message status when WA credentials are missing', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetAllMocks();
        // Remove WA credentials
        delete process.env.WA_PHONE_ID;
        delete process.env.WA_TOKEN;
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('should mark message as failed when WA credentials are missing for winback', async () => {
        const mockSupabaseClient = {
            from: vi.fn(),
            rpc: vi.fn().mockResolvedValue({ error: null }),
        };

        const tenants = [{
            id: 'tenant-1',
            name: 'Test Restaurant',
            credits_balance: 10,
            coupon_winback: 20,
            coupon_bday: 15,
            slug: 'test-restaurant',
        }];

        const winbackCustomers = [{
            id: 'cust-1',
            name: 'John',
            phone: '+919876543210',
        }];

        // Track all inserts to find the message_log insert
        const messageLogInserts: any[] = [];

        mockSupabaseClient.from.mockImplementation((table: string) => {
            if (table === 'tenants') {
                return {
                    select: vi.fn().mockResolvedValue({ data: tenants, error: null }),
                };
            }

            if (table === 'customers') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            gte: vi.fn().mockReturnValue({
                                lte: vi.fn().mockResolvedValue({ data: winbackCustomers, error: null }),
                            }),
                            not: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                    }),
                };
            }

            if (table === 'coupons') {
                return createCouponsMock();
            }

            if (table === 'message_log') {
                return {
                    select: vi.fn().mockReturnValue({
                        in: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                    insert: vi.fn().mockImplementation((data: any) => {
                        messageLogInserts.push(data);
                        return Promise.resolve({ error: null });
                    }),
                };
            }

            return {
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
            };
        });

        // Mock createServiceClient
        const { createServiceClient } = await import('~/lib/supabase/server');
        vi.mocked(createServiceClient).mockResolvedValue(mockSupabaseClient as any);

        const result = await processCampaigns();

        // Find the message_log insert for the winback campaign
        const winbackLog = messageLogInserts.find(
            (log) => log.coupon_id === 'coupon-1' && log.tenant_id === 'tenant-1'
        );

        expect(winbackLog).toBeDefined();
        expect(winbackLog?.status).toBe('failed');
    });
});

describe('15-day welcome reminder - simulated sends should not deduct credits', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetAllMocks();
        // Remove 3rd-party WhatsApp credentials to trigger simulation
        delete process.env.WHATSAPP_PROVIDER;
        delete process.env.WHATSAPP_API_URL;
        delete process.env.WHATSAPP_API_KEY;
        delete process.env.WHATSAPP_INSTANCE_ID;
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('should NOT deduct credits when sendThirdPartyMessage returns simulated success', async () => {
        const { sendThirdPartyMessage } = await import('~/lib/whatsapp');
        
        // Mock sendThirdPartyMessage to return simulated response
        vi.mocked(sendThirdPartyMessage).mockResolvedValue({
            success: false,
            simulated: true,
            error: 'Missing 3rd-party WhatsApp provider configuration',
        } as any);

        const mockSupabaseClient = {
            from: vi.fn(),
            rpc: vi.fn().mockResolvedValue({ error: null }),
        };

        const tenants = [{
            id: 'tenant-1',
            name: 'Test Restaurant',
            credits_balance: 10,
            coupon_winback: 20,
            coupon_bday: 15,
            slug: 'test-restaurant',
        }];

        // 15-day old welcome coupon
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        const reminderDateStr = fifteenDaysAgo.toISOString().split('T')[0];

        const welcomeCoupons = [{
            id: 'coupon-welcome-1',
            code: 'WELCOME-ABC',
            discount: 50,
            created_at: `${reminderDateStr}T10:00:00.000Z`,
            customer_id: 'cust-1',
            customers: { id: 'cust-1', name: 'John', phone: '+919876543210' },
        }];

        const messageLogInserts: any[] = [];

        mockSupabaseClient.from.mockImplementation((table: string) => {
            if (table === 'tenants') {
                return {
                    select: vi.fn().mockResolvedValue({ data: tenants, error: null }),
                };
            }

            if (table === 'customers') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            gte: vi.fn().mockReturnValue({
                                lte: vi.fn().mockResolvedValue({ data: [], error: null }),
                            }),
                            not: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                    }),
                };
            }

            if (table === 'coupons') {
                return createCouponsMock({ welcomeCoupons });
            }

            if (table === 'message_log') {
                return {
                    select: vi.fn().mockReturnValue({
                        in: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                    insert: vi.fn().mockImplementation((data: any) => {
                        messageLogInserts.push(data);
                        return Promise.resolve({ error: null });
                    }),
                };
            }

            return {
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
            };
        });

        const { createServiceClient } = await import('~/lib/supabase/server');
        vi.mocked(createServiceClient).mockResolvedValue(mockSupabaseClient as any);

        const result = await processCampaigns();

        // Find the message_log insert for the welcome reminder
        const welcomeLog = messageLogInserts.find(
            (log) => log.coupon_id === 'coupon-welcome-1' && log.tenant_id === 'tenant-1'
        );

        expect(welcomeLog).toBeDefined();
        expect(welcomeLog?.status).toBe('sent'); // Simulated sends are logged as 'sent' (DB schema constraint)
        expect(result.reminderSent).toBe(0); // But credits are NOT deducted for simulated sends
    });
});

describe('Issue #19 - Batch platform credit RPCs (eliminate N+1 loop)', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetAllMocks();
        delete process.env.WA_PHONE_ID;
        delete process.env.WA_TOKEN;
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('should call decrement_platform_credits_batch once with total count instead of N times', async () => {
        const messageLogInserts: any[] = [];

        const mockSupabaseClient = {
            from: vi.fn(),
            rpc: vi.fn().mockResolvedValue({ error: null }),
        };

        const tenants = [{
            id: 'tenant-1',
            name: 'Test Restaurant',
            credits_balance: 100,
            coupon_winback: 20,
            coupon_bday: 15,
            slug: 'test-restaurant',
        }];

        // 3 winback customers
        const winbackCustomers = [
            { id: 'cust-1', name: 'John', phone: '+919876543210' },
            { id: 'cust-2', name: 'Jane', phone: '+919876543211' },
            { id: 'cust-3', name: 'Bob', phone: '+919876543212' },
        ];

        mockSupabaseClient.from.mockImplementation((table: string) => {
            if (table === 'tenants') {
                return {
                    select: vi.fn().mockResolvedValue({ data: tenants, error: null }),
                };
            }
            if (table === 'customers') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            gte: vi.fn().mockReturnValue({
                                lte: vi.fn().mockResolvedValue({ data: winbackCustomers, error: null }),
                            }),
                            not: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                    }),
                };
            }
            if (table === 'coupons') {
                return createCouponsMock();
            }
            if (table === 'message_log') {
                return {
                    select: vi.fn().mockReturnValue({
                        in: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                    insert: vi.fn().mockImplementation((data: any) => {
                        messageLogInserts.push(data);
                        return Promise.resolve({ error: null });
                    }),
                };
            }
            return {
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
            };
        });

        const { createServiceClient } = await import('~/lib/supabase/server');
        vi.mocked(createServiceClient).mockResolvedValue(mockSupabaseClient as any);

        const result = await processCampaigns();

        // 3 winback messages were sent
        expect(result.winbackSent).toBe(3);

        // CRITICAL: decrement_platform_credits_batch should be called ONCE with batch count
        const platformBatchCall = mockSupabaseClient.rpc.mock.calls.find(
            (call: any[]) => call[0] === 'decrement_platform_credits_batch'
        );
        expect(platformBatchCall).toBeDefined();
        expect(platformBatchCall![1]).toEqual({ count: 3 });
        
        // Verify it was NOT called as individual decrement_platform_credits (N+1 pattern)
        const individualCalls = mockSupabaseClient.rpc.mock.calls.filter(
            (call: any[]) => call[0] === 'decrement_platform_credits'
        );
        expect(individualCalls).toHaveLength(0);
    });

    it('should call rpc zero times when no messages are sent', async () => {
        const mockSupabaseClient = {
            from: vi.fn(),
            rpc: vi.fn().mockResolvedValue({ error: null }),
        };

        const tenants = [{
            id: 'tenant-1',
            name: 'Test Restaurant',
            credits_balance: 100,
            coupon_winback: 20,
            coupon_bday: 15,
            slug: 'test-restaurant',
        }];

        mockSupabaseClient.from.mockImplementation((table: string) => {
            if (table === 'tenants') {
                return {
                    select: vi.fn().mockResolvedValue({ data: tenants, error: null }),
                };
            }
            // All queries return empty results
            return {
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        gte: vi.fn().mockReturnValue({
                            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                        not: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                    in: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            gte: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                    }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
            };
        });

        const { createServiceClient } = await import('~/lib/supabase/server');
        vi.mocked(createServiceClient).mockResolvedValue(mockSupabaseClient as any);

        const result = await processCampaigns();

        expect(result.winbackSent + result.bdaySent + result.reminderSent).toBe(0);
        expect(mockSupabaseClient.rpc).not.toHaveBeenCalled();
    });
});

describe('Issue #20 - Atomic tenant credit deduction (no race condition)', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetAllMocks();
        delete process.env.WA_PHONE_ID;
        delete process.env.WA_TOKEN;
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('should use atomic decrement_tenant_credits RPC instead of direct update', async () => {
        const mockSupabaseClient = {
            from: vi.fn(),
            rpc: vi.fn(),
        };

        // Track tenant update calls to verify NO direct update happens
        const tenantUpdates: any[] = [];

        const tenants = [{
            id: 'tenant-1',
            name: 'Test Restaurant',
            credits_balance: 100,
            coupon_winback: 20,
            coupon_bday: 15,
            slug: 'test-restaurant',
        }];

        const winbackCustomers = [
            { id: 'cust-1', name: 'John', phone: '+919876543210' },
        ];

        mockSupabaseClient.from.mockImplementation((table: string) => {
            if (table === 'tenants') {
                return {
                    select: vi.fn().mockResolvedValue({ data: tenants, error: null }),
                    update: vi.fn().mockImplementation((data: any) => {
                        tenantUpdates.push(data);
                        return { eq: vi.fn().mockResolvedValue({ error: null }) };
                    }),
                };
            }
            if (table === 'customers') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            gte: vi.fn().mockReturnValue({
                                lte: vi.fn().mockResolvedValue({ data: winbackCustomers, error: null }),
                            }),
                            not: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                    }),
                };
            }
            if (table === 'coupons') {
                return createCouponsMock();
            }
            if (table === 'message_log') {
                return {
                    select: vi.fn().mockReturnValue({
                        in: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                    insert: vi.fn().mockResolvedValue({ error: null }),
                };
            }
            return {
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
            };
        });

        // Mock RPC for batch platform credits (#19) and atomic tenant credits (#20)
        mockSupabaseClient.rpc.mockImplementation((fnName: string, params: any) => {
            if (fnName === 'decrement_platform_credits_batch') {
                return Promise.resolve({ error: null });
            }
            if (fnName === 'decrement_tenant_credits') {
                return Promise.resolve({ data: [{ new_balance: 99 }], error: null });
            }
            return Promise.resolve({ error: null });
        });

        const { createServiceClient } = await import('~/lib/supabase/server');
        vi.mocked(createServiceClient).mockResolvedValue(mockSupabaseClient as any);

        const result = await processCampaigns();

        // 1 winback message sent
        expect(result.winbackSent).toBe(1);

        // CRITICAL: Tenant credits should be decremented atomically via RPC
        const tenantCreditCall = mockSupabaseClient.rpc.mock.calls.find(
            (call: any[]) => call[0] === 'decrement_tenant_credits'
        );
        expect(tenantCreditCall).toBeDefined();
        expect(tenantCreditCall![1]).toEqual({ p_tenant_id: 'tenant-1', p_count: 1 });

        // CRITICAL: NO direct SET update on tenants table for credits
        const creditUpdates = tenantUpdates.filter(u => 'credits_balance' in u);
        expect(creditUpdates).toHaveLength(0);
    });
});
