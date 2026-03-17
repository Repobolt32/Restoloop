/**
 * billing.ts
 *
 * Core logic for calculating bill totals, applying discounts, and calculating taxes.
 */

export interface BillCalculationResult {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    taxAmount: number;
    finalTotal: number;
}

/**
 * Calculates the final bill breakdown given a subtotal, a flat discount, and a tax rate.
 *
 * @param subtotal The initial bill amount before any discounts or taxes.
 * @param discount The flat discount amount to subtract (e.g., from a coupon).
 * @param taxRate The percentage tax rate to apply (e.g., 5.0 for 5%).
 * @returns A detailed breakdown of the bill calculation.
 */
export function calculateBill(
    subtotal: number,
    discount: number,
    taxRate: number
): BillCalculationResult {
    // Ensure inputs are valid positive numbers or zero
    const safeSubtotal = Math.max(0, subtotal);
    const safeDiscount = Math.max(0, discount);
    const safeTaxRate = Math.max(0, taxRate);

    // Apply discount, ensuring we don't go below 0
    // We apply tax AFTER the discount according to standard Indian GST rules on discounted items
    const discountAmount = Math.min(safeSubtotal, safeDiscount);
    const taxableAmount = safeSubtotal - discountAmount;

    // Calculate tax on the post-discount amount
    const taxAmount = (taxableAmount * safeTaxRate) / 100;

    // Final total
    const finalTotal = taxableAmount + taxAmount;

    return {
        subtotal: safeSubtotal,
        discountAmount,
        taxableAmount,
        taxAmount: Number(taxAmount.toFixed(2)),
        finalTotal: Number(finalTotal.toFixed(2)),
    };
}
