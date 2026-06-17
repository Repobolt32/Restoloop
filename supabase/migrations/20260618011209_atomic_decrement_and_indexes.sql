-- Atomic decrement function for platform_credits
-- Fixes race condition: concurrent requests no longer lose credits

CREATE OR REPLACE FUNCTION decrement_platform_credits()
RETURNS TABLE(new_balance INTEGER) AS $$
BEGIN
    RETURN QUERY
    UPDATE platform_credits
    SET balance = balance - 1
    WHERE id = (SELECT id FROM platform_credits ORDER BY id LIMIT 1)
    AND balance > 0
    RETURNING balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(last_visit);
CREATE INDEX IF NOT EXISTS idx_customers_birthday ON customers(birthday);
CREATE INDEX IF NOT EXISTS idx_coupons_tenant_id ON coupons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_customer_id ON coupons(customer_id);
CREATE INDEX IF NOT EXISTS idx_coupons_type_status ON coupons(type, status);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON coupons(created_at);
CREATE INDEX IF NOT EXISTS idx_message_log_tenant_id ON message_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_message_log_coupon_id ON message_log(coupon_id);
