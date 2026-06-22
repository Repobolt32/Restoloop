import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '~/api/leads/route';

function mockRequest(body: any) {
    return new Request('http://localhost/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

const mockCustomerInsert = vi.fn();
const mockCouponInsert = vi.fn();

// Default tenant mock returns coupon_welcome: 50
let mockTenantData = { coupon_welcome: 50, name: 'Test Restaurant' };

vi.mock('~/lib/supabase/server', () => ({
    createServiceClient: vi.fn(() => ({
        from: vi.fn((table: string) => {
            if (table === 'customers') {
                return {
                    insert: mockCustomerInsert.mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
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
                                data: mockTenantData,
                                error: null,
                            }),
                        }),
                    }),
                };
            }
            if (table === 'coupons') {
                return {
                    insert: mockCouponInsert.mockResolvedValue({ error: null }),
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
        mockTenantData = { coupon_welcome: 50, name: 'Test Restaurant' };
    });

    it('does NOT include visit_count in the customer insert', async () => {
        const req = mockRequest({
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test User',
            phone: '+919876543210',
        });

        await POST(req);

        const insertPayload = mockCustomerInsert.mock.calls[0][0];
        expect(insertPayload).not.toHaveProperty('visit_count');
    });

    it('inserts customer with valid fields', async () => {
        const req = mockRequest({
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test User',
            phone: '+919876543210',
        });

        await POST(req);

        const insertPayload = mockCustomerInsert.mock.calls[0][0];
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

    // Issue #17: Store favouriteDish in database
    it('inserts favouriteDish as food_pref when provided', async () => {
        const req = mockRequest({
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test User',
            phone: '+919876543210',
            favouriteDish: 'Butter Chicken',
        });

        await POST(req);

        const insertPayload = mockCustomerInsert.mock.calls[0][0];
        expect(insertPayload).toHaveProperty('food_pref', 'Butter Chicken');
    });

    it('inserts food_pref as null when favouriteDish not provided', async () => {
        const req = mockRequest({
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test User',
            phone: '+919876543210',
        });

        await POST(req);

        const insertPayload = mockCustomerInsert.mock.calls[0][0];
        expect(insertPayload).toHaveProperty('food_pref', null);
    });

    // Issue #18: Use tenant's coupon_welcome config instead of hardcoded W50
    it('uses tenant coupon_welcome discount amount for welcome coupon', async () => {
        const req = mockRequest({
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test User',
            phone: '+919876543210',
        });

        const res = await POST(req);
        const body = await res.json();

        // Tenant has coupon_welcome: 50, so discount should be 50
        expect(body.discount).toBe(50);
    });

    it('generates coupon code with prefix based on tenant discount amount', async () => {
        const req = mockRequest({
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test User',
            phone: '+919876543210',
        });

        const res = await POST(req);
        const body = await res.json();

        // Should use W50- prefix (derived from coupon_welcome: 50)
        expect(body.couponCode).toMatch(/^W50-/);
    });

    it('uses dynamic prefix when tenant has different coupon_welcome value', async () => {
        // Override tenant mock to return different coupon_welcome value
        mockTenantData = { coupon_welcome: 100, name: 'Test Restaurant' };

        const req = mockRequest({
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test User',
            phone: '+919876543210',
        });

        const res = await POST(req);
        const body = await res.json();

        // Should use W100- prefix (derived from coupon_welcome: 100)
        expect(body.couponCode).toMatch(/^W100-/);
        expect(body.discount).toBe(100);
    });
});
