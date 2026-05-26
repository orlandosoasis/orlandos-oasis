
-- 1. Realtime: deny-by-default authorization on broadcast/presence channels.
-- postgres_changes events continue to be filtered by RLS on the underlying tables
-- (profiles/pools/services), so subscribed homeowners/technicians still receive
-- only rows they're allowed to see. This blocks unauthorized broadcast/presence
-- channel subscriptions.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny broadcast and presence by default" ON realtime.messages;
CREATE POLICY "Deny broadcast and presence by default"
ON realtime.messages
FOR SELECT
TO authenticated, anon
USING (false);

DROP POLICY IF EXISTS "Deny broadcast and presence writes" ON realtime.messages;
CREATE POLICY "Deny broadcast and presence writes"
ON realtime.messages
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

-- 2. Restrict SECURITY DEFINER helpers to authenticated users only.
REVOKE EXECUTE ON FUNCTION public.cancel_subscription(text, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reactivate_subscription() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_subscription(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_subscription() TO authenticated;
