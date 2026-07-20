import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSendText = vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' })
const mockValidateWebhook = vi.fn()
const mockResolveLidPhone = vi.fn()
const mockVerifySignature = vi.fn().mockReturnValue(true)
vi.mock('@/lib/whatsapp/adapter', () => ({
  createWhatsAppAdapter: () => ({
    sendText: mockSendText,
    sendTemplate: vi.fn(),
    validateWebhook: mockValidateWebhook,
    verifySignature: mockVerifySignature,
    parseInbound: vi.fn(),
    resolveLidPhone: mockResolveLidPhone,
  }),
}))

export let afterPromises: Promise<any>[] = []

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
  after: (cb: () => any) => {
    const p = cb()
    if (p && typeof p.then === 'function') {
      afterPromises.push(p)
    }
  },
}))

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
    afterPromises.length = 0
    vi.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
      if (typeof cb === 'function') cb()
      return 0 as any
    })
    mockSendText.mockResolvedValue({ success: true, messageId: 'msg-1' })
    mockResolveLidPhone.mockResolvedValue(null)
    mockValidateWebhook.mockReturnValue({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'hello',
      messageId: 'msg-123',
      timestamp: 1700000000,
    })
  })

  it('returns duplicate for already-processed message', async () => {
    mockValidateWebhook.mockReturnValue({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'hello',
      messageId: 'msg-123',
      timestamp: 1700000000,
    })

    tableHandler = (table: string) => {
      if (table === 'message_logs') {
        return chain({ id: 'existing-log' })
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
      return chain(null)
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

    await Promise.all(afterPromises)

    expect(res.body).toEqual({ status: 'ok' })
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('Reply YES'))
  })

  it('handles YES reply: opts in customer and sends welcome coupon', async () => {
    mockValidateWebhook.mockReturnValue({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'YES',
      messageId: 'msg-yes-1',
      timestamp: 1700000000,
    })

    tableHandler = (table: string) => {
      if (table === 'message_logs') {
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue(c)
        return c
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', welcome_discount_percent: 10 })
      }
      if (table === 'customers') {
        return chain({ id: 'cust-1', opt_in_status: 'pending' })
      }
      if (table === 'coupons') {
        return chain(null)
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

    await Promise.all(afterPromises)

    expect(res.body).toEqual({ status: 'ok' })
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('coupon'))
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('10'))
  })

  it('handles STOP reply: opts out customer', async () => {
    mockValidateWebhook.mockReturnValue({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'STOP',
      messageId: 'msg-stop-1',
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

    await Promise.all(afterPromises)

    expect(res.body).toEqual({ status: 'ok' })
    expect(mockSendText).not.toHaveBeenCalled()
  })

  it('re-sends opt-in prompt when pending customer sends non-YES/STOP', async () => {
    mockValidateWebhook.mockReturnValue({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'hello',
      messageId: 'msg-pending-1',
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

    await Promise.all(afterPromises)

    expect(res.body).toEqual({ status: 'ok' })
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('reply YES'))
  })

  it('reuses existing welcome coupon on YES when one already exists', async () => {
    mockValidateWebhook.mockReturnValue({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'YES',
      messageId: 'msg-yes-2',
      timestamp: 1700000000,
    })

    tableHandler = (table: string) => {
      if (table === 'message_logs') {
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue(c)
        return c
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', welcome_discount_percent: 10 })
      }
      if (table === 'customers') {
        return chain({ id: 'cust-1', opt_in_status: 'pending' })
      }
      if (table === 'coupons') {
        return chain({ code: 'W50-EXISTING' })
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

    await Promise.all(afterPromises)

    expect(res.body).toEqual({ status: 'ok' })
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('W50-EXISTING'))
  })

  it('opted_in customer first message: sends coupon directly without YES prompt', async () => {
    mockValidateWebhook.mockReturnValue({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'Hi, I would like to join your loyalty club!',
      messageId: 'msg-optin-1',
      timestamp: 1700000000,
    })

    const messageLogsChain = chain(null)
    messageLogsChain.maybeSingle = vi.fn()
      .mockResolvedValueOnce({ data: null, error: null }) // 1st call (dedupe)
      .mockResolvedValueOnce({ data: null, error: null }) // 2nd call (confirmLog check — no prior confirm)

    tableHandler = (table: string) => {
      if (table === 'message_logs') {
        return messageLogsChain
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', welcome_discount_percent: 10 })
      }
      if (table === 'customers') {
        return chain({ id: 'cust-1', name: 'Arjun', opt_in_status: 'opted_in' })
      }
      if (table === 'coupons') {
        return chain({ id: 'cpn-1', code: 'W10-ABCDEF' })
      }
      return chain(null)
    }

    const res = await POST(makeRequest({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'Hi, I would like to join your loyalty club!',
      id: 'msg-optin-1',
      timestamp: 1700000000,
    }))

    await Promise.all(afterPromises)

    expect(res.body).toEqual({ status: 'ok' })
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('W10-ABCDEF'))
    expect(mockSendText).toHaveBeenCalledWith('919900000000', expect.stringContaining('Arjun'))
  })

  it('LID + unresolvable phone: sends opt-in prompt to unknown customer at raw LID JID', async () => {
    mockResolveLidPhone.mockResolvedValue(null)
    mockValidateWebhook.mockReturnValue({
      from: '48816900317433@lid',
      to: '917542011085@c.us',
      body: 'Hi, I would like to join your loyalty club!',
      messageId: 'false_48816900317433@lid_ACED50DB',
      timestamp: 1700000000,
    })

    tableHandler = (table: string) => {
      if (table === 'message_logs') {
        const c = chain(null)
        c.insert = vi.fn().mockReturnValue(c)
        return c
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', welcome_discount_percent: 2 })
      }
      if (table === 'customers') {
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
      from: '48816900317433@lid',
      to: '917542011085@c.us',
      body: 'Hi, I would like to join your loyalty club!',
      id: 'false_48816900317433@lid_ACED50DB',
      timestamp: 1700000000,
    }))

    await Promise.all(afterPromises)

    expect(res.body).toEqual({ status: 'ok' })
    expect(mockSendText).toHaveBeenCalledWith('48816900317433@lid', expect.stringContaining('Reply YES'))
  })


  it('LID + senderPhone resolved: looks up customer by resolved phone, sends coupon, replies to resolved phone', async () => {
    mockResolveLidPhone.mockResolvedValue('919876543210')
    mockValidateWebhook.mockReturnValue({
      from: '48816900317433@lid',
      to: '917542011085@c.us',
      body: 'Hi, I would like to join your loyalty club!',
      messageId: 'msg-lid-resolved-2',
      timestamp: 1700000000,
      senderPhone: '919876543210',
    })

    const messageLogsChain = chain(null)
    messageLogsChain.maybeSingle = vi.fn()
      .mockResolvedValueOnce({ data: null, error: null }) // dedupe check
      .mockResolvedValueOnce({ data: null, error: null }) // confirmLog check

    tableHandler = (table: string) => {
      if (table === 'message_logs') {
        return messageLogsChain
      }
      if (table === 'restaurants') {
        return chain({ id: 'rest-1', name: 'Spice Garden', welcome_discount_percent: 2 })
      }
      if (table === 'customers') {
        return chain({
          id: 'cust-1',
          restaurant_id: 'rest-1',
          phone: '919876543210',
          name: 'Tester',
          opt_in_status: 'opted_in',
        })
      }
      if (table === 'coupons') {
        return chain({
          id: 'cpn-1',
          code: 'W2-9O06V8',
          customer_id: 'cust-1',
          type: 'welcome',
          discount_percent: 2,
          expires_at: '2026-08-08T09:50:13.000Z',
        })
      }
      return chain(null)
    }

    const res = await POST(makeRequest({
      from: '48816900317433@lid',
      to: '917542011085@c.us',
      body: 'Hi, I would like to join your loyalty club!',
      id: 'msg-lid-resolved-2',
      timestamp: 1700000000,
      senderPhone: '919876543210',
    }))

    await Promise.all(afterPromises)

    expect(res.body).toEqual({ status: 'ok' })
    expect(mockSendText).toHaveBeenCalledWith('919876543210', expect.stringContaining('W2-9O06V8'))
  })
})
