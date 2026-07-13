-- ============================================================
-- ORLANDO'S OASIS — FULL DATABASE SETUP
-- Drop everything first for a clean slate
-- ============================================================

-- Drop all tables
DROP TABLE IF EXISTS public.homeowner_custom_services CASCADE;
DROP TABLE IF EXISTS public.homeowner_notifications CASCADE;
DROP TABLE IF EXISTS public.homeowner_addons CASCADE;
DROP TABLE IF EXISTS public.tech_notifications CASCADE;
DROP TABLE IF EXISTS public.route_issue_events CASCADE;
DROP TABLE IF EXISTS public.route_issue_services CASCADE;
DROP TABLE IF EXISTS public.route_issues CASCADE;
DROP TABLE IF EXISTS public.service_catalog CASCADE;
DROP TABLE IF EXISTS public.service_photos CASCADE;
DROP TABLE IF EXISTS public.service_requests CASCADE;
DROP TABLE IF EXISTS public.subscription_events CASCADE;
DROP TABLE IF EXISTS public.compensation_events CASCADE;
DROP TABLE IF EXISTS public.expense_items CASCADE;
DROP TABLE IF EXISTS public.day_off_request_events CASCADE;
DROP TABLE IF EXISTS public.day_off_requests CASCADE;
DROP TABLE IF EXISTS public.technician_unavailability CASCADE;
DROP TABLE IF EXISTS public.technician_applications CASCADE;
DROP TABLE IF EXISTS public.applicant_certifications CASCADE;
DROP TABLE IF EXISTS public.admin_notes CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.issues CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.pools CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop all types
DROP TYPE IF EXISTS app_role CASCADE;
DROP TYPE IF EXISTS service_status CASCADE;
DROP TYPE IF EXISTS pool_type CASCADE;
DROP TYPE IF EXISTS water_type CASCADE;
DROP TYPE IF EXISTS access_method CASCADE;
DROP TYPE IF EXISTS billing_type CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS notification_kind CASCADE;
DROP TYPE IF EXISTS issue_status CASCADE;
DROP TYPE IF EXISTS route_issue_status CASCADE;
DROP TYPE IF EXISTS day_off_status CASCADE;
DROP TYPE IF EXISTS day_off_resolution CASCADE;
DROP TYPE IF EXISTS tech_notification_type CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS time_window CASCADE;
DROP TYPE IF EXISTS review_status CASCADE;
DROP TYPE IF EXISTS admin_note_target CASCADE;
DROP TYPE IF EXISTS service_request_status CASCADE;

-- Drop pricing tables
DROP TABLE IF EXISTS public.pricing_addons CASCADE;
DROP TABLE IF EXISTS public.pricing_pool_sizes CASCADE;
DROP TABLE IF EXISTS public.pricing_frequencies CASCADE;

-- ============================================================
-- Migration: 20260429193317_c259148a-e17e-4494-8a43-05e402468d0e.sql
-- ============================================================

-- Enums
CREATE TYPE public.app_role AS ENUM ('homeowner', 'technician', 'admin');
CREATE TYPE public.service_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.time_window AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.issue_status AS ENUM ('open', 'resolved');

-- Updated-at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========== profiles ===========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  role public.app_role NOT NULL DEFAULT 'homeowner',
  avatar_url TEXT,
  phone TEXT,
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role);
$$;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'homeowner')
  );
  RETURN NEW;
END;
$$;


-- =========== pools ===========
CREATE TABLE public.pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  pool_type TEXT,
  pool_size TEXT,
  water_type TEXT,
  equipment TEXT,
  access_method TEXT,
  access_detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_pools_updated_at BEFORE UPDATE ON public.pools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== services ===========
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  homeowner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  hours INTEGER NOT NULL DEFAULT 1,
  service_date DATE NOT NULL,
  time_window public.time_window NOT NULL,
  status public.service_status NOT NULL DEFAULT 'scheduled',
  completed_tasks TEXT[],
  tech_notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners view own services" ON public.services FOR SELECT USING (auth.uid() = homeowner_id);
CREATE POLICY "Technicians view assigned services" ON public.services FOR SELECT USING (auth.uid() = technician_id);
CREATE POLICY "Technicians update assigned services" ON public.services FOR UPDATE USING (auth.uid() = technician_id);
CREATE POLICY "Admins manage all services" ON public.services FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Homeowners create own services" ON public.services FOR INSERT WITH CHECK (auth.uid() = homeowner_id);

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- pools policies (reference services)
CREATE POLICY "Homeowners manage own pools" ON public.pools FOR ALL
  USING (auth.uid() = homeowner_id) WITH CHECK (auth.uid() = homeowner_id);
CREATE POLICY "Technicians view assigned pools" ON public.pools FOR SELECT
  USING (public.has_role(auth.uid(), 'technician') AND EXISTS (
    SELECT 1 FROM public.services s WHERE s.pool_id = pools.id AND s.technician_id = auth.uid()
  ));
CREATE POLICY "Admins manage all pools" ON public.pools FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========== technician_applications ===========
CREATE TABLE public.technician_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  experience TEXT,
  resume_url TEXT,
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.technician_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can apply" ON public.technician_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view applications" ON public.technician_applications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update applications" ON public.technician_applications FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete applications" ON public.technician_applications FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_technician_applications_updated_at BEFORE UPDATE ON public.technician_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== applicant_certifications ===========
CREATE TABLE public.applicant_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.technician_applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.applicant_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can add certifications" ON public.applicant_certifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view certifications" ON public.applicant_certifications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage certifications" ON public.applicant_certifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_applicant_certifications_updated_at BEFORE UPDATE ON public.applicant_certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== issues ===========
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  service_date DATE,
  related_service TEXT,
  status public.issue_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners manage own issues" ON public.issues FOR ALL
  USING (auth.uid() = homeowner_id) WITH CHECK (auth.uid() = homeowner_id);
CREATE POLICY "Admins manage all issues" ON public.issues FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== messages ===========
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own messages" ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients update read state" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Admins view all messages" ON public.messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== reviews ===========
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message TEXT,
  status public.review_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved reviews are public" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Reviewers view own reviews" ON public.reviews FOR SELECT USING (auth.uid() = reviewer_id);
CREATE POLICY "Technicians view own reviews" ON public.reviews FOR SELECT USING (auth.uid() = technician_id);
CREATE POLICY "Reviewers create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Admins manage all reviews" ON public.reviews FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- Migration: 20260429193337_b6e901bf-7beb-4073-90cc-1c99599a19e8.sql
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;


-- ============================================================
-- Migration: 20260429194051_16731d69-0df4-494f-8f8d-f13ef04a7ba1.sql
-- ============================================================
-- Helper functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- Applicants can view their own application via email match
CREATE POLICY "Applicants view own application"
ON public.technician_applications
FOR SELECT
TO authenticated
USING (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Applicants can view their own certifications
CREATE POLICY "Applicants view own certifications"
ON public.applicant_certifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.technician_applications ta
    WHERE ta.id = applicant_certifications.application_id
      AND ta.email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
);

-- Reviews: any authenticated user can read
CREATE POLICY "Authenticated users view reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

-- Messages: tighten update so recipients can ONLY mark read_at
DROP POLICY IF EXISTS "Recipients update read state" ON public.messages;

CREATE POLICY "Recipients mark messages read"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (
  auth.uid() = recipient_id
  AND sender_id = (SELECT m.sender_id FROM public.messages m WHERE m.id = messages.id)
  AND recipient_id = (SELECT m.recipient_id FROM public.messages m WHERE m.id = messages.id)
  AND body = (SELECT m.body FROM public.messages m WHERE m.id = messages.id)
  AND thread_id = (SELECT m.thread_id FROM public.messages m WHERE m.id = messages.id)
);

-- ============================================================
-- Migration: 20260429194110_880cf045-67ad-4eef-ae12-902731f2894a.sql
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM authenticated;

-- ============================================================
-- Migration: 20260429201116_50776b3e-8135-4378-b4fe-47e1dc1ec7c8.sql
-- ============================================================
-- Create service-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-photos', 'service-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view service photos (public bucket)
CREATE POLICY "Service photos are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'service-photos');

-- Technicians can upload photos to folders matching service ids they own
-- Path convention: {service_id}/{before|after}/{filename}
CREATE POLICY "Technicians upload service photos for assigned services"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-photos'
  AND EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.technician_id = auth.uid()
  )
);

-- Technicians can update/delete their own service photos
CREATE POLICY "Technicians manage service photos for assigned services"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-photos'
  AND EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.technician_id = auth.uid()
  )
);

CREATE POLICY "Technicians delete service photos for assigned services"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-photos'
  AND EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.technician_id = auth.uid()
  )
);

-- Admins manage all service photos
CREATE POLICY "Admins manage all service photos"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'service-photos' AND public.is_admin())
WITH CHECK (bucket_id = 'service-photos' AND public.is_admin());

-- Add a service_photos table to track photo metadata (before/after grouping)
CREATE TABLE public.service_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after')),
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service photos viewable by participants"
ON public.service_photos
FOR SELECT
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id = service_photos.service_id
      AND (s.homeowner_id = auth.uid() OR s.technician_id = auth.uid())
  )
);

CREATE POLICY "Technicians insert service photos"
ON public.service_photos
FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id = service_photos.service_id
      AND s.technician_id = auth.uid()
  )
);

CREATE POLICY "Admins manage service photo records"
ON public.service_photos
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE INDEX idx_service_photos_service_id ON public.service_photos(service_id);

-- ============================================================
-- Migration: 20260429230228_15488e30-41b9-453c-bcb4-181a57d72845.sql
-- ============================================================

-- 1. Profiles: prevent self role escalation
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- 2. Reviews: one per reviewer per service
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_reviewer_service_unique UNIQUE (reviewer_id, service_id);

-- 3. Length checks
ALTER TABLE public.messages
  ADD CONSTRAINT messages_body_length_check CHECK (length(body) <= 5000);

ALTER TABLE public.issues
  ADD CONSTRAINT issues_message_length_check CHECK (length(message) <= 5000);

-- 4. Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/gif']),
  ('resumes', 'resumes', false, 5242880, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('certifications', 'certifications', false, 5242880, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. Storage policies: avatars
CREATE POLICY "Avatars publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Storage policies: resumes
CREATE POLICY "Anyone uploads resume"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Admins read resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes' AND public.is_admin());

CREATE POLICY "Admins manage resumes"
ON storage.objects FOR UPDATE
USING (bucket_id = 'resumes' AND public.is_admin());

CREATE POLICY "Admins delete resumes"
ON storage.objects FOR DELETE
USING (bucket_id = 'resumes' AND public.is_admin());

-- 7. Storage policies: certifications
CREATE POLICY "Anyone uploads certification"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certifications');

CREATE POLICY "Admins read certifications"
ON storage.objects FOR SELECT
USING (bucket_id = 'certifications' AND public.is_admin());

CREATE POLICY "Admins manage certifications"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certifications' AND public.is_admin());

CREATE POLICY "Admins delete certifications"
ON storage.objects FOR DELETE
USING (bucket_id = 'certifications' AND public.is_admin());


-- ============================================================
-- Migration: 20260429230257_c51095fe-262a-4c3d-8594-dc21fca9d2c0.sql
-- ============================================================

-- Replace overly-broad INSERT policies on resumes/certifications with path-scoped ones.
-- The buckets are private so SELECT remains admin-only. INSERT for anon applicants
-- is constrained to an `applications/` path prefix to avoid arbitrary writes.
DROP POLICY IF EXISTS "Anyone uploads resume" ON storage.objects;
DROP POLICY IF EXISTS "Anyone uploads certification" ON storage.objects;

CREATE POLICY "Applicants upload resume to applications path"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = 'applications'
);

CREATE POLICY "Applicants upload certification to applications path"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certifications'
  AND (storage.foldername(name))[1] = 'applications'
);

-- Avatars: replace broad public SELECT with path-scoped read so listing the
-- bucket root returns nothing while direct file reads still work.
DROP POLICY IF EXISTS "Avatars publicly readable" ON storage.objects;

CREATE POLICY "Avatars publicly readable by path"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] IS NOT NULL
);


-- ============================================================
-- Migration: 20260430010000_security_hardening_v3.sql
-- ============================================================
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


-- ============================================================
-- Migration: 20260505030905_b8f8c0ad-be95-4a1c-8601-0f7436692793.sql
-- ============================================================

-- 1. Reviews: drop overly broad authenticated SELECT policy
DROP POLICY IF EXISTS "Authenticated users view reviews" ON public.reviews;

-- 2. Service photos bucket: make private and lock down SELECT
UPDATE storage.buckets SET public = false WHERE id = 'service-photos';

DROP POLICY IF EXISTS "Service photos are publicly viewable" ON storage.objects;

CREATE POLICY "Service photo participants view"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'service-photos'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND (s.homeowner_id = auth.uid() OR s.technician_id = auth.uid())
    )
  )
);

-- 3. Applicant certifications: restrict INSERT to admins or the matching applicant
DROP POLICY IF EXISTS "Anyone can add certifications" ON public.applicant_certifications;

CREATE POLICY "Applicants add own certifications"
ON public.applicant_certifications FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.technician_applications ta
    WHERE ta.id = applicant_certifications.application_id
      AND ta.email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
);


-- ============================================================
-- Migration: 20260505141358_25cb1fd4-fdb9-43b4-b896-85354bd4b29e.sql
-- ============================================================
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

alter policy "Admins view all profiles"
on public.profiles
to authenticated;

alter policy "Admins update all profiles"
on public.profiles
to authenticated;

alter policy "Users view own profile"
on public.profiles
to authenticated;

alter policy "Users insert own profile"
on public.profiles
to authenticated;

alter policy "Users update own profile"
on public.profiles
to authenticated;

-- ============================================================
-- Migration: 20260505141602_b6d1e017-c033-4ff1-9de4-890913408072.sql
-- ============================================================
create schema if not exists private;
revoke all on schema private from public;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = _user_id
      and role = _role
  );
$$;

grant execute on function private.has_role(uuid, public.app_role) to authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.has_role(uuid, public.app_role) from public;

