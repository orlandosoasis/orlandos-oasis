
-- 1) Compensation audit log table
CREATE TABLE IF NOT EXISTS public.compensation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id),
  previous_payout_type text,
  previous_payout_rate numeric,
  new_payout_type text NOT NULL,
  new_payout_rate numeric NOT NULL,
  effective_date date,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.compensation_events TO authenticated;
GRANT ALL ON public.compensation_events TO service_role;

ALTER TABLE public.compensation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view compensation events"
  ON public.compensation_events FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Techs view own compensation events"
  ON public.compensation_events FOR SELECT TO authenticated
  USING (technician_id = auth.uid());

CREATE INDEX IF NOT EXISTS compensation_events_tech_created_idx
  ON public.compensation_events (technician_id, created_at DESC);

-- 2) RPC: update technician compensation (admin only) + write audit log
CREATE OR REPLACE FUNCTION public.update_technician_compensation(
  p_technician_id uuid,
  p_payout_type   text,
  p_payout_rate   numeric,
  p_effective_date date
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_uid uuid := auth.uid();
  v_prev_type text;
  v_prev_rate numeric;
  v_actor_name text;
  v_tech_name  text;
  v_profile public.profiles;
BEGIN
  IF v_uid IS NULL OR NOT private.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can update technician compensation';
  END IF;

  IF p_payout_type NOT IN ('hourly','per_service','daily') THEN
    RAISE EXCEPTION 'Invalid payout type: %', p_payout_type;
  END IF;

  IF p_payout_rate IS NULL OR p_payout_rate < 0 THEN
    RAISE EXCEPTION 'Payout rate must be a positive number';
  END IF;

  SELECT payout_type, payout_rate, COALESCE(full_name, email)
    INTO v_prev_type, v_prev_rate, v_tech_name
    FROM public.profiles WHERE id = p_technician_id;

  IF v_tech_name IS NULL THEN
    RAISE EXCEPTION 'Technician not found';
  END IF;

  SELECT COALESCE(full_name, email) INTO v_actor_name
    FROM public.profiles WHERE id = v_uid;

  UPDATE public.profiles
     SET payout_type = p_payout_type,
         payout_rate = p_payout_rate,
         payout_effective_date = p_effective_date,
         payout_updated_at = now()
   WHERE id = p_technician_id
  RETURNING * INTO v_profile;

  INSERT INTO public.compensation_events (
    technician_id, actor_id,
    previous_payout_type, previous_payout_rate,
    new_payout_type, new_payout_rate,
    effective_date, summary
  ) VALUES (
    p_technician_id, v_uid,
    v_prev_type, v_prev_rate,
    p_payout_type, p_payout_rate,
    p_effective_date,
    format('%s updated %s''s payout rate from $%s/%s to $%s/%s',
      COALESCE(v_actor_name,'Admin'), v_tech_name,
      COALESCE(v_prev_rate::text,'0'), COALESCE(v_prev_type,'per_service'),
      p_payout_rate::text, p_payout_type)
  );

  RETURN v_profile;
END
$fn$;

REVOKE ALL ON FUNCTION public.update_technician_compensation(uuid, text, numeric, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_technician_compensation(uuid, text, numeric, date) TO authenticated;
