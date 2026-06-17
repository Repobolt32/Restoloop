import { test, expect } from '@playwright/test';

test.describe('Auth Callback Error page @unauthenticated', () => {
  test('renders error page', async ({ page }) => {
    await page.goto('/auth/callback/error');

    await expect(
      page.getByRole('heading', { name: 'Authentication Error' })
    ).toBeVisible();

    await expect(
      page.getByText('There was an error authenticating your account')
    ).toBeVisible();
  });

  test('has resend email form', async ({ page }) => {
    await page.goto('/auth/callback/error?code=otp_expired');

    await expect(page.getByRole('textbox')).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'RESEND LINK' })
    ).toBeVisible();
  });

  test('has link to sign-in', async ({ page }) => {
    await page.goto('/auth/callback/error');

    const signInLink = page.getByRole('link', { name: 'Sign in' });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute('href', '/auth/sign-in');
  });
});
