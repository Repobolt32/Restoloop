import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OpenWAAdapter } from './openwa'

const adapter = new OpenWAAdapter()

describe('OpenWAAdapter.validateWebhook', () => {
  it('parses valid JSON with all fields', () => {
    const body = JSON.stringify({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'hello',
      id: 'msg-123',
      timestamp: 1700000000,
    })

    const result = adapter.validateWebhook(body, 'sig')

    expect(result).toEqual({
      from: '919900000000@c.us',
      to: '918800000000@c.us',
      body: 'hello',
      messageId: 'msg-123',
      timestamp: 1700000000,
    })
  })

  it('returns null for invalid JSON', () => {
    expect(adapter.validateWebhook('not json', 'sig')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(adapter.validateWebhook('', 'sig')).toBeNull()
  })

  it('returns object with undefined fields for valid JSON missing fields', () => {
    const body = JSON.stringify({ from: '919900000000@c.us' })
    const result = adapter.validateWebhook(body, 'sig')

    expect(result).not.toBeNull()
    expect(result!.from).toBe('919900000000@c.us')
    expect(result!.body).toBeUndefined()
    expect(result!.messageId).toBeUndefined()
  })
})

describe('OpenWAAdapter.sendTemplate', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('interpolates template variables into sendText', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messageId: 'msg-1' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await adapter.sendTemplate('919900000000', 'Hey {0}! Code: {1}', ['Alice', 'ABC123'])

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.text).toBe('Hey Alice! Code: ABC123')
  })

  it('replaces missing var index with empty string', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messageId: 'msg-1' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await adapter.sendTemplate('919900000000', 'Hello {0} {1} {2}', ['Alice'])

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.text).toBe('Hello Alice  ')
  })

  it('sends template as-is when no placeholders', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messageId: 'msg-1' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await adapter.sendTemplate('919900000000', 'No vars here', [])

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.text).toBe('No vars here')
  })
})

describe('OpenWAAdapter.sendText', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns success with messageId on HTTP 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messageId: 'msg-abc' }),
    }))

    const result = await adapter.sendText('919900000000', 'hello')

    expect(result).toEqual({ success: true, messageId: 'msg-abc' })
  })

  it('returns failure on HTTP 500', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ message: 'server broke' }),
    }))

    const result = await adapter.sendText('919900000000', 'hello')

    expect(result.success).toBe(false)
    expect(result.error).toContain('server broke')
  })

  it('returns failure on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))

    const result = await adapter.sendText('919900000000', 'hello')

    expect(result.success).toBe(false)
    expect(result.error).toContain('fetch failed')
  })
})
