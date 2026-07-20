import { WhatsAppAdapter, SendResult, WebhookEvent, InboundMessage } from './types'
import { createHmac, timingSafeEqual } from 'crypto'

const META_API_VERSION = 'v20.0'
const GRAPH_URL = 'https://graph.facebook.com'

export class MetaAdapter implements WhatsAppAdapter {
  private phoneNumberId: string
  private accessToken: string
  private appSecret: string

  constructor() {
    this.phoneNumberId = process.env.META_PHONE_NUMBER_ID || ''
    this.accessToken = process.env.META_ACCESS_TOKEN || ''
    this.appSecret = process.env.META_APP_SECRET || ''
  }

  verifySignature(rawBody: string, signature: string): boolean {
    if (!this.appSecret || !signature) return false
    if (!signature.startsWith('sha256=')) return false
    const expected = 'sha256=' + createHmac('sha256', this.appSecret).update(rawBody).digest('hex')
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    } catch {
      return false
    }
  }

  private parsePayload(rawBody: string): WebhookEvent | null {
    try {
      const payload = JSON.parse(rawBody)
      if (payload.object !== 'whatsapp_business_account') return null
      const change = payload.entry?.[0]?.changes?.[0]
      if (!change || change.field !== 'messages') return null
      const value = change.value
      const msg = value?.messages?.[0]
      if (!msg) return null
      const body = msg.text?.body
        || msg.button?.text
        || msg.interactive?.button_reply?.title
        || msg.interactive?.list_reply?.title
        || ''
      return {
        from: msg.from || '',
        to: value?.metadata?.display_phone_number || '',
        body,
        messageId: msg.id || '',
        timestamp: Number(msg.timestamp) || 0,
        senderPhone: msg.from || '',
      }
    } catch {
      return null
    }
  }

  validateWebhook(rawBody: string, signature: string): WebhookEvent | null {
    if (!this.verifySignature(rawBody, signature)) return null
    return this.parsePayload(rawBody)
  }

  parseInbound(rawBody: string): InboundMessage | null {
    const event = this.parsePayload(rawBody)
    if (!event) return null
    return { from: event.from, body: event.body, messageId: event.messageId }
  }

  async sendText(phone: string, text: string): Promise<SendResult> {
    return this.apiCall({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'text',
      text: { body: text },
    })
  }

  async sendTemplate(phone: string, template: string, vars: string[]): Promise<SendResult> {
    const body: any = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: template,
        language: { code: 'en_US' },
      },
    }
    if (vars.length > 0) {
      body.template.components = [
        {
          type: 'body',
          parameters: vars.map(v => ({ type: 'text', text: v })),
        },
      ]
    }
    return this.apiCall(body)
  }

  private async apiCall(body: Record<string, unknown>): Promise<SendResult> {
    try {
      const response = await fetch(
        `${GRAPH_URL}/${META_API_VERSION}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        const err = (errBody as any)?.error
        throw new Error(err?.message || err?.error_data?.details || `HTTP ${response.status}`)
      }
      const data = await response.json() as any
      return { success: true, messageId: data.messages?.[0]?.id }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async getStatus(): Promise<string> {
    try {
      const response = await fetch(
        `${GRAPH_URL}/${META_API_VERSION}/${this.phoneNumberId}?fields=verified_name,quality_rating,display_phone_number`,
        {
          headers: { 'Authorization': `Bearer ${this.accessToken}` },
        }
      )
      if (!response.ok) return `HTTP ${response.status}`
      const data = await response.json() as any
      const rating = data.quality_rating || 'N/A'
      const phone = data.display_phone_number || 'unknown'
      const name = data.verified_name || ''
      return `${name} (${phone}) quality: ${rating}`
    } catch (error) {
      return `Error: ${String(error)}`
    }
  }

  verifyWebhookChallenge(mode: string, token: string, challenge: string): string | null {
    const verifyToken = process.env.META_VERIFY_TOKEN || ''
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge
    }
    return null
  }
}
