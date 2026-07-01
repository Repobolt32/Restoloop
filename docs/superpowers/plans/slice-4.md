## Slice 4: "First Campaign Fires"

**Activates:** Phase 4 (Campaign Engine)

**Required Tech Skills:**
- Next.js API Routes & Webhooks: `route-handlers`, `vercel-functions`
- Campaign Engine & DB queries: `typescript-best-practices`
- UI / Vercel configurations: `vercel-react-best-practices`
- E2E Testing / TDD: `playwright`, `webapp-testing`, `tdd`, `e2e-testing-patterns`

**Ships:** Cron job runs, welcome reminder (25d) sends

### Task 4.1: Campaign Engine Core

**Files:**
- Create: `src/lib/campaigns/index.ts`

- [ ] **Step 1: Create campaign engine**

Create `src/lib/campaigns/index.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { createWhatsAppAdapter } from '@/lib/whatsapp/adapter'

export async function runWelcomeReminders() {
  const supabase = await createClient()
  const adapter = createWhatsAppAdapter()

  // Find customers who signed up 25 days ago with unredeemed welcome coupons
  const { data: customers } = await supabase
    .from('customers')
    .select('*, coupons(*)')
    .eq('opt_in_status', 'opted_in')
    .filter('created_at', 'gte', new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString())
    .filter('created_at', 'lte', new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString())

  for (const customer of customers || []) {
    const welcomeCoupon = customer.coupons?.find(
      (c: any) => c.type === 'welcome' && c.status === 'sent'
    )

    if (!welcomeCoupon) continue

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', customer.restaurant_id)
      .single()

    if (!restaurant) continue

    const reminderMessage = `Hey ${customer.name || 'there'}! Your coupon ${welcomeCoupon.code} for ${restaurant.name} is still active! Reply STOP to opt out.`

    const result = await adapter.sendText(customer.phone, reminderMessage)

    await supabase.from('message_logs').insert({
      restaurant_id: restaurant.id,
      customer_id: customer.id,
      direction: 'outbound',
      type: 'campaign',
      status: result.success ? 'sent' : 'failed',
      error: result.error || null,
    })

    if (result.success) {
      // Deduct credit
      await supabase.rpc('deduct_credit', { restaurant_id: restaurant.id })
    } else {
      await supabase.from('message_logs').insert({
        restaurant_id: restaurant.id,
        customer_id: customer.id,
        direction: 'outbound',
        type: 'campaign',
        status: 'blocked_no_credits',
      })
    }
  }
}
```

- [ ] **Step 2: Create deduct_credit function**

Create `supabase/migrations/003_deduct_credit.sql`:
```sql
create or replace function deduct_credit(restaurant_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  current_credits integer;
begin
  -- Lock row and get current credits
  select credits into current_credits
  from restaurants
  where id = restaurant_id
  for update;

  if current_credits > 0 then
    update restaurants
    set credits = credits - 1
    where id = restaurant_id;
  else
    raise exception 'insufficient_credits';
  end if;
end;
$$;
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/campaigns/ supabase/
git commit -m "feat: add welcome reminder campaign engine"
```

---

### Task 4.2: Cron Endpoint

**Files:**
- Create: `src/app/api/cron/welcome-reminder/route.ts`
- Modify: `vercel.json`

**Ref mcp verify:** Vercel cron config (already verified)

- [ ] **Step 1: Create cron route**

Create `src/app/api/cron/welcome-reminder/route.ts`:
```typescript
import { runWelcomeReminders } from '@/lib/campaigns'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    await runWelcomeReminders()
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Add to vercel.json**

Edit `vercel.json`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/welcome-reminder",
      "schedule": "30 4 * * *"
    }
  ]
}
```

- [ ] **Step 3: Add CRON_SECRET to env**

Add to `.env.local`:
```env
CRON_SECRET=your-random-secret-here
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/ vercel.json .env.local
git commit -m "feat: add cron endpoint for welcome reminder"
```

---

### Task 4.3: Test Slice 4

- [ ] **Step 1: Seed test data**

Create customer with `created_at` 25 days ago in Supabase dashboard.

- [ ] **Step 2: Test cron manually**

```bash
curl -H "Authorization: Bearer your-cron-secret" http://localhost:3000/api/cron/welcome-reminder
```

- [ ] **Step 3: Verify message sent**

1. Check message_logs table
2. Check WhatsApp (if OpenWA running)
3. Verify credit deducted

- [ ] **Step 4: Commit (if fixes needed)**

```bash
git add .
git commit -m "fix: slice 4 test fixes"
```
