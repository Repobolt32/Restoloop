import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockMaybeSingle = vi.fn()
const mockUpdate = vi.fn()

vi.mock('@/lib/supabase/server', () => {
  const mockClient = {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: mockMaybeSingle,
                }),
              }),
            }),
          }),
          update: mockUpdate,
        }
      }
      return {}
    }),
  }
  return {
    createServiceClient: vi.fn().mockReturnValue(mockClient),
    createClient: vi.fn().mockResolvedValue(mockClient),
  }
})

vi.mock('razorpay', () => ({
  default: {
    validateWebhookSignature: vi.fn(),
  },
}))

vi.mock('next/server', () => ({
  NextRequest: class {
    constructor(public url: string, public init?: any) {}
    text() { return Promise.resolve(this.init?.body || '') }
    headers = { get: (key: string) => this.init?.headers?.[key] || null }
  },
  NextResponse: {
    json: (body: any, init?: any) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    }),
  },
}))

let POST: any

async function loadModule() {
  const mod = await import('./route')
  POST = mod.POST
}

function makeRequest(body: string, signature = 'sig_mock') {
  return {
    text: () => Promise.resolve(body),
    headers: { get: (key: string) => key === 'x-razorpay-signature' ? signature : null },
  } as any
}

describe('POST /api/razorpay/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RAZORPAY_WEBHOOK_SECRET = 'mock'
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
  })

  it('returns 400 when signature is invalid in mock mode', async () => {
    await loadModule()

    const res = await POST(makeRequest('{"event":"payment.captured"}', 'bad_sig'))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid signature (mock mode)')
  })

  it('returns ok for non-payment events', async () => {
    await loadModule()

    const res = await POST(makeRequest(JSON.stringify({ event: 'order.paid' }), 'sig_mock'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.status).toBe('ok')
  })

  it('returns 400 when payment notes missing userId or credits', async () => {
    await loadModule()

    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { notes: { userId: '', credits: '' } } } },
    })
    const res = await POST(makeRequest(body, 'sig_mock'))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Missing payment notes metadata')
  })

  it('returns 404 when restaurant not found for owner', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
    await loadModule()

    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { notes: { userId: 'user-1', credits: '10' } } } },
    })
    const res = await POST(makeRequest(body, 'sig_mock'))
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toBe('Restaurant not found')
  })

  it('adds credits to restaurant on valid payment', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { credits: 5 }, error: null })
    await loadModule()

    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { notes: { userId: 'user-1', credits: '10' } } } },
    })
    const res = await POST(makeRequest(body, 'sig_mock'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(mockUpdate).toHaveBeenCalledWith({ credits: 15 })
  })

  it('returns 500 when update fails', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { credits: 5 }, error: null })
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: 'update failed' } }),
    })
    await loadModule()

    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { notes: { userId: 'user-1', credits: '10' } } } },
    })
    const res = await POST(makeRequest(body, 'sig_mock'))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Database update failed')
  })

  it('activates 21-day trial on valid trial payment', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { credits: 0 }, error: null })
    await loadModule()

    const body = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            notes: {
              userId: 'user-1',
              purchaseType: 'trial',
            },
          },
        },
      },
    })
    const res = await POST(makeRequest(body, 'sig_mock'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'trial',
        trial_activated_at: expect.any(String),
        trial_expires_at: expect.any(String),
      })
    )
  })
})

