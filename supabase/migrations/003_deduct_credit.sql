-- Create deduct_credit function for atomic credit deduction with locking
create or replace function deduct_credit(restaurant_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  current_credits integer;
begin
  -- Lock row and get current credits
  select credits into current_credits
  from restaurants
  where id = restaurant_id
  for update;

  if current_credits is null then
    raise exception 'restaurant_not_found';
  end if;

  if current_credits > 0 then
    update restaurants
    set credits = credits - 1
    where id = restaurant_id;
  else
    raise exception 'insufficient_credits';
  end if;
end;
$$;
