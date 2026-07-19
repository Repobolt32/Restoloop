import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock whatsapp adapter at top level
const mockSendText = vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' })
const mockSendTemplate = vi.fn().mockResolvedValue({ success: true, messageId: 'tpl-1' })
vi.mock('@/lib/whatsapp/adapter', () => ({
  createWhatsAppAdapter: () => ({
    sendText: mockSendText,
    sendTemplate: mockSendTemplate,
    validateWebhook: vi.fn(),
    parseInbound: vi.fn(),
  }),
}))

// Supabase chain mock helper
function chain(data: any = null, error: any = null) {
  const c: any = {
    _isDefaultChain: data === null && error === null,
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
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
const defaultChain = chain(null)
defaultChain._isDefaultChain = true
let tableHandler: (table: string) => any = () => defaultChain
const rpcMock = vi.fn().mockResolvedValue({ error: null })

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      const res = tableHandler(table)
      if (table === 'message_logs' && res && res._isDefaultChain) {
        let direction = ''
        const c: any = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          eq: vi.fn((key, value) => {
            if (key === 'direction') direction = value
            return c
          }),
          maybeSingle: vi.fn(async () => {
            if (direction === 'inbound') {
              return { data: { id: 'default-inbound-log' }, error: null }
            }
            return { data: null, error: null }
          }),
          single: vi.fn(async () => {
            if (direction === 'inbound') {
              return { data: { id: 'default-inbound-log' }, error: null }
            }
            return { data: null, error: null }
          }),
          then: (resolve: any) => resolve({ data: null, error: null }),
        }
        return c
      }
      return res
    },
    rpc: rpcMock,
  }),
}))

// Import AFTER mocks
import { runWelcomeReminders, runBirthdayCampaigns, runWinbackCampaigns, runExpiryReminders } from './index'

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
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, welcome_reminder_days: 25 }])
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
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, welcome_reminder_days: 25 }])
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
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 0, welcome_reminder_days: 25 }])
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
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, welcome_reminder_days: 25 }])
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
        const c = chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, welcome_reminder_days: 25 }])
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
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, birthday_discount_percent: 15 }])
      }
      return chain(null)
    }

    await runBirthdayCampaigns()

    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringMatching(/birthday/i))
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('15'))
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
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 0, birthday_discount_percent: 15 }])
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
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, winback_discount_percent: 20, winback_days: 40 }])
      }
      return chain(null)
    }

    await runWinbackCampaigns()

    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringMatching(/miss|while/i))
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('20'))
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
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 0, winback_discount_percent: 20, winback_days: 40 }])
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

