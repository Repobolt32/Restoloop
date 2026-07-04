-- Add trial tracking columns to restaurants
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_activated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update credits default value to 0 for new registrations
ALTER TABLE restaurants 
  ALTER COLUMN credits SET DEFAULT 0;
