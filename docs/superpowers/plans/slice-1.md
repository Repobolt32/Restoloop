## Slice 1: "Hello Restoloop"

**Activates:** Phase 1 (Foundation)

**Required Tech Skills:**
- UI Design & Layout: `frontend-design`, `tailwind-design-system`, `web-design-guidelines`
- Next.js Frontend & Auth client: `vercel-react-best-practices`, `typescript-best-practices`
- Next.js Middleware / Client configs: `vercel-functions`
- E2E Testing / TDD: `playwright`, `webapp-testing`, `tdd`, `e2e-testing-patterns`

**Ships:** Owner can signup, create restaurant profile, see empty dashboard

### Task 1.1: Initialize Next.js + Supabase

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.local`
- Create: `vercel.json`
- Create: `.gitignore`

- [ ] **Step 1: Create Next.js app**

```bash
npx create-next-app@latest . --typescript --app --tailwind --eslint --src-dir --import-alias "@/*"
```

- [ ] **Step 2: Install Supabase**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 3: Create Supabase client**

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component, ignore
          }
        },
      },
    }
  )
}
```

- [ ] **Step 4: Add env vars**

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WHATSAPP_PROVIDER=openwa
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: initialize Next.js + Supabase"
```

---

### Task 1.2: Database Schema + RLS

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/migrations/002_rls_policies.sql`

**Ref mcp verify:** Supabase RLS `auth.uid()` syntax (already verified)

- [ ] **Step 1: Create schema migration**

Create `supabase/migrations/001_initial_schema.sql`:
```sql
-- Restaurants table
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null,
  name text not null,
  address text,
  phone text,
  email text,
  slug text unique not null,
  whatsapp_number text not null,
  welcome_discount_cents integer not null default 5000,
  birthday_discount_cents integer not null default 3800,
  winback_discount_cents integer not null default 3000,
  credits integer not null default 1000,
  plan text not null default 'free',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Customers table
create table customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants not null,
  phone text not null,
  name text,
  opt_in_status text not null default 'pending',
  birthday_month integer,
  birthday_day integer,
  food_preference text,
  last_visit_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (restaurant_id, phone)
);

-- Coupons table
create table coupons (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants not null,
  customer_id uuid references customers not null,
  type text not null,
  code text unique not null,
  discount_cents integer not null,
  status text not null default 'sent',
  expires_at timestamp with time zone not null,
  redeemed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Message logs table
create table message_logs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants,
  customer_id uuid references customers,
  direction text not null,
  type text not null,
  status text not null,
  provider_message_id text unique,
  error text,
  created_at timestamp with time zone default now()
);
```

- [ ] **Step 2: Create RLS policies**

Create `supabase/migrations/002_rls_policies.sql`:
```sql
-- Enable RLS
alter table restaurants enable row level security;
alter table customers enable row level security;
alter table coupons enable row level security;
alter table message_logs enable row level security;

-- Restaurants: owner can CRUD own
create policy "Owners can view own restaurants"
  on restaurants for select to authenticated
  using (owner_id = auth.uid());

create policy "Owners can insert own restaurants"
  on restaurants for insert to authenticated
  with check (owner_id = auth.uid());

create policy "Owners can update own restaurants"
  on restaurants for update to authenticated
  using (owner_id = auth.uid());

create policy "Owners can delete own restaurants"
  on restaurants for delete to authenticated
  using (owner_id = auth.uid());

-- Customers: owner can CRUD via restaurant
create policy "Owners can view customers"
  on customers for select to authenticated
  using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

create policy "Owners can insert customers"
  on customers for insert to authenticated
  with check (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

create policy "Owners can update customers"
  on customers for update to authenticated
  using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

create policy "Owners can delete customers"
  on customers for delete to authenticated
  using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

-- Coupons: owner can CRUD via restaurant
create policy "Owners can view coupons"
  on coupons for select to authenticated
  using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

create policy "Owners can insert coupons"
  on coupons for insert to authenticated
  with check (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

create policy "Owners can update coupons"
  on coupons for update to authenticated
  using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

create policy "Owners can delete coupons"
  on coupons for delete to authenticated
  using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

-- Message logs: owner can view via restaurant
create policy "Owners can view message logs"
  on message_logs for select to authenticated
  using (restaurant_id in (select id from restaurants where owner_id = auth.uid()) or restaurant_id is null);

create policy "System can insert message logs"
  on message_logs for insert to authenticated
  with check (true);
```

- [ ] **Step 3: Run migrations**

