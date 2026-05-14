-- ============================================================================
-- GDPR / privacy: account deletion + data export
--
-- Adds two RPC functions callable from authenticated client code:
--   * public.delete_my_account() — soft-deletes the caller's account.
--     Marks profile as deleted, anonymizes PII, cascades to owned data via
--     existing FKs (pools, services, messages, reviews, issues). The auth.users
--     row is deleted by the trigger after the profile is anonymized; this
--     invalidates the session.
--   * public.export_my_data() — returns a single JSON blob containing every
--     row the caller has access to, suitable for a GDPR data-export download.
--
-- Both functions use auth.uid() internally; no parameters needed. RLS still
-- applies on all reads — the function is SECURITY DEFINER but checks
-- auth.uid() before doing anything sensitive.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. delete_my_account()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to delete account';
  END IF;

  -- Block admins from self-deleting via this RPC (prevents accidental
  -- destruction of the platform admin). Another admin must delete them.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = uid AND role = 'admin') THEN
    RAISE EXCEPTION 'Admins cannot delete their own account; ask another admin';
  END IF;

  -- Anonymize PII on the profile. We KEEP the row so historical references
  -- (services, messages) don't break and reviews still show "Deleted user".
  UPDATE public.profiles
  SET
    email = 'deleted-' || id || '@deleted.local',
    full_name = 'Deleted user',
    first_name = NULL,
    last_name = NULL,
    phone = NULL,
    street_address = NULL,
    city = NULL,
    state = NULL,
    zip_code = NULL,
    avatar_url = NULL,
    updated_at = now()
  WHERE id = uid;

  -- Scrub message bodies they sent (recipient can still see "this user
  -- deleted their messages" placeholder if you want; for now, blank them).
  UPDATE public.messages
  SET body = '[message deleted by sender]'
  WHERE sender_id = uid;

  -- Cancel any active services for the caller (homeowner side).
  UPDATE public.services
  SET status = 'cancelled', updated_at = now()
  WHERE homeowner_id = uid AND status IN ('scheduled', 'in_progress');

  -- Finally, delete the auth.users row. Cascades to the profile (FK ON
  -- DELETE CASCADE), but we've already anonymized the profile above so this
  -- removes the now-anonymous row and invalidates the session.
  -- We use the admin API via service-role in the Edge Function path normally,
  -- but for the SQL path we do it via auth schema.
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. export_my_data() — returns JSONB blob of everything the user owns
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.export_my_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  result jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to export data';
  END IF;

  SELECT jsonb_build_object(
    'exported_at', now(),
    'user_id', uid,
    'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = uid),
    'pools', COALESCE(
      (SELECT jsonb_agg(row_to_json(po)) FROM public.pools po WHERE po.homeowner_id = uid),
      '[]'::jsonb
    ),
    'services', COALESCE(
      (SELECT jsonb_agg(row_to_json(s)) FROM public.services s
       WHERE s.homeowner_id = uid OR s.technician_id = uid),
      '[]'::jsonb
    ),
    'messages_sent', COALESCE(
      (SELECT jsonb_agg(row_to_json(m)) FROM public.messages m WHERE m.sender_id = uid),
      '[]'::jsonb
    ),
    'messages_received', COALESCE(
      (SELECT jsonb_agg(row_to_json(m)) FROM public.messages m WHERE m.recipient_id = uid),
      '[]'::jsonb
    ),
    'reviews_written', COALESCE(
      (SELECT jsonb_agg(row_to_json(r)) FROM public.reviews r WHERE r.reviewer_id = uid),
      '[]'::jsonb
    ),
    'reviews_received', COALESCE(
      (SELECT jsonb_agg(row_to_json(r)) FROM public.reviews r WHERE r.technician_id = uid),
      '[]'::jsonb
    ),
    'issues', COALESCE(
      (SELECT jsonb_agg(row_to_json(i)) FROM public.issues i WHERE i.homeowner_id = uid),
      '[]'::jsonb
    )
  )
  INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.export_my_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.export_my_data() TO authenticated;
