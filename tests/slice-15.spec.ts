import { test, expect } from '@playwright/test'

test.describe('Slice 15: Campaign Control', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill('iamkumarankit1502@gmail.com')
    await page.getByLabel('Password').fill('Ankit@2032')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('Settings page shows Campaign Settings section', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/settings')
    await expect(page.getByRole('heading', { name: 'Campaign Settings' })).toBeVisible()
    await expect(page.getByText('Welcome Reminder')).toBeVisible()
    await expect(page.getByText('Birthday Campaign')).toBeVisible()
    await expect(page.getByText('Winback Campaign')).toBeVisible()
    await expect(page.getByText('Expiry Reminder')).toBeVisible()
  })

  test('Timing inputs are visible with defaults', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/settings')
    await expect(page.locator('#welcome_reminder_days')).toBeVisible()
    await expect(page.locator('#winback_days')).toBeVisible()
    await expect(page.locator('#expiry_reminder_days')).toBeVisible()
  })

  test('WhatsApp prefill input is visible', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/settings')
    await expect(page.getByTestId('whatsapp-prefill-input')).toBeVisible()
  })

  test('Campaign settings can be saved', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/settings')

    const welcomeInput = page.locator('#welcome_reminder_days')
    await welcomeInput.clear()
    await welcomeInput.fill('20')

    await page.getByTestId('save-campaign-settings-btn').click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('#welcome_reminder_days')).toHaveValue('20')
  })
})