```bash
npx supabase db push
```

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema + RLS policies"
```

---

### Task 1.3: Auth Pages (Signup/Login)

**Files:**
- Create: `src/app/signup/page.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/auth/callback/route.ts`

**Ref mcp verify:** Supabase auth API (already verified)

- [ ] **Step 1: Create signup page**

Create `src/app/signup/page.tsx`:
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSignup} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Sign Up</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2"
        />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" className="bg-blue-500 text-white p-2">
          Sign Up
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Create login page**

Create `src/app/login/page.tsx`:
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2"
        />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" className="bg-blue-500 text-white p-2">
          Login
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Create auth callback**

Create `src/app/auth/callback/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/signup/ src/app/login/ src/app/auth/
git commit -m "feat: add auth pages (signup, login, callback)"
```

---

### Task 1.4: Restaurant Profile Page

**Files:**
- Create: `src/app/dashboard/create/page.tsx`
- Create: `src/app/dashboard/create/actions.ts`

**Ref mcp verify:** Next.js Server Actions (already verified)

- [ ] **Step 1: Create server action**

Create `src/app/dashboard/create/actions.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  whatsappNumber: z.string().regex(/^91\d{10}$/),
  welcomeDiscountCents: z.coerce.number().int().positive(),
  birthdayDiscountCents: z.coerce.number().int().positive(),
  winbackDiscountCents: z.coerce.number().int().positive(),
})

export async function createRestaurant(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const validated = schema.parse({
    name: formData.get('name'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    whatsappNumber: formData.get('whatsappNumber'),
    welcomeDiscountCents: formData.get('welcomeDiscountCents'),
    birthdayDiscountCents: formData.get('birthdayDiscountCents'),
    winbackDiscountCents: formData.get('winbackDiscountCents'),
  })

  // Generate slug from name
  const slug = validated.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { error } = await supabase.from('restaurants').insert({
    owner_id: user.id,
    name: validated.name,
    address: validated.address || null,
    phone: validated.phone || null,
    email: validated.email || null,
    slug: slug,
    whatsapp_number: validated.whatsappNumber,
    welcome_discount_cents: validated.welcomeDiscountCents,
    birthday_discount_cents: validated.birthdayDiscountCents,
    winback_discount_cents: validated.winbackDiscountCents,
  })

  if (error) {
    throw new Error(error.message)
  }

  redirect('/dashboard')
}
```

- [ ] **Step 2: Create create page**

Create `src/app/dashboard/create/page.tsx`:
```typescript
import { createRestaurant } from './actions'

export default function CreateRestaurantPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form action={createRestaurant} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Create Restaurant</h1>
        <input
          type="text"
          name="name"
          placeholder="Restaurant Name"
          required
          className="border p-2"
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          className="border p-2"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          className="border p-2"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="border p-2"
        />
        <input
          type="text"
          name="whatsappNumber"
          placeholder="WhatsApp Number (91xxxxxxxxxx)"
          required
          className="border p-2"
        />
        <input
          type="number"
          name="welcomeDiscountCents"
          placeholder="Welcome Discount (cents)"
          defaultValue={5000}
          required
          className="border p-2"
        />
        <input
          type="number"
          name="birthdayDiscountCents"
          placeholder="Birthday Discount (cents)"
          defaultValue={3800}
          required
          className="border p-2"
        />
        <input
          type="number"
          name="winbackDiscountCents"
          placeholder="Winback Discount (cents)"
          defaultValue={3000}
          required
          className="border p-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2">
          Create Restaurant
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/create/
git commit -m "feat: add restaurant profile creation"
```

---

### Task 1.5: Empty Dashboard

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/middleware.ts`

- [ ] **Step 1: Create middleware**

Create `src/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/form')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: Create dashboard page**

Create `src/app/dashboard/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
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

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">{restaurant.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/dashboard/customers/add" className="border p-4 rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Add Customer</h2>
        </Link>
        <Link href="/dashboard/customers" className="border p-4 rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Active Guests</h2>
        </Link>
        <Link href="/dashboard/coupons" className="border p-4 rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Coupons</h2>
        </Link>
      </div>

      <div className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Credits</h2>
        <p className="text-2xl">{restaurant.credits} / 1000</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx src/middleware.ts
git commit -m "feat: add empty dashboard + auth middleware"
```

---

### Task 1.6: Test Slice 1

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test signup flow**

1. Visit `http://localhost:3000/signup`
2. Create account
3. Verify redirect to login

- [ ] **Step 3: Test login flow**

1. Visit `http://localhost:3000/login`
2. Login with credentials
3. Verify redirect to dashboard/create

- [ ] **Step 4: Test restaurant creation**

1. Fill in restaurant details
2. Submit form
3. Verify redirect to dashboard
4. Verify restaurant in Supabase dashboard

- [ ] **Step 5: Commit (if fixes needed)**

```bash
git add .
git commit -m "fix: slice 1 test fixes"
```
