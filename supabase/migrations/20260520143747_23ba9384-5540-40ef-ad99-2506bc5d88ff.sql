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