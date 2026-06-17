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

// Helper to build a chainable Supabase mock
function createMockSupabase() {
    const mockData: Record<string, any> = {};
    const mockInsert = vi.fn();
    const mockUpdate = vi.fn();
    const mockRpc = vi.fn();

    const chainable: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        insert: mockInsert,
        update: mockUpdate,
    };

    const supabase = {
        from: vi.fn().mockReturnValue(chainable),
        rpc: mockRpc,
    };

    return { supabase, chainable, mockInsert, mockUpdate, mockRpc };
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
        const couponInserts: any[] = [];

        // tenant query
        let callCount = 0;
        mockSupabaseClient.from.mockImplementation((table: string) => {
            callCount++;
            const currentCall = callCount;

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
                // First call: batch check for existing coupons (returns empty)
                // Second call: insert new coupon
                const selectReturn = {
                    eq: vi.fn().mockReturnValue({
                        gte: vi.fn().mockReturnValue({
                            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                    }),
                    in: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            gte: vi.fn().mockResolvedValue({ data: [], error: null }),
                        }),
                    }),
                };

                return {
                    select: vi.fn().mockReturnValue(selectReturn),
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { id: 'coupon-1' },
                                error: null,
                            }),
                        }),
                    }),
                };
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

        // BUG: This should be 'failed' because WA credentials are missing,
        // but currently it's 'sent'
        expect(winbackLog).toBeDefined();
        expect(winbackLog?.status).toBe('failed');
    });
});
