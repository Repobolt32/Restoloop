import { test, expect } from '@playwright/test';

test.describe('Error Pages @unauthenticated', () => {
  test('shows tenant 404 for invalid form slug', async ({ page }) => {
    await page.goto('/form/this-slug-definitely-does-not-exist-12345');

    await expect(page.getByText('Restaurant not found')).toBeVisible();
  });

  test('tenant 404 has link to sign-up', async ({ page }) => {
    await page.goto('/form/this-slug-definitely-does-not-exist-12345');

    const signUpLink = page.getByRole('link', {
      name: /Create your free account/i,
    });

    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute('href', '/auth/sign-up');
  });

  test('shows 404 for unknown route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz');

    await expect(page.getByText('Page Not Found')).toBeVisible();
  });
});

test.describe('Error Pages @authenticated', () => {
  test('shows 404 for unknown home route', async ({ page }) => {
    await page.goto('/home/this-does-not-exist');

    await expect(page.getByText('Page Not Found')).toBeVisible();
  });
});
