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