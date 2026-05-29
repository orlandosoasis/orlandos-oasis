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