alter policy "Admins manage certifications"
on public.applicant_certifications
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins view certifications"
on public.applicant_certifications
using (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Applicants add own certifications"
on public.applicant_certifications
with check (
  private.has_role(auth.uid(), 'admin'::public.app_role)
  or exists (
    select 1
    from public.technician_applications ta
    where ta.id = applicant_certifications.application_id
      and ta.email = (
        select profiles.email
        from public.profiles
        where profiles.id = auth.uid()
      )
  )
);

alter policy "Admins manage all issues"
on public.issues
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins view all messages"
on public.messages
using (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins manage all pools"
on public.pools
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Technicians view assigned pools"
on public.pools
using (
  private.has_role(auth.uid(), 'technician'::public.app_role)
  and exists (
    select 1
    from public.services s
    where s.pool_id = pools.id
      and s.technician_id = auth.uid()
  )
);

alter policy "Admins update all profiles"
on public.profiles
using (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins view all profiles"
on public.profiles
using (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins manage all reviews"
on public.reviews
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins manage all services"
on public.services
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins delete applications"
on public.technician_applications
using (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins update applications"
on public.technician_applications
using (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins view applications"
on public.technician_applications
using (private.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================
-- Migration: 20260505142724_60e685b0-3b8c-4a7f-bc3b-45ef96b41441.sql
-- ============================================================

-- Add 'in_progress' to issue_status enum and admin_notes column
ALTER TYPE issue_status ADD VALUE IF NOT EXISTS 'in_progress' BEFORE 'resolved';

ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS assigned_technician_id uuid;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone;


-- ============================================================
-- Migration: 20260505145434_7168cb8a-acf2-415e-9c48-c0edb62e3078.sql
-- ============================================================
-- 1. Profile contract & billing fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS contract_start_date date,
  ADD COLUMN IF NOT EXISTS contract_locked boolean NOT NULL DEFAULT false;

-- 2. Pool ↔ technician assignment (separate from per-service assignment)
ALTER TABLE public.pools
  ADD COLUMN IF NOT EXISTS assigned_technician_id uuid;

-- Allow assigned tech to view their pools
DROP POLICY IF EXISTS "Technicians view assigned pools" ON public.pools;
CREATE POLICY "Technicians view assigned pools"
  ON public.pools FOR SELECT
  USING (
    private.has_role(auth.uid(), 'technician'::app_role)
    AND (
      assigned_technician_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.services s WHERE s.pool_id = pools.id AND s.technician_id = auth.uid())
    )
  );

-- 3. Messages: optional pool reference for grouping
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS pool_id uuid;

-- 4. Service requests (ad-hoc)
CREATE TYPE public.service_request_status AS ENUM ('open', 'in_progress', 'resolved', 'cancelled');

CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id uuid NOT NULL,
  pool_id uuid,
  request_type text NOT NULL,
  description text NOT NULL,
  status public.service_request_status NOT NULL DEFAULT 'open',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners manage own service requests"
  ON public.service_requests FOR ALL
  USING (auth.uid() = homeowner_id)
  WITH CHECK (auth.uid() = homeowner_id);

CREATE POLICY "Admins manage all service requests"
  ON public.service_requests FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Admin-only notes (target = technician | homeowner | pool)
CREATE TYPE public.admin_note_target AS ENUM ('technician', 'homeowner', 'pool');

CREATE TABLE public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type public.admin_note_target NOT NULL,
  target_id uuid NOT NULL,
  body text NOT NULL,
  author_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_notes_target_idx ON public.admin_notes(target_type, target_id);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all admin notes"
  ON public.admin_notes FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER admin_notes_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Migration: 20260507181451_8b86c385-f116-4110-a2ce-af92e38a20fd.sql
-- ============================================================
DROP POLICY IF EXISTS "Avatars publicly readable by path" ON storage.objects;

-- ============================================================
-- Migration: 20260507181510_f6fb9d89-1986-4411-b49c-57fa0c0623d9.sql
-- ============================================================
DROP POLICY IF EXISTS "Anyone can apply" ON public.technician_applications;
CREATE POLICY "Anyone can apply"
ON public.technician_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(email)) > 0
  AND length(btrim(first_name)) > 0
  AND length(btrim(last_name)) > 0
  AND status = 'pending'::application_status
);

-- ============================================================
-- Migration: 20260507181804_7e51ec17-a56f-486d-b3d9-045336a2c283.sql
-- ============================================================
DROP POLICY IF EXISTS "Technicians view own reviews" ON public.reviews;
CREATE POLICY "Technicians view own approved reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = technician_id AND status = 'approved'::review_status);

-- ============================================================
-- Migration: 20260507185647_f8f8bda5-5b92-4f75-8404-f0a98ba16d44.sql
-- ============================================================
-- 1. Force new signups to homeowner role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'homeowner'::public.app_role
  );
  RETURN NEW;
END;
$function$;

-- 2. Tighten reviewer SELECT policy: hide rejected reviews (and their rejection_reason) from reviewers
DROP POLICY IF EXISTS "Reviewers view own reviews" ON public.reviews;
CREATE POLICY "Reviewers view own non-rejected reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = reviewer_id AND status <> 'rejected'::review_status);

-- ============================================================
-- Migration: 20260514120000_account_deletion_and_export.sql
-- ============================================================
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


-- ============================================================
-- Migration: 20260518150000_tech_verification_fields.sql
-- ============================================================
-- ============================================================================
-- Tech verification trust signals
--
-- Adds fields to profiles that the UI uses to display verification badges
-- on technician cards (visible to homeowners on the service detail page,
-- to admins on the tech list, etc.). Helps build marketplace trust:
-- "Background-checked, insured, X services completed" is the marketplace
-- currency.
--
-- All fields default to false / null so existing rows aren't affected.
-- Admins set these flags via the admin dashboard tech-detail page.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_background_checked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS background_check_date date,
  ADD COLUMN IF NOT EXISTS is_insured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurance_expires_on date,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Tighten the update policy so only admins can flip these flags. The
-- existing "Users update own profile" policy already locks `role` from
-- self-update; this extends the same protection to the verification flags.
-- We swap out the policy with one that compares the new row's verification
-- columns against the current values for non-admin updates.

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  AND is_background_checked = (SELECT is_background_checked FROM public.profiles WHERE id = auth.uid())
  AND background_check_date IS NOT DISTINCT FROM (SELECT background_check_date FROM public.profiles WHERE id = auth.uid())
  AND is_insured = (SELECT is_insured FROM public.profiles WHERE id = auth.uid())
  AND insurance_expires_on IS NOT DISTINCT FROM (SELECT insurance_expires_on FROM public.profiles WHERE id = auth.uid())
  AND is_verified = (SELECT is_verified FROM public.profiles WHERE id = auth.uid())
  AND verified_at IS NOT DISTINCT FROM (SELECT verified_at FROM public.profiles WHERE id = auth.uid())
);

-- Helpful index for filtering admin views by verified status.
CREATE INDEX IF NOT EXISTS profiles_role_verified_idx ON public.profiles (role) WHERE is_verified = true;


-- ============================================================
-- Migration: 20260518191448_f522369b-60ab-47b9-885d-0857202ac4ac.sql
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- ============================================================
-- Migration: 20260518200802_f1c9f8ab-a9f5-4632-bb43-7a606adcf9d0.sql
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_grandfathered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_placeholder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS grandfathered_note text;

-- ============================================================
-- Migration: 20260518202354_f3a2ee3d-a11d-46e7-98f1-c32059a01dc3.sql
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_freds boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.profiles.is_freds IS 'Fred''s account tag: suppress all emails and notifications, but track service data.';
COMMENT ON COLUMN public.profiles.notifications_enabled IS 'When false, suppress all outbound emails and notifications for this profile.';

-- ============================================================
-- Migration: 20260518205013_0f05023f-e19b-450c-b5ce-01af67de62bd.sql
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_per_pool numeric NOT NULL DEFAULT 100;

-- ============================================================
-- Migration: 20260518205839_596d1698-66e1-4dc3-8396-d267ab603e3b.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.expense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('chemical','equipment')),
  per_pool_cost numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage expense items"
  ON public.expense_items
  FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER expense_items_set_updated_at
  BEFORE UPDATE ON public.expense_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.expense_items (name, category, per_pool_cost, sort_order) VALUES
  ('Chlorine tablets (3")',       'chemical', 18,  10),
  ('Liquid shock',                'chemical', 6,   20),
  ('Muriatic acid',               'chemical', 4,   30),
  ('Algaecide',                   'chemical', 3,   40),
  ('Cyanuric acid stabilizer',    'chemical', 2,   50),
  ('pH increaser / decreaser',    'chemical', 2.5, 60),
  ('Calcium hardness',            'chemical', 2,   70),
  ('Clarifier & enzyme',          'chemical', 2.5, 80),
  ('Skimmer nets & brushes (amortized)', 'equipment', 3,   10),
  ('Test strips & reagents',      'equipment', 1.5, 20),
  ('Vacuum hose / pole wear',     'equipment', 2,   30),
  ('Filter cleaner & lube',       'equipment', 1.5, 40);


-- ============================================================
-- Migration: 20260520004818_407a752c-6953-453f-985a-4eb457892904.sql
-- ============================================================
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- ============================================================
-- Migration: 20260520143747_23ba9384-5540-40ef-ad99-2506bc5d88ff.sql
-- ============================================================
CREATE POLICY "Homeowners view assigned technician profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role = 'technician'::public.app_role
  AND EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.technician_id = profiles.id
      AND s.homeowner_id = auth.uid()
  )
);

-- ============================================================
-- Migration: 20260521042813_e8207ca3-b7de-421b-9192-479bdacee357.sql
-- ============================================================
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.pools REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pools;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ============================================================
-- Migration: 20260521045328_d24d7c60-f8d7-4513-8a40-653f69549850.sql
-- ============================================================
-- Add frequency to pools so we can pre-seed recurring services per property
ALTER TABLE public.pools
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'monthly';

-- Ensure realtime publication includes services and pools (idempotent guards)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'services'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.services';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pools'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.pools';
  END IF;
END $$;

-- Make sure REPLICA IDENTITY FULL is set so updates carry old row data
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.pools REPLICA IDENTITY FULL;


-- ============================================================
-- Migration: 20260522172735_a3f5c127-03a1-4b6e-8a2e-ccfbb465683a.sql
-- ============================================================

-- 1) Subscription status enum
DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'pending_cancellation', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Add subscription fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status public.subscription_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS subscription_cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_effective_end_date date,
  ADD COLUMN IF NOT EXISTS subscription_cancellation_reason text;

-- 3) Add cancellation provenance to services
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS cancelled_by_homeowner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- 4) Cancel subscription RPC (homeowner self-serve, SECURITY DEFINER so we can update services)
CREATE OR REPLACE FUNCTION public.cancel_subscription(
  p_reason text,
  p_effective_end date
) RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_status public.subscription_status;
  v_profile public.profiles;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  IF v_role IS DISTINCT FROM 'homeowner' THEN
    RAISE EXCEPTION 'Only homeowners can cancel subscriptions';
  END IF;

  IF p_effective_end IS NULL THEN
    RAISE EXCEPTION 'Effective end date required';
  END IF;

  v_status := CASE WHEN p_effective_end <= CURRENT_DATE
                   THEN 'cancelled'::public.subscription_status
                   ELSE 'pending_cancellation'::public.subscription_status END;

  UPDATE public.profiles
     SET subscription_status = v_status,
         subscription_cancelled_at = now(),
         subscription_effective_end_date = p_effective_end,
         subscription_cancellation_reason = NULLIF(btrim(p_reason), '')
   WHERE id = v_uid
  RETURNING * INTO v_profile;

  -- Cancel future scheduled services after the effective end date
  UPDATE public.services
     SET status = 'cancelled',
         cancelled_by_homeowner = true,
         cancellation_reason = NULLIF(btrim(p_reason), ''),
         cancelled_at = now()
   WHERE homeowner_id = v_uid
     AND service_date > p_effective_end
     AND status IN ('scheduled', 'in_progress');

  RETURN v_profile;
END;
$$;

-- 5) Reactivate RPC
CREATE OR REPLACE FUNCTION public.reactivate_subscription()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.profiles;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  UPDATE public.profiles
     SET subscription_status = 'active',
         subscription_cancelled_at = NULL,
         subscription_effective_end_date = NULL,
         subscription_cancellation_reason = NULL
   WHERE id = v_uid
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_subscription(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_subscription() TO authenticated;

-- 6) Enable realtime on profiles so admins/homeowners see status changes live
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- Migration: 20260522172752_ff541cb3-efbb-4cc5-ab6b-fb6d243cd443.sql
-- ============================================================

REVOKE ALL ON FUNCTION public.cancel_subscription(text, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reactivate_subscription() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_subscription(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_subscription() TO authenticated;


-- ============================================================
-- Migration: 20260526041454_93539cf1-3eec-4f7d-9e9a-04dbe314a89f.sql
-- ============================================================

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


-- ============================================================
-- Migration: 20260526164642_8f1eb68f-b8ec-44e1-a958-808d05980522.sql
-- ============================================================

-- Allow anonymous and authenticated applicants to attach certifications to a
-- pending application they just created. Without this, the existing policy
-- required the user's profile email to equal the application email, which
-- breaks for anon submissions and for logged-in users using a different email.

DROP POLICY IF EXISTS "Anyone can add certifications to pending application" ON public.applicant_certifications;
CREATE POLICY "Anyone can add certifications to pending application"
ON public.applicant_certifications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.technician_applications ta
    WHERE ta.id = applicant_certifications.application_id
      AND ta.status = 'pending'::application_status
  )
);

GRANT INSERT ON public.applicant_certifications TO anon;


-- ============================================================
-- Migration: 20260529143044_2eff00aa-1954-431e-82c4-45bff4c5e1de.sql
-- ============================================================

-- 1. Audit table
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('cancelled','reactivated','pending_cancellation')),
  reason text,
  effective_end_date date,
  status_after public.subscription_status NOT NULL,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_homeowner_created
  ON public.subscription_events (homeowner_id, created_at DESC);

GRANT SELECT ON public.subscription_events TO authenticated;
GRANT ALL ON public.subscription_events TO service_role;

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners view own subscription events"
ON public.subscription_events FOR SELECT TO authenticated
USING (auth.uid() = homeowner_id);

CREATE POLICY "Admins view all subscription events"
ON public.subscription_events FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Update cancel_subscription to also log the event
CREATE OR REPLACE FUNCTION public.cancel_subscription(p_reason text, p_effective_end date)
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_status public.subscription_status;
  v_profile public.profiles;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  IF v_role IS DISTINCT FROM 'homeowner' THEN
    RAISE EXCEPTION 'Only homeowners can cancel subscriptions';
  END IF;

  IF p_effective_end IS NULL THEN
    RAISE EXCEPTION 'Effective end date required';
  END IF;

  v_status := CASE WHEN p_effective_end <= CURRENT_DATE
                   THEN 'cancelled'::public.subscription_status
                   ELSE 'pending_cancellation'::public.subscription_status END;

  UPDATE public.profiles
     SET subscription_status = v_status,
         subscription_cancelled_at = now(),
         subscription_effective_end_date = p_effective_end,
         subscription_cancellation_reason = NULLIF(btrim(p_reason), '')
   WHERE id = v_uid
  RETURNING * INTO v_profile;

  UPDATE public.services
     SET status = 'cancelled',
         cancelled_by_homeowner = true,
         cancellation_reason = NULLIF(btrim(p_reason), ''),
         cancelled_at = now()
   WHERE homeowner_id = v_uid
     AND service_date > p_effective_end
     AND status IN ('scheduled', 'in_progress');

  INSERT INTO public.subscription_events
    (homeowner_id, event_type, reason, effective_end_date, status_after, actor_id)
  VALUES
    (v_uid,
     CASE WHEN v_status = 'cancelled' THEN 'cancelled' ELSE 'pending_cancellation' END,
     NULLIF(btrim(p_reason), ''),
     p_effective_end,
     v_status,
     v_uid);

  RETURN v_profile;
END;
$function$;

-- 3. Update reactivate_subscription to also log the event
CREATE OR REPLACE FUNCTION public.reactivate_subscription()
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.profiles;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  UPDATE public.profiles
     SET subscription_status = 'active',
         subscription_cancelled_at = NULL,
         subscription_effective_end_date = NULL,
         subscription_cancellation_reason = NULL
   WHERE id = v_uid
  RETURNING * INTO v_profile;

  INSERT INTO public.subscription_events
    (homeowner_id, event_type, reason, effective_end_date, status_after, actor_id)
  VALUES
    (v_uid, 'reactivated', NULL, NULL, 'active'::public.subscription_status, v_uid);

  RETURN v_profile;
END;
$function$;


-- ============================================================
-- Migration: 20260529143701_51bb5236-db9a-4e39-a3a4-7cce5dbb1b6c.sql
-- ============================================================
UPDATE storage.buckets SET allowed_mime_types = ARRAY['application/pdf','image/png','image/jpeg']::text[] WHERE id = 'certifications';

-- ============================================================
-- Migration: 20260529150742_394f89ea-c2a6-46cb-b1ac-e022392f1965.sql
-- ============================================================
CREATE POLICY "Homeowners view pool assigned technician profile"
ON public.profiles FOR SELECT
TO authenticated
USING (
  role = 'technician'::app_role
  AND EXISTS (
    SELECT 1 FROM public.pools p
    WHERE p.assigned_technician_id = profiles.id
      AND p.homeowner_id = auth.uid()
  )
);

-- ============================================================
-- Migration: 20260529153006_835ce246-dbc8-4ec9-b321-dbfaaeec0b5c.sql
-- ============================================================

-- Helper column on services
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS delay_minutes integer NOT NULL DEFAULT 0;

