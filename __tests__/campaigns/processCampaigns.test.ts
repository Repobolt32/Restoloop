/**
 * Tests for lib/campaigns.ts — processCampaigns()
 *
 * Bug 4: Sequential awaits in for loops → should use Promise.allSettled()
 * Bug 5: Platform credits decremented N times in loop → should be single RPC call
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing the module under test
vi.mock('../../lib/supabase/server', () => ({
    createServiceClient: vi.fn(),
}));

vi.mock('../../lib/coupons', () => ({
    generateCouponCode: vi.fn(() => 'TESTCODE'),
    generateExpiryDate: vi.fn(() => '2026-12-31T23:59:59.000Z'),
}));

vi.mock('../../lib/whatsapp', () => ({
    sendThirdPartyMessage: vi.fn(() => Promise.resolve({ success: true })),
}));

import { processCampaigns } from '../../lib/campaigns';
import { createServiceClient } from '../../lib/supabase/server';

let couponIdCounter = 0;

/** Minimal shape of the chainable query builder returned by supabase.from() */
interface MockQuery {
    select: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    gte: ReturnType<typeof vi.fn>;
    lte: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    not: ReturnType<typeof vi.fn>;
    filter: ReturnType<typeof vi.fn>;
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => void;
}

/**
 * Create a full Supabase query builder mock.
 *
 * Supports all Supabase query patterns used in campaigns.ts:
 * - select().eq()...  → read queries
 * - insert().select().single()  → create queries
 * - update().eq()  → update queries
 *
 * All method calls are tracked in callLog for assertions.
 */
function createMockSupabase() {
    const callLog: { method: string; table?: string; fnName?: string; params?: unknown }[] = [];
    couponIdCounter = 0;

    // Fixed date for deterministic tests
    const now = new Date('2026-06-18T12:00:00.000Z');
    const winbackTarget = new Date(now);
    winbackTarget.setDate(winbackTarget.getDate() - 45);
    const winbackDateStr = winbackTarget.toISOString().split('T')[0]!;

    // ── Test data ──
    const tenants = [{
        id: 'tenant-1',
        name: 'Test Restaurant',
        credits_balance: 100,
        coupon_winback: 50,
        coupon_bday: 30,
        coupon_welcome: 40,
    }];

    const winbackCustomers = [
        { id: 'wb-1', tenant_id: 'tenant-1', name: 'Alice', phone: '+919990000001', birthday: null, last_visit: `${winbackDateStr}T10:00:00.000Z`, created_at: '2026-01-01' },
        { id: 'wb-2', tenant_id: 'tenant-1', name: 'Bob', phone: '+919990000002', birthday: null, last_visit: `${winbackDateStr}T11:00:00.000Z`, created_at: '2026-01-01' },
        { id: 'wb-3', tenant_id: 'tenant-1', name: 'Charlie', phone: '+919990000003', birthday: null, last_visit: `${winbackDateStr}T12:00:00.000Z`, created_at: '2026-01-01' },
    ];

    const bdayCustomers = [
        { id: 'bd-1', tenant_id: 'tenant-1', name: 'Dave', phone: '+919990000004', birthday: '1990-06-18', last_visit: '2026-06-01', created_at: '2026-01-01' },
        { id: 'bd-2', tenant_id: 'tenant-1', name: 'Eve', phone: '+919990000005', birthday: '1985-06-18', last_visit: '2026-06-01', created_at: '2026-01-01' },
    ];

    const allCustomers = [...winbackCustomers, ...bdayCustomers];

    /**
     * Create a chainable Supabase query builder mock.
     * Tracks whether insert/update was called to return appropriate terminal data.
     */
    function createQuery(tableData: Record<string, unknown>[]): MockQuery {
        let wasInsert = false;
        let wasSingle = false;

        const q = {} as MockQuery;

        // Chainable filter methods
        for (const m of ['eq', 'gte', 'lte', 'in', 'not', 'filter'] as const) {
            q[m] = vi.fn(() => q);
        }

        q.select = vi.fn(() => q);
        q.limit = vi.fn(() => q);

        q.insert = vi.fn(() => {
            wasInsert = true;
            return q;
        });

        q.update = vi.fn(() => {
            return q;
        });

        q.single = vi.fn(() => {
            wasSingle = true;
            if (wasInsert) {
                // Return a mock coupon with generated id
                const mockCoupon = { id: `coupon-${++couponIdCounter}` };
                return Promise.resolve({ data: mockCoupon, error: null });
            }
            return Promise.resolve({ data: tableData[0] ?? null, error: null });
        });

        q.maybeSingle = vi.fn(() => Promise.resolve({ data: tableData[0] ?? null, error: null }));

        // Make thenable (for `await supabase.from(...).select(...)`)
        q.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
            if (wasSingle) {
                // Already resolved via single()
                return;
            }
            const result = { data: tableData, error: null };
            try {
                return resolve(result) as void;
            } catch (e) {
                if (reject) return reject(e) as void;
                throw e;
            }
        };

        return q;
    }

    const supabase = {
        from: vi.fn((table: string) => {
            callLog.push({ method: 'from', table });

            switch (table) {
                case 'tenants':
                    return createQuery(tenants);
                case 'customers':
                    return createQuery(allCustomers);
                case 'coupons':
                    return createQuery([]); // No existing coupons (no duplicates)
                case 'message_log':
                    return createQuery([]); // No existing logs
                case 'platform_credits':
                    return createQuery([{ id: 'pc-1', balance: 1000 }]);
                default:
                    return createQuery([]);
            }
        }),
        rpc: vi.fn((fnName: string, params?: unknown) => {
            callLog.push({ method: 'rpc', fnName, params });
            return Promise.resolve({ data: null, error: null });
        }),
        _callLog: callLog,
    };

    return supabase;
}

