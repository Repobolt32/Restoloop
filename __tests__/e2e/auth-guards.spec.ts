import { test, expect } from '@playwright/test';

test.describe('Auth guards — authenticated user @authenticated', () => {
  test('redirects from /auth/sign-in to /home', async ({ page }) => {
    await page.goto('/auth/sign-in');

    await expect(page).toHaveURL(/\/home/);
  });

  test('redirects from /auth/sign-up to /home', async ({ page }) => {
    await page.goto('/auth/sign-up');

    await expect(page).toHaveURL(/\/home/);
  });

  test('redirects from /auth/password-reset to /home', async ({ page }) => {
    await page.goto('/auth/password-reset');

    await expect(page).toHaveURL(/\/home/);
  });

  test('can access /home', async ({ page }) => {
    await page.goto('/home');

    await expect(page.getByRole('heading', { name: 'Restoloop' })).toBeVisible();
  });

  test('can access /home/dashboard', async ({ page }) => {
    await page.goto('/home/dashboard');

    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
  });

  test('can access /home/billing', async ({ page }) => {
    await page.goto('/home/billing');

    await expect(page.getByRole('heading', { name: /Billing/i })).toBeVisible();
  });

  test('can access /home/restaurant-profile', async ({ page }) => {
    await page.goto('/home/restaurant-profile');

    await expect(page.getByRole('heading', { name: /Profile/i })).toBeVisible();
  });
});

test.describe('Auth guards — unauthenticated user @unauthenticated', () => {
  test('redirects from /home to /auth/sign-in', async ({ request }) => {
    const response = await request.get('/home', { maxRedirects: 0 });

    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers()['location']).toContain('/auth/sign-in');
  });

  test('redirects from /home/dashboard to /auth/sign-in', async ({ request }) => {
    const response = await request.get('/home/dashboard', { maxRedirects: 0 });

    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers()['location']).toContain('/auth/sign-in');
  });

  test('redirects from /home/billing to /auth/sign-in', async ({ request }) => {
    const response = await request.get('/home/billing', { maxRedirects: 0 });

    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers()['location']).toContain('/auth/sign-in');
  });

  test('redirects from /home/restaurant-profile to /auth/sign-in', async ({ request }) => {
    const response = await request.get('/home/restaurant-profile', { maxRedirects: 0 });

    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers()['location']).toContain('/auth/sign-in');
  });

  test('redirects from /update-password to /auth/sign-in', async ({ page }) => {
    await page.goto('/update-password');

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});
