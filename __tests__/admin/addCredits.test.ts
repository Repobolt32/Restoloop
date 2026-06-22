import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addCredits } from '~/admin/_lib/server-actions';

const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

// Default platform_credits mock (returns no row by default)
const mockPlatformSelect = vi.fn().mockReturnValue({
    limit: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
});
const mockPlatformUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
});

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
            // platform_credits
            return {
                select: mockPlatformSelect,
                update: mockPlatformUpdate,
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

    it('decrements platform_credits.balance by the added amount', async () => {
        process.env.SUPER_ADMIN_USER_ID = 'admin-1';
        mockSingle.mockResolvedValue({
            data: { credits_balance: 50 },
            error: null,
        });

        // Track platform_credits updates separately
        const platformEq = vi.fn().mockResolvedValue({ error: null });
        const platformUpdate = vi.fn().mockReturnValue({
            eq: platformEq,
        });
        const platformSingle = vi.fn().mockResolvedValue({
            data: { id: 'pc-1', balance: 500 },
            error: null,
        });
        const platformSelect = vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
                single: platformSingle,
            }),
        });

        // Override the mock so platform_credits calls are tracked
        const { createServiceClient } = await import('~/lib/supabase/server');
        vi.mocked(createServiceClient).mockResolvedValue({
            from: vi.fn((table: string) => {
                if (table === 'tenants') {
                    return {
                        select: mockSelect.mockReturnValue({
                            eq: vi.fn().mockReturnValue({ single: mockSingle }),
                        }),
                        update: mockUpdate.mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ error: null }),
                        }),
                    };
                }
                // platform_credits
                return {
                    select: platformSelect,
                    update: platformUpdate,
                };
            }),
        } as any);

        await addCredits('tenant-1', 30);

        // platform_credits.update should be called exactly once with the correct delta
        expect(platformUpdate).toHaveBeenCalledTimes(1);
        expect(platformUpdate).toHaveBeenCalledWith({ balance: 470 });
        // Should update by the platform row's ID
        expect(platformEq).toHaveBeenCalledWith('id', 'pc-1');
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
