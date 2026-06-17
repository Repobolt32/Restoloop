import { test, expect } from '@playwright/test';

test.describe('Billing Page @authenticated', () => {
  test('sees billing terminal', async ({ page }) => {
    await page.goto('/home/billing');

    await expect(page.getByRole('heading', { name: /Billing/i })).toBeVisible();
  });

  test('can add bill items', async ({ page }) => {
    await page.goto('/home/billing');

    await expect(page.getByText('No items in this transaction')).toBeVisible();

    await page.getByRole('button', { name: /Add Entry/i }).click();

    await expect(page.getByText('No items in this transaction')).not.toBeVisible();
    await expect(page.getByText('1 Active Items')).toBeVisible();

    await page.getByRole('button', { name: /Add Entry/i }).click();
    await expect(page.getByText('2 Active Items')).toBeVisible();
  });

  test('coupon verify calls validate API', async ({ page }) => {
    await page.route('**/api/coupons/validate', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          discount: 50,
          customerName: 'Test Customer',
          customerPhone: '+91 98765 43210',
        }),
      })
    );

    await page.goto('/home/billing');

    await page.getByRole('button', { name: /Add Entry/i }).click();

    const couponInput = page.getByPlaceholder(/Enter code/i);
    await couponInput.fill('WELCOME50');

    await page.getByRole('button', { name: /^Verify$/i }).click();

    await expect(page.getByText(/50% Off/i)).toBeVisible();
    await expect(page.getByText(/Test Customer/i)).toBeVisible();
  });

  test('Confirm Bill calls confirm API', async ({ page }) => {
    await page.route('**/api/billing/confirm', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, billId: 'bill-001', remainingCredits: 95 }),
      })
    );

    await page.goto('/home/billing');

    await page.getByRole('button', { name: /Add Entry/i }).click();
    await page.getByRole('button', { name: /Confirm Bill/i }).click();

    await expect(page.getByText(/Bill confirmed/i)).toBeVisible();
  });

  test('shows tax toggle and GST inputs', async ({ page }) => {
    await page.goto('/home/billing');

    await expect(page.getByText('CGST (%)')).toBeVisible();
    await expect(page.getByText('SGST (%)')).toBeVisible();
  });
});

test.describe('Billing Page unauthenticated @unauthenticated', () => {
  test('redirects to sign-in', async ({ page }) => {
    await page.goto('/home/billing');
    expect(page.url()).toContain('/auth/sign-in');
  });
});
