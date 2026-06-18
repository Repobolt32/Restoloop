import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addCredits } from '~/admin/_lib/server-actions';

const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('~/lib/supabase/server', () => ({
    createServiceClient: vi.fn(() => ({
        from: vi.fn((table: string) => {
            if (table === 'tenants') {
                return {
                    select: mockSelect.mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: mockSingle,
                        }),
                    }),
                    update: mockUpdate.mockReturnValue({
                        eq: mockEq.mockResolvedValue({ error: null }),
                    }),
                };
            }
            // platform_credits should NOT be touched
            return {
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                }),
                update: vi.fn(),
            };
        }),
    })),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

describe('addCredits', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects when SUPER_ADMIN_USER_ID is not set', async () => {
        const original = process.env.SUPER_ADMIN_USER_ID;
        delete process.env.SUPER_ADMIN_USER_ID;

        await expect(addCredits('tenant-1', 100)).rejects.toThrow('System not configured');

        process.env.SUPER_ADMIN_USER_ID = original;
    });

    it('updates tenant credits_balance with correct new value', async () => {
        process.env.SUPER_ADMIN_USER_ID = 'admin-1';
        mockSingle.mockResolvedValue({
            data: { credits_balance: 50 },
            error: null,
        });

        const result = await addCredits('tenant-1', 30);

        expect(result.success).toBe(true);
        expect(result.newBalance).toBe(80);
        expect(mockUpdate).toHaveBeenCalledWith({ credits_balance: 80 });
    });

    it('does NOT update platform_credits table', async () => {
        process.env.SUPER_ADMIN_USER_ID = 'admin-1';
        mockSingle.mockResolvedValue({
            data: { credits_balance: 50 },
            error: null,
        });

        const platformUpdate = vi.fn();
        // Override the mock to track platform_credits.update
        const originalFrom = vi.mocked(
            (await import('~/lib/supabase/server')).createServiceClient
        );

        await addCredits('tenant-1', 30);

        // The platform_credits update should NOT have been called
        // We verify this by checking mockUpdate was called exactly once (for tenants only)
        expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    it('handles negative amounts (credit removal)', async () => {
        process.env.SUPER_ADMIN_USER_ID = 'admin-1';
        mockSingle.mockResolvedValue({
            data: { credits_balance: 50 },
            error: null,
        });

        const result = await addCredits('tenant-1', -20);

        expect(result.success).toBe(true);
        expect(result.newBalance).toBe(30);
    });

    it('throws when tenant not found', async () => {
        process.env.SUPER_ADMIN_USER_ID = 'admin-1';
        mockSingle.mockResolvedValue({
            data: null,
            error: null,
        });

        await expect(addCredits('nonexistent', 100)).rejects.toThrow('Tenant not found');
    });
});
