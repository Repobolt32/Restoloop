import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MetaAdapter } from './meta'
import { createHmac } from 'crypto'

const META_VERIFY_TOKEN = 'restoloop_test_verify_token_2026'
const META_APP_SECRET = '42d845bfa4b61be444dcdc10421915ed'
const META_ACCESS_TOKEN = 'test-access-token'
const META_PHONE_NUMBER_ID = '1274457862413947'

function signBody(body: string): string {
  return 'sha256=' + createHmac('sha256', META_APP_SECRET).update(body).digest('hex')
}

function makeAdapter(overrides: Partial<Record<string, string>> = {}) {
  const env = {
    META_VERIFY_TOKEN,
    META_APP_SECRET,
    META_ACCESS_TOKEN,
    META_PHONE_NUMBER_ID,
    ...overrides,
  }
  return { adapter: new MetaAdapter(), env }
}

describe('MetaAdapter', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetAllMocks()
    process.env.META_VERIFY_TOKEN = META_VERIFY_TOKEN
    process.env.META_APP_SECRET = META_APP_SECRET
    process.env.META_ACCESS_TOKEN = META_ACCESS_TOKEN
    process.env.META_PHONE_NUMBER_ID = META_PHONE_NUMBER_ID
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('verifySignature', () => {
    it('returns true for valid signature', () => {
      const body = JSON.stringify({ object: 'whatsapp_business_account' })
      const sig = signBody(body)
      const adapter = new MetaAdapter()
      expect(adapter.verifySignature(body, sig)).toBe(true)
    })

    it('returns false for invalid signature', () => {
      const body = JSON.stringify({ object: 'whatsapp_business_account' })
      const adapter = new MetaAdapter()
      expect(adapter.verifySignature(body, 'sha256=deadbeef')).toBe(false)
    })

    it('returns false when app secret is missing', () => {
      delete process.env.META_APP_SECRET
      const adapter = new MetaAdapter()
      const body = 'test'
      expect(adapter.verifySignature(body, 'sha256=anything')).toBe(false)
    })

    it('returns false when signature is empty', () => {
      const adapter = new MetaAdapter()
      expect(adapter.verifySignature('body', '')).toBe(false)
    })

    it('returns false when signature does not start with sha256=', () => {
      const adapter = new MetaAdapter()
      expect(adapter.verifySignature('body', 'invalid')).toBe(false)
    })
  })

  describe('validateWebhook', () => {
    it('parses a valid text message webhook', () => {
      const adapter = new MetaAdapter()
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: '123',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15551234567',
                phone_number_id: '987',
              },
              messages: [{
                from: '17863559966',
                id: 'wamid.test123',
                timestamp: '1758254144',
                text: { body: 'Hello!' },
                type: 'text',
              }],
            },
          }],
        }],
      }
      const body = JSON.stringify(payload)
      const sig = signBody(body)
      const event = adapter.validateWebhook(body, sig)

      expect(event).not.toBeNull()
      expect(event!.from).toBe('17863559966')
      expect(event!.to).toBe('15551234567')
      expect(event!.body).toBe('Hello!')
      expect(event!.messageId).toBe('wamid.test123')
      expect(event!.timestamp).toBe(1758254144)
    })

    it('returns null for invalid signature', () => {
      const adapter = new MetaAdapter()
      const payload = { object: 'whatsapp_business_account' }
      const body = JSON.stringify(payload)
      expect(adapter.validateWebhook(body, 'sha256=badsig')).toBeNull()
    })

    it('returns null for non-whatsapp payload', () => {
      const adapter = new MetaAdapter()
      const payload = { object: 'page', entry: [] }
      const body = JSON.stringify(payload)
      const sig = signBody(body)
      expect(adapter.validateWebhook(body, sig)).toBeNull()
    })

    it('returns null for status update (no messages array)', () => {
      const adapter = new MetaAdapter()
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: '123',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15551234567', phone_number_id: '987' },
              statuses: [{ id: 'wamid.test', status: 'delivered' }],
            },
          }],
        }],
      }
      const body = JSON.stringify(payload)
      const sig = signBody(body)
      expect(adapter.validateWebhook(body, sig)).toBeNull()
    })

    it('handles button reply messages', () => {
      const adapter = new MetaAdapter()
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: '123',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15551234567', phone_number_id: '987' },
              messages: [{
                from: '17863559966',
                id: 'wamid.btn',
                timestamp: '1700000000',
                type: 'button',
                button: { text: 'Yes' },
              }],
            },
          }],
        }],
      }
      const body = JSON.stringify(payload)
      const sig = signBody(body)
      const event = adapter.validateWebhook(body, sig)
      expect(event).not.toBeNull()
      expect(event!.body).toBe('Yes')
    })

    it('handles interactive list reply messages', () => {
      const adapter = new MetaAdapter()
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: '123',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15551234567', phone_number_id: '987' },
              messages: [{
                from: '17863559966',
                id: 'wamid.interactive',
                timestamp: '1700000000',
                type: 'interactive',
                interactive: { list_reply: { title: 'Option 1' } },
              }],
            },
          }],
        }],
      }
      const body = JSON.stringify(payload)
      const sig = signBody(body)
      const event = adapter.validateWebhook(body, sig)
      expect(event).not.toBeNull()
      expect(event!.body).toBe('Option 1')
    })

    it('returns null for malformed JSON', () => {
      const adapter = new MetaAdapter()
      expect(adapter.validateWebhook('not-json', 'sha256=abc')).toBeNull()
    })

    it('returns null for empty messages array', () => {
      const adapter = new MetaAdapter()
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: '123',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15551234567', phone_number_id: '987' },
              messages: [],
            },
          }],
        }],
      }
      const body = JSON.stringify(payload)
      const sig = signBody(body)
      expect(adapter.validateWebhook(body, sig)).toBeNull()
    })
  })

  describe('verifyWebhookChallenge', () => {
    it('returns challenge on matching token and subscribe mode', () => {
      const adapter = new MetaAdapter()
      const result = adapter.verifyWebhookChallenge('subscribe', META_VERIFY_TOKEN, 'challenge123')
      expect(result).toBe('challenge123')
    })

    it('returns null on wrong token', () => {
      const adapter = new MetaAdapter()
      expect(adapter.verifyWebhookChallenge('subscribe', 'wrong-token', 'challenge123')).toBeNull()
    })

    it('returns null on non-subscribe mode', () => {
      const adapter = new MetaAdapter()
      expect(adapter.verifyWebhookChallenge('unsubscribe', META_VERIFY_TOKEN, 'challenge123')).toBeNull()
    })
  })

  describe('parseInbound', () => {
    it('parses a valid text message', () => {
      const adapter = new MetaAdapter()
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: '123',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15551234567', phone_number_id: '987' },
              messages: [{
                from: '17863559966',
                id: 'wamid.test123',
                timestamp: '1758254144',
                text: { body: 'Hi' },
                type: 'text',
              }],
            },
          }],
        }],
      }
      const msg = adapter.parseInbound(JSON.stringify(payload))
      expect(msg).not.toBeNull()
      expect(msg!.from).toBe('17863559966')
      expect(msg!.body).toBe('Hi')
      expect(msg!.messageId).toBe('wamid.test123')
    })

    it('returns null for non-whatsapp payload', () => {
      const adapter = new MetaAdapter()
      expect(adapter.parseInbound('{}')).toBeNull()
    })

    it('returns null for malformed JSON', () => {
      const adapter = new MetaAdapter()
      expect(adapter.parseInbound('not-json')).toBeNull()
    })
  })

  describe('sendText', () => {
    it('sends text message via Meta API', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ messages: [{ id: 'wamid.out.123' }] }),
      })
      global.fetch = mockFetch as any

      const adapter = new MetaAdapter()
      const result = await adapter.sendText('919876543210', 'Hello from test')

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('wamid.out.123')
      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, opts] = mockFetch.mock.calls[0] as [string, { headers?: Record<string, string>; body?: string }]
      expect(url).toContain('graph.facebook.com')
      expect(url).toContain(META_PHONE_NUMBER_ID)
      expect(url).toContain('/messages')
      expect(opts.headers?.['Authorization']).toBe(`Bearer ${META_ACCESS_TOKEN}`)
      const body = JSON.parse(opts.body as string)
      expect(body.to).toBe('919876543210')
      expect(body.type).toBe('text')
      expect(body.text.body).toBe('Hello from test')
    })

    it('returns failure on HTTP error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: { message: 'Invalid phone number' } }),
      })
      global.fetch = mockFetch as any

      const adapter = new MetaAdapter()
      const result = await adapter.sendText('badphone', 'test')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid phone number')
    })

    it('returns failure on network error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network down'))
      global.fetch = mockFetch as any

      const adapter = new MetaAdapter()
      const result = await adapter.sendText('919876543210', 'test')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network down')
    })
  })

  describe('sendTemplate', () => {
    it('sends template message with parameters via Meta API', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ messages: [{ id: 'wamid.tpl.456' }] }),
      })
      global.fetch = mockFetch as any

      const adapter = new MetaAdapter()
      const result = await adapter.sendTemplate(
        '919876543210',
        'welcome_reminder',
        ['Spice Garden', 'W10-ABC123', '2026-08-18']
      )

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('wamid.tpl.456')
      const body = JSON.parse((mockFetch.mock.calls[0] as any)[1].body as string)
      expect(body.type).toBe('template')
      expect(body.template.name).toBe('welcome_reminder')
      expect(body.template.language.code).toBe('en_US')
      expect(body.template.components[0].type).toBe('body')
      expect(body.template.components[0].parameters).toEqual([
        { type: 'text', text: 'Spice Garden' },
        { type: 'text', text: 'W10-ABC123' },
        { type: 'text', text: '2026-08-18' },
      ])
    })

    it('sends template without components when vars is empty', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ messages: [{ id: 'wamid.tpl.789' }] }),
      })
      global.fetch = mockFetch as any

      const adapter = new MetaAdapter()
      const result = await adapter.sendTemplate('919876543210', 'test_template', [])

      expect(result.success).toBe(true)
      const body = JSON.parse((mockFetch.mock.calls[0] as any)[1].body as string)
      expect(body.template.components).toBeUndefined()
    })
  })

  describe('getStatus', () => {
    it('returns formatted status string', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          verified_name: 'Restoloop',
          quality_rating: 'GREEN',
          display_phone_number: '15551234567',
        }),
      })
      global.fetch = mockFetch as any

      const adapter = new MetaAdapter()
      const status = await adapter.getStatus()

      expect(status).toContain('Restoloop')
      expect(status).toContain('15551234567')
      expect(status).toContain('GREEN')
    })

    it('returns HTTP error string on failure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      })
      global.fetch = mockFetch as any

      const adapter = new MetaAdapter()
      const status = await adapter.getStatus()

      expect(status).toContain('403')
    })

    it('returns error string on network failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'))
      global.fetch = mockFetch as any

      const adapter = new MetaAdapter()
      const status = await adapter.getStatus()

      expect(status).toContain('Connection refused')
    })
  })
})
