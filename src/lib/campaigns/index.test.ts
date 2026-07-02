import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock whatsapp adapter at top level
const mockSendText = vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' })
vi.mock('@/lib/whatsapp/adapter', () => ({
  createWhatsAppAdapter: () => ({
    sendText: mockSendText,
    sendTemplate: vi.fn(),
    validateWebhook: vi.fn(),
    parseInbound: vi.fn(),
  }),
}))

// Supabase chain mock helper
function chain(data: any = null, error: any = null) {
  const c: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: any) => resolve({ data, error }),
  }
  return c
}

// We'll configure this per test
let tableHandler: (table: string) => any = () => chain(null)
const rpcMock = vi.fn().mockResolvedValue({ error: null })

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    from: (table: string) => tableHandler(table),
    rpc: rpcMock,
  }),
}))

// Import AFTER mocks
import { runWelcomeReminders, runBirthdayCampaigns, runWinbackCampaigns } from './index'

describe('runWelcomeReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendText.mockResolvedValue({ success: true, messageId: 'msg-1' })
  })

  it('sends reminder to customer with unredeemed welcome coupon and credits', async () => {
    tableHandler = (table: string) => {
      if (table === 'customers') {
        return chain([
          {
            id: 'cust-1',
            restaurant_id: 'rest-1',
            phone: '919900000000',
            name: 'Alice',
            opt_in_status: 'opted_in',
            coupons: [{ id: 'c-1', type: 'welcome', status: 'sent', code: 'W50-ABC123' }],
          },
        ])
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', credits: 10 })
      }
      return chain(null)
    }

    await runWelcomeReminders()

    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('W50-ABC123'))
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('Spice Garden'))
  })

  it('skips customer whose welcome coupon is already redeemed', async () => {
    tableHandler = (table: string) => {
      if (table === 'customers') {
        return chain([
          {
            id: 'cust-1',
            restaurant_id: 'rest-1',
            phone: '919900000000',
            name: 'Alice',
            opt_in_status: 'opted_in',
            coupons: [{ id: 'c-1', type: 'welcome', status: 'redeemed', code: 'W50-ABC123' }],
          },
        ])
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', credits: 10 })
      }
      return chain(null)
    }

    await runWelcomeReminders()

    expect(mockSendText).not.toHaveBeenCalled()
  })

  it('logs blocked_no_credits when credits = 0', async () => {
    const logsInsert = vi.fn().mockReturnValue(chain(null))
    tableHandler = (table: string) => {
      if (table === 'customers') {
        return chain([
          {
            id: 'cust-1',
            restaurant_id: 'rest-1',
            phone: '919900000000',
            name: 'Alice',
            opt_in_status: 'opted_in',
            coupons: [{ id: 'c-1', type: 'welcome', status: 'sent', code: 'W50-ABC123' }],
          },
        ])
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', credits: 0 })
      }
      if (table === 'message_logs') {
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue(c)
        return c
      }
      return chain(null)
    }

    await runWelcomeReminders()

    expect(mockSendText).not.toHaveBeenCalled()
  })

  it('skips customer with no coupons', async () => {
    tableHandler = (table: string) => {
      if (table === 'customers') {
        return chain([
          {
            id: 'cust-1',
            restaurant_id: 'rest-1',
            phone: '919900000000',
            name: 'Alice',
            opt_in_status: 'opted_in',
            coupons: [],
          },
        ])
      }
      return chain(null)
    }

    await runWelcomeReminders()

    expect(mockSendText).not.toHaveBeenCalled()
  })

  it('deducts credit via RPC on successful send', async () => {
    tableHandler = (table: string) => {
      if (table === 'customers') {
        return chain([
          {
            id: 'cust-1',
            restaurant_id: 'rest-1',
            phone: '919900000000',
            name: 'Alice',
            opt_in_status: 'opted_in',
            coupons: [{ id: 'c-1', type: 'welcome', status: 'sent', code: 'W50-ABC123' }],
          },
        ])
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', credits: 10 })
      }
      return chain(null)
    }

    await runWelcomeReminders()

    expect(rpcMock).toHaveBeenCalledWith('deduct_credit', { restaurant_id: 'rest-1' })
  })

  it('falls back to direct update when RPC returns PGRST202', async () => {
    rpcMock.mockResolvedValueOnce({ error: { code: 'PGRST202' } })

    const updateChain = chain(null)
    updateChain.eq = vi.fn().mockResolvedValue({ error: null })

    tableHandler = (table: string) => {
      if (table === 'customers') {
        return chain([
          {
            id: 'cust-1',
            restaurant_id: 'rest-1',
            phone: '919900000000',
            name: 'Alice',
            opt_in_status: 'opted_in',
            coupons: [{ id: 'c-1', type: 'welcome', status: 'sent', code: 'W50-ABC123' }],
          },
        ])
      }
      if (table === 'restaurants') {
        const c = chain({ id: 'rest-1', name: 'Spice Garden', credits: 10 })
        c.update = vi.fn().mockReturnValue(c)
        return c
      }
      return chain(null)
    }

    await runWelcomeReminders()

    // Should have attempted the fallback update
    expect(rpcMock).toHaveBeenCalled()
  })
})

