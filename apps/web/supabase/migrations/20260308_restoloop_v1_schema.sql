-- ============================================================
-- Restoloop MVP Schema v1
-- ============================================================
-- Applied via Supabase MCP. This file is the canonical source of truth.
-- Run: supabase db push (if resetting local dev)
-- ============================================================

-- TENANTS
CREATE TABLE IF NOT EXISTS public.tenants (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  slug             TEXT        NOT NULL UNIQUE,
  credits_balance  INTEGER     NOT NULL DEFAULT 0,
  coupon_welcome   INTEGER     NOT NULL DEFAULT 50,
  coupon_bday      INTEGER     NOT NULL DEFAULT 38,
  coupon_winback   INTEGER     NOT NULL DEFAULT 30,
  tax_rate         NUMERIC(5,2) NOT NULL DEFAULT 5.0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_select_own"
  ON public.tenants FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "tenants_insert_own"
  ON public.tenants FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "tenants_update_own"
  ON public.tenants FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- CUSTOMERS
-- Note: No anniversary column — not needed for MVP
CREATE TABLE IF NOT EXISTS public.customers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  phone      TEXT        NOT NULL,
  birthday   DATE,
  last_visit TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, phone)
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_tenant_all"
  ON public.customers FOR ALL
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

-- COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('welcome', 'bday', 'winback')),
  code        TEXT        NOT NULL UNIQUE,
  discount    INTEGER     NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'redeemed', 'expired')),
  bill_amount NUMERIC(10,2),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_tenant_all"
  ON public.coupons FOR ALL
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

-- Public read so billing counter can validate coupon codes without auth
CREATE POLICY "coupons_public_validate"
  ON public.coupons FOR SELECT
  USING (true);

-- MESSAGE LOG
-- status: sent | failed | delivered | blocked (blocked = tenant out of credits)
CREATE TABLE IF NOT EXISTS public.message_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id   UUID        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  coupon_id     UUID        REFERENCES public.coupons(id) ON DELETE SET NULL,
  wa_message_id TEXT,
  status        TEXT        NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered', 'blocked')),
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_log_tenant_all"
  ON public.message_log FOR ALL
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

-- PLATFORM CREDITS (super-admin wallet — single row, service-role access only)
CREATE TABLE IF NOT EXISTS public.platform_credits (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  balance    INTEGER     NOT NULL DEFAULT 1000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_credits ENABLE ROW LEVEL SECURITY;
-- No user-level policies — accessed only via service role key in server API routes

INSERT INTO public.platform_credits (balance) VALUES (1000)
ON CONFLICT DO NOTHING;
