/**
 * Tests for app/api/coupons/validate/route.ts — POST handler
 *
 * Validates coupons and marks them as redeemed on successful validation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module under test
vi.mock('../../lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('../../lib/tenant', () => ({
    getTenantForUser: vi.fn(),
}));

import { POST } from '../../app/api/coupons/validate/route';
import { createClient } from '../../lib/supabase/server';
import { getTenantForUser } from '../../lib/tenant';

/** Minimal shape of the chainable query builder returned by supabase.from() */
interface MockQuery {
    select: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => void;
}

/**
 * Create a chainable Supabase query builder mock for the coupons table.
 * Tracks whether update() was called to verify the bug.
 */
function createCouponsQuery(couponData: unknown): MockQuery {
    const q = {} as MockQuery;

    q.select = vi.fn(() => q);
    q.eq = vi.fn(() => q);

    q.update = vi.fn(() => {
        return q;
    });

    q.single = vi.fn(() => Promise.resolve({ data: couponData, error: null }));

    // Make thenable (for `await supabase.from(...).select(...)`)
    q.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
        const result = { data: couponData, error: null };
        try {
            return resolve(result) as void;
        } catch (e) {
            if (reject) return reject(e) as void;
            throw e;
        }
    };

    return q;
}

/**
 * Create a mock Request object for the POST handler.
 */
function createMockRequest(body: unknown): Request {
    return {
        json: () => Promise.resolve(body),
    } as unknown as Request;
}

describe('POST /api/coupons/validate', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockSupabase: any;
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockTenant: any = { id: 'tenant-1', name: 'Test Restaurant' };

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock supabase with auth and query methods
        mockSupabase = {
            auth: {
                getUser: vi.fn(),
            },
            from: vi.fn(),
        };

        vi.mocked(createClient).mockResolvedValue(mockSupabase);
    });

    it('returns 401 when user is not authenticated', async () => {
        // Arrange: auth returns error
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
        });

        const request = createMockRequest({ code: 'TEST123' });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(401);
        expect(data.error).toBe('UNAUTHORIZED');
        expect(data.message).toContain('signed in');
    });

    it('returns 404 when tenant not found', async () => {
        // Arrange: auth succeeds but tenant not found
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });
        vi.mocked(getTenantForUser).mockResolvedValue(null);

        const request = createMockRequest({ code: 'TEST123' });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(404);
        expect(data.error).toBe('NOT_FOUND');
        expect(data.message).toContain('Restaurant profile');
    });

    it('returns 400 when coupon code is missing', async () => {
        // Arrange: auth and tenant succeed, but no code in body
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });
        vi.mocked(getTenantForUser).mockResolvedValue(mockTenant);

        const request = createMockRequest({}); // Missing code

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toBe('VALIDATION_ERROR');
        expect(data.message).toContain('required');
    });

    it('returns 404 when coupon not found', async () => {
        // Arrange: auth and tenant succeed, coupon lookup returns error
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });
        vi.mocked(getTenantForUser).mockResolvedValue(mockTenant);

        const couponsQuery = createCouponsQuery(null);
        couponsQuery.single = vi.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } }));
        mockSupabase.from.mockReturnValue(couponsQuery);

        const request = createMockRequest({ code: 'INVALID' });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(404);
        expect(data.error).toBe('NOT_FOUND');
        expect(data.message).toContain('Invalid coupon');
    });

    it('returns 400 when coupon already redeemed', async () => {
        // Arrange: auth and tenant succeed, coupon found with status 'redeemed'
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });
        vi.mocked(getTenantForUser).mockResolvedValue(mockTenant);

        const redeemedCoupon = {
            id: 'coupon-1',
            code: 'TEST123',
            discount: 10,
            status: 'redeemed',
            expires_at: '2026-12-31T23:59:59.000Z',
            customers: { name: 'John', phone: '+1234567890' },
        };
        const couponsQuery = createCouponsQuery(redeemedCoupon);
        mockSupabase.from.mockReturnValue(couponsQuery);

        const request = createMockRequest({ code: 'TEST123' });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toBe('COUPON_REDEEMED');
        expect(data.message).toContain('already been redeemed');
    });

    it('returns 400 when coupon expired (status)', async () => {
        // Arrange: auth and tenant succeed, coupon found with status 'expired'
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });
        vi.mocked(getTenantForUser).mockResolvedValue(mockTenant);

        const expiredCoupon = {
            id: 'coupon-2',
            code: 'EXPIRED',
            discount: 20,
            status: 'expired',
            expires_at: '2026-12-31T23:59:59.000Z',
            customers: { name: 'Jane', phone: '+0987654321' },
        };
        const couponsQuery = createCouponsQuery(expiredCoupon);
        mockSupabase.from.mockReturnValue(couponsQuery);

        const request = createMockRequest({ code: 'EXPIRED' });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toBe('COUPON_EXPIRED');
        expect(data.message).toContain('expired');
    });

    it('returns 400 when expiry date has passed', async () => {
        // Arrange: auth and tenant succeed, coupon found but expiry date is in the past
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });
        vi.mocked(getTenantForUser).mockResolvedValue(mockTenant);

        const pastCoupon = {
            id: 'coupon-3',
            code: 'PAST',
            discount: 15,
            status: 'active',
            expires_at: '2020-01-01T00:00:00.000Z', // Expired in the past
            customers: { name: 'Bob', phone: '+1111111111' },
        };
        const couponsQuery = createCouponsQuery(pastCoupon);
        mockSupabase.from.mockReturnValue(couponsQuery);

        const request = createMockRequest({ code: 'PAST' });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toBe('COUPON_EXPIRED');
        expect(data.message).toContain('date passed');
    });

    it('returns 200 success and marks coupon as redeemed', async () => {
        // Arrange: auth and tenant succeed, coupon found with valid status and future expiry
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });
        vi.mocked(getTenantForUser).mockResolvedValue(mockTenant);

        const validCoupon = {
            id: 'coupon-valid',
            code: 'VALID',
            discount: 25,
            status: 'active',
            expires_at: '2099-12-31T23:59:59.000Z',
            customers: { name: 'Alice', phone: '+2222222222' },
        };
        const couponsQuery = createCouponsQuery(validCoupon);
        const updateSpy = couponsQuery.update;
        mockSupabase.from.mockReturnValue(couponsQuery);

        const request = createMockRequest({ code: 'VALID' });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert: returns 200 with coupon details
        expect(response.status).toBe(200);
        expect(data.id).toBe('coupon-valid');
        expect(data.code).toBe('VALID');
        expect(data.discount).toBe(25);
        expect(data.customerName).toBe('Alice');
        expect(data.customerPhone).toBe('+2222222222');

        // Verify that update() was called to mark coupon as redeemed
        expect(updateSpy).toHaveBeenCalled();
        expect(updateSpy).toHaveBeenCalledWith({ status: 'redeemed' });
    });
});
