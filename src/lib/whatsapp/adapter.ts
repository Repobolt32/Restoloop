import { WhatsAppAdapter, SendResult, WebhookEvent, InboundMessage } from './types'
import { OpenWAAdapter } from './openwa'
import { MetaAdapter } from './meta'

class MockAdapter implements WhatsAppAdapter {
  async sendText(phone: string, text: string): Promise<SendResult> {
    return { success: true, messageId: `mock-msg-${Math.random().toString(36).substring(2, 9)}` }
  }

  async sendTemplate(phone: string, template: string, vars: string[]): Promise<SendResult> {
    const text = template.replace(/\{(\d+)\}/g, (_, idx) => vars[Number(idx)] || '')
    return this.sendText(phone, text)
  }

  validateWebhook(rawBody: string, signature: string): WebhookEvent | null {
    try {
      const payload = JSON.parse(rawBody)
      return {
        from: payload.from,
        to: payload.to,
        body: payload.body,
        messageId: payload.id,
        timestamp: payload.timestamp,
      }
    } catch {
      return null
    }
  }

  parseInbound(rawBody: string): InboundMessage | null {
    try {
      const payload = JSON.parse(rawBody)
      return {
        from: payload.from,
        body: payload.body,
        messageId: payload.id,
      }
    } catch {
      return null
    }
  }

  async getStatus(): Promise<string> {
    return 'ready'
  }
}

export function createWhatsAppAdapter(): WhatsAppAdapter {
  const provider = process.env.WHATSAPP_PROVIDER || 'openwa'

  if (provider === 'mock') {
    return new MockAdapter()
  }

  if (provider === 'meta') {
    return new MetaAdapter()
  }

  return new OpenWAAdapter()
}
