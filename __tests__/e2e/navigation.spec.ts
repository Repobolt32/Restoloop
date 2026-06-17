import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation @authenticated', () => {
  test('sidebar has Home link', async ({ page }) => {
    await page.goto('/home');
    const link = page.locator('aside').getByRole('link', { name: 'Home', exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/home');
  });

  test('sidebar has Dashboard link', async ({ page }) => {
    await page.goto('/home');
    const link = page.locator('aside').getByRole('link', { name: 'Dashboard', exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/home/dashboard');
  });

  test('sidebar has Profile link', async ({ page }) => {
    await page.goto('/home');
    const link = page.locator('aside').getByRole('link', { name: 'Profile', exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/home/restaurant-profile');
  });

  test('sidebar has Billing link', async ({ page }) => {
    await page.goto('/home');
    const link = page.locator('aside').getByRole('link', { name: 'Billing', exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/home/billing');
  });

  test('sidebar has Logout button', async ({ page }) => {
    await page.goto('/home');
    const button = page.locator('aside').getByRole('button', { name: /Logout|Sign Out|Log Out/i });
    await expect(button).toBeVisible();
  });

  test('navigates to Dashboard', async ({ page }) => {
    await page.goto('/home');
    const link = page.locator('aside').getByRole('link', { name: 'Dashboard', exact: true });
    await expect(link).toBeVisible();
    await link.click({ force: true });
    await page.waitForURL(/\/home\/dashboard/, { timeout: 10000 });
  });

  test('navigates to Profile', async ({ page }) => {
    await page.goto('/home');
    const link = page.locator('aside').getByRole('link', { name: 'Profile', exact: true });
    await expect(link).toBeVisible();
    await link.click({ force: true });
    await page.waitForURL(/\/home\/restaurant-profile/, { timeout: 10000 });
  });

  test('navigates to Billing', async ({ page }) => {
    await page.goto('/home');
    const link = page.locator('aside').getByRole('link', { name: 'Billing', exact: true });
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL(/\/home\/billing/, { timeout: 10000 });
  });
});