-- ============================================================
-- TABLES (create first, policies later)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.route_issues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_type        text NOT NULL CHECK (issue_type IN ('sick','breakdown','late','other')),
  other_text        text,
  reported_by_role  text NOT NULL CHECK (reported_by_role IN ('admin','technician')),
  reported_by_id    uuid NOT NULL,
  technician_id     uuid,
  route_date        date NOT NULL DEFAULT CURRENT_DATE,
  scope             text NOT NULL CHECK (scope IN ('all','specific')),
  action_taken      text NOT NULL CHECK (action_taken IN ('notify','delay','reschedule','reassign')),
  delay_minutes     integer,
  new_service_date  date,
  new_time_window   text,
  reassigned_to_id  uuid,
  message_to_homeowners text NOT NULL DEFAULT '',
  status            text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','pending_approval','resolved','cancelled')),
  resolved_at       timestamptz,
  resolved_by_id    uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS route_issues_status_idx     ON public.route_issues(status);
CREATE INDEX IF NOT EXISTS route_issues_technician_idx ON public.route_issues(technician_id);
CREATE INDEX IF NOT EXISTS route_issues_created_at_idx ON public.route_issues(created_at DESC);

CREATE TABLE IF NOT EXISTS public.route_issue_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_issue_id uuid NOT NULL REFERENCES public.route_issues(id) ON DELETE CASCADE,
  service_id     uuid NOT NULL,
  homeowner_id   uuid NOT NULL,
  previous_status        text,
  previous_time_window   text,
  previous_service_date  date,
  previous_technician_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS route_issue_services_issue_idx     ON public.route_issue_services(route_issue_id);
CREATE INDEX IF NOT EXISTS route_issue_services_service_idx   ON public.route_issue_services(service_id);
CREATE INDEX IF NOT EXISTS route_issue_services_homeowner_idx ON public.route_issue_services(homeowner_id);

CREATE TABLE IF NOT EXISTS public.homeowner_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id   uuid NOT NULL,
  route_issue_id uuid REFERENCES public.route_issues(id) ON DELETE CASCADE,
  service_id     uuid,
  kind           text NOT NULL CHECK (kind IN ('route_notify','route_delay','route_reschedule','route_reassign')),
  title          text NOT NULL,
  body           text NOT NULL DEFAULT '',
  cta_route      text,
  dismissed_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS homeowner_notifications_owner_idx
  ON public.homeowner_notifications(homeowner_id, dismissed_at, created_at DESC);

-- ============================================================
-- GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.route_issues             TO authenticated;
GRANT ALL                    ON public.route_issues             TO service_role;
GRANT SELECT, INSERT         ON public.route_issue_services     TO authenticated;
GRANT ALL                    ON public.route_issue_services     TO service_role;
GRANT SELECT, UPDATE         ON public.homeowner_notifications  TO authenticated;
GRANT ALL                    ON public.homeowner_notifications  TO service_role;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.route_issues             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_issue_services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homeowner_notifications  ENABLE ROW LEVEL SECURITY;

-- route_issues policies
CREATE POLICY "Admins manage all route issues"
  ON public.route_issues
  FOR ALL TO authenticated
  USING      (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Reporter views own route issue"
  ON public.route_issues
  FOR SELECT TO authenticated
  USING (reported_by_id = auth.uid());

CREATE POLICY "Affected homeowner views route issue"
  ON public.route_issues
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.route_issue_services ris
    WHERE ris.route_issue_id = route_issues.id
      AND ris.homeowner_id   = auth.uid()
  ));

CREATE POLICY "Assigned tech views route issue"
  ON public.route_issues
  FOR SELECT TO authenticated
  USING (technician_id = auth.uid() OR reassigned_to_id = auth.uid());

CREATE TRIGGER route_issues_set_updated_at
  BEFORE UPDATE ON public.route_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- route_issue_services policies
CREATE POLICY "Admins manage all route_issue_services"
  ON public.route_issue_services
  FOR ALL TO authenticated
  USING      (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Homeowner views own route_issue_services"
  ON public.route_issue_services
  FOR SELECT TO authenticated
  USING (homeowner_id = auth.uid());

CREATE POLICY "Technician views assigned route_issue_services"
  ON public.route_issue_services
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.route_issues ri
    WHERE ri.id = route_issue_services.route_issue_id
      AND (ri.technician_id = auth.uid() OR ri.reassigned_to_id = auth.uid())
  ));

-- homeowner_notifications policies
CREATE POLICY "Admins view all notifications"
  ON public.homeowner_notifications
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Homeowner reads own notifications"
  ON public.homeowner_notifications
  FOR SELECT TO authenticated
  USING (homeowner_id = auth.uid());

CREATE POLICY "Homeowner dismisses own notifications"
  ON public.homeowner_notifications
  FOR UPDATE TO authenticated
  USING (homeowner_id = auth.uid())
  WITH CHECK (homeowner_id = auth.uid());

-- ============================================================
-- RPC: submit_route_issue
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_route_issue(
  p_issue_type       text,
  p_other_text       text,
  p_technician_id    uuid,
  p_route_date       date,
  p_scope            text,
  p_service_ids      uuid[],
  p_action           text,
  p_delay_minutes    integer,
  p_new_service_date date,
  p_new_time_window  text,
  p_reassign_to      uuid,
  p_message          text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_role_text text;
  v_issue_id uuid;
  v_status text;
  v_svc record;
  v_kind text;
  v_title text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  v_role_text := CASE WHEN v_role = 'admin' THEN 'admin'
                      WHEN v_role = 'technician' THEN 'technician'
                      ELSE NULL END;
  IF v_role_text IS NULL THEN
    RAISE EXCEPTION 'Only admins or technicians can report route issues';
  END IF;

  IF p_action = 'reassign' AND v_role_text <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can reassign a technician';
  END IF;

  v_status := CASE WHEN p_action = 'reschedule' AND v_role_text = 'technician'
                   THEN 'pending_approval' ELSE 'active' END;

  INSERT INTO public.route_issues (
    issue_type, other_text, reported_by_role, reported_by_id,
    technician_id, route_date, scope, action_taken,
    delay_minutes, new_service_date, new_time_window, reassigned_to_id,
    message_to_homeowners, status
  ) VALUES (
    p_issue_type, NULLIF(btrim(p_other_text),''), v_role_text, v_uid,
    p_technician_id, COALESCE(p_route_date, CURRENT_DATE), p_scope, p_action,
    NULLIF(p_delay_minutes,0), p_new_service_date, NULLIF(btrim(p_new_time_window),''), p_reassign_to,
    COALESCE(p_message,''), v_status
  )
  RETURNING id INTO v_issue_id;

  FOR v_svc IN
    SELECT s.*
      FROM public.services s
     WHERE
       ( p_scope = 'specific' AND s.id = ANY(p_service_ids) )
       OR
       ( p_scope = 'all'
         AND s.service_date = COALESCE(p_route_date, CURRENT_DATE)
         AND ( p_technician_id IS NULL OR s.technician_id = p_technician_id )
         AND s.status IN ('scheduled','in_progress')
       )
  LOOP
    IF v_role_text = 'technician' AND v_svc.technician_id IS DISTINCT FROM v_uid THEN
      CONTINUE;
    END IF;

    INSERT INTO public.route_issue_services (
      route_issue_id, service_id, homeowner_id,
      previous_status, previous_time_window, previous_service_date, previous_technician_id
    ) VALUES (
      v_issue_id, v_svc.id, v_svc.homeowner_id,
      v_svc.status::text, v_svc.time_window::text, v_svc.service_date, v_svc.technician_id
    );

    IF v_status = 'active' THEN
      IF p_action = 'delay' THEN
        UPDATE public.services
           SET delay_minutes = COALESCE(NULLIF(p_delay_minutes,0), delay_minutes)
         WHERE id = v_svc.id;
      ELSIF p_action = 'reschedule' THEN
        UPDATE public.services
           SET service_date = COALESCE(p_new_service_date, service_date),
               time_window  = COALESCE(NULLIF(btrim(p_new_time_window),'')::public.time_window, time_window),
               delay_minutes = 0
         WHERE id = v_svc.id;
      ELSIF p_action = 'reassign' THEN
        UPDATE public.services SET technician_id = p_reassign_to WHERE id = v_svc.id;
        UPDATE public.pools    SET assigned_technician_id = p_reassign_to WHERE id = v_svc.pool_id;
      END IF;

      v_kind  := 'route_' || p_action;
      v_title := CASE p_action
                   WHEN 'notify'     THEN 'Service update from your technician'
                   WHEN 'delay'      THEN 'Your service may be delayed'
                   WHEN 'reschedule' THEN 'Your service has been rescheduled'
                   WHEN 'reassign'   THEN 'A new technician has been assigned'
                 END;

      INSERT INTO public.homeowner_notifications
        (homeowner_id, route_issue_id, service_id, kind, title, body, cta_route)
      VALUES
        (v_svc.homeowner_id, v_issue_id, v_svc.id, v_kind, v_title,
         COALESCE(NULLIF(btrim(p_message),''),''), '/service/' || v_svc.id::text);
    END IF;
  END LOOP;

  RETURN v_issue_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_route_issue(text,text,uuid,date,text,uuid[],text,integer,date,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_route_issue(text,text,uuid,date,text,uuid[],text,integer,date,text,uuid,text) TO authenticated;

-- ============================================================
-- RPC: resolve_route_issue (admins)
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_route_issue(p_id uuid, p_status text)
RETURNS public.route_issues
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.route_issues;
BEGIN
  IF v_uid IS NULL OR NOT private.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can resolve route issues';
  END IF;
  IF p_status NOT IN ('resolved','cancelled') THEN
    RAISE EXCEPTION 'Invalid status %', p_status;
  END IF;

  UPDATE public.route_issues
     SET status = p_status, resolved_at = now(), resolved_by_id = v_uid
   WHERE id = p_id
  RETURNING * INTO v_row;

  IF p_status = 'resolved' AND v_row.action_taken = 'delay' THEN
    UPDATE public.services s
       SET delay_minutes = 0
      FROM public.route_issue_services ris
     WHERE ris.route_issue_id = p_id
       AND s.id = ris.service_id;
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_route_issue(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_route_issue(uuid,text) TO authenticated;

-- ============================================================
-- RPC: dismiss_homeowner_notification
-- ============================================================
CREATE OR REPLACE FUNCTION public.dismiss_homeowner_notification(p_id uuid)
RETURNS public.homeowner_notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.homeowner_notifications;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.homeowner_notifications
     SET dismissed_at = now()
   WHERE id = p_id AND homeowner_id = v_uid
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.dismiss_homeowner_notification(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dismiss_homeowner_notification(uuid) TO authenticated;

-- ============================================================
-- Realtime
-- ============================================================
ALTER TABLE public.route_issues             REPLICA IDENTITY FULL;
ALTER TABLE public.route_issue_services     REPLICA IDENTITY FULL;
ALTER TABLE public.homeowner_notifications  REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.route_issues;             EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.route_issue_services;     EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.homeowner_notifications;  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;


-- ============================================================
-- Migration: 20260626022046_6d56ca00-a569-48be-82e5-a35084ad23d6.sql
-- ============================================================

-- Audit log for route issues
CREATE TABLE public.route_issue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_issue_id uuid NOT NULL REFERENCES public.route_issues(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'created','service_affected','service_updated','notification_sent',
    'status_changed','reschedule_approved'
  )),
  actor_id uuid,
  actor_role text,
  service_id uuid,
  homeowner_id uuid,
  notification_id uuid,
  summary text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX route_issue_events_issue_idx ON public.route_issue_events(route_issue_id, created_at);
CREATE INDEX route_issue_events_type_idx ON public.route_issue_events(event_type);

GRANT SELECT, INSERT ON public.route_issue_events TO authenticated;
GRANT ALL ON public.route_issue_events TO service_role;

ALTER TABLE public.route_issue_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all route_issue_events"
  ON public.route_issue_events FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Affected homeowner views route_issue_events"
  ON public.route_issue_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.route_issue_services ris
    WHERE ris.route_issue_id = route_issue_events.route_issue_id
      AND ris.homeowner_id = auth.uid()
  ));

CREATE POLICY "Technician views own route_issue_events"
  ON public.route_issue_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.route_issues ri
    WHERE ri.id = route_issue_events.route_issue_id
      AND (ri.technician_id = auth.uid() OR ri.reassigned_to_id = auth.uid() OR ri.reported_by_id = auth.uid())
  ));

ALTER PUBLICATION supabase_realtime ADD TABLE public.route_issue_events;

-- Rewire submit_route_issue to emit audit events
CREATE OR REPLACE FUNCTION public.submit_route_issue(
  p_issue_type text, p_other_text text, p_technician_id uuid, p_route_date date,
  p_scope text, p_service_ids uuid[], p_action text, p_delay_minutes integer,
  p_new_service_date date, p_new_time_window text, p_reassign_to uuid, p_message text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_role_text text;
  v_issue_id uuid;
  v_status text;
  v_svc record;
  v_kind text;
  v_title text;
  v_notif_id uuid;
  v_affected_count int := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  v_role_text := CASE WHEN v_role = 'admin' THEN 'admin'
                      WHEN v_role = 'technician' THEN 'technician'
                      ELSE NULL END;
  IF v_role_text IS NULL THEN RAISE EXCEPTION 'Only admins or technicians can report route issues'; END IF;
  IF p_action = 'reassign' AND v_role_text <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can reassign a technician';
  END IF;

  v_status := CASE WHEN p_action = 'reschedule' AND v_role_text = 'technician'
                   THEN 'pending_approval' ELSE 'active' END;

  INSERT INTO public.route_issues (
    issue_type, other_text, reported_by_role, reported_by_id,
    technician_id, route_date, scope, action_taken,
    delay_minutes, new_service_date, new_time_window, reassigned_to_id,
    message_to_homeowners, status
  ) VALUES (
    p_issue_type, NULLIF(btrim(p_other_text),''), v_role_text, v_uid,
    p_technician_id, COALESCE(p_route_date, CURRENT_DATE), p_scope, p_action,
    NULLIF(p_delay_minutes,0), p_new_service_date, NULLIF(btrim(p_new_time_window),''), p_reassign_to,
    COALESCE(p_message,''), v_status
  ) RETURNING id INTO v_issue_id;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role, summary, details)
  VALUES (v_issue_id, 'created', v_uid, v_role_text,
    'Route issue reported',
    jsonb_build_object('issue_type', p_issue_type, 'scope', p_scope, 'action', p_action,
      'route_date', COALESCE(p_route_date, CURRENT_DATE), 'status', v_status));

  FOR v_svc IN
    SELECT s.* FROM public.services s
     WHERE ( p_scope = 'specific' AND s.id = ANY(p_service_ids) )
        OR ( p_scope = 'all'
             AND s.service_date = COALESCE(p_route_date, CURRENT_DATE)
             AND ( p_technician_id IS NULL OR s.technician_id = p_technician_id )
             AND s.status IN ('scheduled','in_progress') )
  LOOP
    IF v_role_text = 'technician' AND v_svc.technician_id IS DISTINCT FROM v_uid THEN CONTINUE; END IF;

    INSERT INTO public.route_issue_services (
      route_issue_id, service_id, homeowner_id,
      previous_status, previous_time_window, previous_service_date, previous_technician_id
    ) VALUES (
      v_issue_id, v_svc.id, v_svc.homeowner_id,
      v_svc.status::text, v_svc.time_window::text, v_svc.service_date, v_svc.technician_id
    );
    v_affected_count := v_affected_count + 1;

    INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
      service_id, homeowner_id, summary, details)
    VALUES (v_issue_id, 'service_affected', v_uid, v_role_text,
      v_svc.id, v_svc.homeowner_id,
      'Appointment linked to route issue',
      jsonb_build_object(
        'previous_status', v_svc.status::text,
        'previous_time_window', v_svc.time_window::text,
        'previous_service_date', v_svc.service_date,
        'previous_technician_id', v_svc.technician_id
      ));

    IF v_status = 'active' THEN
      IF p_action = 'delay' THEN
        UPDATE public.services
           SET delay_minutes = COALESCE(NULLIF(p_delay_minutes,0), delay_minutes)
         WHERE id = v_svc.id;
        INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
          service_id, homeowner_id, summary, details)
        VALUES (v_issue_id, 'service_updated', v_uid, v_role_text, v_svc.id, v_svc.homeowner_id,
          format('Delay added (%s min)', COALESCE(p_delay_minutes,0)),
          jsonb_build_object('action','delay','delay_minutes', p_delay_minutes));
      ELSIF p_action = 'reschedule' THEN
        UPDATE public.services
           SET service_date = COALESCE(p_new_service_date, service_date),
               time_window  = COALESCE(NULLIF(btrim(p_new_time_window),'')::public.time_window, time_window),
               delay_minutes = 0
         WHERE id = v_svc.id;
        INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
          service_id, homeowner_id, summary, details)
        VALUES (v_issue_id, 'service_updated', v_uid, v_role_text, v_svc.id, v_svc.homeowner_id,
          'Appointment rescheduled',
          jsonb_build_object('action','reschedule',
            'new_service_date', p_new_service_date,
            'new_time_window', p_new_time_window,
            'previous_service_date', v_svc.service_date,
            'previous_time_window', v_svc.time_window::text));
      ELSIF p_action = 'reassign' THEN
        UPDATE public.services SET technician_id = p_reassign_to WHERE id = v_svc.id;
        UPDATE public.pools    SET assigned_technician_id = p_reassign_to WHERE id = v_svc.pool_id;
        INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
          service_id, homeowner_id, summary, details)
        VALUES (v_issue_id, 'service_updated', v_uid, v_role_text, v_svc.id, v_svc.homeowner_id,
          'Technician reassigned',
          jsonb_build_object('action','reassign',
            'previous_technician_id', v_svc.technician_id,
            'new_technician_id', p_reassign_to));
      END IF;

      v_kind  := 'route_' || p_action;
      v_title := CASE p_action
                   WHEN 'notify'     THEN 'Service update from your technician'
                   WHEN 'delay'      THEN 'Your service may be delayed'
                   WHEN 'reschedule' THEN 'Your service has been rescheduled'
                   WHEN 'reassign'   THEN 'A new technician has been assigned'
                 END;

      INSERT INTO public.homeowner_notifications
        (homeowner_id, route_issue_id, service_id, kind, title, body, cta_route)
      VALUES
        (v_svc.homeowner_id, v_issue_id, v_svc.id, v_kind, v_title,
         COALESCE(NULLIF(btrim(p_message),''),''), '/service/' || v_svc.id::text)
      RETURNING id INTO v_notif_id;

      INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
        service_id, homeowner_id, notification_id, summary, details)
      VALUES (v_issue_id, 'notification_sent', v_uid, v_role_text,
        v_svc.id, v_svc.homeowner_id, v_notif_id,
        format('Notification sent: %s', v_title),
        jsonb_build_object('kind', v_kind, 'title', v_title, 'body', COALESCE(p_message,'')));
    END IF;
  END LOOP;

  RETURN v_issue_id;
