-- Campaign toggle flags (all enabled by default)
alter table restaurants
  add column if not exists welcome_reminder_enabled boolean not null default true,
  add column if not exists birthday_campaign_enabled boolean not null default true,
  add column if not exists winback_campaign_enabled  boolean not null default true,
  add column if not exists expiry_reminder_enabled   boolean not null default true;

-- Configurable timing
alter table restaurants
  add column if not exists welcome_reminder_days  integer not null default 25,
  add column if not exists winback_days           integer not null default 40,
  add column if not exists expiry_reminder_days   integer not null default 1;

-- WhatsApp prefill message for intake form QR
alter table restaurants
  add column if not exists whatsapp_prefill_message text default 'Hi, I would like to join your loyalty club!';

-- Link message_logs to specific coupon for tracking
alter table message_logs
  add column if not exists coupon_id uuid references coupons(id);
