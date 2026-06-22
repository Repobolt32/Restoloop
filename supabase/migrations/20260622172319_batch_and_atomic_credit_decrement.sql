-- Issue #19: Batch platform credit decrement (eliminate N+1 loop)
-- Single RPC call instead of N individual calls

CREATE OR REPLACE FUNCTION decrement_platform_credits_batch(count INTEGER)
RETURNS TABLE(new_balance INTEGER) AS $$
BEGIN
    IF count <= 0 THEN
        -- No-op: return current balance without modifying
        RETURN QUERY SELECT p.balance FROM platform_credits p ORDER BY p.id LIMIT 1;
        RETURN;
    END IF;

    RETURN QUERY
    UPDATE platform_credits
    SET balance = balance - count
    WHERE id = (SELECT id FROM platform_credits ORDER BY id LIMIT 1)
    AND balance >= count
    RETURNING balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Issue #20: Atomic tenant credit decrement (no race condition)
-- Combines credit check + deduction into a single atomic DB operation
-- Returns the new balance, or nothing if insufficient credits

CREATE OR REPLACE FUNCTION decrement_tenant_credits(p_tenant_id UUID, p_count INTEGER)
RETURNS TABLE(new_balance INTEGER) AS $$
BEGIN
    IF p_count <= 0 THEN
        -- No-op: return current balance without modifying
        RETURN QUERY SELECT t.credits_balance FROM tenants t WHERE t.id = p_tenant_id;
        RETURN;
    END IF;

    RETURN QUERY
    UPDATE tenants
    SET credits_balance = credits_balance - p_count
    WHERE id = p_tenant_id
    AND credits_balance >= p_count
    RETURNING credits_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
