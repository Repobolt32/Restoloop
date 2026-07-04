import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockServiceFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
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

let addCreditsAction: any

async function loadModule() {
  const mod = await import('./actions')
  addCreditsAction = mod.addCreditsAction
}

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.set(k, v)
  return fd
}

describe('addCreditsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when restaurantId or amount is missing', async () => {
    await loadModule()

    await expect(addCreditsAction(makeFormData({}))).rejects.toThrow('Invalid action parameters')
  })

  it('throws when amount is not a number', async () => {
    await loadModule()

    await expect(addCreditsAction(makeFormData({ restaurantId: 'rest-1', amount: 'abc' }))).rejects.toThrow('Invalid action parameters')
  })

  it('throws when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await loadModule()

    await expect(addCreditsAction(makeFormData({ restaurantId: 'rest-1', amount: '10' }))).rejects.toThrow('Unauthorized')
  })

  it('throws when user is not admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'user@example.com' } } })
    await loadModule()

    await expect(addCreditsAction(makeFormData({ restaurantId: 'rest-1', amount: '10' }))).rejects.toThrow('Unauthorized')
  })

  it('throws when restaurant not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1', email: 'admin@restoloop.com' } } })
    mockServiceFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
        }),
      }),
    })
    await loadModule()

    await expect(addCreditsAction(makeFormData({ restaurantId: 'rest-1', amount: '10' }))).rejects.toThrow('Restaurant not found')
  })

  it('adds credits and redirects with success', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1', email: 'admin@restoloop.com' } } })
    mockServiceFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { credits: 5 }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({ eq: eqMock }),
    })
    await loadModule()

    await expect(addCreditsAction(makeFormData({ restaurantId: 'rest-1', amount: '10' }))).rejects.toThrow('REDIRECT:/admin/rest-1?success=true&added=10')
  })

  it('throws when update fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1', email: 'admin@restoloop.com' } } })
    mockServiceFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { credits: 5 }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'update failed' } }),
      }),
    })
    await loadModule()

    await expect(addCreditsAction(makeFormData({ restaurantId: 'rest-1', amount: '10' }))).rejects.toThrow('Database update failed')
  })
})

describe('updatePlanAction', () => {
  let updatePlanAction: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./actions')
    updatePlanAction = mod.updatePlanAction
  })

  it('throws when parameters are invalid', async () => {
    await expect(updatePlanAction(makeFormData({}))).rejects.toThrow('Invalid action parameters')
  })

  it('throws when user is not admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'user@example.com' } } })
    await expect(updatePlanAction(makeFormData({ restaurantId: 'rest-1', plan: 'trial' }))).rejects.toThrow('Unauthorized')
  })

  it('updates plan and trial dates and redirects', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1', email: 'admin@restoloop.com' } } })
    mockServiceFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { plan: 'free', trial_activated_at: null }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({ eq: eqMock }),
    })

    await expect(updatePlanAction(makeFormData({ restaurantId: 'rest-1', plan: 'trial', trialExpiresAt: '2026-07-25T12:00' })))
      .rejects.toThrow('REDIRECT:/admin/rest-1?success=true')

    expect(mockServiceFrom().update).toHaveBeenCalledWith(expect.objectContaining({
      plan: 'trial',
      trial_expires_at: expect.any(String),
      trial_activated_at: expect.any(String),
    }))
  })
})

