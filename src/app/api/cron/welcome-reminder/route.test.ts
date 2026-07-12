import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRunWelcomeReminders = vi.fn().mockResolvedValue(undefined)
const mockRunBirthdayCampaigns = vi.fn().mockResolvedValue(undefined)
const mockRunWinbackCampaigns = vi.fn().mockResolvedValue(undefined)
const mockRunExpiryReminders = vi.fn().mockResolvedValue(undefined)

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockFrom = vi.fn(() => ({ select: mockSelect }))
const mockCreateServiceClient = vi.fn(() => ({ from: mockFrom }))

vi.mock('@/lib/campaigns', () => ({
  runWelcomeReminders: mockRunWelcomeReminders,
  runBirthdayCampaigns: mockRunBirthdayCampaigns,
  runWinbackCampaigns: mockRunWinbackCampaigns,
  runExpiryReminders: mockRunExpiryReminders,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => mockCreateServiceClient(),
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

function makeRequest(authHeader: string | null, url?: string): any {
  const requestUrl = url || 'https://example.com/api/cron/welcome-reminder'
  return {
    url: requestUrl,
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
    process.env.NEXT_PUBLIC_SITE_URL = 'https://test.example.com'

    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: [{ id: 'r1' }, { id: 'r2' }], error: null })
  })

  // --- Auth tests ---

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

  // --- Worker mode (with restaurant_id) ---

  it('worker mode: runs all campaigns for a single restaurant', async () => {
    await loadModule()
    const url = 'https://example.com/api/cron/welcome-reminder?restaurant_id=abc123'
    const res = await GET(makeRequest('Bearer test-secret', url))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.restaurant_id).toBe('abc123')
    expect(mockRunWelcomeReminders).toHaveBeenCalledWith('abc123')
    expect(mockRunBirthdayCampaigns).toHaveBeenCalledWith('abc123')
    expect(mockRunWinbackCampaigns).toHaveBeenCalledWith('abc123')
    expect(mockRunExpiryReminders).toHaveBeenCalledWith('abc123')
  })

  it('worker mode: returns 500 when a campaign throws', async () => {
    mockRunWelcomeReminders.mockRejectedValueOnce(new Error('campaign failed'))
    await loadModule()

    const url = 'https://example.com/api/cron/welcome-reminder?restaurant_id=abc123'
    const res = await GET(makeRequest('Bearer test-secret', url))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('campaign failed')
  })

  // --- Dispatcher mode (no restaurant_id) ---

  it('dispatcher mode: fans out to per-restaurant workers', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'))
    await loadModule()

    const res = await GET(makeRequest('Bearer test-secret'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.dispatched).toBe(2)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('restaurant_id=r1'),
      expect.objectContaining({ headers: { Authorization: 'Bearer test-secret' } })
    )
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('restaurant_id=r2'),
      expect.objectContaining({ headers: { Authorization: 'Bearer test-secret' } })
    )

    fetchSpy.mockRestore()
  })

  it('dispatcher mode: returns dispatched 0 when no active restaurants', async () => {
    mockEq.mockResolvedValue({ data: [], error: null })
    await loadModule()

    const res = await GET(makeRequest('Bearer test-secret'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.dispatched).toBe(0)
  })

  it('dispatcher mode: returns 500 when restaurant fetch fails', async () => {
    mockEq.mockResolvedValue({ data: null, error: { message: 'db error' } })
    await loadModule()

    const res = await GET(makeRequest('Bearer test-secret'))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to fetch restaurants')
  })
})
