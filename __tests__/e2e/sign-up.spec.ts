import { test, expect } from '@playwright/test';

test.describe('Sign-up page @unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/sign-up');
  });

  test('renders sign-up form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Initialize Account/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('has link to sign-in page', async ({ page }) => {
    const signInLink = page.getByRole('link', { name: /ACCESS EXISTING PORTAL|sign in/i });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute('href', '/auth/sign-in');
  });
});
