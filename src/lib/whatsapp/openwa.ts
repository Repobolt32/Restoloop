import { WhatsAppAdapter, SendResult, WebhookEvent, InboundMessage } from './types'

export class OpenWAAdapter implements WhatsAppAdapter {
  private baseUrl: string
  private apiKey: string
  private sessionId: string

  constructor() {
    this.baseUrl = process.env.OPENWA_BASE_URL || 'http://localhost:2785/api'
    this.apiKey = process.env.OPENWA_API_KEY || ''
    this.sessionId = process.env.OPENWA_SESSION_ID || 'default'
  }

  async sendText(phone: string, text: string): Promise<SendResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/sessions/${this.sessionId}/messages/send-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          body: JSON.stringify({
            chatId: `${phone}@c.us`,
            text,
          }),
        }
      )

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.message || `HTTP ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return { success: true, messageId: data.messageId }
    } catch (error) {
      return { success: false, error: String(error) }
    }
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
}
