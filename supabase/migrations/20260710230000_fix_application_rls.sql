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
