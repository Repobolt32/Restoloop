# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-controls.spec.ts >> Admin Controls >> admin can suspend and reactivate a restaurant
- Location: tests\admin-controls.spec.ts:17:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('[data-testid^="manage-btn-"]').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Log In" [level=1] [ref=e5]
      - paragraph [ref=e6]: Welcome back to Restoloop
    - generic [ref=e7]:
      - generic [ref=e8]: Email
      - textbox "Email" [ref=e9]
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: Password
        - link "Forgot password?" [ref=e13] [cursor=pointer]:
          - /url: /forgot-password
      - textbox "Password" [ref=e14]
    - button "Log In" [ref=e15] [cursor=pointer]
    - paragraph [ref=e16]:
      - text: Don't have an account?
      - link "Sign up" [ref=e17] [cursor=pointer]:
        - /url: /signup
  - button "Open Next.js Dev Tools" [ref=e23] [cursor=pointer]:
    - img [ref=e24]
  - alert [ref=e27]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './helpers/supabase'
  3  | 
  4  | test.describe('Admin Controls', () => {
  5  |   test.use({ storageState: { cookies: [], origins: [] } })
  6  | 
  7  |   test('admin@restoloop.com is redirected from /dashboard to /admin', async ({ page }) => {
  8  |     await page.goto('http://localhost:3000/login')
  9  |     await page.getByLabel('Email').fill(TEST_ADMIN_EMAIL)
  10 |     await page.getByLabel('Password').fill(TEST_ADMIN_PASSWORD)
  11 |     await page.getByRole('button', { name: /log in/i }).click()
  12 | 
  13 |     await expect(page).toHaveURL(/.*admin/)
  14 |     await expect(page).not.toHaveURL(/.*dashboard/)
  15 |   })
  16 | 
  17 |   test('admin can suspend and reactivate a restaurant', async ({ page }) => {
  18 |     await page.goto('http://localhost:3000/login')
  19 |     await page.getByLabel('Email').fill(TEST_ADMIN_EMAIL)
  20 |     await page.getByLabel('Password').fill(TEST_ADMIN_PASSWORD)
  21 |     await page.getByRole('button', { name: /log in/i }).click()
  22 | 
  23 |     await page.goto('http://localhost:3000/admin')
  24 |     const manageBtn = page.locator('[data-testid^="manage-btn-"]').first()
> 25 |     await manageBtn.click()
     |                     ^ Error: locator.click: Test timeout of 60000ms exceeded.
  26 | 
  27 |     await expect(page.getByTestId('suspension-status')).toContainText('Active')
  28 | 
  29 |     await page.getByTestId('toggle-suspension-btn').click()
  30 |     await expect(page.getByTestId('suspension-status')).toContainText('Suspended')
  31 | 
  32 |     await page.getByTestId('toggle-suspension-btn').click()
  33 |     await expect(page.getByTestId('suspension-status')).toContainText('Active')
  34 |   })
  35 | 
  36 |   test('admin can add custom credits with reason', async ({ page }) => {
  37 |     await page.goto('http://localhost:3000/login')
  38 |     await page.getByLabel('Email').fill(TEST_ADMIN_EMAIL)
  39 |     await page.getByLabel('Password').fill(TEST_ADMIN_PASSWORD)
  40 |     await page.getByRole('button', { name: /log in/i }).click()
  41 | 
  42 |     await page.goto('http://localhost:3000/admin')
  43 |     const manageBtn = page.locator('[data-testid^="manage-btn-"]').first()
  44 |     await manageBtn.click()
  45 | 
  46 |     await page.getByTestId('custom-credit-amount').fill('250')
  47 |     await page.getByTestId('custom-credit-reason').fill('Trial extension bonus')
  48 |     await page.getByTestId('custom-credit-btn').click()
  49 |     await expect(page.getByTestId('success-alert')).toBeVisible()
  50 |   })
  51 | })
  52 | 
```