
-- 1. Audit table
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('cancelled','reactivated','pending_cancellation')),
  reason text,
  effective_end_date date,
  status_after public.subscription_status NOT NULL,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_homeowner_created
  ON public.subscription_events (homeowner_id, created_at DESC);

GRANT SELECT ON public.subscription_events TO authenticated;
GRANT ALL ON public.subscription_events TO service_role;

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners view own subscription events"
ON public.subscription_events FOR SELECT TO authenticated
USING (auth.uid() = homeowner_id);

CREATE POLICY "Admins view all subscription events"
ON public.subscription_events FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Update cancel_subscription to also log the event
CREATE OR REPLACE FUNCTION public.cancel_subscription(p_reason text, p_effective_end date)
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  UPDATE public.services
     SET status = 'cancelled',
         cancelled_by_homeowner = true,
         cancellation_reason = NULLIF(btrim(p_reason), ''),
         cancelled_at = now()
   WHERE homeowner_id = v_uid
     AND service_date > p_effective_end
     AND status IN ('scheduled', 'in_progress');

  INSERT INTO public.subscription_events
    (homeowner_id, event_type, reason, effective_end_date, status_after, actor_id)
  VALUES
    (v_uid,
     CASE WHEN v_status = 'cancelled' THEN 'cancelled' ELSE 'pending_cancellation' END,
     NULLIF(btrim(p_reason), ''),
     p_effective_end,
     v_status,
     v_uid);

  RETURN v_profile;
END;
$function$;

-- 3. Update reactivate_subscription to also log the event
CREATE OR REPLACE FUNCTION public.reactivate_subscription()
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  INSERT INTO public.subscription_events
    (homeowner_id, event_type, reason, effective_end_date, status_after, actor_id)
  VALUES
    (v_uid, 'reactivated', NULL, NULL, 'active'::public.subscription_status, v_uid);

  RETURN v_profile;
END;
$function$;
