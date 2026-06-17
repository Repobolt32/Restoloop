import { test, expect } from '@playwright/test';

test.describe('Home Page (/home) @authenticated', () => {
  test('sees the hub page with 3 action cards', async ({ page }) => {
    await page.goto('/home');

    await expect(page.getByRole('heading', { name: 'Restoloop' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Manual Add' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Form Terminal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Billing System' })).toBeVisible();
  });

  test('cards link to correct pages', async ({ page }) => {
    await page.goto('/home');

    const manualAdd = page.getByRole('link', { name: /Manual Add/i });
    await expect(manualAdd).toHaveAttribute('href', '/home/restaurant-profile');

    const formTerminal = page.getByRole('link', { name: /Form Terminal/i });
    await expect(formTerminal).toHaveAttribute('href', '/home/restaurant-profile');

    const billingSystem = page.getByRole('link', { name: /Billing System/i });
    await expect(billingSystem).toHaveAttribute('href', '/home/billing');
  });

  test('displays Returning Guest Engine banner', async ({ page }) => {
    await page.goto('/home');

    await expect(page.getByText('Returning Guest Engine')).toBeVisible();
    await expect(page.getByText('Monitoring Growth')).toBeVisible();
  });
});

test.describe('Home Page unauthenticated @unauthenticated', () => {
  test('redirects to sign-in', async ({ request }) => {
    const response = await request.get('/home', {
      maxRedirects: 0,
    });

    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers()['location']).toContain('/auth/sign-in');
  });
});
