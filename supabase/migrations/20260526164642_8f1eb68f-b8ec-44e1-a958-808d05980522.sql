
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
