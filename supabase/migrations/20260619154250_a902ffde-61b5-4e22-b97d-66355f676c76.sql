
-- 1) Remove permissive anon-insert policy on applicant_certifications
DROP POLICY IF EXISTS "Anyone can add certifications to pending application" ON public.applicant_certifications;

-- 2) Tighten technician_applications insert: signed-in users, email must match their profile
DROP POLICY IF EXISTS "Anyone can apply" ON public.technician_applications;
CREATE POLICY "Authenticated users can apply"
ON public.technician_applications
FOR INSERT
TO authenticated
WITH CHECK (
  length(btrim(email)) > 0
  AND length(btrim(first_name)) > 0
  AND length(btrim(last_name)) > 0
  AND status = 'pending'::public.application_status
  AND lower(btrim(email)) = lower((SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()))
);

-- 3) Profiles role-escalation: hard-block via trigger + tightened WITH CHECK
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Only admins can change a user role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
);

-- 4) Hide admin_notes column on issues from non-admins via column privileges
REVOKE SELECT (admin_notes) ON public.issues FROM authenticated;
REVOKE SELECT (admin_notes) ON public.issues FROM anon;
-- service_role and admin RPCs continue to access this column

-- 5) Storage: restrict resume/certification uploads to authenticated users with size + MIME limits
DROP POLICY IF EXISTS "Applicants upload resume to applications path" ON storage.objects;
DROP POLICY IF EXISTS "Applicants upload certification to applications path" ON storage.objects;

CREATE POLICY "Authenticated upload resume to applications path"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = 'applications'
  AND COALESCE((metadata->>'size')::bigint, 0) <= 10485760
  AND COALESCE(metadata->>'mimetype','') IN (
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
);

CREATE POLICY "Authenticated upload certification to applications path"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certifications'
  AND (storage.foldername(name))[1] = 'applications'
  AND COALESCE((metadata->>'size')::bigint, 0) <= 10485760
  AND COALESCE(metadata->>'mimetype','') IN (
    'application/pdf','image/png','image/jpeg','image/webp'
  )
);
