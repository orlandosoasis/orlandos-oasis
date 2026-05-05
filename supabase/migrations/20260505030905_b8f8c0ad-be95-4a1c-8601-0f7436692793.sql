
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
