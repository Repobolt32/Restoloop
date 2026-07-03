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

let updateDiscountsAction: any
let updateCampaignSettings: any

async function loadModule() {
  const mod = await import('./actions')
  updateDiscountsAction = mod.updateDiscountsAction
  updateCampaignSettings = mod.updateCampaignSettings
}

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.set(k, v)
  return fd
}

describe('updateDiscountsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await loadModule()

    await expect(updateDiscountsAction(makeFormData({}))).rejects.toThrow('REDIRECT:/login')
  })

  it('throws when discount values are negative', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    await loadModule()

    await expect(updateDiscountsAction(makeFormData({
      welcome_discount: '-5',
      birthday_discount: '10',
      winback_discount: '10',
    }))).rejects.toThrow('Invalid discount amounts')
  })

  it('throws when discount values are NaN', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    await loadModule()

    await expect(updateDiscountsAction(makeFormData({
      welcome_discount: 'abc',
      birthday_discount: '10',
      winback_discount: '10',
    }))).rejects.toThrow('Invalid discount amounts')
  })

  it('updates restaurant discounts in cents', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockReturnValue({ update: updateMock })
    await loadModule()

    await updateDiscountsAction(makeFormData({
      welcome_discount: '50',
      birthday_discount: '100',
      winback_discount: '75',
    }))

    expect(updateMock).toHaveBeenCalledWith({
      welcome_discount_cents: 5000,
      birthday_discount_cents: 10000,
      winback_discount_cents: 7500,
    })
  })

  it('throws when update returns error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'db error' } }),
      }),
    })
    await loadModule()

    await expect(updateDiscountsAction(makeFormData({
      welcome_discount: '50',
      birthday_discount: '100',
      winback_discount: '75',
    }))).rejects.toThrow('db error')
  })
})

describe('updateCampaignSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await loadModule()

    await expect(updateCampaignSettings(makeFormData({}))).rejects.toThrow('REDIRECT:/login')
  })

  it('throws on invalid schema: welcome_reminder_days > 90', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    await loadModule()

    await expect(updateCampaignSettings(makeFormData({
      welcome_reminder_days: '91',
      winback_days: '40',
      expiry_reminder_days: '1',
      whatsapp_prefill_message: 'Hi',
    }))).rejects.toThrow()
  })

  it('throws on invalid schema: winback_days > 180', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    await loadModule()

    await expect(updateCampaignSettings(makeFormData({
      welcome_reminder_days: '25',
      winback_days: '181',
      expiry_reminder_days: '1',
      whatsapp_prefill_message: 'Hi',
    }))).rejects.toThrow()
  })

  it('updates campaign settings with valid data', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockReturnValue({ update: updateMock })
    await loadModule()

    await updateCampaignSettings(makeFormData({
      welcome_reminder_enabled: 'on',
      birthday_campaign_enabled: 'on',
      winback_campaign_enabled: '',
      expiry_reminder_enabled: 'on',
      welcome_reminder_days: '25',
      winback_days: '40',
      expiry_reminder_days: '2',
      whatsapp_prefill_message: 'Hello!',
    }))

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      welcome_reminder_enabled: true,
      birthday_campaign_enabled: true,
      winback_campaign_enabled: false,
      expiry_reminder_enabled: true,
      welcome_reminder_days: 25,
      winback_days: 40,
      expiry_reminder_days: 2,
      whatsapp_prefill_message: 'Hello!',
    }))
  })
})
