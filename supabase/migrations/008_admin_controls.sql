-- Add suspension flag to restaurants
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;

-- Add WhatsApp session data storage
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS whatsapp_session_data JSONB DEFAULT NULL;

-- Admin credit change audit log
CREATE TABLE IF NOT EXISTS admin_credit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants NOT NULL,
  admin_user_id UUID REFERENCES auth.users NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS: admin_credit_logs only readable by admin (service client bypasses anyway)
ALTER TABLE admin_credit_logs ENABLE ROW LEVEL SECURITY;
