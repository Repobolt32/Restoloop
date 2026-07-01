## Slice 8: "Admin Sees All"

**Activates:** Phase 6 (Admin + Billing)

**Required Tech Skills:**
- Next.js Pages & Client/Server logic: `vercel-react-best-practices`, `typescript-best-practices`
- Next.js Server Actions: `vercel-react-best-practices`
- UI Styling / Admin Tables & Panels: `frontend-design`, `tailwind-design-system`, `web-design-guidelines`
- E2E Testing / TDD: `playwright`, `webapp-testing`, `tdd`, `e2e-testing-patterns`

**Ships:** Super admin can view restaurants + add credits

### Task 8.1: Admin Panel

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/[id]/page.tsx`
- Create: `src/app/admin/[id]/actions.ts`

- [ ] **Step 1: Create admin list page**

Create `src/app/admin/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin (hardcode email for now)
  if (user.email !== 'admin@restoloop.com') {
    redirect('/dashboard')
  }

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Credits</th>
              <th className="border p-2">Plan</th>
              <th className="border p-2">Created</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants?.map((restaurant) => (
              <tr key={restaurant.id}>
                <td className="border p-2">{restaurant.name}</td>
                <td className="border p-2">{restaurant.credits}</td>
                <td className="border p-2">{restaurant.plan}</td>
                <td className="border p-2">
                  {new Date(restaurant.created_at).toLocaleDateString()}
                </td>
                <td className="border p-2">
                  <Link
                    href={`/admin/${restaurant.id}`}
                    className="text-blue-500 hover:underline"
                  >
                    Manage
                  </Link>
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

- [ ] **Step 2: Create server action**

Create `src/app/admin/[id]/actions.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addCredits(restaurantId: string, credits: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'admin@restoloop.com') {
    throw new Error('Unauthorized')
  }

  await supabase
    .from('restaurants')
    .update({ credits: supabase.raw(`credits + ${credits}`) })
    .eq('id', restaurantId)

  revalidatePath('/admin')
  revalidatePath(`/admin/${restaurantId}`)
}
```

- [ ] **Step 3: Create admin detail page**

Create `src/app/admin/[id]/page.tsx`:
```typescript
'use client'

import { addCredits } from './actions'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

export default function AdminDetailPage({ params }: { params: { id: string } }) {
  const [restaurant, setRestaurant] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchRestaurant()
  }, [])

  const fetchRestaurant = async () => {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', params.id)
      .single()
    setRestaurant(data)
  }

  const handleAddCredits = async (credits: number) => {
    await addCredits(params.id, credits)
    fetchRestaurant()
  }

  if (!restaurant) return <div>Loading...</div>

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">{restaurant.name}</h1>

      <div className="border p-4 rounded mb-8">
        <h2 className="text-xl font-semibold mb-4">Credits</h2>
        <p className="text-2xl mb-4">{restaurant.credits} credits</p>
        <div className="flex gap-4">
          <button
            onClick={() => handleAddCredits(100)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add 100
          </button>
          <button
            onClick={() => handleAddCredits(500)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add 500
          </button>
          <button
            onClick={() => handleAddCredits(1000)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add 1000
          </button>
        </div>
      </div>

      <div className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Details</h2>
        <p><strong>Owner:</strong> {restaurant.owner_id}</p>
        <p><strong>WhatsApp:</strong> {restaurant.whatsapp_number}</p>
        <p><strong>Slug:</strong> {restaurant.slug}</p>
        <p><strong>Plan:</strong> {restaurant.plan}</p>
        <p><strong>Created:</strong> {new Date(restaurant.created_at).toLocaleString()}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/
git commit -m "feat: add admin panel"
```

---

### Task 8.2: Test Slice 8

- [ ] **Step 1: Login as admin**

1. Create admin@restoloop.com account
2. Login
3. Visit `http://localhost:3000/admin`

- [ ] **Step 2: Test restaurant list**

1. Verify all restaurants appear
2. Click "Manage" on one
3. Verify details page

- [ ] **Step 3: Test add credits**

1. Click "Add 100"
2. Verify credits increase
3. Refresh page
4. Verify persisted

- [ ] **Step 4: Commit (if fixes needed)**

```bash
git add .
git commit -m "fix: slice 8 test fixes"
```