END;
$function$;

-- Rewire resolve_route_issue to emit status_changed event
CREATE OR REPLACE FUNCTION public.resolve_route_issue(p_id uuid, p_status text)
RETURNS public.route_issues
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.route_issues;
  v_prev text;
BEGIN
  IF v_uid IS NULL OR NOT private.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can resolve route issues';
  END IF;
  IF p_status NOT IN ('resolved','cancelled') THEN
    RAISE EXCEPTION 'Invalid status %', p_status;
  END IF;

  SELECT status INTO v_prev FROM public.route_issues WHERE id = p_id;

  UPDATE public.route_issues
     SET status = p_status, resolved_at = now(), resolved_by_id = v_uid
   WHERE id = p_id
  RETURNING * INTO v_row;

  IF p_status = 'resolved' AND v_row.action_taken = 'delay' THEN
    UPDATE public.services s
       SET delay_minutes = 0
      FROM public.route_issue_services ris
     WHERE ris.route_issue_id = p_id AND s.id = ris.service_id;
  END IF;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
    summary, details)
  VALUES (p_id, 'status_changed', v_uid, 'admin',
    format('Status changed: %s → %s', COALESCE(v_prev,''), p_status),
    jsonb_build_object('from', v_prev, 'to', p_status));

  RETURN v_row;
END;
$function$;


-- ============================================================
-- Migration: 20260626023047_dc92041f-ff0b-46fb-8d20-cdd4e699a655.sql
-- ============================================================

-- ─── Enums ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.day_off_status AS ENUM ('pending','approved','denied','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.day_off_resolution AS ENUM ('reassign','unassigned','reschedule','notify_only');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── day_off_requests ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.day_off_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status public.day_off_status NOT NULL DEFAULT 'pending',
  resolution_action public.day_off_resolution,
  decided_by_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT day_off_requests_range_chk CHECK (end_date >= start_date)
);

GRANT SELECT, INSERT, UPDATE ON public.day_off_requests TO authenticated;
GRANT ALL ON public.day_off_requests TO service_role;
ALTER TABLE public.day_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tech can view own requests" ON public.day_off_requests
  FOR SELECT TO authenticated
  USING (technician_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role));

CREATE POLICY "Tech can insert own requests" ON public.day_off_requests
  FOR INSERT TO authenticated
  WITH CHECK (technician_id = auth.uid());

CREATE POLICY "Admin can update requests" ON public.day_off_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role) OR technician_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role) OR technician_id = auth.uid());

CREATE TRIGGER trg_day_off_requests_updated
  BEFORE UPDATE ON public.day_off_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── technician_unavailability ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.technician_unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  reason text,
  source text NOT NULL DEFAULT 'day_off_request',
  request_id uuid REFERENCES public.day_off_requests(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (technician_id, date)
);

GRANT SELECT ON public.technician_unavailability TO authenticated;
GRANT ALL ON public.technician_unavailability TO service_role;
ALTER TABLE public.technician_unavailability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view unavailability" ON public.technician_unavailability
  FOR SELECT TO authenticated USING (true);

-- ─── day_off_request_events ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.day_off_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.day_off_requests(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role text,
  summary text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.day_off_request_events TO authenticated;
GRANT ALL ON public.day_off_request_events TO service_role;
ALTER TABLE public.day_off_request_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View events for own or admin" ON public.day_off_request_events
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin'::public.app_role) OR EXISTS (
      SELECT 1 FROM public.day_off_requests r
      WHERE r.id = request_id AND r.technician_id = auth.uid()
    )
  );

-- ─── tech_notifications ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tech_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  cta_route text,
  request_id uuid REFERENCES public.day_off_requests(id) ON DELETE SET NULL,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.tech_notifications TO authenticated;
GRANT ALL ON public.tech_notifications TO service_role;
ALTER TABLE public.tech_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tech reads own notifications" ON public.tech_notifications
  FOR SELECT TO authenticated
  USING (technician_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role));

CREATE POLICY "Tech updates own notifications" ON public.tech_notifications
  FOR UPDATE TO authenticated
  USING (technician_id = auth.uid())
  WITH CHECK (technician_id = auth.uid());

-- ─── Realtime ──────────────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.day_off_requests;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.day_off_request_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tech_notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.technician_unavailability;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── RPC: submit ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_day_off_request(
  p_start date, p_end date, p_reason text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  IF v_role IS DISTINCT FROM 'technician' THEN
    RAISE EXCEPTION 'Only technicians can submit day-off requests';
  END IF;
  IF p_end < p_start THEN RAISE EXCEPTION 'End date before start date'; END IF;

  INSERT INTO public.day_off_requests (technician_id, start_date, end_date, reason)
  VALUES (v_uid, p_start, p_end, NULLIF(btrim(p_reason),''))
  RETURNING id INTO v_id;

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary, details)
  VALUES (v_id, 'submitted', v_uid, 'technician',
    format('Day off request submitted for %s to %s', p_start, p_end),
    jsonb_build_object('start_date', p_start, 'end_date', p_end, 'reason', p_reason));

  RETURN v_id;
END $$;

-- ─── RPC: cancel (tech withdraws) ──────────────────────────
CREATE OR REPLACE FUNCTION public.cancel_day_off_request(p_id uuid)
RETURNS public.day_off_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.day_off_requests;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_row FROM public.day_off_requests WHERE id = p_id;
  IF v_row IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_row.technician_id <> v_uid THEN RAISE EXCEPTION 'Not your request'; END IF;
  IF v_row.status <> 'pending' THEN RAISE EXCEPTION 'Only pending requests can be cancelled'; END IF;

  UPDATE public.day_off_requests SET status = 'cancelled' WHERE id = p_id RETURNING * INTO v_row;
  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary)
  VALUES (p_id, 'cancelled', v_uid, 'technician', 'Request withdrawn by technician');
  RETURN v_row;
END $$;

-- ─── RPC: preview impact ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.preview_day_off_impact(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req public.day_off_requests;
  v_services jsonb;
  v_homeowner_count int;
BEGIN
  SELECT * INTO v_req FROM public.day_off_requests WHERE id = p_id;
  IF v_req IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin'::public.app_role) OR v_req.technician_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'service_id', s.id,
    'service_date', s.service_date,
    'service_type', s.service_type,
    'status', s.status::text,
    'homeowner_id', s.homeowner_id,
    'homeowner_name', COALESCE(p.full_name, p.email),
    'address', po.address
  ) ORDER BY s.service_date), '[]'::jsonb),
  COUNT(DISTINCT s.homeowner_id)::int
  INTO v_services, v_homeowner_count
  FROM public.services s
  LEFT JOIN public.profiles p ON p.id = s.homeowner_id
  LEFT JOIN public.pools po ON po.id = s.pool_id
  WHERE s.technician_id = v_req.technician_id
    AND s.service_date BETWEEN v_req.start_date AND v_req.end_date
    AND s.status IN ('scheduled','in_progress');

  RETURN jsonb_build_object(
    'affected_services', v_services,
    'affected_homeowner_count', v_homeowner_count,
    'days', (v_req.end_date - v_req.start_date) + 1
  );
END $$;

-- ─── RPC: approve ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_day_off_request(
  p_id uuid,
  p_action public.day_off_resolution,
  p_reassign_to uuid,
  p_reschedule_to date,
  p_message text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_req public.day_off_requests;
  v_d date;
  v_svc record;
  v_affected int := 0;
  v_title text;
  v_kind text;
  v_notif_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid,'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can approve day-off requests';
  END IF;
  SELECT * INTO v_req FROM public.day_off_requests WHERE id = p_id FOR UPDATE;
  IF v_req IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_req.status <> 'pending' THEN RAISE EXCEPTION 'Request already %', v_req.status; END IF;

  IF p_action = 'reassign' AND p_reassign_to IS NULL THEN
    RAISE EXCEPTION 'Reassign target required';
  END IF;
  IF p_action = 'reschedule' AND p_reschedule_to IS NULL THEN
    RAISE EXCEPTION 'New service date required';
  END IF;

  UPDATE public.day_off_requests
     SET status='approved', resolution_action=p_action,
         decided_by_id=v_uid, decided_at=now(), decision_note=NULLIF(btrim(p_message),'')
   WHERE id = p_id;

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary, details)
  VALUES (p_id, 'approved', v_uid, 'admin',
    format('Approved with action: %s', p_action),
    jsonb_build_object('action', p_action, 'reassign_to', p_reassign_to,
      'reschedule_to', p_reschedule_to, 'message', p_message));

  -- Mark technician unavailable for every date in range
  v_d := v_req.start_date;
  WHILE v_d <= v_req.end_date LOOP
    INSERT INTO public.technician_unavailability (technician_id, date, reason, source, request_id)
    VALUES (v_req.technician_id, v_d, COALESCE(v_req.reason,'Approved day off'), 'day_off_request', p_id)
    ON CONFLICT (technician_id, date) DO NOTHING;
    v_d := v_d + 1;
  END LOOP;
  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary)
  VALUES (p_id, 'availability_updated', v_uid, 'admin',
    format('Technician marked unavailable %s – %s', v_req.start_date, v_req.end_date));

  -- Apply action to affected services
  FOR v_svc IN
    SELECT s.*
      FROM public.services s
     WHERE s.technician_id = v_req.technician_id
       AND s.service_date BETWEEN v_req.start_date AND v_req.end_date
       AND s.status IN ('scheduled','in_progress')
  LOOP
    v_affected := v_affected + 1;

    IF p_action = 'reassign' THEN
      UPDATE public.services SET technician_id = p_reassign_to WHERE id = v_svc.id;
      UPDATE public.pools SET assigned_technician_id = p_reassign_to WHERE id = v_svc.pool_id;
      v_kind := 'tech_reassigned';
      v_title := 'A new technician has been assigned';
    ELSIF p_action = 'unassigned' THEN
      UPDATE public.services SET technician_id = NULL WHERE id = v_svc.id;
      v_kind := 'tech_unassigned';
      v_title := 'Your technician is being reassigned';
    ELSIF p_action = 'reschedule' THEN
      UPDATE public.services SET service_date = p_reschedule_to WHERE id = v_svc.id;
      v_kind := 'service_rescheduled';
      v_title := 'Your service has been rescheduled';
    ELSE
      v_kind := 'service_update';
      v_title := 'Service update from your technician';
    END IF;

    INSERT INTO public.homeowner_notifications
      (homeowner_id, service_id, kind, title, body, cta_route)
    VALUES (v_svc.homeowner_id, v_svc.id, v_kind, v_title,
            COALESCE(NULLIF(btrim(p_message),''),''), '/service/' || v_svc.id::text)
    RETURNING id INTO v_notif_id;
  END LOOP;

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary, details)
  VALUES (p_id, 'appointments_updated', v_uid, 'admin',
    format('%s appointment(s) updated', v_affected),
    jsonb_build_object('count', v_affected, 'action', p_action));

  -- Notify technician
  INSERT INTO public.tech_notifications (technician_id, kind, title, body, cta_route, request_id)
  VALUES (v_req.technician_id, 'day_off_approved',
    format('Your day off request for %s to %s has been approved.', v_req.start_date, v_req.end_date),
    COALESCE(NULLIF(btrim(p_message),''),''),
    '/tech/time-off', p_id);

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary)
  VALUES (p_id, 'tech_notified', v_uid, 'admin', 'Technician notified of approval');

  RETURN p_id;
END $$;

