import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRunWelcomeReminders = vi.fn().mockResolvedValue(undefined)
const mockRunBirthdayCampaigns = vi.fn().mockResolvedValue(undefined)
const mockRunWinbackCampaigns = vi.fn().mockResolvedValue(undefined)
const mockRunExpiryReminders = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/campaigns', () => ({
  runWelcomeReminders: mockRunWelcomeReminders,
  runBirthdayCampaigns: mockRunBirthdayCampaigns,
  runWinbackCampaigns: mockRunWinbackCampaigns,
  runExpiryReminders: mockRunExpiryReminders,
}))

vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: (body: any, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}))

let GET: any

async function loadModule() {
  const mod = await import('./route')
  GET = mod.GET
}

function makeRequest(authHeader: string | null): any {
  return {
    headers: {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'authorization') return authHeader
        return null
      }),
    },
  }
}

describe('GET /api/cron/welcome-reminder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'test-secret'
  })

  it('returns 401 when no auth header', async () => {
    await loadModule()

    const res = await GET(makeRequest(null))

    expect(res.status).toBe(401)
  })

  it('returns 401 when auth header is wrong', async () => {
    await loadModule()

    const res = await GET(makeRequest('Bearer wrong-secret'))

    expect(res.status).toBe(401)
  })

  it('returns 401 when CRON_SECRET is not set', async () => {
    delete process.env.CRON_SECRET
    await loadModule()

    const res = await GET(makeRequest('Bearer test-secret'))

    expect(res.status).toBe(401)
  })

  it('runs all campaigns and returns ok', async () => {
    await loadModule()

    const res = await GET(makeRequest('Bearer test-secret'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(mockRunWelcomeReminders).toHaveBeenCalled()
    expect(mockRunBirthdayCampaigns).toHaveBeenCalled()
    expect(mockRunWinbackCampaigns).toHaveBeenCalled()
    expect(mockRunExpiryReminders).toHaveBeenCalled()
  })

  it('returns 500 when a campaign throws', async () => {
    mockRunWelcomeReminders.mockRejectedValueOnce(new Error('campaign failed'))
    await loadModule()

    const res = await GET(makeRequest('Bearer test-secret'))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('campaign failed')
  })

  it('calls campaigns in order: welcome, birthday, winback, expiry', async () => {
    const callOrder: string[] = []
    mockRunWelcomeReminders.mockImplementation(() => { callOrder.push('welcome'); return Promise.resolve() })
    mockRunBirthdayCampaigns.mockImplementation(() => { callOrder.push('birthday'); return Promise.resolve() })
    mockRunWinbackCampaigns.mockImplementation(() => { callOrder.push('winback'); return Promise.resolve() })
    mockRunExpiryReminders.mockImplementation(() => { callOrder.push('expiry'); return Promise.resolve() })
    await loadModule()

    await GET(makeRequest('Bearer test-secret'))

    expect(callOrder).toEqual(['welcome', 'birthday', 'winback', 'expiry'])
  })
})
