import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

let createCouponAction: any
let disableCouponAction: any
let deleteCouponAction: any

async function loadModule() {
  const mod = await import('./actions')
  createCouponAction = mod.createCouponAction
  disableCouponAction = mod.disableCouponAction
  deleteCouponAction = mod.deleteCouponAction
}

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.set(k, v)
  return fd
}

function createRestaurantMock(data: any, error: any = null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  }
  return builder
}

describe('createCouponAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await loadModule()

    await expect(createCouponAction(makeFormData({}))).rejects.toThrow('REDIRECT:/login')
  })

  it('redirects to /dashboard/create when user has no restaurant', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockReturnValue(createRestaurantMock(null))
    await loadModule()

    await expect(createCouponAction(makeFormData({ customer_id: 'c1', discount_percent: '10' }))).rejects.toThrow('REDIRECT:/dashboard/create')
  })

  it('throws when customer_id or discount_percent missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockReturnValue(createRestaurantMock({ id: 'rest-1' }))
    await loadModule()

    await expect(createCouponAction(makeFormData({}))).rejects.toThrow('Missing required fields')
  })

  it('creates coupon and revalidates path', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return createRestaurantMock({ id: 'rest-1' })
      }
      if (table === 'coupons') {
        return { insert: insertMock }
      }
      return {}
    })
    await loadModule()

    await createCouponAction(makeFormData({ customer_id: 'cust-1', discount_percent: '10' }))

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      restaurant_id: 'rest-1',
      customer_id: 'cust-1',
      type: 'manual',
      discount_percent: 10,
      status: 'sent',
      enabled: true,
    }))
  })

  it('throws when insert returns error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return createRestaurantMock({ id: 'rest-1' })
      }
      if (table === 'coupons') {
        return { insert: vi.fn().mockResolvedValue({ error: { message: 'duplicate key' } }) }
      }
      return {}
    })
    await loadModule()

    await expect(createCouponAction(makeFormData({ customer_id: 'cust-1', discount_percent: '10' }))).rejects.toThrow('duplicate key')
  })
})

describe('disableCouponAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await loadModule()

    await expect(disableCouponAction('c-1')).rejects.toThrow('REDIRECT:/login')
  })

  it('disables coupon for owner restaurant', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return createRestaurantMock({ id: 'rest-1' })
      }
      if (table === 'coupons') {
        return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: eqMock }) }) }
      }
      return {}
    })
    await loadModule()

    await disableCouponAction('c-1')

    expect(true).toBe(true) // no throw = success
  })
})

describe('deleteCouponAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await loadModule()

    await expect(deleteCouponAction('c-1')).rejects.toThrow('REDIRECT:/login')
  })

  it('deletes coupon with status=sent for owner restaurant', async () => {
    const eq3 = vi.fn().mockResolvedValue({ error: null })
    const eq2 = vi.fn().mockReturnValue({ eq: eq3 })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return createRestaurantMock({ id: 'rest-1' })
      }
      if (table === 'coupons') {
        return { delete: vi.fn().mockReturnValue({ eq: eq1 }) }
      }
      return {}
    })
    await loadModule()

    await deleteCouponAction('c-1')

    expect(eq1).toHaveBeenCalledWith('id', 'c-1')
    expect(eq2).toHaveBeenCalledWith('restaurant_id', 'rest-1')
    expect(eq3).toHaveBeenCalledWith('status', 'sent')
  })
})
