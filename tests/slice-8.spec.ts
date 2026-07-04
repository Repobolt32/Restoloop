import { test, expect } from '@playwright/test'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Slice 8: Admin Sees All', () => {
  let adminUserId: string
  let normalUserId: string
  let restaurantId: string
  let restaurantSlug: string

  test.beforeAll(async () => {
    // 1. Delete admin user if already exists to start clean
    const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const existingAdmin = users.users.find(u => u.email === 'admin@restoloop.com')
    if (existingAdmin) {
      await supabase.auth.admin.deleteUser(existingAdmin.id)
    }

    // 2. Create admin user
    const { data: adminResp, error: adminErr } = await supabase.auth.admin.createUser({
      email: 'admin@restoloop.com',
      password: 'adminpassword123',
      email_confirm: true
    })
    if (adminErr) {
      if (adminErr.message.includes('already been registered')) {
        const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 })
        const existingAdmin = users.users.find(u => u.email === 'admin@restoloop.com')
        if (existingAdmin) {
          adminUserId = existingAdmin.id
        }
      } else {
        throw new Error(`Failed to create admin user: ${adminErr.message}`)
      }
    } else if (adminResp.user) {
      adminUserId = adminResp.user.id
    }

    // 3. Create a normal user
    const normalEmail = `owner-slice8-${Date.now()}@restoloop.dev`
    const { data: normalResp, error: normalErr } = await supabase.auth.admin.createUser({
      email: normalEmail,
      password: 'testpass123',
      email_confirm: true
    })
    if (normalErr || !normalResp.user) {
      throw new Error(`Failed to create normal user: ${normalErr?.message}`)
    }
    normalUserId = normalResp.user.id

    // 4. Create restaurant for normal user
    restaurantSlug = `slice8-rest-${Date.now()}`
    const { data: rest, error: restErr } = await supabase
      .from('restaurants')
      .insert({
        owner_id: normalUserId,
        name: 'Slice 8 Gourmet Diner',
        slug: restaurantSlug,
        whatsapp_number: '919876543210',
        credits: 100
      })
      .select()
      .single()
    if (restErr || !rest) {
      throw new Error(`Failed to create restaurant: ${restErr?.message}`)
    }
    restaurantId = rest.id
  })

  test.afterAll(async () => {
    if (restaurantId) {
      await supabase.from('restaurants').delete().eq('id', restaurantId)
    }
    if (adminUserId) {
      await supabase.auth.admin.deleteUser(adminUserId)
    }
    if (normalUserId) {
      await supabase.auth.admin.deleteUser(normalUserId)
    }
  })

  test('Access is denied to unauthenticated users', async ({ page }) => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL(/.*login/)
  })

  test('Access is denied to non-admin users', async ({ page }) => {
    // Login as normal user
    const { data: user } = await supabase.auth.admin.getUserById(normalUserId)
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill(user.user!.email!)
    await page.getByLabel('Password').fill('testpass123')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('Super admin can view details and add credits', async ({ page }) => {
    // 1. Log in as Super Admin
    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Email').fill('admin@restoloop.com')
    await page.getByLabel('Password').fill('adminpassword123')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/.*admin/)

    // 2. Navigate to admin panel
    await page.goto('http://localhost:3000/admin')
    await expect(page.getByTestId(`restaurant-row-${restaurantSlug}`)).toBeVisible()

    // 3. Click manage restaurant button
    await page.getByTestId(`manage-btn-${restaurantSlug}`).click()
    await expect(page).toHaveURL(new RegExp(`/admin/${restaurantId}`))

    // 4. Verify detail elements
    await expect(page.getByTestId('admin-restaurant-name')).toContainText('Slice 8 Gourmet Diner')
    await expect(page.getByTestId('admin-credits-display')).toContainText('100')

    // 5. Trigger add 100 credits action
    await page.getByTestId('add-100-btn').click()

    // 6. Verify credits update to 200 in UI and success banner appears
    await expect(page.getByTestId('admin-credits-display')).toContainText('200')
    await expect(page.getByTestId('success-alert')).toBeVisible()

    // 7. Verify in database directly
    const { data: dbRest } = await supabase
      .from('restaurants')
      .select('credits')
      .eq('id', restaurantId)
      .single()
    expect(dbRest!.credits).toBe(200)
  })
})
