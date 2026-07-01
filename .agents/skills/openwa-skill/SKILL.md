---
name: openwa-skill
description: Guidelines and specifications for integrating with the OpenWA (Open Source WhatsApp API Gateway) REST API. Use this skill whenever implementing, modifying, or debugging the WhatsApp integration, adding adapters, defining webhooks, sending messages (text, image, video, audio, document, location, contact, sticker), or managing session state and QR codes.
---

# OpenWA API Gateway Integration Guide

Use this skill to guide implementation details, request bodies, authentication headers, and response parsing for the OpenWA API gateway.

---

## Core Configuration & Base API Setup

### Base URL
All REST routes are mounted under the `/api` prefix:
```
http://<host>:2785/api
```
For local dev, this is `http://localhost:2785/api`.

### Authentication
Every REST route (unless explicitly public) requires authentication. Pass the API key in the `X-API-Key` header:
```http
X-API-Key: owa_k1_your-api-key-here
Content-Type: application/json
```
*Note: Query-parameter API keys are NOT accepted on REST routes.*

---

## Response & Error Formats

### Success Response
OpenWA returns the raw handler payload directly. There is **no envelope** (no wrapper like `{ success, data, meta }`).
- List routes return a bare JSON array.
- Detail/Resource routes return the resource object directly.
- Send messages return `{ messageId: string, timestamp: number }`.
- Session status values are lowercase string enums: `created | initializing | qr_ready | authenticating | ready | disconnected | failed`.

### Error Response
Errors use the standard NestJS default schema:
```json
{
  "statusCode": 404,
  "message": "Session 'session-id' not found",
  "error": "Not Found"
}
```
For validation failures (HTTP 400), `message` is an **array** of validation strings.

---

## Session Management

### 1. Create a Session (`POST /api/sessions`)
- **Request Body (`CreateSessionDto`):**
  ```json
  {
    "name": "my-session-name",
    "config": {},
    "proxyUrl": "http://user:pass@host:port", // optional
    "proxyType": "http" // optional: http | https | socks4 | socks5
  }
  ```
  *Constraint:* `name` must be 3-50 chars matching `/^[a-zA-Z0-9-]+$/`.
- **Response (`201`):** Returns the raw session entity including configuration and proxy details.

### 2. Start a Session (`POST /api/sessions/:id/start`)
Initializes the WhatsApp engine connection for the session.
- **Response (`201`):** Returns the transformed session status (e.g. status: `initializing`).

### 3. Get QR Code (`GET /api/sessions/:id/qr`)
- **Response (`200`):**
  ```json
  {
    "qrCode": "data:image/png;base64,iVBORw0...",
    "status": "qr_ready"
  }
  ```

### 4. Stop a Session (`POST /api/sessions/:id/stop`)
- **Response (`201`):** Disconnects the engine and sets status to `disconnected`.

---

## Messaging Endpoints

All message endpoints are POST routes under `/api/sessions/:sessionId/messages`. All write routes require `X-API-Key` with `OPERATOR` privilege or higher.

### 1. Send Text Message (`POST /api/sessions/:sessionId/messages/send-text`)
- **Request Body (`SendTextMessageDto`):**
  ```json
  {
    "chatId": "919876543210@c.us",
    "text": "Hello, this is a message from Restoloop!",
    "mentions": ["919876543210@c.us"] // optional WIDs
  }
  ```
  *Constraints:* `text` max 4096 characters.
- **Response (`201`):** `{ "messageId": "true_919876543210@c.us_3EB0ABCD", "timestamp": 1719312000 }`

### 2. Send Template Message (`POST /api/sessions/:sessionId/messages/send-template`)
Renders a stored template by replacing `{{placeholder}}` tokens with variables.
- **Request Body (`SendTemplateMessageDto`):**
  ```json
  {
    "chatId": "919876543210@c.us",
    "templateName": "welcome-coupon",
    "vars": {
      "customer": "John",
      "couponCode": "RESTO10"
    }
  }
  ```

### 3. Send Media Message
All media endpoints (`send-image`, `send-video`, `send-audio`, `send-document`, `send-sticker`) share a flat request body layout (`SendMediaMessageDto`).
- **Request Body (`SendMediaMessageDto`):**
  ```json
  {
    "chatId": "919876543210@c.us",
    "url": "https://example.com/media.jpg", // Conditional: required if base64 absent
    "base64": "...", // Conditional: required if url absent
    "mimetype": "image/jpeg", // Required if base64 is used
    "filename": "coupon.jpg", // Optional
    "caption": "Your coupon is ready!" // Optional, max 1024 chars
  }
  ```
  *Constraint:* Shared media byte cap is 50 MiB (52,428,800 bytes). Decoded base64/downloaded bytes exceeding this yield `413 Payload Too Large`.

---

## TypeScript Client Integration Example

When implementing an OpenWA adapter or client in TypeScript, match this structure:

```typescript
import { SendResult, WhatsAppAdapter } from './types'

export class OpenWAAdapter implements WhatsAppAdapter {
  private baseUrl: string
  private apiKey: string
  private sessionId: string

  constructor() {
    this.baseUrl = process.env.OPENWA_BASE_URL || 'http://localhost:2785/api'
    this.apiKey = process.env.OPENWA_API_KEY || ''
    this.sessionId = process.env.OPENWA_SESSION_ID || ''
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
        throw new Error(errBody.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return { success: true, messageId: data.messageId }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async sendTemplate(phone: string, template: string, vars: string[]): Promise<SendResult> {
    // Basic substitution mapping if mapping templates on client-side
    const text = template.replace(/\{(\d+)\}/g, (_, idx) => vars[Number(idx)] || '')
    return this.sendText(phone, text)
  }

  validateWebhook(rawBody: string, signature: string): any {
    // If webhook needs verification via HMAC, use the rawBody and config key.
    // Parse raw webhook events
    try {
      return JSON.parse(rawBody)
    } catch {
      return null
    }
  }

  parseInbound(rawBody: string): any {
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
```
