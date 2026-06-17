import { test, expect } from '@playwright/test';

test.describe('Sign-in page @unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/sign-in');
  });

  test('renders sign-in form with email and password fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Access Portal' })).toBeVisible();

    // Email input uses placeholder, not label
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();

    // Password field (second textbox)
    await expect(page.getByRole('textbox').nth(1)).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: 'SIGN IN' })).toBeVisible();
  });

  test('has link to sign-up page', async ({ page }) => {
    const signUpLink = page.getByRole('link', { name: /REQUEST ACCESS/i });
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute('href', '/auth/sign-up');
  });

  test('has link to password reset', async ({ page }) => {
    const resetLink = page.getByRole('link', { name: /Forgot Password/i });
    await expect(resetLink).toBeVisible();
    await expect(resetLink).toHaveAttribute('href', '/auth/password-reset');
  });

  test('stays on sign-in page without redirect', async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Access Portal' })).toBeVisible();
  });
});
