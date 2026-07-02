import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock whatsapp adapter
const mockSendText = vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' })
const mockValidateWebhook = vi.fn()
vi.mock('@/lib/whatsapp/adapter', () => ({
  createWhatsAppAdapter: () => ({
    sendText: mockSendText,
    sendTemplate: vi.fn(),
    validateWebhook: mockValidateWebhook,
    parseInbound: vi.fn(),
  }),
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
      body,
      json: () => Promise.resolve(body),
    }),
  },
}))

// Supabase chain mock
function chain(data: any = null, error: any = null) {
  const c: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
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

let tableHandler: (table: string) => any = () => chain(null)

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    from: (table: string) => tableHandler(table),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  }),
}))

import { POST } from './route'

function makeRequest(body: any, headers: Record<string, string> = {}) {
  return {
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: { get: (key: string) => headers[key] || null },
  } as any
}

describe('WhatsApp Webhook Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendText.mockResolvedValue({ success: true, messageId: 'msg-1' })
    mockValidateWebhook.mockReturnValue({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'hello',
      id: 'msg-123',
      timestamp: 1700000000,
    })
  })

  it('returns duplicate for already-processed message', async () => {
    mockValidateWebhook.mockReturnValue({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'hello',
      id: 'msg-123',
      timestamp: 1700000000,
    })

    tableHandler = (table: string) => {
      if (table === 'message_logs') {
        return chain({ id: 'existing-log' }) // duplicate found
      }
      return chain(null)
    }

    const res = await POST(makeRequest({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'hello',
      id: 'msg-123',
      timestamp: 1700000000,
    }))

    expect(res.body).toEqual({ status: 'duplicate' })
  })

  it('returns unknown_restaurant when no restaurant matches', async () => {
    tableHandler = (table: string) => {
      if (table === 'message_logs') {
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue(c)
        return c
      }
      return chain(null) // no restaurant found
    }

    const res = await POST(makeRequest({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'hello',
      id: 'msg-unk-1',
      timestamp: 1700000000,
    }))

    expect(res.body).toEqual({ status: 'unknown_restaurant' })
  })

  it('creates pending customer and sends opt-in prompt for new customer', async () => {
    tableHandler = (table: string) => {
      if (table === 'message_logs') {
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue(c)
        return c
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden' })
      }
      if (table === 'customers') {
        // First call: lookup (null = new customer), second: insert
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'new-cust' } }),
          }),
        })
        return c
      }
      return chain(null)
    }

    const res = await POST(makeRequest({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'hello',
      id: 'msg-new-1',
      timestamp: 1700000000,
    }))

    expect(res.body).toEqual({ status: 'ok' })
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('Reply YES'))
  })

  it('handles YES reply: opts in customer and sends welcome coupon', async () => {
    mockValidateWebhook.mockReturnValue({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'YES',
      id: 'msg-yes-1',
      timestamp: 1700000000,
    })

    tableHandler = (table: string) => {
      if (table === 'message_logs') {
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue(c)
        return c
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', welcome_discount_cents: 5000 })
      }
      if (table === 'customers') {
        return chain({ id: 'cust-1', opt_in_status: 'pending' })
      }
      if (table === 'coupons') {
        return chain(null) // no existing welcome coupon
      }
      return chain(null)
    }

    const res = await POST(makeRequest({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'YES',
      id: 'msg-yes-1',
      timestamp: 1700000000,
    }))

    expect(res.body).toEqual({ status: 'ok' })
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('Welcome'))
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('50'))
  })

  it('handles STOP reply: opts out customer', async () => {
    mockValidateWebhook.mockReturnValue({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'STOP',
      id: 'msg-stop-1',
      timestamp: 1700000000,
    })

    tableHandler = (table: string) => {
      if (table === 'message_logs') {
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue(c)
        return c
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden' })
      }
      if (table === 'customers') {
        return chain({ id: 'cust-1', opt_in_status: 'opted_in' })
      }
      return chain(null)
    }

    const res = await POST(makeRequest({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'STOP',
      id: 'msg-stop-1',
      timestamp: 1700000000,
    }))

    expect(res.body).toEqual({ status: 'ok' })
    expect(mockSendText).not.toHaveBeenCalled()
  })

  it('re-sends opt-in prompt when pending customer sends non-YES/STOP', async () => {
    mockValidateWebhook.mockReturnValue({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'hello',
      id: 'msg-pending-1',
      timestamp: 1700000000,
    })

    tableHandler = (table: string) => {
      if (table === 'message_logs') {
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue(c)
        return c
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden' })
      }
      if (table === 'customers') {
        return chain({ id: 'cust-1', opt_in_status: 'pending' })
      }
      return chain(null)
    }

    const res = await POST(makeRequest({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'hello',
      id: 'msg-pending-1',
      timestamp: 1700000000,
    }))

    expect(res.body).toEqual({ status: 'ok' })
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('Reply YES'))
  })

  it('reuses existing welcome coupon on YES when one already exists', async () => {
    mockValidateWebhook.mockReturnValue({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'YES',
      id: 'msg-yes-2',
      timestamp: 1700000000,
    })

    tableHandler = (table: string) => {
      if (table === 'message_logs') {
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue(c)
        return c
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', welcome_discount_cents: 5000 })
      }
      if (table === 'customers') {
        return chain({ id: 'cust-1', opt_in_status: 'pending' })
      }
      if (table === 'coupons') {
        return chain({ code: 'W50-EXISTING' }) // existing coupon
      }
      return chain(null)
    }

    const res = await POST(makeRequest({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'YES',
      id: 'msg-yes-2',
      timestamp: 1700000000,
    }))

    expect(res.body).toEqual({ status: 'ok' })
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('W50-EXISTING'))
  })

  it('silently ignores non-YES/STOP from opted_in customer', async () => {
    mockValidateWebhook.mockReturnValue({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'hello',
      id: 'msg-silent-1',
      timestamp: 1700000000,
    })

    tableHandler = (table: string) => {
      if (table === 'message_logs') {
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue(c)
        return c
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden' })
      }
      if (table === 'customers') {
        return chain({ id: 'cust-1', opt_in_status: 'opted_in' })
      }
      return chain(null)
    }

    const res = await POST(makeRequest({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'hello',
      id: 'msg-silent-1',
      timestamp: 1700000000,
    }))

    expect(res.body).toEqual({ status: 'ok' })
    // opted_in + non-YES/STOP = no outbound message
    expect(mockSendText).not.toHaveBeenCalled()
  })
})
