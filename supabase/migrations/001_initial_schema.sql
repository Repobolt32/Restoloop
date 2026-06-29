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
