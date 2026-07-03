import { test, expect } from '@playwright/test'
import { createTestSupabase, cleanupRestaurant } from './helpers/supabase'

test.describe('Create restaurant flow', () => {
  let createdRestaurantId: string | null = null

  test.afterAll(async () => {
    if (createdRestaurantId) {
      await cleanupRestaurant(createdRestaurantId)
    }
  })

  test('owner creates a restaurant and lands on dashboard', async ({ page }) => {
    await page.goto('/dashboard/create')

    await expect(page.getByRole('heading', { name: 'Create Your Restaurant' })).toBeVisible()

    const restaurantName = `E2E-Restaurant-${Date.now()}`

    await page.fill('input[name="name"]', restaurantName)
    await page.fill('input[name="whatsappNumber"]', '919999900000')
    await page.fill('input[name="welcomeDiscount"]', '10')
    await page.fill('input[name="birthdayDiscount"]', '5')
    await page.fill('input[name="winbackDiscount"]', '3')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard$/)

    await expect(page.getByTestId('restaurant-name')).toHaveText(restaurantName)
    await expect(page.getByTestId('dashboard-sidebar')).toContainText(restaurantName)

    const supabase = createTestSupabase()
    const { data } = await supabase
      .from('restaurants')
      .select('id')
      .eq('name', restaurantName)
      .single()
    createdRestaurantId = data?.id ?? null
    expect(createdRestaurantId).not.toBeNull()
  })
})
