-- ============================================================================
-- Security hardening v3
-- Closes:
--   1. Privilege escalation via signup metadata (role: 'admin' was honored)
--   2. Technicians could edit any column on assigned services (re-assign,
--      change pool, change date, etc.)
--   3. Anonymous applicants could DoS technician_applications with infinite
--      submissions for the same email
--   4. tech_notes and other free-text fields had no length cap
-- ============================================================================

-- 1. handle_new_user: ignore admin role from signup metadata.
--    Only 'technician' is honored; everything else (including missing or
--    'admin') defaults to 'homeowner'. Admins must be promoted by an existing
--    admin via the admin dashboard, never via self-signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  requested_role TEXT := NEW.raw_user_meta_data->>'role';
  safe_role public.app_role;
BEGIN
  -- Only honor 'technician' from metadata. Anything else (including 'admin')
  -- silently becomes 'homeowner'. Prevents browser-console privilege escalation.
  IF requested_role = 'technician' THEN
    safe_role := 'technician'::public.app_role;
  ELSE
    safe_role := 'homeowner'::public.app_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    safe_role
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2. services: column-level protection for technicians.
--    The "Technicians update assigned services" RLS policy permits the row
--    update but doesn't restrict columns. Add a BEFORE UPDATE trigger that
--    rejects any technician change to immutable columns. Admins bypass.
CREATE OR REPLACE FUNCTION public.protect_services_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Admins can change anything
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  -- Technician update path: only status, completed_tasks, tech_notes,
  -- started_at, completed_at, updated_at can change.
  IF auth.uid() = OLD.technician_id THEN
    IF OLD.id IS DISTINCT FROM NEW.id
       OR OLD.pool_id IS DISTINCT FROM NEW.pool_id
       OR OLD.homeowner_id IS DISTINCT FROM NEW.homeowner_id
       OR OLD.technician_id IS DISTINCT FROM NEW.technician_id
       OR OLD.service_type IS DISTINCT FROM NEW.service_type
       OR OLD.hours IS DISTINCT FROM NEW.hours
       OR OLD.service_date IS DISTINCT FROM NEW.service_date
       OR OLD.time_window IS DISTINCT FROM NEW.time_window
       OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
      RAISE EXCEPTION 'Technicians can only update status, completed_tasks, tech_notes, started_at, and completed_at on assigned services';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_services_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS services_protect_columns ON public.services;
CREATE TRIGGER services_protect_columns
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.protect_services_columns();

-- 3. technician_applications: one pending application per email at a time.
--    Once status is approved/rejected, the email can apply again (e.g. after
--    reapplying with new credentials).
CREATE UNIQUE INDEX IF NOT EXISTS technician_applications_email_pending_unique
  ON public.technician_applications (lower(email))
  WHERE status = 'pending';

-- 4. Length caps on remaining free-text fields. 5000 chars is enough for
--    legitimate use and prevents storage DoS.
ALTER TABLE public.services
  DROP CONSTRAINT IF EXISTS services_tech_notes_length_check;
ALTER TABLE public.services
  ADD CONSTRAINT services_tech_notes_length_check
  CHECK (tech_notes IS NULL OR length(tech_notes) <= 5000);

ALTER TABLE public.pools
  DROP CONSTRAINT IF EXISTS pools_equipment_length_check;
ALTER TABLE public.pools
  ADD CONSTRAINT pools_equipment_length_check
  CHECK (equipment IS NULL OR length(equipment) <= 2000);

ALTER TABLE public.pools
  DROP CONSTRAINT IF EXISTS pools_access_detail_length_check;
ALTER TABLE public.pools
  ADD CONSTRAINT pools_access_detail_length_check
  CHECK (access_detail IS NULL OR length(access_detail) <= 1000);

ALTER TABLE public.technician_applications
  DROP CONSTRAINT IF EXISTS technician_applications_experience_length_check;
ALTER TABLE public.technician_applications
  ADD CONSTRAINT technician_applications_experience_length_check
  CHECK (experience IS NULL OR length(experience) <= 5000);

-- 5. Tighten reviews.message length too (was unset)
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_message_length_check;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_message_length_check
  CHECK (message IS NULL OR length(message) <= 2000);