-- ─── RPC: deny ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deny_day_off_request(p_id uuid, p_reason text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_req public.day_off_requests;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid,'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can deny day-off requests';
  END IF;
  SELECT * INTO v_req FROM public.day_off_requests WHERE id = p_id FOR UPDATE;
  IF v_req IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_req.status <> 'pending' THEN RAISE EXCEPTION 'Request already %', v_req.status; END IF;

  UPDATE public.day_off_requests
     SET status='denied', decided_by_id=v_uid, decided_at=now(),
         decision_note=NULLIF(btrim(p_reason),'')
   WHERE id = p_id;

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary, details)
  VALUES (p_id, 'denied', v_uid, 'admin', 'Request denied',
    jsonb_build_object('reason', p_reason));

  INSERT INTO public.tech_notifications (technician_id, kind, title, body, cta_route, request_id)
  VALUES (v_req.technician_id, 'day_off_denied',
    format('Your day off request for %s to %s was not approved.', v_req.start_date, v_req.end_date),
    COALESCE(NULLIF(btrim(p_reason),''),''),
    '/tech/time-off', p_id);

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary)
  VALUES (p_id, 'tech_notified', v_uid, 'admin', 'Technician notified of denial');

  RETURN p_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_day_off_request(date,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_day_off_request(date,date,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_day_off_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_day_off_request(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.preview_day_off_impact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_day_off_impact(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_day_off_request(uuid,public.day_off_resolution,uuid,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_day_off_request(uuid,public.day_off_resolution,uuid,date,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.deny_day_off_request(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deny_day_off_request(uuid,text) TO authenticated;


-- ============================================================
-- Migration: 20260626023521_f1f41ce2-1589-40fb-9e5f-3fe2ccb7259f.sql
-- ============================================================

CREATE OR REPLACE FUNCTION public.approve_day_off_request(
  p_id uuid,
  p_action public.day_off_resolution,
  p_reassign_to uuid,
  p_reschedule_to date,
  p_message text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_req public.day_off_requests;
  v_d date;
  v_svc record;
  v_affected int := 0;
  v_title text;
  v_kind text;
  v_notif_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid,'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can approve day-off requests';
  END IF;
  SELECT * INTO v_req FROM public.day_off_requests WHERE id = p_id FOR UPDATE;
  IF v_req IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_req.status <> 'pending' THEN RAISE EXCEPTION 'Request already %', v_req.status; END IF;

  IF p_action = 'reassign' AND p_reassign_to IS NULL THEN
    RAISE EXCEPTION 'Reassign target required';
  END IF;
  IF p_action = 'reschedule' AND p_reschedule_to IS NULL THEN
    RAISE EXCEPTION 'New service date required';
  END IF;

  UPDATE public.day_off_requests
     SET status='approved', resolution_action=p_action,
         decided_by_id=v_uid, decided_at=now(), decision_note=NULLIF(btrim(p_message),'')
   WHERE id = p_id;

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary, details)
  VALUES (p_id, 'approved', v_uid, 'admin',
    format('Approved with action: %s', p_action),
    jsonb_build_object('action', p_action, 'reassign_to', p_reassign_to,
      'reschedule_to', p_reschedule_to, 'message', p_message));

  v_d := v_req.start_date;
  WHILE v_d <= v_req.end_date LOOP
    INSERT INTO public.technician_unavailability (technician_id, date, reason, source, request_id)
    VALUES (v_req.technician_id, v_d, COALESCE(v_req.reason,'Approved day off'), 'day_off_request', p_id)
    ON CONFLICT (technician_id, date) DO NOTHING;
    v_d := v_d + 1;
  END LOOP;
  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary)
  VALUES (p_id, 'availability_updated', v_uid, 'admin',
    format('Technician marked unavailable %s – %s', v_req.start_date, v_req.end_date));

  FOR v_svc IN
    SELECT s.*
      FROM public.services s
     WHERE s.technician_id = v_req.technician_id
       AND s.service_date BETWEEN v_req.start_date AND v_req.end_date
       AND s.status IN ('scheduled','in_progress')
  LOOP
    v_affected := v_affected + 1;

    IF p_action = 'reassign' THEN
      UPDATE public.services SET technician_id = p_reassign_to WHERE id = v_svc.id;
      UPDATE public.pools SET assigned_technician_id = p_reassign_to WHERE id = v_svc.pool_id;
      v_kind := 'route_reassign';
      v_title := 'A new technician has been assigned';
    ELSIF p_action = 'unassigned' THEN
      UPDATE public.services SET technician_id = NULL WHERE id = v_svc.id;
      v_kind := 'route_reassign';
      v_title := 'Your technician is being reassigned';
    ELSIF p_action = 'reschedule' THEN
      UPDATE public.services SET service_date = p_reschedule_to WHERE id = v_svc.id;
      v_kind := 'route_reschedule';
      v_title := 'Your service has been rescheduled';
    ELSE
      v_kind := 'route_notify';
      v_title := 'Service update from your technician';
    END IF;

    INSERT INTO public.homeowner_notifications
      (homeowner_id, service_id, kind, title, body, cta_route)
    VALUES (v_svc.homeowner_id, v_svc.id, v_kind, v_title,
            COALESCE(NULLIF(btrim(p_message),''),''), '/service/' || v_svc.id::text)
    RETURNING id INTO v_notif_id;
  END LOOP;

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary, details)
  VALUES (p_id, 'appointments_updated', v_uid, 'admin',
    format('%s appointment(s) updated', v_affected),
    jsonb_build_object('count', v_affected, 'action', p_action));

  INSERT INTO public.tech_notifications (technician_id, kind, title, body, cta_route, request_id)
  VALUES (v_req.technician_id, 'day_off_approved',
    format('Your day off request for %s to %s has been approved.', v_req.start_date, v_req.end_date),
    COALESCE(NULLIF(btrim(p_message),''),''),
    '/tech/time-off', p_id);

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary)
  VALUES (p_id, 'tech_notified', v_uid, 'admin', 'Technician notified of approval');

  RETURN p_id;
END $$;


-- ============================================================
-- Migration: 20260626030341_fad7b982-f0ae-4607-bb25-8784477f32d4.sql
-- ============================================================

-- Fix infinite recursion between route_issues and route_issue_services policies
-- by replacing cross-table EXISTS checks with SECURITY DEFINER helper functions.

CREATE OR REPLACE FUNCTION private.is_affected_homeowner_of_route_issue(_issue_id uuid, _uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.route_issue_services ris
    WHERE ris.route_issue_id = _issue_id
      AND ris.homeowner_id = _uid
  );
$$;

CREATE OR REPLACE FUNCTION private.is_tech_on_route_issue(_issue_id uuid, _uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.route_issues ri
    WHERE ri.id = _issue_id
      AND (ri.technician_id = _uid OR ri.reassigned_to_id = _uid)
  );
$$;

GRANT EXECUTE ON FUNCTION private.is_affected_homeowner_of_route_issue(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_tech_on_route_issue(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Affected homeowner views route issue" ON public.route_issues;
CREATE POLICY "Affected homeowner views route issue"
  ON public.route_issues FOR SELECT
  USING (private.is_affected_homeowner_of_route_issue(id, auth.uid()));

DROP POLICY IF EXISTS "Technician views assigned route_issue_services" ON public.route_issue_services;
CREATE POLICY "Technician views assigned route_issue_services"
  ON public.route_issue_services FOR SELECT
  USING (private.is_tech_on_route_issue(route_issue_id, auth.uid()));


-- ============================================================
-- Migration: 20260626033835_baaaa51b-6ebc-4055-ae72-9e5f670a6145.sql
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_type text NOT NULL DEFAULT 'per_service' CHECK (payout_type IN ('hourly','per_service','daily')),
  ADD COLUMN IF NOT EXISTS payout_rate numeric(10,2),
  ADD COLUMN IF NOT EXISTS payout_effective_date date,
  ADD COLUMN IF NOT EXISTS payout_updated_at timestamptz;

-- Backfill payout_rate from legacy payout_per_pool for technicians
UPDATE public.profiles
   SET payout_rate = payout_per_pool
 WHERE role = 'technician' AND payout_rate IS NULL;

-- ============================================================
-- Migration: 20260626035249_a12feaa9-e0eb-4ad1-b355-dd770db9e6f9.sql
-- ============================================================

-- 1) Compensation audit log table
CREATE TABLE IF NOT EXISTS public.compensation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id),
  previous_payout_type text,
  previous_payout_rate numeric,
  new_payout_type text NOT NULL,
  new_payout_rate numeric NOT NULL,
  effective_date date,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.compensation_events TO authenticated;
GRANT ALL ON public.compensation_events TO service_role;

ALTER TABLE public.compensation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view compensation events"
  ON public.compensation_events FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Techs view own compensation events"
  ON public.compensation_events FOR SELECT TO authenticated
  USING (technician_id = auth.uid());

CREATE INDEX IF NOT EXISTS compensation_events_tech_created_idx
  ON public.compensation_events (technician_id, created_at DESC);

-- 2) RPC: update technician compensation (admin only) + write audit log
CREATE OR REPLACE FUNCTION public.update_technician_compensation(
  p_technician_id uuid,
  p_payout_type   text,
  p_payout_rate   numeric,
  p_effective_date date
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_uid uuid := auth.uid();
  v_prev_type text;
  v_prev_rate numeric;
  v_actor_name text;
  v_tech_name  text;
  v_profile public.profiles;
BEGIN
  IF v_uid IS NULL OR NOT private.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can update technician compensation';
  END IF;

  IF p_payout_type NOT IN ('hourly','per_service','daily') THEN
    RAISE EXCEPTION 'Invalid payout type: %', p_payout_type;
  END IF;

  IF p_payout_rate IS NULL OR p_payout_rate < 0 THEN
    RAISE EXCEPTION 'Payout rate must be a positive number';
  END IF;

  SELECT payout_type, payout_rate, COALESCE(full_name, email)
    INTO v_prev_type, v_prev_rate, v_tech_name
    FROM public.profiles WHERE id = p_technician_id;

  IF v_tech_name IS NULL THEN
    RAISE EXCEPTION 'Technician not found';
  END IF;

  SELECT COALESCE(full_name, email) INTO v_actor_name
    FROM public.profiles WHERE id = v_uid;

  UPDATE public.profiles
     SET payout_type = p_payout_type,
         payout_rate = p_payout_rate,
         payout_effective_date = p_effective_date,
         payout_updated_at = now()
   WHERE id = p_technician_id
  RETURNING * INTO v_profile;

  INSERT INTO public.compensation_events (
    technician_id, actor_id,
    previous_payout_type, previous_payout_rate,
    new_payout_type, new_payout_rate,
    effective_date, summary
  ) VALUES (
    p_technician_id, v_uid,
    v_prev_type, v_prev_rate,
    p_payout_type, p_payout_rate,
    p_effective_date,
    format('%s updated %s''s payout rate from $%s/%s to $%s/%s',
      COALESCE(v_actor_name,'Admin'), v_tech_name,
      COALESCE(v_prev_rate::text,'0'), COALESCE(v_prev_type,'per_service'),
      p_payout_rate::text, p_payout_type)
  );

  RETURN v_profile;
END
$fn$;

REVOKE ALL ON FUNCTION public.update_technician_compensation(uuid, text, numeric, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_technician_compensation(uuid, text, numeric, date) TO authenticated;


-- ============================================================
-- Migration: 20260626045243_d20e30cb-d3de-481d-96a4-8d9a1e401cab.sql
-- ============================================================
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

-- ============================================================
-- Migration: 20260626045317_62a1d58b-2f8a-4154-bd21-6bf32ca20150.sql
-- ============================================================
ALTER TABLE public.profiles DISABLE TRIGGER USER; UPDATE public.profiles SET role='admin'::public.app_role WHERE email='admin@example.com'; ALTER TABLE public.profiles ENABLE TRIGGER USER;

-- ============================================================
-- Migration: 20260626051445_13107d8d-72d8-43ce-a37f-22c4541472f2.sql
-- ============================================================

-- =========================================================
-- Phase 1: Admin pricing foundation
-- Adds selected-addons per homeowner, custom price override,
-- grandfathered snapshot, and updates pricing math + RPCs.
-- =========================================================

-- 1. Custom pricing + grandfathered snapshot on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS use_custom_pricing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_monthly_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS grandfathered_snapshot jsonb;

-- 2. Selected add-ons per homeowner
CREATE TABLE IF NOT EXISTS public.homeowner_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES public.pricing_addons(id) ON DELETE RESTRICT,
  price_snapshot numeric(10,2) NOT NULL,
  billing_type_snapshot text NOT NULL DEFAULT 'one_time',
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (homeowner_id, addon_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.homeowner_addons TO authenticated;
GRANT ALL ON public.homeowner_addons TO service_role;

ALTER TABLE public.homeowner_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners read own addons"
  ON public.homeowner_addons FOR SELECT
  TO authenticated
  USING (homeowner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage homeowner addons"
  ON public.homeowner_addons FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_homeowner_addons_updated
  BEFORE UPDATE ON public.homeowner_addons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Updated compute function: custom > grandfathered snapshot > computed
CREATE OR REPLACE FUNCTION public.compute_homeowner_monthly(p_homeowner_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile public.profiles;
  v_pool public.pools;
  v_pool_price numeric := 0;
  v_freq_delta numeric := 0;
  v_freq_mult numeric := 1;
  v_addons numeric := 0;
  v_custom numeric := 0;
  v_total numeric := 0;
  v_snap jsonb;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_homeowner_id;
  IF v_profile IS NULL THEN RETURN 0; END IF;

  -- Custom override wins above all
  IF v_profile.use_custom_pricing AND v_profile.custom_monthly_price IS NOT NULL THEN
    RETURN v_profile.custom_monthly_price;
  END IF;

  -- Grandfathered snapshot wins next
  IF v_profile.is_grandfathered THEN
    v_snap := v_profile.grandfathered_snapshot;
    IF v_snap IS NOT NULL AND (v_snap ? 'monthly_total') THEN
      RETURN (v_snap->>'monthly_total')::numeric;
    END IF;
    IF v_profile.grandfathered_monthly_override IS NOT NULL THEN
      RETURN v_profile.grandfathered_monthly_override;
    END IF;
    IF v_profile.grandfathered_plan_id IS NOT NULL THEN
      SELECT monthly_price INTO v_total
        FROM public.pricing_grandfathered_plans
       WHERE id = v_profile.grandfathered_plan_id;
      IF v_total IS NOT NULL THEN RETURN v_total; END IF;
    END IF;
    IF v_profile.monthly_amount IS NOT NULL THEN
      RETURN v_profile.monthly_amount;
    END IF;
  END IF;

  SELECT * INTO v_pool FROM public.pools WHERE homeowner_id = p_homeowner_id LIMIT 1;

  IF v_pool.pool_size IS NOT NULL THEN
    SELECT base_monthly_price INTO v_pool_price
      FROM public.pricing_pool_sizes
     WHERE lower(size) = lower(v_pool.pool_size) AND active;
  END IF;
  v_pool_price := COALESCE(v_pool_price, 0);

  IF v_pool.frequency IS NOT NULL THEN
    SELECT price_delta, multiplier INTO v_freq_delta, v_freq_mult
      FROM public.pricing_frequencies
     WHERE lower(frequency) = lower(v_pool.frequency) AND active;
  END IF;
  v_freq_delta := COALESCE(v_freq_delta, 0);
  v_freq_mult  := COALESCE(v_freq_mult, 1);

  -- Recurring add-ons from homeowner_addons
  SELECT COALESCE(SUM(price_snapshot),0) INTO v_addons
    FROM public.homeowner_addons
   WHERE homeowner_id = p_homeowner_id
     AND active
     AND billing_type_snapshot = 'recurring';

  SELECT COALESCE(SUM(amount),0) INTO v_custom
    FROM public.homeowner_custom_charges
   WHERE homeowner_id = p_homeowner_id AND active AND billing_type = 'monthly';

  v_total := (v_pool_price * v_freq_mult) + v_freq_delta + v_addons + v_custom;
  RETURN ROUND(v_total::numeric, 2);
END;
$function$;

-- 4. RPC: replace homeowner add-on selections (admin only)
CREATE OR REPLACE FUNCTION public.set_homeowner_addons(
  p_homeowner_id uuid,
  p_addon_ids uuid[]
) RETURNS SETOF public.homeowner_addons
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_addon_id uuid;
  v_addon public.pricing_addons;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can manage homeowner add-ons';
  END IF;

  -- Soft-deactivate any not in new set
  UPDATE public.homeowner_addons
     SET active = false, updated_at = now()
   WHERE homeowner_id = p_homeowner_id
     AND (p_addon_ids IS NULL OR NOT (addon_id = ANY(p_addon_ids)));

  IF p_addon_ids IS NOT NULL THEN
    FOREACH v_addon_id IN ARRAY p_addon_ids LOOP
      SELECT * INTO v_addon FROM public.pricing_addons WHERE id = v_addon_id AND active;
      IF v_addon IS NULL THEN CONTINUE; END IF;

      INSERT INTO public.homeowner_addons
        (homeowner_id, addon_id, price_snapshot, billing_type_snapshot, active, created_by)
      VALUES
        (p_homeowner_id, v_addon_id, v_addon.price, v_addon.billing_type, true, v_uid)
      ON CONFLICT (homeowner_id, addon_id) DO UPDATE
        SET active = true,
            price_snapshot = EXCLUDED.price_snapshot,
            billing_type_snapshot = EXCLUDED.billing_type_snapshot,
            updated_at = now();
    END LOOP;
  END IF;

  RETURN QUERY
    SELECT * FROM public.homeowner_addons
     WHERE homeowner_id = p_homeowner_id AND active
     ORDER BY created_at;
END;
$$;

-- 5. RPC: snapshot grandfathered pricing (freeze current prices)
CREATE OR REPLACE FUNCTION public.snapshot_grandfathered_pricing(p_homeowner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_pool public.pools;
  v_pool_price numeric := 0;
  v_freq_delta numeric := 0;
  v_freq_mult numeric := 1;
  v_addons jsonb := '[]'::jsonb;
  v_addons_total numeric := 0;
  v_monthly numeric := 0;
  v_snap jsonb;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can snapshot grandfathered pricing';
  END IF;

  SELECT * INTO v_pool FROM public.pools WHERE homeowner_id = p_homeowner_id LIMIT 1;

  IF v_pool.pool_size IS NOT NULL THEN
    SELECT base_monthly_price INTO v_pool_price
      FROM public.pricing_pool_sizes
     WHERE lower(size) = lower(v_pool.pool_size) AND active;
  END IF;
  v_pool_price := COALESCE(v_pool_price, 0);

  IF v_pool.frequency IS NOT NULL THEN
    SELECT price_delta, multiplier INTO v_freq_delta, v_freq_mult
      FROM public.pricing_frequencies
     WHERE lower(frequency) = lower(v_pool.frequency) AND active;
  END IF;
  v_freq_delta := COALESCE(v_freq_delta, 0);
  v_freq_mult  := COALESCE(v_freq_mult, 1);

  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'addon_id', addon_id,
      'name', (SELECT name FROM public.pricing_addons WHERE id = ha.addon_id),
      'price', price_snapshot,
      'billing_type', billing_type_snapshot
    )), '[]'::jsonb),
    COALESCE(SUM(CASE WHEN billing_type_snapshot='recurring' THEN price_snapshot ELSE 0 END), 0)
  INTO v_addons, v_addons_total
  FROM public.homeowner_addons ha
  WHERE homeowner_id = p_homeowner_id AND active;

  v_monthly := ROUND(((v_pool_price * v_freq_mult) + v_freq_delta + v_addons_total)::numeric, 2);

  v_snap := jsonb_build_object(
    'snapshotted_at', now(),
    'pool_size', v_pool.pool_size,
    'pool_size_price', v_pool_price,
    'frequency', v_pool.frequency,
    'frequency_delta', v_freq_delta,
    'frequency_multiplier', v_freq_mult,
    'addons', v_addons,
    'addons_total', v_addons_total,
    'monthly_total', v_monthly
  );

  UPDATE public.profiles
     SET grandfathered_snapshot = v_snap,
         is_grandfathered = true
   WHERE id = p_homeowner_id;

  RETURN v_snap;
END;
$$;

-- 6. RPC: clear grandfathered snapshot (when toggling OFF)
CREATE OR REPLACE FUNCTION public.clear_grandfathered_pricing(p_homeowner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can clear grandfathered pricing';
  END IF;
  UPDATE public.profiles
     SET grandfathered_snapshot = NULL,
         is_grandfathered = false
   WHERE id = p_homeowner_id;
END;
$$;


-- ============================================================
-- Migration: 20260626053720_9c0bc71e-7817-44c5-a2fe-1125e9badf5c.sql
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;

-- ============================================================
-- Migration: 20260626054807_bab52ef4-ea38-4e7b-950c-1d0c1f254ed8.sql
-- ============================================================

-- Extend homeowner_notifications for issue notifications and read state
ALTER TABLE public.homeowner_notifications
  ADD COLUMN IF NOT EXISTS issue_id uuid REFERENCES public.issues(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

ALTER TABLE public.homeowner_notifications DROP CONSTRAINT IF EXISTS homeowner_notifications_kind_check;
ALTER TABLE public.homeowner_notifications ADD CONSTRAINT homeowner_notifications_kind_check
  CHECK (kind = ANY (ARRAY[
    'route_notify','route_delay','route_reschedule','route_reassign',
    'issue_submitted','issue_in_progress','issue_assigned','issue_resolved'
  ]));

CREATE INDEX IF NOT EXISTS homeowner_notifications_unread_idx
  ON public.homeowner_notifications (homeowner_id, read_at, created_at DESC);

-- Trigger: create homeowner notifications on issue events
CREATE OR REPLACE FUNCTION public.handle_issue_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cta text;
  v_label text;
  v_tech_name text;
BEGIN
  v_cta := CASE WHEN NEW.service_id IS NOT NULL
                THEN '/service/' || NEW.service_id::text
                ELSE '/dashboard' END;
  v_label := COALESCE(NULLIF(btrim(NEW.type), ''), 'service');

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.homeowner_notifications
      (homeowner_id, issue_id, service_id, kind, title, body, cta_route)
    VALUES (NEW.homeowner_id, NEW.id, NEW.service_id, 'issue_submitted',
      'Issue submitted',
      format('We''ve received your %s report and our team will review it shortly.', v_label),
      v_cta);
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'in_progress' THEN
      INSERT INTO public.homeowner_notifications
        (homeowner_id, issue_id, service_id, kind, title, body, cta_route)
      VALUES (NEW.homeowner_id, NEW.id, NEW.service_id, 'issue_in_progress',
        'Issue in progress',
        format('Your %s issue is currently being reviewed.', v_label),
        v_cta);
    ELSIF NEW.status = 'resolved' THEN
      INSERT INTO public.homeowner_notifications
        (homeowner_id, issue_id, service_id, kind, title, body, cta_route)
      VALUES (NEW.homeowner_id, NEW.id, NEW.service_id, 'issue_resolved',
        'Issue resolved',
        format('Your %s issue has been resolved. Tap to view the resolution details.', v_label),
        v_cta);
    END IF;
  END IF;

  IF NEW.assigned_technician_id IS DISTINCT FROM OLD.assigned_technician_id
     AND NEW.assigned_technician_id IS NOT NULL THEN
    SELECT COALESCE(full_name, email, 'A technician')
      INTO v_tech_name FROM public.profiles WHERE id = NEW.assigned_technician_id;
    INSERT INTO public.homeowner_notifications
      (homeowner_id, issue_id, service_id, kind, title, body, cta_route)
    VALUES (NEW.homeowner_id, NEW.id, NEW.service_id, 'issue_assigned',
      'Technician assigned',
      format('%s has been assigned to your issue.', COALESCE(v_tech_name, 'A technician')),
      v_cta);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS issues_notify_homeowner ON public.issues;
CREATE TRIGGER issues_notify_homeowner
AFTER INSERT OR UPDATE ON public.issues
FOR EACH ROW EXECUTE FUNCTION public.handle_issue_notification();

-- RPCs for read state
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.homeowner_notifications
     SET read_at = COALESCE(read_at, now())
   WHERE id = p_id AND homeowner_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.homeowner_notifications
     SET read_at = now()
   WHERE homeowner_id = auth.uid() AND read_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;


-- ============================================================
-- Migration: 20260626054944_cc3c81da-63c5-4d77-9fa1-0698f709d510.sql
-- ============================================================

CREATE OR REPLACE FUNCTION public.submit_route_issue(p_issue_type text, p_other_text text, p_technician_id uuid, p_route_date date, p_scope text, p_service_ids uuid[], p_action text, p_delay_minutes integer, p_new_service_date date, p_new_time_window text, p_reassign_to uuid, p_message text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_role_text text;
  v_issue_id uuid;
  v_status text;
  v_svc record;
  v_kind text;
  v_title text;
  v_body text;
  v_notif_id uuid;
  v_affected_count int := 0;
  v_date_str text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  v_role_text := CASE WHEN v_role = 'admin' THEN 'admin'
                      WHEN v_role = 'technician' THEN 'technician'
                      ELSE NULL END;
  IF v_role_text IS NULL THEN RAISE EXCEPTION 'Only admins or technicians can report route issues'; END IF;
  IF p_action = 'reassign' AND v_role_text <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can reassign a technician';
  END IF;

  v_status := CASE WHEN p_action = 'reschedule' AND v_role_text = 'technician'
                   THEN 'pending_approval' ELSE 'active' END;

  INSERT INTO public.route_issues (
    issue_type, other_text, reported_by_role, reported_by_id,
    technician_id, route_date, scope, action_taken,
    delay_minutes, new_service_date, new_time_window, reassigned_to_id,
    message_to_homeowners, status
  ) VALUES (
    p_issue_type, NULLIF(btrim(p_other_text),''), v_role_text, v_uid,
    p_technician_id, COALESCE(p_route_date, CURRENT_DATE), p_scope, p_action,
    NULLIF(p_delay_minutes,0), p_new_service_date, NULLIF(btrim(p_new_time_window),''), p_reassign_to,
    COALESCE(p_message,''), v_status
  ) RETURNING id INTO v_issue_id;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role, summary, details)
  VALUES (v_issue_id, 'created', v_uid, v_role_text,
    'Route issue reported',
    jsonb_build_object('issue_type', p_issue_type, 'scope', p_scope, 'action', p_action,
      'route_date', COALESCE(p_route_date, CURRENT_DATE), 'status', v_status));

  FOR v_svc IN
    SELECT s.* FROM public.services s
     WHERE ( p_scope = 'specific' AND s.id = ANY(p_service_ids) )
        OR ( p_scope = 'all'
             AND s.service_date = COALESCE(p_route_date, CURRENT_DATE)
             AND ( p_technician_id IS NULL OR s.technician_id = p_technician_id )
             AND s.status IN ('scheduled','in_progress') )
  LOOP
    IF v_role_text = 'technician' AND v_svc.technician_id IS DISTINCT FROM v_uid THEN CONTINUE; END IF;

    INSERT INTO public.route_issue_services (
      route_issue_id, service_id, homeowner_id,
      previous_status, previous_time_window, previous_service_date, previous_technician_id
    ) VALUES (
      v_issue_id, v_svc.id, v_svc.homeowner_id,
      v_svc.status::text, v_svc.time_window::text, v_svc.service_date, v_svc.technician_id
    );
    v_affected_count := v_affected_count + 1;

    INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
      service_id, homeowner_id, summary, details)
    VALUES (v_issue_id, 'service_affected', v_uid, v_role_text,
      v_svc.id, v_svc.homeowner_id,
      'Appointment linked to route issue',
      jsonb_build_object(
        'previous_status', v_svc.status::text,
        'previous_time_window', v_svc.time_window::text,
        'previous_service_date', v_svc.service_date,
        'previous_technician_id', v_svc.technician_id
      ));

    IF v_status = 'active' THEN
      IF p_action = 'delay' THEN
        UPDATE public.services
           SET delay_minutes = COALESCE(NULLIF(p_delay_minutes,0), delay_minutes)
         WHERE id = v_svc.id;
        INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
          service_id, homeowner_id, summary, details)
        VALUES (v_issue_id, 'service_updated', v_uid, v_role_text, v_svc.id, v_svc.homeowner_id,
          format('Delay added (%s min)', COALESCE(p_delay_minutes,0)),
          jsonb_build_object('action','delay','delay_minutes', p_delay_minutes));
      ELSIF p_action = 'reschedule' THEN
        UPDATE public.services
           SET service_date = COALESCE(p_new_service_date, service_date),
               time_window  = COALESCE(NULLIF(btrim(p_new_time_window),'')::public.time_window, time_window),
               delay_minutes = 0
         WHERE id = v_svc.id;
        INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
          service_id, homeowner_id, summary, details)
        VALUES (v_issue_id, 'service_updated', v_uid, v_role_text, v_svc.id, v_svc.homeowner_id,
          'Appointment rescheduled',
          jsonb_build_object('action','reschedule',
            'new_service_date', p_new_service_date,
            'new_time_window', p_new_time_window,
            'previous_service_date', v_svc.service_date,
            'previous_time_window', v_svc.time_window::text));
      ELSIF p_action = 'reassign' THEN
        UPDATE public.services SET technician_id = p_reassign_to WHERE id = v_svc.id;
        UPDATE public.pools    SET assigned_technician_id = p_reassign_to WHERE id = v_svc.pool_id;
        INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
          service_id, homeowner_id, summary, details)
        VALUES (v_issue_id, 'service_updated', v_uid, v_role_text, v_svc.id, v_svc.homeowner_id,
          'Technician reassigned',
          jsonb_build_object('action','reassign',
            'previous_technician_id', v_svc.technician_id,
            'new_technician_id', p_reassign_to));
      END IF;

      v_kind  := 'route_' || p_action;

      IF p_action = 'delay' THEN
        v_title := 'Service delay';
        v_body  := 'Your technician is running behind schedule and may arrive later than expected.';
      ELSIF p_action = 'reschedule' THEN
        IF p_new_service_date IS NOT NULL THEN
          v_date_str := to_char(p_new_service_date, 'Mon DD, YYYY');
          v_title := 'New service date';
          v_body  := format('Your pool service has been rescheduled to %s%s.',
                            v_date_str,
                            CASE WHEN NULLIF(btrim(p_new_time_window),'') IS NOT NULL
                                 THEN ', between ' || p_new_time_window ELSE '' END);
        ELSE
          v_title := 'Service rescheduled';
          v_body  := 'Today''s pool service has been rescheduled due to an unexpected route issue.';
        END IF;
      ELSIF p_action = 'reassign' THEN
        v_title := 'A new technician has been assigned';
        v_body  := 'A new technician will be handling your scheduled pool service.';
      ELSE
        v_title := 'Service update from your technician';
        v_body  := 'There''s an update about your scheduled pool service.';
      END IF;

      IF NULLIF(btrim(p_message),'') IS NOT NULL THEN
        v_body := v_body || E'\n' || p_message;
      END IF;

      INSERT INTO public.homeowner_notifications
        (homeowner_id, route_issue_id, service_id, kind, title, body, cta_route)
      VALUES
        (v_svc.homeowner_id, v_issue_id, v_svc.id, v_kind, v_title, v_body,
         '/service/' || v_svc.id::text)
      RETURNING id INTO v_notif_id;

      INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
        service_id, homeowner_id, notification_id, summary, details)
      VALUES (v_issue_id, 'notification_sent', v_uid, v_role_text,
        v_svc.id, v_svc.homeowner_id, v_notif_id,
        format('Notification sent: %s', v_title),
        jsonb_build_object('kind', v_kind, 'title', v_title, 'body', v_body));
    END IF;
  END LOOP;

  RETURN v_issue_id;
END;
$function$;

-- Resolve: notify "back on track"
CREATE OR REPLACE FUNCTION public.resolve_route_issue(p_id uuid, p_status text)
 RETURNS route_issues
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.route_issues;
  v_prev text;
  v_svc record;
  v_notif_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT private.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can resolve route issues';
  END IF;
  IF p_status NOT IN ('resolved','cancelled') THEN
    RAISE EXCEPTION 'Invalid status %', p_status;
  END IF;

  SELECT status INTO v_prev FROM public.route_issues WHERE id = p_id;

  UPDATE public.route_issues
     SET status = p_status, resolved_at = now(), resolved_by_id = v_uid
   WHERE id = p_id
  RETURNING * INTO v_row;

  IF p_status = 'resolved' AND v_row.action_taken = 'delay' THEN
    UPDATE public.services s
       SET delay_minutes = 0
      FROM public.route_issue_services ris
     WHERE ris.route_issue_id = p_id AND s.id = ris.service_id;
  END IF;

  IF p_status = 'resolved' THEN
    FOR v_svc IN
      SELECT ris.service_id, ris.homeowner_id
        FROM public.route_issue_services ris
       WHERE ris.route_issue_id = p_id
    LOOP
      INSERT INTO public.homeowner_notifications
        (homeowner_id, route_issue_id, service_id, kind, title, body, cta_route)
      VALUES (v_svc.homeowner_id, p_id, v_svc.service_id, 'route_notify',
        'Service update',
        'Your scheduled pool service is back on track and will proceed as planned.',
        '/service/' || v_svc.service_id::text)
      RETURNING id INTO v_notif_id;

      INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
        service_id, homeowner_id, notification_id, summary)
      VALUES (p_id, 'notification_sent', v_uid, 'admin',
        v_svc.service_id, v_svc.homeowner_id, v_notif_id,
        'Notification sent: Service back on track');
    END LOOP;
  END IF;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
    summary, details)
  VALUES (p_id, 'status_changed', v_uid, 'admin',
    format('Status changed: %s → %s', COALESCE(v_prev,''), p_status),
    jsonb_build_object('from', v_prev, 'to', p_status));

  RETURN v_row;
END;
$function$;


-- ============================================================
-- Migration: 20260710094946_8986b8c7-4342-4452-a54b-d793917f0a0f.sql
-- ============================================================

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


-- ============================================================
-- Migration: 20260710200000_service_catalog.sql
-- ============================================================
-- Service catalog: admin-managed bookable specialty services
CREATE TABLE public.service_catalog (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  description  text,
  price        numeric     NOT NULL DEFAULT 0,
  duration_hours numeric   NOT NULL DEFAULT 1,
  category     text,
  active       boolean     NOT NULL DEFAULT true,
  sort_order   integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone (including unauthenticated) can read active catalog entries
CREATE POLICY "Anyone can view active service catalog"
  ON public.service_catalog FOR SELECT
  USING (active = true);

-- Admins can read all (including inactive)
CREATE POLICY "Admins can view all service catalog"
  ON public.service_catalog FOR SELECT
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can insert / update / delete
CREATE POLICY "Admins can manage service catalog"
  ON public.service_catalog FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_service_catalog_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_service_catalog_updated_at
  BEFORE UPDATE ON public.service_catalog
  FOR EACH ROW EXECUTE FUNCTION public.set_service_catalog_updated_at();

-- Seed the four specialty services
INSERT INTO public.service_catalog (name, description, price, duration_hours, sort_order, category) VALUES
  ('Robot Pool Cleaner Drop-off', 'We drop off and set up a robotic pool cleaner for your pool. The robot runs a full cleaning cycle while you relax — no effort required.', 75, 1, 1, 'Equipment'),
  ('Hose Bags', 'Supply and installation of filter hose bags to keep your pool water clean and free of fine debris.', 35, 0.5, 2, 'Supplies'),
  ('Plumbing Services', 'Professional pool plumbing repair and maintenance including pipe repairs, valve replacement, and fitting adjustments.', 120, 2, 3, 'Repair'),
  ('Leak Detection & Repair', 'Expert leak detection using pressure testing and visual inspection, followed by professional repair to stop water loss.', 150, 3, 4, 'Repair');


-- ============================================================
-- Migration: 20260710210000_cleanup_dummy_accounts.sql
-- ============================================================
-- Remove mailnesia.con homeowner accounts and their related data
-- These are test/dummy accounts not real clients

-- Delete homeowner_notifications for these users
DELETE FROM homeowner_notifications
WHERE homeowner_id IN (
  SELECT id FROM profiles WHERE email ILIKE '%@mailnesia.con'
);

-- Delete tech_notifications referencing services owned by these users
DELETE FROM tech_notifications
WHERE cta_route ILIKE ANY(
  SELECT CONCAT('/tech/jobs/', s.id)
  FROM services s
  JOIN profiles p ON p.id = s.homeowner_id
  WHERE p.email ILIKE '%@mailnesia.con'
);

-- Delete service_photos for their services
DELETE FROM service_photos
WHERE service_id IN (
  SELECT s.id FROM services s
  JOIN profiles p ON p.id = s.homeowner_id
  WHERE p.email ILIKE '%@mailnesia.con'
);

-- Delete messages involving these users
DELETE FROM messages
WHERE sender_id IN (SELECT id FROM profiles WHERE email ILIKE '%@mailnesia.con')
   OR recipient_id IN (SELECT id FROM profiles WHERE email ILIKE '%@mailnesia.con');

-- Delete subscription_events for these users
DELETE FROM subscription_events
WHERE homeowner_id IN (SELECT id FROM profiles WHERE email ILIKE '%@mailnesia.con');

-- Delete services for these users
DELETE FROM services
WHERE homeowner_id IN (SELECT id FROM profiles WHERE email ILIKE '%@mailnesia.con');

-- Delete pools for these users
DELETE FROM pools
WHERE homeowner_id IN (SELECT id FROM profiles WHERE email ILIKE '%@mailnesia.con');

-- Delete the profiles themselves
DELETE FROM profiles
WHERE email ILIKE '%@mailnesia.con';

-- Also clear all is_placeholder = true records (dummy data used for demos)
-- First clean up their related data
DELETE FROM homeowner_notifications
WHERE homeowner_id IN (SELECT id FROM profiles WHERE is_placeholder = true);

DELETE FROM subscription_events
WHERE homeowner_id IN (SELECT id FROM profiles WHERE is_placeholder = true);

DELETE FROM service_photos
WHERE service_id IN (
  SELECT s.id FROM services s
  JOIN profiles p ON p.id = s.homeowner_id
  WHERE p.is_placeholder = true
);

DELETE FROM messages
WHERE sender_id IN (SELECT id FROM profiles WHERE is_placeholder = true)
   OR recipient_id IN (SELECT id FROM profiles WHERE is_placeholder = true);

DELETE FROM services
WHERE homeowner_id IN (SELECT id FROM profiles WHERE is_placeholder = true);

DELETE FROM pools
WHERE homeowner_id IN (SELECT id FROM profiles WHERE is_placeholder = true);

DELETE FROM profiles
WHERE is_placeholder = true;


-- ============================================================
-- Migration: 20260710220000_technician_application_credentials.sql
-- ============================================================
-- Add columns to store generated credentials after applicant is approved
ALTER TABLE technician_applications
  ADD COLUMN IF NOT EXISTS generated_email text,
  ADD COLUMN IF NOT EXISTS generated_password text,
  ADD COLUMN IF NOT EXISTS technician_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;


-- ============================================================
-- Migration: 20260710230000_fix_application_rls.sql
-- ============================================================
-- Restore anonymous insert access for technician applications and certifications.
-- These policies were dropped in earlier migrations and never recreated,
-- causing "new row violates row-level security policy" on public form submissions.

-- technician_applications: anyone (including anonymous) can submit
DROP POLICY IF EXISTS "Anyone can apply" ON public.technician_applications;
CREATE POLICY "Anyone can apply"
  ON public.technician_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.technician_applications TO anon;

-- applicant_certifications: anyone can attach certs to a pending application
DROP POLICY IF EXISTS "Anyone can add certifications" ON public.applicant_certifications;
CREATE POLICY "Anyone can add certifications"
  ON public.applicant_certifications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.applicant_certifications TO anon;


-- ============================================================
-- Migration: 20260710240000_messages_image_support.sql
-- ============================================================
-- Add image support to messages table so photo uploads appear in chat
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_type text; -- 'before' | 'after'


-- ============================================================
-- Migration: 20260710250000_route_issue_approval_flow.sql
-- ============================================================
-- Route issue approval flow:
-- 1. All technician-submitted issues go to pending_approval (not just reschedule)
-- 2. approve_route_issue: applies service changes + sends homeowner notifications + notifies tech
-- 3. reject_route_issue: cancels without notifying homeowners, notifies tech of rejection

-- ─────────────────────────────────────────────────────────────────
-- 1. Update submit_route_issue: technicians always get pending_approval
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_route_issue(
  p_issue_type    text,
  p_other_text    text    DEFAULT NULL,
  p_technician_id uuid    DEFAULT NULL,
  p_route_date    date    DEFAULT NULL,
  p_scope         text    DEFAULT 'all',
  p_service_ids   uuid[]  DEFAULT '{}',
  p_action        text    DEFAULT 'notify',
  p_delay_minutes integer DEFAULT 0,
  p_new_service_date date DEFAULT NULL,
  p_new_time_window  text DEFAULT NULL,
  p_reassign_to   uuid   DEFAULT NULL,
  p_message       text   DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_uid          uuid := auth.uid();
  v_role_text    text;
  v_status       text;
  v_issue_id     uuid;
  v_svc          public.services%ROWTYPE;
  v_affected_count int := 0;
  v_kind         text;
  v_title        text;
  v_notif_id     uuid;
BEGIN
  SELECT CASE role WHEN 'admin' THEN 'admin' WHEN 'technician' THEN 'technician' ELSE NULL END
    INTO v_role_text
    FROM public.profiles WHERE id = v_uid;

  IF v_role_text IS NULL THEN RAISE EXCEPTION 'Only admins or technicians can report route issues'; END IF;
  IF p_action = 'reassign' AND v_role_text <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can reassign a technician';
  END IF;

  -- Technicians always need admin approval before homeowners are notified
  v_status := CASE WHEN v_role_text = 'technician' THEN 'pending_approval' ELSE 'active' END;

  INSERT INTO public.route_issues (
    issue_type, other_text, reported_by_role, reported_by_id,
    technician_id, route_date, scope, action_taken,
    delay_minutes, new_service_date, new_time_window, reassigned_to_id,
    message_to_homeowners, status
  ) VALUES (
    p_issue_type, NULLIF(btrim(p_other_text),''), v_role_text, v_uid,
    p_technician_id, COALESCE(p_route_date, CURRENT_DATE), p_scope, p_action,
    NULLIF(p_delay_minutes,0), p_new_service_date, NULLIF(btrim(p_new_time_window),''), p_reassign_to,
    COALESCE(p_message,''), v_status
  ) RETURNING id INTO v_issue_id;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role, summary, details)
  VALUES (v_issue_id, 'created', v_uid, v_role_text,
    'Route issue reported',
    jsonb_build_object('issue_type', p_issue_type, 'scope', p_scope, 'action', p_action,
      'route_date', COALESCE(p_route_date, CURRENT_DATE), 'status', v_status));

  -- Link affected services
  FOR v_svc IN
    SELECT s.* FROM public.services s
     WHERE ( p_scope = 'specific' AND s.id = ANY(p_service_ids) )
        OR ( p_scope = 'all'
             AND s.service_date = COALESCE(p_route_date, CURRENT_DATE)
             AND ( p_technician_id IS NULL OR s.technician_id = p_technician_id )
             AND s.status IN ('scheduled','in_progress') )
  LOOP
    IF v_role_text = 'technician' AND v_svc.technician_id IS DISTINCT FROM v_uid THEN CONTINUE; END IF;

    INSERT INTO public.route_issue_services (
      route_issue_id, service_id, homeowner_id,
      previous_status, previous_time_window, previous_service_date, previous_technician_id
    ) VALUES (
      v_issue_id, v_svc.id, v_svc.homeowner_id,
      v_svc.status::text, v_svc.time_window::text, v_svc.service_date, v_svc.technician_id
    );
    v_affected_count := v_affected_count + 1;

    INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
      service_id, homeowner_id, summary, details)
    VALUES (v_issue_id, 'service_affected', v_uid, v_role_text,
      v_svc.id, v_svc.homeowner_id,
      'Appointment linked to route issue',
      jsonb_build_object(
        'previous_status', v_svc.status::text,
        'previous_time_window', v_svc.time_window::text,
        'previous_service_date', v_svc.service_date,
        'previous_technician_id', v_svc.technician_id
      ));

    -- Only apply service changes + notify homeowners immediately for admin submissions
    IF v_status = 'active' THEN
      IF p_action = 'delay' THEN
        UPDATE public.services
           SET delay_minutes = COALESCE(NULLIF(p_delay_minutes,0), delay_minutes)
         WHERE id = v_svc.id;
      ELSIF p_action = 'reschedule' THEN
        UPDATE public.services
           SET service_date = COALESCE(p_new_service_date, service_date),
               time_window  = COALESCE(NULLIF(btrim(p_new_time_window),'')::public.time_window, time_window),
               delay_minutes = 0
         WHERE id = v_svc.id;
      ELSIF p_action = 'reassign' THEN
        UPDATE public.services SET technician_id = p_reassign_to WHERE id = v_svc.id;
        UPDATE public.pools    SET assigned_technician_id = p_reassign_to WHERE id = v_svc.pool_id;
      END IF;

      v_kind  := 'route_' || p_action;
      v_title := CASE p_action
                   WHEN 'notify'     THEN 'Service update from your technician'
                   WHEN 'delay'      THEN 'Your service may be delayed'
                   WHEN 'reschedule' THEN 'Your service has been rescheduled'
                   WHEN 'reassign'   THEN 'A new technician has been assigned'
                 END;

      INSERT INTO public.homeowner_notifications
        (homeowner_id, route_issue_id, service_id, kind, title, body, cta_route)
      VALUES
        (v_svc.homeowner_id, v_issue_id, v_svc.id, v_kind, v_title,
         COALESCE(NULLIF(btrim(p_message),''),''), '/service/' || v_svc.id::text)
      RETURNING id INTO v_notif_id;

      INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
        service_id, homeowner_id, notification_id, summary, details)
      VALUES (v_issue_id, 'notification_sent', v_uid, v_role_text,
        v_svc.id, v_svc.homeowner_id, v_notif_id,
        format('Notification sent: %s', v_title),
        jsonb_build_object('kind', v_kind, 'title', v_title, 'body', COALESCE(p_message,'')));
    END IF;
  END LOOP;

  -- Notify technician that their report is pending review (for their own submission)
  IF v_status = 'pending_approval' THEN
    INSERT INTO public.tech_notifications (
      technician_id, kind, title, body, cta_route, request_id
    ) VALUES (
      v_uid,
      'route_issue_pending',
      'Route issue submitted for review',
      'Your route issue report has been submitted and is awaiting admin approval. You will be notified once reviewed.',
      '/tech/jobs',
      v_issue_id::text
    );
  END IF;

  RETURN v_issue_id;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────
