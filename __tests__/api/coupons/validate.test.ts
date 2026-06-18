import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '~/api/coupons/validate/route';

function mockRequest(body: any) {
    return new Request('http://localhost/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('~/lib/supabase/server', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'user-1' } },
                error: null,
            }),
        },
        from: vi.fn((table: string) => {
            if (table === 'coupons') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: mockSingle,
                            }),
                        }),
                    }),
                    update: mockUpdate.mockReturnValue({
                        eq: mockEq.mockResolvedValue({ error: null }),
                    }),
                };
            }
            return { select: vi.fn() };
        }),
    })),
}));

vi.mock('~/lib/tenant', () => ({
    getTenantForUser: vi.fn().mockResolvedValue({
        id: 'tenant-1',
        name: 'Test Restaurant',
    }),
}));

describe('POST /api/coupons/validate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('marks coupon as redeemed after successful validation', async () => {
        mockSingle.mockResolvedValue({
            data: {
                id: 'coupon-1',
                code: 'W50-ABC',
                discount: 50,
                status: 'sent',
                expires_at: new Date(Date.now() + 86400000).toISOString(),
                customers: { name: 'Test User', phone: '+919876543210' },
            },
            error: null,
        });

        const req = mockRequest({ code: 'W50-ABC' });
        await POST(req);

        expect(mockUpdate).toHaveBeenCalledWith({
            status: 'redeemed',
            redeemed_at: expect.any(String),
        });
    });

    it('returns 200 with coupon info on success', async () => {
        mockSingle.mockResolvedValue({
            data: {
                id: 'coupon-1',
                code: 'W50-ABC',
                discount: 50,
                status: 'sent',
                expires_at: new Date(Date.now() + 86400000).toISOString(),
                customers: { name: 'Test User', phone: '+919876543210' },
            },
            error: null,
        });

        const req = mockRequest({ code: 'W50-ABC' });
        const res = await POST(req);

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.code).toBe('W50-ABC');
        expect(body.discount).toBe(50);
    });

    it('returns 400 for already redeemed coupon', async () => {
        mockSingle.mockResolvedValue({
            data: {
                id: 'coupon-1',
                code: 'W50-ABC',
                discount: 50,
                status: 'redeemed',
                expires_at: new Date(Date.now() + 86400000).toISOString(),
                customers: { name: 'Test User', phone: '+919876543210' },
            },
            error: null,
        });

        const req = mockRequest({ code: 'W50-ABC' });
        const res = await POST(req);

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe('COUPON_REDEEMED');
    });

    it('returns 404 for invalid coupon code', async () => {
        mockSingle.mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
        });

        const req = mockRequest({ code: 'INVALID' });
        const res = await POST(req);

        expect(res.status).toBe(404);
    });
});
