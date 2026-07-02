import { test, expect } from '@playwright/test'

test.describe('Slice 9: Front Door + QR', () => {
  test('Landing page renders with all sections', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Hero section
    await expect(page.getByText('Bring Every Customer Back')).toBeVisible()
    await expect(page.getByText('Start Free — 1000 Credits')).toBeVisible()

    // Features section
    await expect(page.getByText('Automated Campaigns')).toBeVisible()
    await expect(page.getByText('QR Enrollment')).toBeVisible()
    await expect(page.getByText('Live Dashboard')).toBeVisible()

    // How it works
    await expect(page.getByText('3 Steps. Zero Hassle.')).toBeVisible()

    // About section
    await expect(page.getByText('Built for the Owner Who Does It All')).toBeVisible()

    // CTA section
    await expect(page.getByText('Ready to Bring Them Back?')).toBeVisible()
  })

  test('Landing page signup link works', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.getByRole('link', { name: /start free/i }).first().click()
    await expect(page).toHaveURL(/.*signup/)
  })

  test('Landing page login link works', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.getByRole('link', { name: /log in/i }).first().click()
    await expect(page).toHaveURL(/.*login/)
  })
})