-- 2. approve_route_issue: admin approves → apply changes + notify homeowners + notify tech
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_route_issue(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_role_text text;
  v_issue     public.route_issues%ROWTYPE;
  v_svc_link  RECORD;
  v_svc       public.services%ROWTYPE;
  v_kind      text;
  v_title     text;
  v_notif_id  uuid;
BEGIN
  SELECT CASE role WHEN 'admin' THEN 'admin' ELSE NULL END
    INTO v_role_text
    FROM public.profiles WHERE id = v_uid;
  IF v_role_text IS NULL THEN RAISE EXCEPTION 'Admin only'; END IF;

  SELECT * INTO v_issue FROM public.route_issues WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Route issue not found'; END IF;
  IF v_issue.status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Route issue is not pending approval (current status: %)', v_issue.status;
  END IF;

  -- Mark active
  UPDATE public.route_issues
     SET status = 'active', updated_at = now()
   WHERE id = p_id;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role, summary, details)
  VALUES (p_id, 'status_changed', v_uid, 'admin', 'Route issue approved by admin',
    jsonb_build_object('from', 'pending_approval', 'to', 'active'));

  -- Apply service changes and send homeowner notifications for each linked service
  FOR v_svc_link IN
    SELECT ris.*, s.*
      FROM public.route_issue_services ris
      JOIN public.services s ON s.id = ris.service_id
     WHERE ris.route_issue_id = p_id
  LOOP
    SELECT * INTO v_svc FROM public.services WHERE id = v_svc_link.service_id;

    IF v_issue.action_taken = 'delay' THEN
      UPDATE public.services
         SET delay_minutes = COALESCE(NULLIF(v_issue.delay_minutes,0), delay_minutes)
       WHERE id = v_svc.id;
    ELSIF v_issue.action_taken = 'reschedule' THEN
      UPDATE public.services
         SET service_date = COALESCE(v_issue.new_service_date, service_date),
             time_window  = COALESCE(v_issue.new_time_window::public.time_window, time_window),
             delay_minutes = 0
       WHERE id = v_svc.id;
    ELSIF v_issue.action_taken = 'reassign' THEN
      UPDATE public.services SET technician_id = v_issue.reassigned_to_id WHERE id = v_svc.id;
      UPDATE public.pools    SET assigned_technician_id = v_issue.reassigned_to_id WHERE id = v_svc.pool_id;
    END IF;

    v_kind  := 'route_' || v_issue.action_taken;
    v_title := CASE v_issue.action_taken
                 WHEN 'notify'     THEN 'Service update from your technician'
                 WHEN 'delay'      THEN 'Your service may be delayed'
                 WHEN 'reschedule' THEN 'Your service has been rescheduled'
                 WHEN 'reassign'   THEN 'A new technician has been assigned'
               END;

    INSERT INTO public.homeowner_notifications
      (homeowner_id, route_issue_id, service_id, kind, title, body, cta_route)
    VALUES
      (v_svc_link.homeowner_id, p_id, v_svc.id, v_kind, v_title,
       COALESCE(NULLIF(btrim(v_issue.message_to_homeowners),''),''),
       '/service/' || v_svc.id::text)
    RETURNING id INTO v_notif_id;

    INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
      service_id, homeowner_id, notification_id, summary, details)
    VALUES (p_id, 'notification_sent', v_uid, 'admin',
      v_svc.id, v_svc_link.homeowner_id, v_notif_id,
      format('Homeowner notified: %s', v_title),
      jsonb_build_object('kind', v_kind, 'title', v_title));
  END LOOP;

  -- Notify the technician who submitted
  IF v_issue.reported_by_role = 'technician' THEN
    INSERT INTO public.tech_notifications (
      technician_id, kind, title, body, cta_route, request_id
    ) VALUES (
      v_issue.reported_by_id,
      'route_issue_approved',
      'Route issue approved',
      'Your route issue report has been approved by an admin. Affected homeowners have been notified.',
      '/tech/jobs',
      p_id::text
    );
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.approve_route_issue(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 3. reject_route_issue: admin rejects → no homeowner notifications, notify tech
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_route_issue(p_id uuid, p_reason text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_role_text text;
  v_issue     public.route_issues%ROWTYPE;
BEGIN
  SELECT CASE role WHEN 'admin' THEN 'admin' ELSE NULL END
    INTO v_role_text
    FROM public.profiles WHERE id = v_uid;
  IF v_role_text IS NULL THEN RAISE EXCEPTION 'Admin only'; END IF;

  SELECT * INTO v_issue FROM public.route_issues WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Route issue not found'; END IF;
  IF v_issue.status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Route issue is not pending approval';
  END IF;

  UPDATE public.route_issues
     SET status = 'cancelled', resolved_at = now(), resolved_by_id = v_uid, updated_at = now()
   WHERE id = p_id;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role, summary, details)
  VALUES (p_id, 'status_changed', v_uid, 'admin', 'Route issue rejected by admin',
    jsonb_build_object('from', 'pending_approval', 'to', 'cancelled',
      'reason', COALESCE(p_reason,'')));

  -- Notify the technician of rejection
  IF v_issue.reported_by_role = 'technician' THEN
    INSERT INTO public.tech_notifications (
      technician_id, kind, title, body, cta_route, request_id
    ) VALUES (
      v_issue.reported_by_id,
      'route_issue_rejected',
      'Route issue not approved',
      CASE WHEN p_reason <> ''
           THEN 'Your route issue report was not approved. Reason: ' || p_reason
           ELSE 'Your route issue report was reviewed but not approved by an admin.'
      END,
      '/tech/jobs',
      p_id::text
    );
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.reject_route_issue(uuid, text) TO authenticated;


-- ============================================================
-- Migration: 20260710260000_tech_notifications_route_issue_support.sql
-- ============================================================
-- Add route_issue_id to tech_notifications so route-issue RPCs can reference issues
-- without conflicting with the existing request_id FK to day_off_requests.

ALTER TABLE public.tech_notifications
  ADD COLUMN IF NOT EXISTS route_issue_id uuid REFERENCES public.route_issues(id) ON DELETE SET NULL;

-- Fix submit_route_issue: use route_issue_id instead of request_id
CREATE OR REPLACE FUNCTION public.submit_route_issue(
  p_issue_type    text,
  p_other_text    text    DEFAULT NULL,
  p_technician_id uuid    DEFAULT NULL,
  p_route_date    date    DEFAULT NULL,
  p_scope         text    DEFAULT 'all',
  p_service_ids   uuid[]  DEFAULT '{}',
  p_action        text    DEFAULT 'notify',
  p_delay_minutes integer DEFAULT 0,
  p_new_service_date date DEFAULT NULL,
  p_new_time_window  text DEFAULT NULL,
  p_reassign_to   uuid   DEFAULT NULL,
  p_message       text   DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_uid          uuid := auth.uid();
  v_role_text    text;
  v_status       text;
  v_issue_id     uuid;
  v_svc          public.services%ROWTYPE;
  v_affected_count int := 0;
  v_kind         text;
  v_title        text;
  v_notif_id     uuid;
BEGIN
  SELECT CASE role WHEN 'admin' THEN 'admin' WHEN 'technician' THEN 'technician' ELSE NULL END
    INTO v_role_text
    FROM public.profiles WHERE id = v_uid;

  IF v_role_text IS NULL THEN RAISE EXCEPTION 'Only admins or technicians can report route issues'; END IF;
  IF p_action = 'reassign' AND v_role_text <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can reassign a technician';
  END IF;

  v_status := CASE WHEN v_role_text = 'technician' THEN 'pending_approval' ELSE 'active' END;

  INSERT INTO public.route_issues (
    issue_type, other_text, reported_by_role, reported_by_id,
    technician_id, route_date, scope, action_taken,
    delay_minutes, new_service_date, new_time_window, reassigned_to_id,
    message_to_homeowners, status
  ) VALUES (
    p_issue_type, NULLIF(btrim(p_other_text),''), v_role_text, v_uid,
    p_technician_id, COALESCE(p_route_date, CURRENT_DATE), p_scope, p_action,
    NULLIF(p_delay_minutes,0), p_new_service_date, NULLIF(btrim(p_new_time_window),''), p_reassign_to,
    COALESCE(p_message,''), v_status
  ) RETURNING id INTO v_issue_id;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role, summary, details)
  VALUES (v_issue_id, 'created', v_uid, v_role_text,
    'Route issue reported',
    jsonb_build_object('issue_type', p_issue_type, 'scope', p_scope, 'action', p_action,
      'route_date', COALESCE(p_route_date, CURRENT_DATE), 'status', v_status));

  FOR v_svc IN
    SELECT s.* FROM public.services s
     WHERE ( p_scope = 'specific' AND s.id = ANY(p_service_ids) )
        OR ( p_scope = 'all'
             AND s.service_date = COALESCE(p_route_date, CURRENT_DATE)
             AND ( p_technician_id IS NULL OR s.technician_id = p_technician_id )
             AND s.status IN ('scheduled','in_progress') )
  LOOP
    IF v_role_text = 'technician' AND v_svc.technician_id IS DISTINCT FROM v_uid THEN CONTINUE; END IF;

    INSERT INTO public.route_issue_services (
      route_issue_id, service_id, homeowner_id,
      previous_status, previous_time_window, previous_service_date, previous_technician_id
    ) VALUES (
      v_issue_id, v_svc.id, v_svc.homeowner_id,
      v_svc.status::text, v_svc.time_window::text, v_svc.service_date, v_svc.technician_id
    );
    v_affected_count := v_affected_count + 1;

    INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
      service_id, homeowner_id, summary, details)
    VALUES (v_issue_id, 'service_affected', v_uid, v_role_text,
      v_svc.id, v_svc.homeowner_id,
      'Appointment linked to route issue',
      jsonb_build_object(
        'previous_status', v_svc.status::text,
        'previous_time_window', v_svc.time_window::text,
        'previous_service_date', v_svc.service_date,
        'previous_technician_id', v_svc.technician_id
      ));

    IF v_status = 'active' THEN
      IF p_action = 'delay' THEN
        UPDATE public.services
           SET delay_minutes = COALESCE(NULLIF(p_delay_minutes,0), delay_minutes)
         WHERE id = v_svc.id;
      ELSIF p_action = 'reschedule' THEN
        UPDATE public.services
           SET service_date = COALESCE(p_new_service_date, service_date),
               time_window  = COALESCE(NULLIF(btrim(p_new_time_window),'')::public.time_window, time_window),
               delay_minutes = 0
         WHERE id = v_svc.id;
      ELSIF p_action = 'reassign' THEN
        UPDATE public.services SET technician_id = p_reassign_to WHERE id = v_svc.id;
        UPDATE public.pools    SET assigned_technician_id = p_reassign_to WHERE id = v_svc.pool_id;
      END IF;

      v_kind  := 'route_' || p_action;
      v_title := CASE p_action
                   WHEN 'notify'     THEN 'Service update from your technician'
                   WHEN 'delay'      THEN 'Your service may be delayed'
                   WHEN 'reschedule' THEN 'Your service has been rescheduled'
                   WHEN 'reassign'   THEN 'A new technician has been assigned'
                 END;

      INSERT INTO public.homeowner_notifications
        (homeowner_id, route_issue_id, service_id, kind, title, body, cta_route)
      VALUES
        (v_svc.homeowner_id, v_issue_id, v_svc.id, v_kind, v_title,
         COALESCE(NULLIF(btrim(p_message),''),''), '/service/' || v_svc.id::text)
      RETURNING id INTO v_notif_id;

      INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
        service_id, homeowner_id, notification_id, summary, details)
      VALUES (v_issue_id, 'notification_sent', v_uid, v_role_text,
        v_svc.id, v_svc.homeowner_id, v_notif_id,
        format('Notification sent: %s', v_title),
        jsonb_build_object('kind', v_kind, 'title', v_title, 'body', COALESCE(p_message,'')));
    END IF;
  END LOOP;

  IF v_status = 'pending_approval' THEN
    INSERT INTO public.tech_notifications (
      technician_id, kind, title, body, cta_route, route_issue_id
    ) VALUES (
      v_uid,
      'route_issue_pending',
      'Route issue submitted for review',
      'Your route issue report has been submitted and is awaiting admin approval. You will be notified once reviewed.',
      '/tech/jobs',
      v_issue_id
    );
  END IF;

  RETURN v_issue_id;
