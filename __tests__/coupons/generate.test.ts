import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCouponCode, generateExpiryDate } from '~/lib/coupons';

describe('generateCouponCode', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('returns an 8-character string', () => {
        const code = generateCouponCode();
        expect(code).toHaveLength(8);
    });

    it('only uses safe charset (no I, O, 0, 1)', () => {
        const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        for (let i = 0; i < 50; i++) {
            const code = generateCouponCode();
            for (const ch of code) {
                expect(CHARSET).toContain(ch);
            }
        }
    });

    it('does NOT use Math.random (must use crypto)', () => {
        const spy = vi.spyOn(Math, 'random');
        generateCouponCode();
        expect(spy).not.toHaveBeenCalled();
    });

    it('produces different codes on successive calls', () => {
        const codes = new Set(Array.from({ length: 20 }, () => generateCouponCode()));
        expect(codes.size).toBeGreaterThan(1);
    });
});

describe('generateExpiryDate', () => {
    it('returns a valid ISO date string', () => {
        const result = generateExpiryDate(7);
        expect(new Date(result).toISOString()).toBe(result);
    });

    it('returns a date N days in the future', () => {
        const now = new Date();
        const result = generateExpiryDate(7);
        const expiry = new Date(result);
        const diffDays = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        expect(diffDays).toBe(7);
    });
});
