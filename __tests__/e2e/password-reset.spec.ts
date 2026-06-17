import { test, expect } from '@playwright/test';

test.describe('Password Reset page @unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/password-reset');
  });

  test('renders password reset form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'RESET PASSWORD' })).toBeVisible();
  });

  test('has link back to sign-in', async ({ page }) => {
    const signInLink = page.getByRole('link', { name: /Sign in/i });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute('href', '/auth/sign-in');
  });

  test('shows validation on empty submit', async ({ page }) => {
    // Wait for form to be fully rendered
    const button = page.getByRole('button', { name: 'RESET PASSWORD' });
    await expect(button).toBeVisible();

    // Bypass HTML5 required/email validation so react-hook-form zod runs
    await page.locator('form').evaluate(
      (el) => ((el as HTMLFormElement).noValidate = true),
    );
    await button.click();

    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('shows success after submitting email', async ({ page }) => {
    await page.route('**/auth/v1/recover', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    );

    // Bypass HTML5 required/email validation so react-hook-form runs
    await page.locator('form').evaluate(
      (el) => ((el as HTMLFormElement).noValidate = true),
    );

    const emailInput = page.getByPlaceholder('Enter your email');
    await expect(emailInput).toBeVisible();
    await emailInput.click();
    await emailInput.pressSequentially('test@example.com', { delay: 30 });
    await expect(emailInput).toHaveValue('test@example.com');
    await page.getByRole('button', { name: 'RESET PASSWORD' }).click();

    await expect(page.getByText('Check Your Email')).toBeVisible();
    await expect(page.getByText(/sent you a password reset link/i)).toBeVisible();
  });
});

test.describe('Update Password page @authenticated', () => {
  test('renders update password form', async ({ page }) => {
    await page.goto('/update-password');

    await expect(page.getByRole('heading', { name: 'RESET PASSWORD' })).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="repeatPassword"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'UPDATE PASSWORD' })).toBeVisible();
  });
});

test.describe('Update Password page @unauthenticated', () => {
  test('redirects to sign-in', async ({ page }) => {
    await page.goto('/update-password');
    expect(page.url()).toContain('/auth/sign-in');
  });
});