END;
$function$;

-- Fix approve_route_issue: use route_issue_id instead of request_id
CREATE OR REPLACE FUNCTION public.approve_route_issue(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_role_text text;
  v_issue     public.route_issues%ROWTYPE;
  v_svc_link  RECORD;
  v_svc       public.services%ROWTYPE;
  v_kind      text;
  v_title     text;
  v_notif_id  uuid;
BEGIN
  SELECT CASE role WHEN 'admin' THEN 'admin' ELSE NULL END
    INTO v_role_text
    FROM public.profiles WHERE id = v_uid;
  IF v_role_text IS NULL THEN RAISE EXCEPTION 'Admin only'; END IF;

  SELECT * INTO v_issue FROM public.route_issues WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Route issue not found'; END IF;
  IF v_issue.status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Route issue is not pending approval (current status: %)', v_issue.status;
  END IF;

  UPDATE public.route_issues SET status = 'active', updated_at = now() WHERE id = p_id;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role, summary, details)
  VALUES (p_id, 'status_changed', v_uid, 'admin', 'Route issue approved by admin',
    jsonb_build_object('from', 'pending_approval', 'to', 'active'));

  FOR v_svc_link IN
    SELECT ris.*, s.*
      FROM public.route_issue_services ris
      JOIN public.services s ON s.id = ris.service_id
     WHERE ris.route_issue_id = p_id
  LOOP
    SELECT * INTO v_svc FROM public.services WHERE id = v_svc_link.service_id;

    IF v_issue.action_taken = 'delay' THEN
      UPDATE public.services
         SET delay_minutes = COALESCE(NULLIF(v_issue.delay_minutes,0), delay_minutes)
       WHERE id = v_svc.id;
    ELSIF v_issue.action_taken = 'reschedule' THEN
      UPDATE public.services
         SET service_date = COALESCE(v_issue.new_service_date, service_date),
             time_window  = COALESCE(v_issue.new_time_window::public.time_window, time_window),
             delay_minutes = 0
       WHERE id = v_svc.id;
    ELSIF v_issue.action_taken = 'reassign' THEN
      UPDATE public.services SET technician_id = v_issue.reassigned_to_id WHERE id = v_svc.id;
      UPDATE public.pools    SET assigned_technician_id = v_issue.reassigned_to_id WHERE id = v_svc.pool_id;
    END IF;

    v_kind  := 'route_' || v_issue.action_taken;
    v_title := CASE v_issue.action_taken
                 WHEN 'notify'     THEN 'Service update from your technician'
                 WHEN 'delay'      THEN 'Your service may be delayed'
                 WHEN 'reschedule' THEN 'Your service has been rescheduled'
                 WHEN 'reassign'   THEN 'A new technician has been assigned'
               END;

    INSERT INTO public.homeowner_notifications
      (homeowner_id, route_issue_id, service_id, kind, title, body, cta_route)
    VALUES
      (v_svc_link.homeowner_id, p_id, v_svc.id, v_kind, v_title,
       COALESCE(NULLIF(btrim(v_issue.message_to_homeowners),''),''),
       '/service/' || v_svc.id::text)
    RETURNING id INTO v_notif_id;

    INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
      service_id, homeowner_id, notification_id, summary, details)
    VALUES (p_id, 'notification_sent', v_uid, 'admin',
      v_svc.id, v_svc_link.homeowner_id, v_notif_id,
      format('Homeowner notified: %s', v_title),
      jsonb_build_object('kind', v_kind, 'title', v_title));
  END LOOP;

  IF v_issue.reported_by_role = 'technician' THEN
    INSERT INTO public.tech_notifications (
      technician_id, kind, title, body, cta_route, route_issue_id
    ) VALUES (
      v_issue.reported_by_id,
      'route_issue_approved',
      'Route issue approved',
      'Your route issue report has been approved by an admin. Affected homeowners have been notified.',
      '/tech/jobs',
      p_id
    );
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.approve_route_issue(uuid) TO authenticated;

