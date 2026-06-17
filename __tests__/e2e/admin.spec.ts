import { test, expect } from '@playwright/test';

test.describe('Admin Panel access control @authenticated', () => {
  test('non-admin user is redirected to home', async ({ page }) => {
    await page.goto('/admin');

    // Test user is not super admin; admin layout redirects to /home
    await expect(page).toHaveURL(/\/home/);
  });

  test('non-admin user does not remain on admin route', async ({ page }) => {
    await page.goto('/admin');

    // After redirect, admin-specific content should not be visible
    await expect(
      page.getByRole('heading', { name: /Admin Dashboard/i })
    ).not.toBeVisible();
  });
});

test.describe('Admin Panel unauthenticated @unauthenticated', () => {
  test('redirects to home', async ({ request }) => {
    const response = await request.get('/admin', {
      maxRedirects: 0,
    });

    // Admin layout redirects to /home (not /auth/sign-in)
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers()['location']).toContain('/home');
  });
});
