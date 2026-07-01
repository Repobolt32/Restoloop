## Slice 7: "Credits Work"

**Activates:** Phase 6 (Admin + Billing)

**Required Tech Skills:**
- Next.js Webhook endpoints & API routes: `route-handlers`, `vercel-functions`
- Payment integrations / external checkout scripts & State: `vercel-react-best-practices`, `typescript-best-practices`
- UI Styling / Top-up controls: `frontend-design`, `tailwind-design-system`, `web-design-guidelines`
- E2E Testing / TDD: `playwright`, `webapp-testing`, `tdd`, `e2e-testing-patterns`

**Ships:** Owner can self-serve top-up via Razorpay

### Task 7.1: Razorpay Integration

**Files:**
- Create: `src/lib/razorpay.ts`
- Create: `src/app/api/razorpay/create-order/route.ts`
- Create: `src/app/api/razorpay/webhook/route.ts`

**Ref mcp verify:** Razorpay webhook signature (already verified)

- [ ] **Step 1: Install Razorpay**

```bash
npm install razorpay
```

- [ ] **Step 2: Create Razorpay client**

Create `src/lib/razorpay.ts`:
```typescript
import Razorpay from 'razorpay'

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})
```

- [ ] **Step 3: Create order endpoint**

Create `src/app/api/razorpay/create-order/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { razorpay } from '@/lib/razorpay'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { amount, credits } = await request.json()

  const order = await razorpay.orders.create({
    amount: amount * 100, // Razorpay expects paise
    currency: 'INR',
    receipt: `credits_${user.id}_${Date.now()}`,
    notes: {
      credits: credits.toString(),
      userId: user.id,
    },
  })

  return NextResponse.json({ orderId: order.id })
}
```

- [ ] **Step 4: Create webhook handler**

Create `src/app/api/razorpay/webhook/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import Razorpay from 'razorpay'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature') || ''

  const isValid = Razorpay.validateWebhookSignature(
    body,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET!
  )

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity
    const userId = payment.notes.userId
    const credits = parseInt(payment.notes.credits)

    const supabase = await createClient()

    // Add credits to restaurant
    await supabase
      .from('restaurants')
      .update({ credits: supabase.raw(`credits + ${credits}`) })
      .eq('owner_id', userId)
  }

  return NextResponse.json({ status: 'ok' })
}
```

- [ ] **Step 5: Add env vars**

Add to `.env.local`:
```env
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/razorpay.ts src/app/api/razorpay/ .env.local
git commit -m "feat: add Razorpay integration"
```

---

### Task 7.2: Top-Up UI

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Create settings page with top-up**

Create `src/app/dashboard/settings/page.tsx`:
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import Script from 'next/script'

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchRestaurant()
  }, [])

  const fetchRestaurant = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', user?.id)
      .single()
    setRestaurant(data)
  }

  const handleTopUp = async (credits: number) => {
    const amount = credits * 1 // ₹1 per credit

    const res = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, credits }),
    })

    const { orderId } = await res.json()

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount * 100,
      currency: 'INR',
      name: 'Restoloop',
      description: `${credits} credits`,
      order_id: orderId,
      handler: async (response: any) => {
        alert('Payment successful!')
        fetchRestaurant()
      },
      prefill: {
        email: restaurant?.email || '',
      },
      theme: {
        color: '#3B82F6',
      },
    }

    const razorpay = new (window as any).Razorpay(options)
    razorpay.open()
  }

  if (!restaurant) return <div>Loading...</div>

  return (
    <div className="min-h-screen p-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="border p-4 rounded mb-8">
        <h2 className="text-xl font-semibold mb-4">Credits</h2>
        <p className="text-2xl mb-4">{restaurant.credits} credits</p>
        <div className="flex gap-4">
          <button
            onClick={() => handleTopUp(100)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Buy 100 credits (₹100)
          </button>
          <button
            onClick={() => handleTopUp(500)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Buy 500 credits (₹500)
          </button>
          <button
            onClick={() => handleTopUp(1000)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Buy 1000 credits (₹1000)
          </button>
        </div>
      </div>

      <div className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Restaurant Info</h2>
        <p><strong>Name:</strong> {restaurant.name}</p>
        <p><strong>Slug:</strong> {restaurant.slug}</p>
        <p><strong>WhatsApp:</strong> {restaurant.whatsapp_number}</p>
        <p><strong>Public URL:</strong> {`${window.location.origin}/form/${restaurant.slug}`}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add link to dashboard**

Edit `src/app/dashboard/page.tsx`, add to quick-action cards:
```typescript
<Link href="/dashboard/settings" className="border p-4 rounded hover:bg-gray-50">
  <h2 className="text-xl font-semibold">Settings</h2>
</Link>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/settings/ src/app/dashboard/page.tsx
git commit -m "feat: add top-up UI"
```

---

### Task 7.3: Test Slice 7

- [ ] **Step 1: Configure Razorpay**

1. Create Razorpay test account
2. Get test API keys
3. Add to `.env.local`

- [ ] **Step 2: Test top-up**

1. Visit `http://localhost:3000/dashboard/settings`
2. Click "Buy 100 credits"
3. Complete test payment
4. Verify credits added
5. Verify webhook received

- [ ] **Step 3: Commit (if fixes needed)**

```bash
git add .
git commit -m "fix: slice 7 test fixes"
```
