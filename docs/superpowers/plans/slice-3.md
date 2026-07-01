## Slice 3: "Owner Sees Activity"

**Activates:** Phase 5 (Dashboard UI)

**Required Tech Skills:**
- Next.js Pages & Client/Server logic: `vercel-react-best-practices`, `typescript-best-practices`
- UI Styling / Layout / Tables / Masks: `frontend-design`, `tailwind-design-system`, `web-design-guidelines`
- E2E Testing / TDD: `playwright`, `webapp-testing`, `tdd`, `e2e-testing-patterns`

**Ships:** Dashboard tables showing customers + coupons + recent activity

### Task 3.1: Customers List Page

**Files:**
- Create: `src/app/dashboard/customers/page.tsx`

- [ ] **Step 1: Create customers list**

Create `src/app/dashboard/customers/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) {
    redirect('/dashboard/create')
  }

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Active Guests</h1>

      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Phone</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Last Visit</th>
              <th className="border p-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {customers?.map((customer) => (
              <tr key={customer.id}>
                <td className="border p-2">{customer.name || '-'}</td>
                <td className="border p-2">
                  {customer.phone.slice(0, -4) + '****'}
                </td>
                <td className="border p-2">{customer.opt_in_status}</td>
                <td className="border p-2">
                  {customer.last_visit_at
                    ? new Date(customer.last_visit_at).toLocaleDateString()
                    : '-'}
                </td>
                <td className="border p-2">
                  {new Date(customer.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/customers/
git commit -m "feat: add customers list page"
```

---

### Task 3.2: Coupons List Page

**Files:**
- Create: `src/app/dashboard/coupons/page.tsx`

- [ ] **Step 1: Create coupons list**

Create `src/app/dashboard/coupons/page.tsx`:
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchCoupons()
  }, [filter])

  const fetchCoupons = async () => {
    let query = supabase
      .from('coupons')
      .select('*, customers(name, phone)')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('type', filter)
    }

    const { data } = await query
    setCoupons(data || [])
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Coupons</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('welcome')}
          className={`px-4 py-2 rounded ${filter === 'welcome' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Welcome
        </button>
        <button
          onClick={() => setFilter('birthday')}
          className={`px-4 py-2 rounded ${filter === 'birthday' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Birthday
        </button>
        <button
          onClick={() => setFilter('winback')}
          className={`px-4 py-2 rounded ${filter === 'winback' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Winback
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Code</th>
              <th className="border p-2">Customer</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Discount</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Expires</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="border p-2 font-mono">{coupon.code}</td>
                <td className="border p-2">
                  {coupon.customers?.phone
                    ? coupon.customers.phone.slice(0, -4) + '****'
                    : '-'}
                </td>
                <td className="border p-2">{coupon.type}</td>
                <td className="border p-2">₹{coupon.discount_cents / 100}</td>
                <td className="border p-2">{coupon.status}</td>
                <td className="border p-2">
                  {new Date(coupon.expires_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/coupons/
git commit -m "feat: add coupons list page with filters"
```

---

### Task 3.3: Recent Activity Feed

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Add activity feed**

Edit `src/app/dashboard/page.tsx`, add before the credits section:

```typescript
  const { data: recentLogs } = await supabase
    .from('message_logs')
    .select('*, customers(name, phone)')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })
    .limit(5)
```

Add after credits section:

```typescript
      <div className="border p-4 rounded mt-8">
        <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
        <ul className="space-y-2">
          {recentLogs?.map((log) => (
            <li key={log.id} className="border-b pb-2">
              <span className="font-mono">{log.customers?.phone ? log.customers.phone.slice(0, -4) + '****' : 'Unknown'}</span>
              {' - '}
              <span>{log.type}</span>
              {' - '}
              <span className={log.status === 'sent' ? 'text-green-600' : 'text-red-600'}>
                {log.status}
              </span>
              <span className="text-gray-500 ml-2">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add recent activity feed to dashboard"
```

---

### Task 3.4: Test Slice 3

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test customers list**

1. Visit `http://localhost:3000/dashboard/customers`
2. Verify customers from slice 2 appear
3. Verify phone masking works

- [ ] **Step 3: Test coupons list**

1. Visit `http://localhost:3000/dashboard/coupons`
2. Verify coupons appear
3. Test filter chips (All, Welcome, Birthday, Winback)

- [ ] **Step 4: Test activity feed**

1. Visit `http://localhost:3000/dashboard`
2. Verify recent activity shows last 5 logs

- [ ] **Step 5: Commit (if fixes needed)**

```bash
git add .
git commit -m "fix: slice 3 test fixes"
```