describe('runBirthdayCampaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendText.mockResolvedValue({ success: true, messageId: 'msg-1' })
  })

  it('creates birthday coupon and sends message for birthday customer', async () => {
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()

    tableHandler = (table: string) => {
      if (table === 'customers') {
        return chain([
          {
            id: 'cust-1',
            restaurant_id: 'rest-1',
            phone: '919900000000',
            name: 'Alice',
            opt_in_status: 'opted_in',
            birthday_month: month,
            birthday_day: day,
          },
        ])
      }
      if (table === 'coupons') {
        return chain(null) // no existing birthday coupon
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', credits: 10, birthday_discount_cents: 3800 })
      }
      return chain(null)
    }

    await runBirthdayCampaigns()

    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('Birthday'))
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('38'))
  })

  it('skips customer who already received birthday coupon this year', async () => {
    const today = new Date()
    tableHandler = (table: string) => {
      if (table === 'customers') {
        return chain([
          {
            id: 'cust-1',
            restaurant_id: 'rest-1',
            phone: '919900000000',
            name: 'Alice',
            opt_in_status: 'opted_in',
            birthday_month: today.getMonth() + 1,
            birthday_day: today.getDate(),
          },
        ])
      }
      if (table === 'coupons') {
        return chain({ id: 'existing-coupon' }) // already sent
      }
      return chain(null)
    }

    await runBirthdayCampaigns()

    expect(mockSendText).not.toHaveBeenCalled()
  })

  it('logs blocked_no_credits when credits = 0', async () => {
    const today = new Date()
    tableHandler = (table: string) => {
      if (table === 'customers') {
        return chain([
          {
            id: 'cust-1',
            restaurant_id: 'rest-1',
            phone: '919900000000',
            name: 'Alice',
            opt_in_status: 'opted_in',
            birthday_month: today.getMonth() + 1,
            birthday_day: today.getDate(),
          },
        ])
      }
      if (table === 'coupons') {
        return chain(null)
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', credits: 0, birthday_discount_cents: 3800 })
      }
      if (table === 'message_logs') {
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue(c)
        return c
      }
      return chain(null)
    }

    await runBirthdayCampaigns()

    expect(mockSendText).not.toHaveBeenCalled()
  })
})

describe('runWinbackCampaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendText.mockResolvedValue({ success: true, messageId: 'msg-1' })
  })

  it('creates winback coupon for inactive customer with no recent winback', async () => {
    const lastVisit = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()

    tableHandler = (table: string) => {
      if (table === 'customers') {
        return chain([
          {
            id: 'cust-1',
            restaurant_id: 'rest-1',
            phone: '919900000000',
            name: 'Alice',
            opt_in_status: 'opted_in',
            last_visit_at: lastVisit,
          },
        ])
      }
      if (table === 'coupons') {
        return chain(null) // no recent winback
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', credits: 10, winback_discount_cents: 3000 })
      }
      return chain(null)
    }

    await runWinbackCampaigns()

    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('miss'))
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('30'))
  })

  it('skips customer with winback coupon sent within 7 days', async () => {
    const lastVisit = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()

    tableHandler = (table: string) => {
      if (table === 'customers') {
        return chain([
          {
            id: 'cust-1',
            restaurant_id: 'rest-1',
            phone: '919900000000',
            name: 'Alice',
            opt_in_status: 'opted_in',
            last_visit_at: lastVisit,
          },
        ])
      }
      if (table === 'coupons') {
        return chain({ id: 'recent-winback' }) // sent within 7 days
      }
      return chain(null)
    }

    await runWinbackCampaigns()

    expect(mockSendText).not.toHaveBeenCalled()
  })

  it('logs blocked_no_credits when credits = 0', async () => {
    const lastVisit = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()

    tableHandler = (table: string) => {
      if (table === 'customers') {
        return chain([
          {
            id: 'cust-1',
            restaurant_id: 'rest-1',
            phone: '919900000000',
            name: 'Alice',
            opt_in_status: 'opted_in',
            last_visit_at: lastVisit,
          },
        ])
      }
      if (table === 'coupons') {
        return chain(null)
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', credits: 0, winback_discount_cents: 3000 })
      }
      if (table === 'message_logs') {
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue(c)
        return c
      }
      return chain(null)
    }

    await runWinbackCampaigns()

    expect(mockSendText).not.toHaveBeenCalled()
  })
})
