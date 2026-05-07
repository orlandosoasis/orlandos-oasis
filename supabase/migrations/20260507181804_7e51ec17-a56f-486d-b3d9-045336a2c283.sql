DROP POLICY IF EXISTS "Technicians view own reviews" ON public.reviews;
CREATE POLICY "Technicians view own approved reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = technician_id AND status = 'approved'::review_status);