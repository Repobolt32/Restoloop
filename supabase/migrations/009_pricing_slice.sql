-- Add plan_expires_at column to restaurants
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Backfill plan_expires_at for existing trial restaurants
UPDATE restaurants
SET plan_expires_at = trial_expires_at
WHERE plan = 'trial' AND plan_expires_at IS NULL AND trial_expires_at IS NOT NULL;

-- Update deduct_credit function to check for active trial plan
CREATE OR REPLACE FUNCTION deduct_credit(restaurant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r_plan text;
  r_plan_expires_at timestamp with time zone;
  current_credits integer;
  is_active_trial boolean;
BEGIN
  -- Select details for update to lock the row
  SELECT plan, plan_expires_at, credits INTO r_plan, r_plan_expires_at, current_credits
  FROM restaurants
  WHERE id = restaurant_id
  FOR UPDATE;

  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'restaurant_not_found';
  END IF;

  -- Determine if trial is active
  is_active_trial := (r_plan = 'trial' AND (r_plan_expires_at IS NULL OR r_plan_expires_at > now()));

  -- If active trial, skip credit deduction
  IF is_active_trial THEN
    RETURN;
  END IF;

  IF current_credits > 0 THEN
    UPDATE restaurants
    SET credits = credits - 1
    WHERE id = restaurant_id;
  ELSE
    RAISE EXCEPTION 'insufficient_credits';
  END IF;
END;
$$;
