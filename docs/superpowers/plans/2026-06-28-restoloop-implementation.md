# Restoloop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build WhatsApp-first customer winback engine for Indian restaurants (Tier-2/3, owner-operated, "set and forget")

**Architecture:** Next.js (App Router) monolith with Server Actions + Route Handlers, Supabase (Postgres + auth + RLS), Vercel cron, OpenWA WhatsApp adapter (dev) → Meta Cloud API (prod), Razorpay billing

**Tech Stack:** Next.js 14+, Supabase, TypeScript, Vercel, OpenWA, Razorpay Node SDK

---

## Phases (Horizontal Layers)

- **P1: Foundation** — Next.js + Supabase + auth + schema + RLS
- **P2: Core Data** — customers, coupons, RLS policies
- **P3: WhatsApp Adapter** — OpenWA + Meta, webhook handler, message logging
- **P4: Campaign Engine** — cron (10am IST), 3 triggers, credit logic
- **P5: Dashboard UI** — 5 surfaces + public intake form
- **P6: Admin + Billing** — Razorpay self-serve, super admin panel

## Slices (Vertical, Each Ships Working Feature)

- **S1: "Hello Restoloop"** — signup → restaurant profile → empty dashboard
- **S2: "Customer joins"** — QR → WhatsApp opt-in → welcome coupon
- **S3: "Owner sees activity"** — dashboard tables, recent activity feed
- **S4: "First campaign fires"** — cron, welcome reminder (25d) runs
- **S5: "Birthday + winback fire"** — remaining 2 campaign types
- **S6: "Coupon redemption"** — validation screen, last_visit_at update
- **S7: "Credits work"** — Razorpay self-serve top-up
- **S8: "Admin sees all"** — super admin panel

---

## Slice 1: "Hello Restoloop"

**Activates:** Phase 1 (Foundation)

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

---

## Slice 2: "Customer Joins"

**Activates:** Phase 2 (Core Data) + Phase 3 (WhatsApp Adapter)

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

---

## Slice 3: "Owner Sees Activity"

**Activates:** Phase 5 (Dashboard UI)

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

---

## Slice 4: "First Campaign Fires"

**Activates:** Phase 4 (Campaign Engine)

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

---

## Slice 5: "Birthday + Winback Fire"

**Activates:** Phase 4 (Campaign Engine)

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

---

## Slice 6: "Coupon Redemption"

**Activates:** Phase 5 (Dashboard UI)

**Ships:** Owner validates coupon, last_visit_at updates

### Task 6.1: Coupon Validation Page

**Files:**
- Create: `src/app/dashboard/validate/page.tsx`
- Create: `src/app/dashboard/validate/actions.ts`

- [ ] **Step 1: Create server action**

Create `src/app/dashboard/validate/actions.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function validateCoupon(code: string) {
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

  const { data: coupon } = await supabase
    .from('coupons')
    .select('*, customers(*)')
    .eq('code', code)
    .single()

  if (!coupon) {
    return { error: 'Coupon not found' }
  }

  if (coupon.restaurant_id !== restaurant.id) {
    return { error: 'Wrong restaurant' }
  }

  if (coupon.status === 'redeemed') {
    return { error: 'Already redeemed' }
  }

  if (new Date(coupon.expires_at) < new Date()) {
    return { error: 'Expired' }
  }

  // Mark as redeemed
  await supabase
    .from('coupons')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
    })
    .eq('id', coupon.id)

  // Update customer last_visit_at
  await supabase
    .from('customers')
    .update({ last_visit_at: new Date().toISOString() })
    .eq('id', coupon.customer_id)

  return {
    success: true,
    customer: coupon.customers,
    discount: coupon.discount_cents,
  }
}
```

- [ ] **Step 2: Create validation page**

Create `src/app/dashboard/validate/page.tsx`:
```typescript
'use client'

import { validateCoupon } from './actions'
import { useState } from 'react'

export default function ValidatePage() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await validateCoupon(code)
    setResult(res)
    if (res.success) {
      setCode('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleValidate} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Validate Coupon</h1>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter coupon code"
          required
          className="border p-2 font-mono text-lg"
        />
        <button type="submit" className="bg-blue-500 text-white p-2">
          Validate
        </button>

        {result?.error && (
          <div className="bg-red-100 border border-red-500 p-4 rounded">
            <p className="text-red-700 font-semibold">{result.error}</p>
          </div>
        )}

        {result?.success && (
          <div className="bg-green-100 border border-green-500 p-4 rounded">
            <p className="text-green-700 font-semibold">✓ Coupon Valid!</p>
            <p className="mt-2">Customer: {result.customer?.name || 'Anonymous'}</p>
            <p>Discount: ₹{result.discount / 100}</p>
          </div>
        )}
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Add link to dashboard**

Edit `src/app/dashboard/page.tsx`, add to quick-action cards:
```typescript
<Link href="/dashboard/validate" className="border p-4 rounded hover:bg-gray-50">
  <h2 className="text-xl font-semibold">Validate Coupon</h2>
</Link>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/validate/ src/app/dashboard/page.tsx
git commit -m "feat: add coupon validation page"
```

---

### Task 6.2: Test Slice 6

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test valid coupon**

1. Visit `http://localhost:3000/dashboard/validate`
2. Enter valid coupon code
3. Verify success message
4. Check coupon status = redeemed
5. Check customer last_visit_at updated

- [ ] **Step 3: Test invalid coupon**

1. Enter non-existent code
2. Verify "Coupon not found"
3. Enter redeemed code
4. Verify "Already redeemed"
5. Enter expired code
6. Verify "Expired"

- [ ] **Step 4: Commit (if fixes needed)**

```bash
git add .
git commit -m "fix: slice 6 test fixes"
```

---

## Slice 7: "Credits Work"

**Activates:** Phase 6 (Admin + Billing)

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

---

## Slice 8: "Admin Sees All"

**Activates:** Phase 6 (Admin + Billing)

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

---

## Summary

**Total Tasks:** 28 tasks across 8 slices

**Execution Order:** S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8

**Each Slice Ships:**
- S1: Signup → restaurant → dashboard ✅
- S2: QR → opt-in → welcome coupon ✅
- S3: Dashboard tables + activity ✅
- S4: Welcome reminder cron ✅
- S5: Birthday + winback cron ✅
- S6: Coupon validation ✅
- S7: Razorpay top-up ✅
- S8: Admin panel ✅

**Ref mcp Verify:** Embedded in each slice's first task (per lib, once)

**Commits:** After each task + each test phase

**Ready to execute slice-by-slice.**
