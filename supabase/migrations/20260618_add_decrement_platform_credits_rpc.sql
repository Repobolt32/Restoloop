-- Create atomic decrement function for platform credits
-- Bug 5 fix: replaces N individual read-then-update queries with a single RPC call
CREATE OR REPLACE FUNCTION public.decrement_platform_credits(amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.platform_credits
    SET balance = balance - amount,
        updated_at = now();
END;
$$;
