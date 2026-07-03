-- Add discount percentage columns to restaurants table
alter table restaurants
  add column if not exists welcome_discount_percent integer not null default 10,
  add column if not exists birthday_discount_percent integer not null default 15,
  add column if not exists winback_discount_percent integer not null default 20;

-- Add discount percentage and tracking columns to coupons table
alter table coupons
  add column if not exists discount_percent integer not null default 10,
  add column if not exists bill_amount_cents integer,
  add column if not exists discount_amount_cents integer;

-- Update existing data to sensible defaults
update restaurants set
  welcome_discount_percent = coalesce(round(welcome_discount_cents / 100), 10),
  birthday_discount_percent = coalesce(round(birthday_discount_cents / 100), 15),
  winback_discount_percent = coalesce(round(winback_discount_cents / 100), 20);

update coupons set
  discount_percent = coalesce(round(discount_cents / 100), 10);
