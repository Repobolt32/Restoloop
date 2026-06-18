import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '~/api/leads/route';

function mockRequest(body: any) {
    return new Request('http://localhost/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();

vi.mock('~/lib/supabase/server', () => ({
    createServiceClient: vi.fn(() => ({
        from: vi.fn((table: string) => {
            if (table === 'customers') {
                return {
                    insert: mockInsert.mockReturnValue({
                        select: mockSelect.mockReturnValue({
                            single: mockSingle.mockResolvedValue({
                                data: { id: 'cust-1' },
                                error: null,
                            }),
                        }),
                    }),
                };
            }
            if (table === 'tenants') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { coupon_welcome: 50, name: 'Test Restaurant' },
                                error: null,
                            }),
                        }),
                    }),
                };
            }
            if (table === 'coupons') {
                return {
                    insert: vi.fn().mockResolvedValue({ error: null }),
                };
            }
            return { select: vi.fn() };
        }),
    })),
}));

vi.mock('~/lib/coupons', () => ({
    generateCouponCode: vi.fn(() => 'ABC12345'),
}));

describe('POST /api/leads', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does NOT include visit_count in the customer insert', async () => {
        const req = mockRequest({
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test User',
            phone: '+919876543210',
        });

        await POST(req);

        const insertPayload = mockInsert.mock.calls[0][0];
        expect(insertPayload).not.toHaveProperty('visit_count');
    });

    it('inserts customer with valid fields', async () => {
        const req = mockRequest({
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test User',
            phone: '+919876543210',
        });

        await POST(req);

        const insertPayload = mockInsert.mock.calls[0][0];
        expect(insertPayload).toHaveProperty('tenant_id');
        expect(insertPayload).toHaveProperty('name');
        expect(insertPayload).toHaveProperty('phone');
        expect(insertPayload).toHaveProperty('last_visit');
    });

    it('returns 400 for invalid data', async () => {
        const req = mockRequest({ name: 'X' });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });
});
