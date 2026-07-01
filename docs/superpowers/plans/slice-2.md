## Slice 2: "Customer Joins"

**Activates:** Phase 2 (Core Data) + Phase 3 (WhatsApp Adapter)

**Required Tech Skills:**
- Webhook endpoints & API routes: `route-handlers`, `vercel-functions`
- Public intake form & Server Actions: `vercel-react-best-practices`, `typescript-best-practices`
- UI Styling / Design System: `frontend-design`, `tailwind-design-system`, `web-design-guidelines`
- E2E Testing / TDD: `playwright`, `webapp-testing`, `tdd`, `e2e-testing-patterns`

**Ships:** QR scan → WhatsApp opt-in → welcome coupon sent

### Task 2.1: WhatsApp Adapter Interface

**Files:**
- Create: `src/lib/whatsapp/types.ts`
- Create: `src/lib/whatsapp/adapter.ts`

- [ ] **Step 1: Define types**

Create `src/lib/whatsapp/types.ts`:
```typescript
export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface WebhookEvent {
  from: string
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
```

- [ ] **Step 2: Create adapter factory**

Create `src/lib/whatsapp/adapter.ts`:
```typescript
import { WhatsAppAdapter } from './types'
import { OpenWAAdapter } from './openwa'
import { MetaAdapter } from './meta'

export function createWhatsAppAdapter(): WhatsAppAdapter {
  const provider = process.env.WHATSAPP_PROVIDER || 'openwa'

  if (provider === 'meta') {
    return new MetaAdapter()
  }

  return new OpenWAAdapter()
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/whatsapp/
git commit -m "feat: add WhatsApp adapter interface"
```

---

### Task 2.2: OpenWA Adapter

**Files:**
- Create: `src/lib/whatsapp/openwa.ts`

**Ref mcp verify:** OpenWA API docs (need to verify)

- [ ] **Step 1: Implement OpenWA adapter**