describe('runExpiryReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendText.mockResolvedValue({ success: true, messageId: 'msg-1' })
  })

  it('sends expiry reminder for coupon expiring tomorrow', async () => {
    const tomorrow = new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString()

    tableHandler = (table: string) => {
      if (table === 'restaurants') {
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, expiry_reminder_days: 1 }])
      }
      if (table === 'coupons') {
        return chain([{
          id: 'coupon-1',
          code: 'EXP-ABC',
          restaurant_id: 'rest-1',
          status: 'sent',
          enabled: true,
          expires_at: tomorrow,
          customers: { id: 'cust-1', phone: '919900000000', name: 'Alice', opt_in_status: 'opted_in' },
        }])
      }
      return chain(null)
    }

    await runExpiryReminders()

    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('EXP-ABC'))
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringMatching(/expir/i))
  })

  it('skips coupon for customer who is not opted_in', async () => {
    const tomorrow = new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString()

    tableHandler = (table: string) => {
      if (table === 'restaurants') {
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, expiry_reminder_days: 1 }])
      }
      if (table === 'coupons') {
        return chain([{
          id: 'coupon-1',
          code: 'EXP-ABC',
          restaurant_id: 'rest-1',
          status: 'sent',
          enabled: true,
          expires_at: tomorrow,
          customers: { id: 'cust-1', phone: '919900000000', name: 'Alice', opt_in_status: 'pending' },
        }])
      }
      return chain(null)
    }

    await runExpiryReminders()

    expect(mockSendText).not.toHaveBeenCalled()
  })

  it('logs blocked_no_credits when credits = 0', async () => {
    const tomorrow = new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString()

    tableHandler = (table: string) => {
      if (table === 'restaurants') {
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 0, expiry_reminder_days: 1 }])
      }
      if (table === 'coupons') {
        return chain([{
          id: 'coupon-1',
          code: 'EXP-ABC',
          restaurant_id: 'rest-1',
          status: 'sent',
          enabled: true,
          expires_at: tomorrow,
          customers: { id: 'cust-1', phone: '919900000000', name: 'Alice', opt_in_status: 'opted_in' },
        }])
      }
      if (table === 'message_logs') {
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue(c)
        return c
      }
      return chain(null)
    }

    await runExpiryReminders()

    expect(mockSendText).not.toHaveBeenCalled()
  })

  it('deducts credit via RPC on successful send', async () => {
    const tomorrow = new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString()

    tableHandler = (table: string) => {
      if (table === 'restaurants') {
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, expiry_reminder_days: 1 }])
      }
      if (table === 'coupons') {
        return chain([{
          id: 'coupon-1',
          code: 'EXP-ABC',
          restaurant_id: 'rest-1',
          status: 'sent',
          enabled: true,
          expires_at: tomorrow,
          customers: { id: 'cust-1', phone: '919900000000', name: 'Alice', opt_in_status: 'opted_in' },
        }])
      }
      return chain(null)
    }

    await runExpiryReminders()

    expect(rpcMock).toHaveBeenCalledWith('deduct_credit', { restaurant_id: 'rest-1' })
  })
})

describe('campaign prior-interaction check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendText.mockResolvedValue({ success: true, messageId: 'msg-1' })
  })

  it('skips customer with no inbound message log', async () => {
    // Explicit override for message_logs returning chain(null) with _isDefaultChain = false
    const messageLogsMock = chain(null)
    messageLogsMock._isDefaultChain = false

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
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, welcome_reminder_days: 25 }])
      }
      if (table === 'message_logs') {
        return messageLogsMock
      }
      return chain(null)
    }

    await runWelcomeReminders()

    expect(mockSendText).not.toHaveBeenCalled()
  })

  it('skips customer who already received campaign today', async () => {
    const messageLogsMock = chain(null)
    messageLogsMock._isDefaultChain = false
    messageLogsMock.maybeSingle = vi.fn()
      .mockResolvedValueOnce({ data: { id: 'inbound-log-1' } }) // inbound check: found
      .mockResolvedValueOnce({ data: { id: 'sent-today-log' } }) // today check: found

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
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, welcome_reminder_days: 25 }])
      }
      if (table === 'message_logs') {
        return messageLogsMock
      }
      return chain(null)
    }

    await runWelcomeReminders()

    expect(mockSendText).not.toHaveBeenCalled()
  })

  it('sends to customer with inbound log and no send today', async () => {
    const messageLogsMock = chain(null)
    messageLogsMock._isDefaultChain = false
    messageLogsMock.maybeSingle = vi.fn()
      .mockResolvedValueOnce({ data: { id: 'inbound-log-1' } }) // inbound check: found
      .mockResolvedValueOnce({ data: null }) // today check: none found

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
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, welcome_reminder_days: 25 }])
      }
      if (table === 'message_logs') {
        return messageLogsMock
      }
      return chain(null)
    }

    await runWelcomeReminders()

    expect(mockSendText).toHaveBeenCalled()
  })
})

