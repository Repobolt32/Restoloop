import { test, expect } from '@playwright/test';

test.describe('Dashboard Page @authenticated', () => {
  test('sees dashboard heading', async ({ page }) => {
    await page.goto('/home/dashboard');

    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
  });

  test('sees core KPI cards', async ({ page }) => {
    await page.goto('/home/dashboard');

    await expect(page.getByText('Total Customers')).toBeVisible();
    await expect(page.getByText('Coupons Sent')).toBeVisible();
    await expect(page.getByText('Credits Remaining')).toBeVisible();
  });

  test('sees coupon performance section with breakdown', async ({ page }) => {
    await page.goto('/home/dashboard');

    await expect(page.getByRole('heading', { name: /Coupon Performance/i })).toBeVisible();
    await expect(page.getByText('welcome', { exact: true })).toBeVisible();
    await expect(page.getByText('birthday', { exact: true })).toBeVisible();
    await expect(page.getByText('winback', { exact: true })).toBeVisible();
  });

  test('sees monthly subscription banner when credits are low', async ({ page }) => {
    await page.goto('/home/dashboard');

    // This test assumes the test tenant has < 50 credits as per requirements
    await expect(page.getByText('Monthly Subscription')).toBeVisible();
  });

  test('sees recent activity feed or empty state', async ({ page }) => {
    await page.goto('/home/dashboard');

    await expect(page.getByRole('heading', { name: /Recent Activity/i })).toBeVisible();
    // Either activity items exist or empty state is shown
    await expect(
      page.locator('.space-y-3 div, text=No recent activity').first()
    ).toBeVisible();
  });
});

test.describe('Dashboard Page unauthenticated @unauthenticated', () => {
  test('redirects to sign-in', async ({ page }) => {
    await page.goto('/home/dashboard');
    expect(page.url()).toContain('/auth/sign-in');
  });
});
