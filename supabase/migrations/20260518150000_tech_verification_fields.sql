-- ============================================================================
-- Tech verification trust signals
--
-- Adds fields to profiles that the UI uses to display verification badges
-- on technician cards (visible to homeowners on the service detail page,
-- to admins on the tech list, etc.). Helps build marketplace trust:
-- "Background-checked, insured, X services completed" is the marketplace
-- currency.
--
-- All fields default to false / null so existing rows aren't affected.
-- Admins set these flags via the admin dashboard tech-detail page.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_background_checked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS background_check_date date,
  ADD COLUMN IF NOT EXISTS is_insured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurance_expires_on date,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Tighten the update policy so only admins can flip these flags. The
-- existing "Users update own profile" policy already locks `role` from
-- self-update; this extends the same protection to the verification flags.
-- We swap out the policy with one that compares the new row's verification
-- columns against the current values for non-admin updates.

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  AND is_background_checked = (SELECT is_background_checked FROM public.profiles WHERE id = auth.uid())
  AND background_check_date IS NOT DISTINCT FROM (SELECT background_check_date FROM public.profiles WHERE id = auth.uid())
  AND is_insured = (SELECT is_insured FROM public.profiles WHERE id = auth.uid())
  AND insurance_expires_on IS NOT DISTINCT FROM (SELECT insurance_expires_on FROM public.profiles WHERE id = auth.uid())
  AND is_verified = (SELECT is_verified FROM public.profiles WHERE id = auth.uid())
  AND verified_at IS NOT DISTINCT FROM (SELECT verified_at FROM public.profiles WHERE id = auth.uid())
);

-- Helpful index for filtering admin views by verified status.
CREATE INDEX IF NOT EXISTS profiles_role_verified_idx ON public.profiles (role) WHERE is_verified = true;
