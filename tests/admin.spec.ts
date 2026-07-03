import { test, expect } from '@playwright/test'
import { createTestRestaurant, cleanupRestaurant } from './helpers/supabase'

test.use({ storageState: 'tests/.auth/admin.json' })

test.describe('Admin add credits flow', () => {
  let restaurantId: string
  let restaurantSlug: string

  test.beforeAll(async () => {
    const restaurant = await createTestRestaurant(`E2E-Admin-${Date.now()}`)
    restaurantId = restaurant.id
    restaurantSlug = restaurant.slug
  })

  test.afterAll(async () => {
    await cleanupRestaurant(restaurantId)
  })

  test('admin adds 100 credits to a restaurant', async ({ page }) => {
    await page.goto('/admin')

    const row = page.getByTestId(`restaurant-row-${restaurantSlug}`)
    await expect(row).toBeVisible()

    await page.getByTestId(`manage-btn-${restaurantSlug}`).click()
    await expect(page).toHaveURL(new RegExp(`/admin/${restaurantId}`))

    const creditsDisplay = page.getByTestId('admin-credits-display')
    const initialCredits = parseInt(await creditsDisplay.textContent() || '0', 10)

    await page.getByTestId('add-100-btn').click()

    await expect(page).toHaveURL(new RegExp(`/admin/${restaurantId}\\?success=true&added=100`))

    await expect(page.getByTestId('success-alert')).toBeVisible()
    await expect(page.getByTestId('success-alert')).toContainText('Successfully added 100 credits')

    const newCredits = parseInt(await page.getByTestId('admin-credits-display').textContent() || '0', 10)
    expect(newCredits).toBe(initialCredits + 100)
  })
})