Create `src/lib/whatsapp/openwa.ts`:
```typescript
import { WhatsAppAdapter, SendResult, WebhookEvent, InboundMessage } from './types'

export class OpenWAAdapter implements WhatsAppAdapter {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.OPENWA_BASE_URL || 'http://localhost:3001'
  }

  async sendText(phone: string, text: string): Promise<SendResult> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: `${phone}@c.us`,
          content: text,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenWA send failed: ${response.statusText}`)
      }

      const data = await response.json()
      return { success: true, messageId: data.id }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async sendTemplate(phone: string, template: string, vars: string[]): Promise<SendResult> {
    // OpenWA doesn't have templates, send as text
    const text = template.replace(/\{(\d+)\}/g, (_, idx) => vars[idx] || '')
    return this.sendText(phone, text)
  }

  validateWebhook(rawBody: string, signature: string): WebhookEvent | null {
    // OpenWA doesn't use signatures
    try {
      const payload = JSON.parse(rawBody)
      return {
        from: payload.from,
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/whatsapp/openwa.ts
git commit -m "feat: add OpenWA adapter"
```

---

### Task 2.3: Meta Adapter (Stub)

**Files:**
- Create: `src/lib/whatsapp/meta.ts`

- [ ] **Step 1: Implement Meta adapter stub**

Create `src/lib/whatsapp/meta.ts`:
```typescript
import { WhatsAppAdapter, SendResult, WebhookEvent, InboundMessage } from './types'

export class MetaAdapter implements WhatsAppAdapter {
  async sendText(phone: string, text: string): Promise<SendResult> {
    // Meta doesn't support free-form text outside 24h window
    return { success: false, error: 'Meta requires templates' }
  }

  async sendTemplate(phone: string, template: string, vars: string[]): Promise<SendResult> {
    // TODO: Implement Meta Cloud API
    return { success: false, error: 'Not implemented' }
  }

  validateWebhook(rawBody: string, signature: string): WebhookEvent | null {
    // TODO: Implement HMAC SHA256 verification
    return null
  }

  parseInbound(rawBody: string): InboundMessage | null {
    // TODO: Implement Meta webhook parsing
    return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/whatsapp/meta.ts
git commit -m "feat: add Meta adapter stub"
```

---

### Task 2.4: Webhook Handler

**Files:**
- Create: `src/app/api/whatsapp/route.ts`

- [ ] **Step 1: Create webhook route**

Create `src/app/api/whatsapp/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { createWhatsAppAdapter } from '@/lib/whatsapp/adapter'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature') || ''

  const adapter = createWhatsAppAdapter()
  const event = adapter.validateWebhook(rawBody, signature)

  if (!event) {
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
  }

  const supabase = await createClient()

  // Dedupe: check if message already processed
  const { data: existing } = await supabase
    .from('message_logs')
    .select('id')
    .eq('provider_message_id', event.messageId)
    .single()

  if (existing) {
    // Already processed, return 200
    return NextResponse.json({ status: 'duplicate' })
  }

  // Lookup restaurant by WhatsApp number
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('whatsapp_number', event.from.replace('@c.us', '').replace(/\D/g, ''))
    .single()

  // Log inbound message
  await supabase.from('message_logs').insert({
    restaurant_id: restaurant?.id || null,
    direction: 'inbound',
    type: 'opt_in_prompt',
    status: 'sent',
    provider_message_id: event.messageId,
  })

  if (!restaurant) {
    // Unknown restaurant, return 200
    return NextResponse.json({ status: 'unknown_restaurant' })
  }

  // Lookup or create customer
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('phone', event.from.replace('@c.us', '').replace(/\D/g, ''))
    .single()

  if (!customer) {
    // New customer: send opt-in prompt
    const optInMessage = `Reply YES to receive exclusive coupons from ${restaurant.name}. Reply STOP to opt out.`

    const result = await adapter.sendText(event.from, optInMessage)

    // Create pending customer
    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurant.id,
        phone: event.from.replace('@c.us', '').replace(/\D/g, ''),
        opt_in_status: 'pending',
      })
      .select()
      .single()

    // Log outbound message
    await supabase.from('message_logs').insert({
      restaurant_id: restaurant.id,
      customer_id: newCustomer?.id,
      direction: 'outbound',
      type: 'opt_in_prompt',
      status: result.success ? 'sent' : 'failed',
      error: result.error || null,
    })
  } else {
    // Existing customer: handle opt-in/out
    const body = event.body.trim().toUpperCase()

    if (body === 'YES') {
      await supabase
        .from('customers')
        .update({ opt_in_status: 'opted_in' })
        .eq('id', customer.id)

      // Send welcome coupon
      const couponCode = `W${restaurant.welcome_discount_cents / 100}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      const { data: coupon } = await supabase
        .from('coupons')
        .insert({
          restaurant_id: restaurant.id,
          customer_id: customer.id,
          type: 'welcome',
          code: couponCode,
          discount_cents: restaurant.welcome_discount_cents,
          status: 'sent',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      const welcomeMessage = `Welcome! Your coupon code is ${couponCode} for ₹${restaurant.welcome_discount_cents / 100} OFF. Reply STOP to opt out.`

      const result = await adapter.sendText(event.from, welcomeMessage)

      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'opt_in_confirm',
        status: result.success ? 'sent' : 'failed',
        error: result.error || null,
      })
    } else if (body === 'STOP') {
      await supabase
        .from('customers')
        .update({ opt_in_status: 'opted_out' })
        .eq('id', customer.id)

      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'inbound',
        type: 'opt_out',
        status: 'sent',
      })
    }
  }

  return NextResponse.json({ status: 'ok' })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/whatsapp/
git commit -m "feat: add WhatsApp webhook handler"
```

---

### Task 2.5: Public Intake Form

**Files:**
- Create: `src/app/form/[slug]/page.tsx`
- Create: `src/app/form/[slug]/actions.ts`

- [ ] **Step 1: Create server action**

Create `src/app/form/[slug]/actions.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^\+91\d{10}$/),
  birthdayMonth: z.coerce.number().int().min(1).max(12).optional(),
  birthdayDay: z.coerce.number().int().min(1).max(31).optional(),
  foodPreference: z.string().optional(),
})

export async function submitIntakeForm(slug: string, formData: FormData) {
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!restaurant) {
    throw new Error('Restaurant not found')
  }

  const validated = schema.parse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    birthdayMonth: formData.get('birthdayMonth'),
    birthdayDay: formData.get('birthdayDay'),
    foodPreference: formData.get('foodPreference'),
  })

  const phone = validated.phone.replace('+', '')

  // Create pending customer
  const { data: customer } = await supabase
    .from('customers')
    .insert({
      restaurant_id: restaurant.id,
      phone,
      name: validated.name,
      opt_in_status: 'pending',
      birthday_month: validated.birthdayMonth || null,
      birthday_day: validated.birthdayDay || null,
      food_preference: validated.foodPreference || null,
    })
    .select()
    .single()

  // Create welcome coupon
  const couponCode = `W${restaurant.welcome_discount_cents / 100}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  await supabase.from('coupons').insert({
    restaurant_id: restaurant.id,
    customer_id: customer?.id,
    type: 'welcome',
    code: couponCode,
    discount_cents: restaurant.welcome_discount_cents,
    status: 'sent',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })

  // Return Click-to-Chat URL
  const waUrl = `https://wa.me/${restaurant.whatsapp_number}?text=hello`

  return waUrl
}
```

- [ ] **Step 2: Create form page**

Create `src/app/form/[slug]/page.tsx`:
```typescript
'use client'

import { submitIntakeForm } from './actions'
import { useState } from 'react'

export default function IntakeFormPage({ params }: { params: { slug: string } }) {
  const [waUrl, setWaUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const url = await submitIntakeForm(params.slug, formData)
    setWaUrl(url)
  }

  if (waUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Thank you!</h1>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white px-6 py-3 rounded inline-block"
          >
            Get Your Coupon on WhatsApp
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Join Our Coupon Program</h1>
        <input
          type="text"
          name="name"
          placeholder="Name"
          required
          className="border p-2"
        />
        <input
          type="text"
          name="phone"
          placeholder="WhatsApp Number (+91xxxxxxxxxx)"
          required
          className="border p-2"
        />
        <input
          type="number"
          name="birthdayMonth"
          placeholder="Birthday Month (1-12)"
          min={1}
          max={12}
          className="border p-2"
        />
        <input
          type="number"
          name="birthdayDay"
          placeholder="Birthday Day (1-31)"
          min={1}
          max={31}
          className="border p-2"
        />
        <input
          type="text"
          name="foodPreference"
          placeholder="Food Preference (optional)"
          className="border p-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2">
          Submit
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/form/
git commit -m "feat: add public intake form"
```

---

### Task 2.6: Test Slice 2

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test public form**

1. Visit `http://localhost:3000/form/your-restaurant-slug`
2. Fill in form
3. Verify redirect to WhatsApp link
4. Check Supabase for customer + coupon

- [ ] **Step 3: Test webhook (manual)**

1. Use ngrok or similar to expose localhost
2. Configure OpenWA webhook URL
3. Send "hello" from WhatsApp
4. Verify opt-in prompt sent
5. Reply "YES"
6. Verify welcome coupon sent

- [ ] **Step 4: Commit (if fixes needed)**

```bash
git add .
git commit -m "fix: slice 2 test fixes"
```
