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
            chatId: phone.includes('@') ? phone : `${phone}@c.us`,
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

  verifySignature(_rawBody: string, _signature: string): boolean {
    return true
  }

  validateWebhook(rawBody: string, signature: string): WebhookEvent | null {
    try {
      const payload = JSON.parse(rawBody)
      const data = payload.data || payload
      if (!data || !data.from) return null
      return {
        from: data.from,
        to: data.to,
        body: data.body,
        messageId: data.id || data.messageId,
        timestamp: data.timestamp,
        senderPhone: data.senderPhone,
      }
    } catch {
      return null
    }
  }

  parseInbound(rawBody: string): InboundMessage | null {
    try {
      const payload = JSON.parse(rawBody)
      const data = payload.data || payload
      if (!data || !data.from) return null
      return {
        from: data.from,
        body: data.body,
        messageId: data.id || data.messageId,
      }
    } catch {
      return null
    }
  }

  async resolveLidPhone(lidJid: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/sessions/${this.sessionId}/contacts/${encodeURIComponent(lidJid)}/phone`,
        { headers: { 'X-API-Key': this.apiKey } }
      )
      if (!response.ok) {
        console.error(`[resolveLidPhone] ${lidJid} -> HTTP ${response.status} ${response.statusText}`)
        return null
      }
      const data = await response.json()
      const phone = data.phone || data.phoneNumber || data.number
      if (!phone) {
        console.error(`[resolveLidPhone] ${lidJid} -> no phone field in response:`, JSON.stringify(data).slice(0, 200))
      }
      return phone ? String(phone).replace(/\D/g, '') : null
    } catch (error) {
      console.error(`[resolveLidPhone] ${lidJid} -> ${String(error)}`)
      return null
    }
  }

  async getStatus(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${this.sessionId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
        },
      })
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        return errBody.message || `HTTP ${response.status}`
      }
      const data = await response.json()
      return data.session?.status || data.status || 'unknown'
    } catch (error) {
      return `Error: ${String(error)}`
    }
  }

  verifyWebhookChallenge(mode: string, token: string, challenge: string): string | null {
    return null
  }
}
