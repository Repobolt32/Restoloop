export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface WebhookEvent {
  from: string
  to?: string
  body: string
  messageId: string
  timestamp: number
}

export interface InboundMessage {
  from: string
  body: string
  messageId: string
}

export interface WhatsAppAdapter {
  sendText(phone: string, text: string): Promise<SendResult>
  sendTemplate(phone: string, template: string, vars: string[]): Promise<SendResult>
  validateWebhook(rawBody: string, signature: string): WebhookEvent | null
  parseInbound(rawBody: string): InboundMessage | null
}
