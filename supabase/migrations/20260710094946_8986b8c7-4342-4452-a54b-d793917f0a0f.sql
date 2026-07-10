
-- 1) day_off_requests: restrict UPDATE to admins only
DROP POLICY IF EXISTS "Admin can update requests" ON public.day_off_requests;
CREATE POLICY "Admins can update requests"
  ON public.day_off_requests
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) messages: prevent recipients from altering message content via UPDATE.
-- Replace the fragile with_check subquery with a trigger that pins immutable
-- columns to their OLD values on non-admin updates.
DROP POLICY IF EXISTS "Recipients mark messages read" ON public.messages;
CREATE POLICY "Recipients mark messages read"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE OR REPLACE FUNCTION public.messages_prevent_content_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.sender_id    IS DISTINCT FROM OLD.sender_id
  OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
  OR NEW.thread_id    IS DISTINCT FROM OLD.thread_id
  OR NEW.body         IS DISTINCT FROM OLD.body THEN
    RAISE EXCEPTION 'Messages content is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_prevent_content_change ON public.messages;
CREATE TRIGGER trg_messages_prevent_content_change
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.messages_prevent_content_change();

-- 3) technician_unavailability: restrict SELECT to owner or admin
DROP POLICY IF EXISTS "Auth can view unavailability" ON public.technician_unavailability;
CREATE POLICY "Owner or admin can view unavailability"
  ON public.technician_unavailability
  FOR SELECT
  TO authenticated
  USING (technician_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4) SECURITY DEFINER functions: revoke anon EXECUTE across public schema.
--    Keep authenticated EXECUTE where user-facing RPCs need it.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS s, p.proname AS f,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon',
                   r.f, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated, service_role',
                   r.f, r.args);
  END LOOP;
END $$;
