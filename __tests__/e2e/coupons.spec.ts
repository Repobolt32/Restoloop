import { test, expect } from '@playwright/test';

test.describe('Coupons Page @authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home/coupons');
  });

  test('renders coupons table with correct columns', async ({ page }) => {
    const headers = page.getByRole('columnheader');
    await expect(headers).toContainText([
      'Code',
      'Type',
      'Discount',
      'Status',
      'Sent Date',
      'Customer Name',
    ]);
  });

  test('filters coupons by "Welcome" type', async ({ page }) => {
    await page.getByRole('button', { name: /Welcome/i }).click();

    // Verify only Welcome coupons are visible
    await expect(page.getByText('Welcome', { exact: true })).toBeVisible();
    await expect(page.getByText('Birthday', { exact: true })).not.toBeVisible();
    await expect(page.getByText('Winback', { exact: true })).not.toBeVisible();
  });

  test('filters coupons by "Birthday" type', async ({ page }) => {
    await page.getByRole('button', { name: /Birthday/i }).click();

    // Verify only Birthday coupons are visible
    await expect(page.getByText('Birthday', { exact: true })).toBeVisible();
    await expect(page.getByText('Welcome', { exact: true })).not.toBeVisible();
    await expect(page.getByText('Winback', { exact: true })).not.toBeVisible();
  });

  test('filters coupons by "Winback" type', async ({ page }) => {
    await page.getByRole('button', { name: /Winback/i }).click();

    // Verify only Winback coupons are visible
    await expect(page.getByText('Winback', { exact: true })).toBeVisible();
    await expect(page.getByText('Welcome', { exact: true })).not.toBeVisible();
    await expect(page.getByText('Birthday', { exact: true })).not.toBeVisible();
  });

  test('resets filter to "All"', async ({ page }) => {
    // First filter by one type
    await page.getByRole('button', { name: /Welcome/i }).click();
    await expect(page.getByText('Birthday', { exact: true })).not.toBeVisible();

    // Then reset to all
    await page.getByRole('button', { name: /All/i }).click();

    // Now multiple types should be visible again (assuming test data has them)
    await expect(page.getByText('Welcome', { exact: true })).toBeVisible();
    await expect(page.getByText('Birthday', { exact: true })).toBeVisible();
    await expect(page.getByText('Winback', { exact: true })).toBeVisible();
  });

  test('is read-only (no create/edit/delete controls)', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Create Coupon/i })).not.toBeVisible();

    // Check that no buttons with "Edit" or "Delete" text exist in the table or page
    const editButtons = page.getByRole('button', { name: /Edit/i });
    const deleteButtons = page.getByRole('button', { name: /Delete/i });

    await expect(editButtons).toHaveCount(0);
    await expect(deleteButtons).toHaveCount(0);
  });

  test('shows empty state when no coupons exist', async ({ page }) => {
    // Note: This test may fail if the test tenant always has coupons.
    // It defines the expected behavior for an empty state.
    const emptyStateMessage = page.getByText(/No coupons found|No coupons available/i);

    // In a real environment, we would navigate to a tenant with no coupons.
    // Since we are in TDD, we expect this to be handled.
    // If the page has coupons, this test will fail, which is correct for now.
    await expect(emptyStateMessage).toBeVisible();
  });
});

test.describe('Coupons Page unauthenticated @unauthenticated', () => {
  test('redirects to sign-in', async ({ page }) => {
    await page.goto('/home/coupons');
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});
