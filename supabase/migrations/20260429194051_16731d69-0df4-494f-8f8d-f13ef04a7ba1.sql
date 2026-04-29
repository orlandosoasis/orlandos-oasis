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