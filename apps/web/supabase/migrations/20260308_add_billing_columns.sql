-- Add tax and bill items columns
ALTER TABLE public.tenants 
  ADD COLUMN IF NOT EXISTS tax_cgst NUMERIC(5,2) NOT NULL DEFAULT 2.50,
  ADD COLUMN IF NOT EXISTS tax_sgst NUMERIC(5,2) NOT NULL DEFAULT 2.50;

ALTER TABLE public.coupons 
  ADD COLUMN IF NOT EXISTS bill_items JSONB;
