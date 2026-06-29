-- Enable RLS
alter table restaurants enable row level security;
alter table customers enable row level security;
alter table coupons enable row level security;
alter table message_logs enable row level security;

-- Restaurants: owner can CRUD own
create policy "Owners can view own restaurants" on restaurants for select to authenticated using (owner_id = auth.uid());
create policy "Owners can insert own restaurants" on restaurants for insert to authenticated with check (owner_id = auth.uid());
create policy "Owners can update own restaurants" on restaurants for update to authenticated using (owner_id = auth.uid());
create policy "Owners can delete own restaurants" on restaurants for delete to authenticated using (owner_id = auth.uid());

-- Customers: owner can CRUD via restaurant
create policy "Owners can view customers" on customers for select to authenticated using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));
create policy "Owners can insert customers" on customers for insert to authenticated with check (restaurant_id in (select id from restaurants where owner_id = auth.uid()));
create policy "Owners can update customers" on customers for update to authenticated using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));
create policy "Owners can delete customers" on customers for delete to authenticated using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

-- Coupons: owner can CRUD via restaurant
create policy "Owners can view coupons" on coupons for select to authenticated using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));
create policy "Owners can insert coupons" on coupons for insert to authenticated with check (restaurant_id in (select id from restaurants where owner_id = auth.uid()));
create policy "Owners can update coupons" on coupons for update to authenticated using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));
create policy "Owners can delete coupons" on coupons for delete to authenticated using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

-- Message logs: owner can view via restaurant
create policy "Owners can view message logs" on message_logs for select to authenticated using (restaurant_id in (select id from restaurants where owner_id = auth.uid()) or restaurant_id is null);
create policy "System can insert message logs" on message_logs for insert to authenticated with check (true);
