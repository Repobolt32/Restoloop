import { test, expect } from '@playwright/test'
import { createTestRestaurant, cleanupRestaurant } from './helpers/supabase'

test.describe('Slice 17: Trial Onboarding, Gating and Admin Overrides', () => {
  let restaurantId: string
  let restaurantSlug: string

  test.beforeAll(async () => {
    // Creates a restaurant associated with the default test user (e2e-test@restoloop.com)
    // plan defaults to 'free', credits default is updated to 0 via our migration
    const restaurant = await createTestRestaurant(`E2E-Trial-${Date.now()}`)
    restaurantId = restaurant.id
    restaurantSlug = restaurant.slug
  })

  test.afterAll(async () => {
    await cleanupRestaurant(restaurantId)
  })

  test.describe('User Session (Owner)', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('new user dashboard shows trial banner and settings gates QR download', async ({ page }) => {
      // 1. Check dashboard trial promo banner
      await page.goto('/dashboard')
      const promoBanner = page.getByTestId('not-started-trial-banner')
      await expect(promoBanner).toBeVisible()
      await expect(promoBanner).toContainText('Claim 21-Day Unlimited Growth Trial!')

      // 2. Check settings page QR code is gated
      await page.goto('/dashboard/settings')
      const lockOverlay = page.getByTestId('qr-lock-overlay')
      await expect(lockOverlay).toBeVisible()
      await expect(lockOverlay).toContainText('Pay ₹599 to unlock')

      // 3. Initiate payment via QR code lock button
      await page.getByTestId('pay-to-unlock-btn').click()
      
      // 4. Verify Sandbox payment simulator opens
      const sandboxModal = page.getByTestId('sandbox-modal')
      await expect(sandboxModal).toBeVisible()
      await expect(sandboxModal).toContainText('21-Day Unlimited Trial')

      // 5. Trigger simulator success
      await page.getByTestId('sandbox-simulate-success').click()

      // 6. Verify payment success alert and QR card is unlocked
      const successAlert = page.getByTestId('payment-success-alert')
      await expect(successAlert).toBeVisible()
      await expect(successAlert).toContainText('Trial successfully activated!')
      await expect(page.getByTestId('qr-lock-overlay')).toHaveCount(0)

      // 7. Verify dashboard active trial banner state
      await page.goto('/dashboard')
      const activeBanner = page.getByTestId('active-trial-banner')
      await expect(activeBanner).toBeVisible()
      await expect(activeBanner).toContainText('Unlimited Growth Trial Active')
    })
  })

  test.describe('Admin Session', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('admin can override restaurant plan and expiry', async ({ page }) => {
      // 1. Visit admin details panel for the test restaurant
      await page.goto(`/admin/${restaurantId}`)
      await expect(page.getByTestId('admin-restaurant-name')).toBeVisible()

      // 2. Update plan status via dropdown and expiry input override
      const planSelect = page.getByTestId('admin-plan-select')
      await expect(planSelect).toBeVisible()
      await planSelect.selectOption('starter')

      await page.getByTestId('admin-update-plan-btn').click()

      // 3. Verify update takes place and success alert is shown
      await expect(page).toHaveURL(new RegExp(`/admin/${restaurantId}\\?success=true`))
    })
  })
})