-- Fix reject_route_issue: use route_issue_id instead of request_id
CREATE OR REPLACE FUNCTION public.reject_route_issue(p_id uuid, p_reason text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_role_text text;
  v_issue     public.route_issues%ROWTYPE;
BEGIN
  SELECT CASE role WHEN 'admin' THEN 'admin' ELSE NULL END
    INTO v_role_text
    FROM public.profiles WHERE id = v_uid;
  IF v_role_text IS NULL THEN RAISE EXCEPTION 'Admin only'; END IF;

  SELECT * INTO v_issue FROM public.route_issues WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Route issue not found'; END IF;
  IF v_issue.status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Route issue is not pending approval';
  END IF;

  UPDATE public.route_issues
     SET status = 'cancelled', resolved_at = now(), resolved_by_id = v_uid, updated_at = now()
   WHERE id = p_id;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role, summary, details)
  VALUES (p_id, 'status_changed', v_uid, 'admin', 'Route issue rejected by admin',
    jsonb_build_object('from', 'pending_approval', 'to', 'cancelled',
      'reason', COALESCE(p_reason,'')));

  IF v_issue.reported_by_role = 'technician' THEN
    INSERT INTO public.tech_notifications (
      technician_id, kind, title, body, cta_route, route_issue_id
    ) VALUES (
      v_issue.reported_by_id,
      'route_issue_rejected',
      'Route issue not approved',
      CASE WHEN p_reason <> ''
           THEN 'Your route issue report was not approved. Reason: ' || p_reason
           ELSE 'Your route issue report was reviewed but not approved by an admin.'
      END,
      '/tech/jobs',
      p_id
    );
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.reject_route_issue(uuid, text) TO authenticated;


-- ============================================================
-- Migration: 20260710270000_add_inactive_catalog_services.sql
-- ============================================================
-- Add new service catalog items as inactive with $0 default price.
-- Admin must enable them before they appear on the website or onboarding flow.

INSERT INTO public.service_catalog (name, description, price, duration_hours, category, active, sort_order)
VALUES
  ('Robot Pool Cleaner Drop-off', 'Robotic pool cleaner delivered and set up at your property for automated pool cleaning.', 0, 1, 'Equipment', false, 100),
  ('Hose Bags',                   'Protective hose bags to keep your pool hoses organised and free from damage.',             0, 1, 'Equipment', false, 101),
  ('Plumbing Services',           'Professional pool plumbing repairs and installations.',                                    0, 2, 'Repairs',   false, 102),
  ('Leak Detection & Repair',     'Thorough leak detection using specialised equipment followed by professional repair.',     0, 2, 'Repairs',   false, 103)
ON CONFLICT DO NOTHING;


-- ============================================================
-- Migration: 20260710280000_homeowner_custom_services.sql
-- ============================================================
-- Per-homeowner custom services: admin-created services with customer-specific pricing.
-- These are independent of the service_catalog and only visible to the assigned homeowner.

CREATE TABLE IF NOT EXISTS public.homeowner_custom_services (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  price           numeric(10,2) NOT NULL DEFAULT 0,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homeowner_custom_services ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "admin_all_homeowner_custom_services"
  ON public.homeowner_custom_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Homeowners can read their own active custom services
CREATE POLICY "homeowner_read_own_custom_services"
  ON public.homeowner_custom_services
  FOR SELECT
  TO authenticated
  USING (homeowner_id = auth.uid() AND active = true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_homeowner_custom_services()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_homeowner_custom_services_updated
  BEFORE UPDATE ON public.homeowner_custom_services
  FOR EACH ROW EXECUTE FUNCTION public.touch_homeowner_custom_services();


