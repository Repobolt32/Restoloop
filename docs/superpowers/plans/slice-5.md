## Slice 5: "Birthday + Winback Fire"

**Activates:** Phase 4 (Campaign Engine)

**Required Tech Skills:**
- Next.js API Routes & Webhooks: `route-handlers`, `vercel-functions`
- Campaign Engine & DB queries: `typescript-best-practices`
- UI / Vercel configurations: `vercel-react-best-practices`
- E2E Testing / TDD: `playwright`, `webapp-testing`, `tdd`, `e2e-testing-patterns`

**Ships:** Birthday + winback campaigns run

### Task 5.1: Birthday Campaign

**Files:**
- Modify: `src/lib/campaigns/index.ts`

- [ ] **Step 1: Add birthday campaign**

Add to `src/lib/campaigns/index.ts`:
```typescript
export async function runBirthdayCampaigns() {
  const supabase = await createClient()
  const adapter = createWhatsAppAdapter()

  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('opt_in_status', 'opted_in')
    .eq('birthday_month', month)
    .eq('birthday_day', day)

  for (const customer of customers || []) {
    // Check if birthday coupon already sent this year
    const yearStart = new Date(today.getFullYear(), 0, 1)
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('type', 'birthday')
      .gte('created_at', yearStart.toISOString())
      .single()

    if (existing) continue

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', customer.restaurant_id)
      .single()

    if (!restaurant) continue

    // Check credits
    if (restaurant.credits <= 0) {
      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'campaign',
        status: 'blocked_no_credits',
      })
      continue
    }

    const couponCode = Math.random().toString(36).substring(2, 10).toUpperCase().replace(/[IO01]/g, 'X')

    await supabase.from('coupons').insert({
      restaurant_id: restaurant.id,
      customer_id: customer.id,
      type: 'birthday',
      code: couponCode,
      discount_cents: restaurant.birthday_discount_cents,
      status: 'sent',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })

    const birthdayMessage = `Happy Birthday ${customer.name || 'there'}! Enjoy ₹${restaurant.birthday_discount_cents / 100} OFF at ${restaurant.name}. Code: ${couponCode}. Reply STOP to opt out.`

    const result = await adapter.sendText(customer.phone, birthdayMessage)

    await supabase.from('message_logs').insert({
      restaurant_id: restaurant.id,
      customer_id: customer.id,
      direction: 'outbound',
      type: 'campaign',
      status: result.success ? 'sent' : 'failed',
      error: result.error || null,
    })

    if (result.success) {
      await supabase.rpc('deduct_credit', { restaurant_id: restaurant.id })
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/campaigns/
git commit -m "feat: add birthday campaign"
```

---

### Task 5.2: Winback Campaign

**Files:**
- Modify: `src/lib/campaigns/index.ts`

- [ ] **Step 1: Add winback campaign**

Add to `src/lib/campaigns/index.ts`:
```typescript
export async function runWinbackCampaigns() {
  const supabase = await createClient()
  const adapter = createWhatsAppAdapter()

  const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('opt_in_status', 'opted_in')
    .lte('last_visit_at', fortyDaysAgo.toISOString())

  for (const customer of customers || []) {
    // Check if winback coupon sent in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const { data: recent } = await supabase
      .from('coupons')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('type', 'winback')
      .gte('created_at', sevenDaysAgo.toISOString())
      .single()

    if (recent) continue

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', customer.restaurant_id)
      .single()

    if (!restaurant) continue

    if (restaurant.credits <= 0) {
      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'campaign',
        status: 'blocked_no_credits',
      })
      continue
    }

    const couponCode = Math.random().toString(36).substring(2, 10).toUpperCase().replace(/[IO01]/g, 'X')

    await supabase.from('coupons').insert({
      restaurant_id: restaurant.id,
      customer_id: customer.id,
      type: 'winback',
      code: couponCode,
      discount_cents: restaurant.winback_discount_cents,
      status: 'sent',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })

    const winbackMessage = `We miss you ${customer.name || 'there'}! Come back for ₹${restaurant.winback_discount_cents / 100} OFF. Code: ${couponCode}. Reply STOP to opt out.`

    const result = await adapter.sendText(customer.phone, winbackMessage)

    await supabase.from('message_logs').insert({
      restaurant_id: restaurant.id,
      customer_id: customer.id,
      direction: 'outbound',
      type: 'campaign',
      status: result.success ? 'sent' : 'failed',
      error: result.error || null,
    })

    if (result.success) {
      await supabase.rpc('deduct_credit', { restaurant_id: restaurant.id })
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/campaigns/
git commit -m "feat: add winback campaign"
```

---

### Task 5.3: Combined Cron

**Files:**
- Modify: `src/app/api/cron/welcome-reminder/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Update cron to run all campaigns**

Edit `src/app/api/cron/welcome-reminder/route.ts`:
```typescript
import { runWelcomeReminders, runBirthdayCampaigns, runWinbackCampaigns } from '@/lib/campaigns'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    await runWelcomeReminders()
    await runBirthdayCampaigns()
    await runWinbackCampaigns()
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/cron/
git commit -m "feat: run all campaigns in single cron"
```

---

### Task 5.4: Test Slice 5

- [ ] **Step 1: Seed test data**

Create customer with birthday today + customer with `last_visit_at` 40+ days ago.

- [ ] **Step 2: Test cron**

```bash
curl -H "Authorization: Bearer your-cron-secret" http://localhost:3000/api/cron/welcome-reminder
```

- [ ] **Step 3: Verify**

1. Check birthday coupons created
2. Check winback coupons created
3. Check credits deducted
4. Check message_logs

- [ ] **Step 4: Commit (if fixes needed)**

```bash
git add .
git commit -m "fix: slice 5 test fixes"
```