describe('Campaigns in Meta Mode (Template Sends)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.WHATSAPP_PROVIDER = 'meta'
  })

  afterEach(() => {
    delete process.env.WHATSAPP_PROVIDER
  })

  it('runWelcomeReminders sends template welcome_reminder', async () => {
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
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, welcome_reminder_days: 25 }])
      }
      return chain(null)
    }

    await runWelcomeReminders()

    expect(mockSendTemplate).toHaveBeenCalledWith(
      '919900000000',
      'welcome_reminder',
      ['Alice', 'W50-ABC123', 'Spice Garden']
    )
    expect(mockSendText).not.toHaveBeenCalled()
  })

  it('runBirthdayCampaigns sends template birthday_campaign', async () => {
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
            name: 'Bob',
            opt_in_status: 'opted_in',
            birthday_month: month,
            birthday_day: day,
          },
        ])
      }
      if (table === 'coupons') {
        return chain(null)
      }
      if (table === 'restaurants') {
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, birthday_discount_percent: 15 }])
      }
      return chain(null)
    }

    await runBirthdayCampaigns()

    expect(mockSendTemplate).toHaveBeenCalledWith(
      '919900000000',
      'birthday_campaign',
      ['Bob', '15', 'Spice Garden', expect.any(String)]
    )
    expect(mockSendText).not.toHaveBeenCalled()
  })

  it('runWinbackCampaigns sends template winback_campaign', async () => {
    const lastVisit = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()

    tableHandler = (table: string) => {
      if (table === 'customers') {
        return chain([
          {
            id: 'cust-1',
            restaurant_id: 'rest-1',
            phone: '919900000000',
            name: 'Charlie',
            opt_in_status: 'opted_in',
            last_visit_at: lastVisit,
          },
        ])
      }
      if (table === 'coupons') {
        return chain(null)
      }
      if (table === 'restaurants') {
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, winback_discount_percent: 20, winback_days: 40 }])
      }
      return chain(null)
    }

    await runWinbackCampaigns()

    expect(mockSendTemplate).toHaveBeenCalledWith(
      '919900000000',
      'winback_campaign',
      ['Charlie', '20', 'Spice Garden', expect.any(String)]
    )
    expect(mockSendText).not.toHaveBeenCalled()
  })

  it('runExpiryReminders sends template expiry_reminder', async () => {
    const tomorrow = new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString()

    tableHandler = (table: string) => {
      if (table === 'restaurants') {
        return chain([{ id: 'rest-1', name: 'Spice Garden', credits: 10, expiry_reminder_days: 1 }])
      }
      if (table === 'coupons') {
        return chain([{
          id: 'coupon-1',
          code: 'EXP-ABC',
          restaurant_id: 'rest-1',
          status: 'sent',
          enabled: true,
          expires_at: tomorrow,
          customers: { id: 'cust-1', phone: '919900000000', name: 'Diana', opt_in_status: 'opted_in' },
        }])
      }
      return chain(null)
    }

    await runExpiryReminders()

    expect(mockSendTemplate).toHaveBeenCalledWith(
      '919900000000',
      'expiry_reminder',
      ['Diana', 'EXP-ABC', 'Spice Garden', '1']
    )
    expect(mockSendText).not.toHaveBeenCalled()
  })
})

describe('Pricing and Expiry Guards in Campaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks campaigns and logs blocked_expired_plan when plan is expired', async () => {
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
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
        return chain([{
          id: 'rest-1',
          name: 'Spice Garden',
          credits: 10,
          welcome_reminder_days: 25,
          plan: 'pro',
          plan_expires_at: expiredDate
        }])
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
    expect(mockSendTemplate).not.toHaveBeenCalled()
  })

  it('bypasses credit checks and does not deduct credits when trial is active', async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
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
        return chain([{
          id: 'rest-1',
          name: 'Spice Garden',
          credits: 0, // 0 credits but trial is active!
          welcome_reminder_days: 25,
          plan: 'trial',
          plan_expires_at: futureDate
        }])
      }
      return chain(null)
    }

    await runWelcomeReminders()
    // Should send successfully because credits are ignored
    expect(mockSendText).toHaveBeenCalled()
    // Should NOT call deduct_credit RPC
    expect(rpcMock).not.toHaveBeenCalledWith('deduct_credit', { restaurant_id: 'rest-1' })
  })
})
