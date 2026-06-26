
-- =========================================================
-- Phase 1: Admin pricing foundation
-- Adds selected-addons per homeowner, custom price override,
-- grandfathered snapshot, and updates pricing math + RPCs.
-- =========================================================

-- 1. Custom pricing + grandfathered snapshot on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS use_custom_pricing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_monthly_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS grandfathered_snapshot jsonb;

-- 2. Selected add-ons per homeowner
CREATE TABLE IF NOT EXISTS public.homeowner_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES public.pricing_addons(id) ON DELETE RESTRICT,
  price_snapshot numeric(10,2) NOT NULL,
  billing_type_snapshot text NOT NULL DEFAULT 'one_time',
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (homeowner_id, addon_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.homeowner_addons TO authenticated;
GRANT ALL ON public.homeowner_addons TO service_role;

ALTER TABLE public.homeowner_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners read own addons"
  ON public.homeowner_addons FOR SELECT
  TO authenticated
  USING (homeowner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage homeowner addons"
  ON public.homeowner_addons FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_homeowner_addons_updated
  BEFORE UPDATE ON public.homeowner_addons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Updated compute function: custom > grandfathered snapshot > computed
CREATE OR REPLACE FUNCTION public.compute_homeowner_monthly(p_homeowner_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile public.profiles;
  v_pool public.pools;
  v_pool_price numeric := 0;
  v_freq_delta numeric := 0;
  v_freq_mult numeric := 1;
  v_addons numeric := 0;
  v_custom numeric := 0;
  v_total numeric := 0;
  v_snap jsonb;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_homeowner_id;
  IF v_profile IS NULL THEN RETURN 0; END IF;

  -- Custom override wins above all
  IF v_profile.use_custom_pricing AND v_profile.custom_monthly_price IS NOT NULL THEN
    RETURN v_profile.custom_monthly_price;
  END IF;

  -- Grandfathered snapshot wins next
  IF v_profile.is_grandfathered THEN
    v_snap := v_profile.grandfathered_snapshot;
    IF v_snap IS NOT NULL AND (v_snap ? 'monthly_total') THEN
      RETURN (v_snap->>'monthly_total')::numeric;
    END IF;
    IF v_profile.grandfathered_monthly_override IS NOT NULL THEN
      RETURN v_profile.grandfathered_monthly_override;
    END IF;
    IF v_profile.grandfathered_plan_id IS NOT NULL THEN
      SELECT monthly_price INTO v_total
        FROM public.pricing_grandfathered_plans
       WHERE id = v_profile.grandfathered_plan_id;
      IF v_total IS NOT NULL THEN RETURN v_total; END IF;
    END IF;
    IF v_profile.monthly_amount IS NOT NULL THEN
      RETURN v_profile.monthly_amount;
    END IF;
  END IF;

  SELECT * INTO v_pool FROM public.pools WHERE homeowner_id = p_homeowner_id LIMIT 1;

  IF v_pool.pool_size IS NOT NULL THEN
    SELECT base_monthly_price INTO v_pool_price
      FROM public.pricing_pool_sizes
     WHERE lower(size) = lower(v_pool.pool_size) AND active;
  END IF;
  v_pool_price := COALESCE(v_pool_price, 0);

  IF v_pool.frequency IS NOT NULL THEN
    SELECT price_delta, multiplier INTO v_freq_delta, v_freq_mult
      FROM public.pricing_frequencies
     WHERE lower(frequency) = lower(v_pool.frequency) AND active;
  END IF;
  v_freq_delta := COALESCE(v_freq_delta, 0);
  v_freq_mult  := COALESCE(v_freq_mult, 1);

  -- Recurring add-ons from homeowner_addons
  SELECT COALESCE(SUM(price_snapshot),0) INTO v_addons
    FROM public.homeowner_addons
   WHERE homeowner_id = p_homeowner_id
     AND active
     AND billing_type_snapshot = 'recurring';

  SELECT COALESCE(SUM(amount),0) INTO v_custom
    FROM public.homeowner_custom_charges
   WHERE homeowner_id = p_homeowner_id AND active AND billing_type = 'monthly';

  v_total := (v_pool_price * v_freq_mult) + v_freq_delta + v_addons + v_custom;
  RETURN ROUND(v_total::numeric, 2);
END;
$function$;

-- 4. RPC: replace homeowner add-on selections (admin only)
CREATE OR REPLACE FUNCTION public.set_homeowner_addons(
  p_homeowner_id uuid,
  p_addon_ids uuid[]
) RETURNS SETOF public.homeowner_addons
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_addon_id uuid;
  v_addon public.pricing_addons;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can manage homeowner add-ons';
  END IF;

  -- Soft-deactivate any not in new set
  UPDATE public.homeowner_addons
     SET active = false, updated_at = now()
   WHERE homeowner_id = p_homeowner_id
     AND (p_addon_ids IS NULL OR NOT (addon_id = ANY(p_addon_ids)));

  IF p_addon_ids IS NOT NULL THEN
    FOREACH v_addon_id IN ARRAY p_addon_ids LOOP
      SELECT * INTO v_addon FROM public.pricing_addons WHERE id = v_addon_id AND active;
      IF v_addon IS NULL THEN CONTINUE; END IF;

      INSERT INTO public.homeowner_addons
        (homeowner_id, addon_id, price_snapshot, billing_type_snapshot, active, created_by)
      VALUES
        (p_homeowner_id, v_addon_id, v_addon.price, v_addon.billing_type, true, v_uid)
      ON CONFLICT (homeowner_id, addon_id) DO UPDATE
        SET active = true,
            price_snapshot = EXCLUDED.price_snapshot,
            billing_type_snapshot = EXCLUDED.billing_type_snapshot,
            updated_at = now();
    END LOOP;
  END IF;

  RETURN QUERY
    SELECT * FROM public.homeowner_addons
     WHERE homeowner_id = p_homeowner_id AND active
     ORDER BY created_at;
END;
$$;

-- 5. RPC: snapshot grandfathered pricing (freeze current prices)
CREATE OR REPLACE FUNCTION public.snapshot_grandfathered_pricing(p_homeowner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_pool public.pools;
  v_pool_price numeric := 0;
  v_freq_delta numeric := 0;
  v_freq_mult numeric := 1;
  v_addons jsonb := '[]'::jsonb;
  v_addons_total numeric := 0;
  v_monthly numeric := 0;
  v_snap jsonb;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can snapshot grandfathered pricing';
  END IF;

  SELECT * INTO v_pool FROM public.pools WHERE homeowner_id = p_homeowner_id LIMIT 1;

  IF v_pool.pool_size IS NOT NULL THEN
    SELECT base_monthly_price INTO v_pool_price
      FROM public.pricing_pool_sizes
     WHERE lower(size) = lower(v_pool.pool_size) AND active;
  END IF;
  v_pool_price := COALESCE(v_pool_price, 0);

  IF v_pool.frequency IS NOT NULL THEN
    SELECT price_delta, multiplier INTO v_freq_delta, v_freq_mult
      FROM public.pricing_frequencies
     WHERE lower(frequency) = lower(v_pool.frequency) AND active;
  END IF;
  v_freq_delta := COALESCE(v_freq_delta, 0);
  v_freq_mult  := COALESCE(v_freq_mult, 1);

  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'addon_id', addon_id,
      'name', (SELECT name FROM public.pricing_addons WHERE id = ha.addon_id),
      'price', price_snapshot,
      'billing_type', billing_type_snapshot
    )), '[]'::jsonb),
    COALESCE(SUM(CASE WHEN billing_type_snapshot='recurring' THEN price_snapshot ELSE 0 END), 0)
  INTO v_addons, v_addons_total
  FROM public.homeowner_addons ha
  WHERE homeowner_id = p_homeowner_id AND active;

  v_monthly := ROUND(((v_pool_price * v_freq_mult) + v_freq_delta + v_addons_total)::numeric, 2);

  v_snap := jsonb_build_object(
    'snapshotted_at', now(),
    'pool_size', v_pool.pool_size,
    'pool_size_price', v_pool_price,
    'frequency', v_pool.frequency,
    'frequency_delta', v_freq_delta,
    'frequency_multiplier', v_freq_mult,
    'addons', v_addons,
    'addons_total', v_addons_total,
    'monthly_total', v_monthly
  );

  UPDATE public.profiles
     SET grandfathered_snapshot = v_snap,
         is_grandfathered = true
   WHERE id = p_homeowner_id;

  RETURN v_snap;
END;
$$;

-- 6. RPC: clear grandfathered snapshot (when toggling OFF)
CREATE OR REPLACE FUNCTION public.clear_grandfathered_pricing(p_homeowner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can clear grandfathered pricing';
  END IF;
  UPDATE public.profiles
     SET grandfathered_snapshot = NULL,
         is_grandfathered = false
   WHERE id = p_homeowner_id;
END;
$$;
