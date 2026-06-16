/**
 * Coupon utilities for Restoloop.
 */

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1 — avoids visual confusion

/**
 * Generates a random 8-character alphanumeric coupon code.
 * e.g. "AMXK7R2Q"
 */
export function generateCouponCode(): string {
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    }
    return code;
}

/**
 * Returns an ISO date string N days from now.
 * Used for coupon expiry.
 */
export function generateExpiryDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
}
