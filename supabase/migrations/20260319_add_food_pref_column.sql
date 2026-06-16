-- Add food_pref column to customers table for public intake form inserts
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS food_pref TEXT;
