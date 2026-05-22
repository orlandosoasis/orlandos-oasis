
-- 1) Subscription status enum
DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'pending_cancellation', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Add subscription fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status public.subscription_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS subscription_cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_effective_end_date date,
  ADD COLUMN IF NOT EXISTS subscription_cancellation_reason text;

-- 3) Add cancellation provenance to services
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS cancelled_by_homeowner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- 4) Cancel subscription RPC (homeowner self-serve, SECURITY DEFINER so we can update services)
CREATE OR REPLACE FUNCTION public.cancel_subscription(
  p_reason text,
  p_effective_end date
) RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_status public.subscription_status;
  v_profile public.profiles;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  IF v_role IS DISTINCT FROM 'homeowner' THEN
    RAISE EXCEPTION 'Only homeowners can cancel subscriptions';
  END IF;

  IF p_effective_end IS NULL THEN
    RAISE EXCEPTION 'Effective end date required';
  END IF;

  v_status := CASE WHEN p_effective_end <= CURRENT_DATE
                   THEN 'cancelled'::public.subscription_status
                   ELSE 'pending_cancellation'::public.subscription_status END;

  UPDATE public.profiles
     SET subscription_status = v_status,
         subscription_cancelled_at = now(),
         subscription_effective_end_date = p_effective_end,
         subscription_cancellation_reason = NULLIF(btrim(p_reason), '')
   WHERE id = v_uid
  RETURNING * INTO v_profile;

  -- Cancel future scheduled services after the effective end date
  UPDATE public.services
     SET status = 'cancelled',
         cancelled_by_homeowner = true,
         cancellation_reason = NULLIF(btrim(p_reason), ''),
         cancelled_at = now()
   WHERE homeowner_id = v_uid
     AND service_date > p_effective_end
     AND status IN ('scheduled', 'in_progress');

  RETURN v_profile;
END;
$$;

-- 5) Reactivate RPC
CREATE OR REPLACE FUNCTION public.reactivate_subscription()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.profiles;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  UPDATE public.profiles
     SET subscription_status = 'active',
         subscription_cancelled_at = NULL,
         subscription_effective_end_date = NULL,
         subscription_cancellation_reason = NULL
   WHERE id = v_uid
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_subscription(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_subscription() TO authenticated;

-- 6) Enable realtime on profiles so admins/homeowners see status changes live
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
