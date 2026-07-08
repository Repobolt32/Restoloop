import { WhatsAppAdapter, SendResult, WebhookEvent, InboundMessage } from './types'

export class MetaAdapter implements WhatsAppAdapter {
  async sendText(phone: string, text: string): Promise<SendResult> {
    return { success: false, error: 'Meta requires templates' }
  }

  async sendTemplate(phone: string, template: string, vars: string[]): Promise<SendResult> {
    return { success: false, error: 'Not implemented' }
  }

  validateWebhook(rawBody: string, signature: string): WebhookEvent | null {
    return null
  }

  parseInbound(rawBody: string): InboundMessage | null {
    return null
  }

  async getStatus(): Promise<string> {
    return 'ready'
  }
}
