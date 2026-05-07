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