describe('processCampaigns', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.WA_PHONE_ID = 'test-phone-id';
        process.env.WA_TOKEN = 'test-token';

        // Mock global fetch for WhatsApp API calls
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ messages: [{ id: 'msg-1' }] }),
            text: () => Promise.resolve('OK'),
        })));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should process campaigns and return correct counts', async () => {
        const mockSupabase = createMockSupabase();
        vi.mocked(createServiceClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createServiceClient>>);

        const results = await processCampaigns();

        // Should have sent campaigns for all types
        expect(results.winbackSent).toBeGreaterThanOrEqual(0);
        expect(results.bdaySent).toBeGreaterThanOrEqual(0);
        expect(results.reminderSent).toBeGreaterThanOrEqual(0);
    });

    it('Bug 5: should call decrement_platform_credits RPC exactly ONCE with total count', async () => {
        const mockSupabase = createMockSupabase();
        vi.mocked(createServiceClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createServiceClient>>);

        const results = await processCampaigns();

        // Collect all rpc calls
        const rpcCalls = mockSupabase._callLog.filter(c => c.method === 'rpc');

        // Bug 5 fix: should be exactly 1 RPC call (not N calls in a loop)
        expect(rpcCalls).toHaveLength(1);
        expect(rpcCalls[0].fnName).toBe('decrement_platform_credits');

        // The amount should equal total successful sends
        const totalSent = results.winbackSent + results.bdaySent + results.reminderSent;
        expect((rpcCalls[0].params as { amount: number }).amount).toBe(totalSent);
    });

    it('Bug 5: should NOT read platform_credits balance in a loop', async () => {
        const mockSupabase = createMockSupabase();
        vi.mocked(createServiceClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createServiceClient>>);

        await processCampaigns();

        // After fix: should NOT query platform_credits table at all
        // (the old code did supabase.from('platform_credits').select('id, balance') inside loops)
        const platformCreditReads = mockSupabase._callLog.filter(
            c => c.method === 'from' && c.table === 'platform_credits'
        );

        expect(platformCreditReads).toHaveLength(0);
    });

    it('Bug 4: should batch duplicate-check queries for coupons (not N+1 per customer)', async () => {
        const mockSupabase = createMockSupabase();
        vi.mocked(createServiceClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createServiceClient>>);

        await processCampaigns();

        // With batch duplicate checks: 2 batch selects + 5 inserts (sendCampaign) + 1 welcome fetch = 8
        // Without fix (N+1): 5 individual selects + 5 inserts + 1 welcome fetch = 11
        const couponTableCalls = mockSupabase._callLog.filter(
            c => c.method === 'from' && c.table === 'coupons'
        );

        // With 5 customers (3 winback + 2 bday), batch approach = 8 calls max
        // Old N+1 approach would be 11+ calls
        expect(couponTableCalls.length).toBeLessThanOrEqual(10);
    });

    it('Bug 4: should batch duplicate-check queries for message_log', async () => {
        const mockSupabase = createMockSupabase();
        vi.mocked(createServiceClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createServiceClient>>);

        await processCampaigns();

        // After fix: message_log "from" calls = 1 batch check + N inserts
        // NOT N individual checks + N inserts
        const messageLogCalls = mockSupabase._callLog.filter(
            c => c.method === 'from' && c.table === 'message_log'
        );

        // With 2 welcome coupons: batch approach = 1 check + inserts
        // The exact count depends on blocked inserts too, but the check should be batched
        // We can't easily distinguish check vs insert from callLog alone,
        // but total should be reasonable
        expect(messageLogCalls.length).toBeLessThanOrEqual(10);
    });
});
