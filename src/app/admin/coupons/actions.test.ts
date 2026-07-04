import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockServiceFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
  createServiceClient: vi.fn().mockReturnValue({
    from: mockServiceFrom,
  }),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('searchCouponsAction', () => {
  let searchCouponsAction: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./actions')
    searchCouponsAction = mod.searchCouponsAction
  })

  it('throws when user is not admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'owner@test.com' } } })
    await expect(searchCouponsAction('ABC')).rejects.toThrow('Unauthorized')
  })

  it('returns matching coupons', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1', email: 'admin@restoloop.com' } } })
    mockServiceFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        ilike: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [{ id: 'c1', code: 'ABC123' }], error: null }),
        }),
      }),
    })

    const result = await searchCouponsAction('ABC')
    expect(result).toHaveLength(1)
    expect(result[0].code).toBe('ABC123')
  })
})

describe('forceRedeemCouponAction', () => {
  let forceRedeemCouponAction: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./actions')
    forceRedeemCouponAction = mod.forceRedeemCouponAction
  })

  it('redeems coupon and redirects', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1', email: 'admin@restoloop.com' } } })
    mockServiceFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: eqMock }),
    })

    await expect(forceRedeemCouponAction(new FormData())).rejects.toThrow('REDIRECT')
  })
})
