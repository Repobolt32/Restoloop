import { test, expect } from '@playwright/test';

test.describe('Restaurant Profile @authenticated', () => {
  test('sees profile page heading', async ({ page }) => {
    await page.goto('/home/restaurant-profile');

    await expect(page.getByRole('heading', { name: /Profile/i })).toBeVisible();
  });

  test('sees all profile form fields', async ({ page }) => {
    await page.goto('/home/restaurant-profile');

    await expect(page.getByLabel('Restaurant Name')).toBeVisible();
    await expect(page.getByLabel('Restaurant Address')).toBeVisible();
    await expect(page.getByLabel('Support Email')).toBeVisible();
    await expect(page.getByLabel('Contact Phone')).toBeVisible();
    await expect(page.getByLabel('CGST Rate (%)')).toBeVisible();
    await expect(page.getByLabel('SGST Rate (%)')).toBeVisible();
    await expect(page.getByLabel('Welcome Payout')).toBeVisible();
    await expect(page.getByLabel('Birthday Gift')).toBeVisible();
    await expect(page.getByLabel('Win-back Bonus')).toBeVisible();
  });

  test('has Save Changes button', async ({ page }) => {
    await page.goto('/home/restaurant-profile');

    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeVisible();
  });

  test('displays public form URL', async ({ page }) => {
    await page.goto('/home/restaurant-profile');

    await expect(page.getByText('Table Flyer Generator')).toBeVisible();
  });

  test('tax fields have default values', async ({ page }) => {
    await page.goto('/home/restaurant-profile');

    await expect(page.getByLabel('CGST Rate (%)')).toHaveValue('2.5');
    await expect(page.getByLabel('SGST Rate (%)')).toHaveValue('2.5');
  });

  test('coupon fields have default values', async ({ page }) => {
    await page.goto('/home/restaurant-profile');

    await expect(page.getByLabel('Welcome Payout')).toHaveValue('50');
    await expect(page.getByLabel('Birthday Gift')).toHaveValue('38');
    await expect(page.getByLabel('Win-back Bonus')).toHaveValue('30');
  });
});

test.describe('Restaurant Profile unauthenticated @unauthenticated', () => {
  test('redirects to sign-in', async ({ page }) => {
    await page.goto('/home/restaurant-profile');
    expect(page.url()).toContain('/auth/sign-in');
  });
});
