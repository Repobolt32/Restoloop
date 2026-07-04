import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockMaybeSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: vi.fn().mockImplementation((table: string) => {
      const builder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
      }
      return builder
    }),
  }),
}))

vi.mock('@/lib/razorpay', () => ({
  razorpay: null,
}))

let POST: any

async function loadModule() {
  const mod = await import('./route')
  POST = mod.POST
}

function makeRequest(body: any): any {
  return {
    json: vi.fn().mockResolvedValue(body),
  }
}

describe('POST /api/razorpay/create-order', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await loadModule()

    const res = await POST(makeRequest({ amount: 100, credits: 10 }))
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 400 when amount or credits missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    await loadModule()

    const res = await POST(makeRequest({ amount: 0, credits: 10 }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid order parameters')
  })

  it('returns 400 when credits is negative', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    await loadModule()

    const res = await POST(makeRequest({ amount: 100, credits: -5 }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid order parameters')
  })

  it('returns 404 when restaurant not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    await loadModule()

    const res = await POST(makeRequest({ amount: 100, credits: 10 }))
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toBe('Restaurant not found')
  })

  it('returns mock order id when razorpay is null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockMaybeSingle.mockResolvedValue({ data: { id: 'rest-1' }, error: null })
    await loadModule()

    const res = await POST(makeRequest({ amount: 100, credits: 10 }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.orderId).toMatch(/^order_mock_/)
  })

  it('returns 400 when trial is already activated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockMaybeSingle.mockResolvedValue({ data: { id: 'rest-1', trial_activated_at: '2026-07-01T00:00:00Z' }, error: null })
    await loadModule()

    const res = await POST(makeRequest({ purchaseType: 'trial' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Trial already activated')
  })

  it('creates mock order for trial when not yet activated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockMaybeSingle.mockResolvedValue({ data: { id: 'rest-1', trial_activated_at: null }, error: null })
    await loadModule()

    const res = await POST(makeRequest({ purchaseType: 'trial' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.orderId).toMatch(/^order_mock_/)
  })
})

