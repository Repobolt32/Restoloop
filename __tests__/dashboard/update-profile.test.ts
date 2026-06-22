import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules before importing
vi.mock('~/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('~/lib/slug', () => ({
    generateUniqueSlug: vi.fn(() => 'test-restaurant'),
}));

vi.mock('~/lib/tenant', () => ({
    getTenantForUser: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

import { updateRestaurantProfile } from '~/home/restaurant-profile/_actions/update-profile';
import { createClient } from '~/lib/supabase/server';
import { getTenantForUser } from '~/lib/tenant';

describe('updateRestaurantProfile - initial credits_balance', () => {
    const mockInsert = vi.fn();
    const mockUpdate = vi.fn();
    const mockSupabase: any = {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default mock chain
        mockSupabase.from.mockReturnValue({
            insert: mockInsert.mockResolvedValue({ error: null }),
            update: mockUpdate.mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
            }),
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
            }),
        });

        vi.mocked(createClient).mockResolvedValue(mockSupabase);
    });

    it('should set credits_balance to 50 for new tenants', async () => {
        // Mock authenticated user
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        });

        // Mock no existing tenant (new tenant creation)
        vi.mocked(getTenantForUser).mockResolvedValue(null);

        const formData = new FormData();
        formData.append('name', 'Test Restaurant');
        formData.append('coupon_welcome', '50');
        formData.append('coupon_bday', '38');
        formData.append('coupon_winback', '30');

        const result = await updateRestaurantProfile({ success: false }, formData);

        // Verify insert was called
        expect(mockInsert).toHaveBeenCalledTimes(1);

        // Get the insert payload
        const insertPayload = mockInsert.mock.calls[0][0];

        // Verify credits_balance is set to 50 (not 0)
        expect(insertPayload).toHaveProperty('credits_balance', 50);

        // Verify success
        expect(result.success).toBe(true);
    });

    it('should NOT change credits_balance for existing tenants', async () => {
        // Mock authenticated user
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        });

        // Mock existing tenant
        vi.mocked(getTenantForUser).mockResolvedValue({
            id: 'tenant-1',
            slug: 'existing-restaurant',
        } as any);

        const formData = new FormData();
        formData.append('name', 'Updated Restaurant');
        formData.append('coupon_welcome', '60');
        formData.append('coupon_bday', '40');
        formData.append('coupon_winback', '35');

        const result = await updateRestaurantProfile({ success: false }, formData);

        // Verify update was called (not insert)
        expect(mockUpdate).toHaveBeenCalledTimes(1);
        expect(mockInsert).not.toHaveBeenCalled();

        // Get the update payload
        const updatePayload = mockUpdate.mock.calls[0][0];

        // Verify credits_balance is NOT in the update payload
        expect(updatePayload).not.toHaveProperty('credits_balance');

        // Verify success
        expect(result.success).toBe(true);
    });
});
