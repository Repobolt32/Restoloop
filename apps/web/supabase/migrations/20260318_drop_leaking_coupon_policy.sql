-- Drop the insecure policy that allowed public reads of all coupons in the network
DROP POLICY IF EXISTS "coupons_public_validate" ON public.coupons;
