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

let validateCoupon: any

async function loadModule() {
  const mod = await import('./actions')
  validateCoupon = mod.validateCoupon
}

describe('validateCoupon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await loadModule()

    await expect(validateCoupon('ABC123')).rejects.toThrow('REDIRECT:/login')
  })

  it('redirects to /dashboard/create when user has no restaurant', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
    await loadModule()

    await expect(validateCoupon('ABC123')).rejects.toThrow('REDIRECT:/dashboard/create')
  })

  it('returns error when coupon not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'rest-1' }, error: null }),
            }),
          }),
        }
      }
      if (table === 'coupons') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      }
      return { select: vi.fn().mockReturnThis() }
    })
    await loadModule()

    const result = await validateCoupon('ABC123')
    expect(result).toEqual({ error: 'Coupon not found' })
  })

  it('returns error when coupon belongs to different restaurant', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'rest-1' }, error: null }),
            }),
          }),
        }
      }
      if (table === 'coupons') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'c-1', restaurant_id: 'rest-2', status: 'sent', expires_at: futureDate(), customers: {} },
                error: null,
              }),
            }),
          }),
        }
      }
      return { select: vi.fn().mockReturnThis() }
    })
    await loadModule()

    const result = await validateCoupon('ABC123')
    expect(result).toEqual({ error: 'Wrong restaurant' })
  })

  it('returns error when coupon is already redeemed', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'rest-1' }, error: null }),
            }),
          }),
        }
      }
      if (table === 'coupons') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'c-1', restaurant_id: 'rest-1', status: 'redeemed', expires_at: futureDate(), customers: {} },
                error: null,
              }),
            }),
          }),
        }
      }
      return { select: vi.fn().mockReturnThis() }
    })
    await loadModule()

    const result = await validateCoupon('ABC123')
    expect(result).toEqual({ error: 'Already redeemed' })
  })

  it('returns error when coupon is expired', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'rest-1' }, error: null }),
            }),
          }),
        }
      }
      if (table === 'coupons') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'c-1',
                  restaurant_id: 'rest-1',
                  status: 'sent',
                  expires_at: '2020-01-01T00:00:00Z', // expired
                  customers: { id: 'cust-1', phone: '919900000000' },
                },
                error: null,
              }),
            }),
          }),
        }
      }
      return { select: vi.fn().mockReturnThis() }
    })
    await loadModule()

    const result = await validateCoupon('ABC123')
    expect(result).toEqual({ error: 'Expired' })
  })

  it('redeems valid coupon and updates customer last_visit_at', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'rest-1' }, error: null }),
            }),
          }),
        }
      }
      if (table === 'coupons') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'c-1',
                  restaurant_id: 'rest-1',
                  customer_id: 'cust-1',
                  code: 'W50-ABC123',
                  discount_cents: 5000,
                  status: 'sent',
                  expires_at: futureDate(),
                  customers: { id: 'cust-1', phone: '919900000000', name: 'Alice' },
                },
                error: null,
              }),
            }),
          }),
          update: updateMock,
        }
      }
      if (table === 'customers') {
        return { update: updateMock }
      }
      return { select: vi.fn().mockReturnThis() }
    })
    await loadModule()

    const result = await validateCoupon('ABC123')

    expect(result.success).toBe(true)
    expect(result.code).toBe('W50-ABC123')
    expect(result.discount).toBe(5000)
    expect(updateMock).toHaveBeenCalled()
  })

  it('normalizes code: trims whitespace and uppercases', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    let capturedCode = ''
    mockFrom.mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'rest-1' }, error: null }),
            }),
          }),
        }
      }
      if (table === 'coupons') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((col: string, val: string) => {
              capturedCode = val
              return {
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }
            }),
          }),
        }
      }
      return { select: vi.fn().mockReturnThis() }
    })
    await loadModule()

    await validateCoupon('  abc123  ')

    expect(capturedCode).toBe('ABC123')
  })
})

function futureDate(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}
