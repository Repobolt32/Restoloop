import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createWhatsAppAdapter } from './adapter'
import { OpenWAAdapter } from './openwa'
import { MetaAdapter } from './meta'

describe('createWhatsAppAdapter', () => {
  const originalEnv = process.env.WHATSAPP_PROVIDER

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.WHATSAPP_PROVIDER
    } else {
      process.env.WHATSAPP_PROVIDER = originalEnv
    }
  })

  it('returns MetaAdapter when WHATSAPP_PROVIDER=meta', () => {
    process.env.WHATSAPP_PROVIDER = 'meta'
    expect(createWhatsAppAdapter()).toBeInstanceOf(MetaAdapter)
  })

  it('returns OpenWAAdapter when WHATSAPP_PROVIDER=openwa', () => {
    process.env.WHATSAPP_PROVIDER = 'openwa'
    expect(createWhatsAppAdapter()).toBeInstanceOf(OpenWAAdapter)
  })

  it('defaults to OpenWAAdapter when WHATSAPP_PROVIDER is unset', () => {
    delete process.env.WHATSAPP_PROVIDER
    expect(createWhatsAppAdapter()).toBeInstanceOf(OpenWAAdapter)
  })
})
