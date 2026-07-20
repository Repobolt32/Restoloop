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
  senderPhone?: string
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
  verifySignature(rawBody: string, signature: string): boolean
  parseInbound(rawBody: string): InboundMessage | null
  getStatus(): Promise<string>
  resolveLidPhone?(lidJid: string): Promise<string | null>
  verifyWebhookChallenge(mode: string, token: string, challenge: string): string | null
}
