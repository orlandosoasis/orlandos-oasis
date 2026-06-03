
-- ============================================================
-- PRICING CATALOG TABLES
-- ============================================================

CREATE TABLE public.pricing_pool_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  size text NOT NULL UNIQUE,
  display_name text NOT NULL,
  base_monthly_price numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_pool_sizes TO anon, authenticated;
GRANT ALL ON public.pricing_pool_sizes TO service_role;
ALTER TABLE public.pricing_pool_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pricing pool sizes are readable by all"
  ON public.pricing_pool_sizes FOR SELECT USING (true);
CREATE POLICY "Admins manage pool size pricing"
  ON public.pricing_pool_sizes FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.pricing_frequencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frequency text NOT NULL UNIQUE,
  display_name text NOT NULL,
  -- additive adjustment to the pool-size monthly price (can be negative for discounts)
  price_delta numeric NOT NULL DEFAULT 0,
  -- optional multiplier applied to the base price (1.0 = no change)
  multiplier numeric NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_frequencies TO anon, authenticated;
GRANT ALL ON public.pricing_frequencies TO service_role;
ALTER TABLE public.pricing_frequencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pricing frequencies are readable by all"
  ON public.pricing_frequencies FOR SELECT USING (true);
CREATE POLICY "Admins manage frequency pricing"
  ON public.pricing_frequencies FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.pricing_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  billing_type text NOT NULL DEFAULT 'one_time' CHECK (billing_type IN ('one_time','monthly')),
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_addons TO anon, authenticated;
GRANT ALL ON public.pricing_addons TO service_role;
ALTER TABLE public.pricing_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pricing add-ons are readable by all"
  ON public.pricing_addons FOR SELECT USING (true);
CREATE POLICY "Admins manage add-on pricing"
  ON public.pricing_addons FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.pricing_grandfathered_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  monthly_price numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_grandfathered_plans TO authenticated;
GRANT ALL ON public.pricing_grandfathered_plans TO service_role;
ALTER TABLE public.pricing_grandfathered_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Grandfathered plans readable by authenticated"
  ON public.pricing_grandfathered_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage grandfathered plans"
  ON public.pricing_grandfathered_plans FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- HOMEOWNER CUSTOM CHARGES
-- ============================================================

CREATE TABLE public.homeowner_custom_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id uuid NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  billing_type text NOT NULL DEFAULT 'one_time' CHECK (billing_type IN ('one_time','monthly')),
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_homeowner_custom_charges_homeowner ON public.homeowner_custom_charges(homeowner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homeowner_custom_charges TO authenticated;
GRANT ALL ON public.homeowner_custom_charges TO service_role;
ALTER TABLE public.homeowner_custom_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all custom charges"
  ON public.homeowner_custom_charges FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Homeowners view own custom charges"
  ON public.homeowner_custom_charges FOR SELECT TO authenticated
  USING (homeowner_id = auth.uid());

-- ============================================================
-- PROFILE EXTENSIONS
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS grandfathered_plan_id uuid,
  ADD COLUMN IF NOT EXISTS grandfathered_monthly_override numeric,
  ADD COLUMN IF NOT EXISTS outstanding_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due_after_cancellation boolean NOT NULL DEFAULT false;

-- ============================================================
-- SERVICES EXTENSIONS (per-visit pricing)
-- ============================================================

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS addon_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  ADD COLUMN IF NOT EXISTS custom_charges jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS base_price numeric,
  ADD COLUMN IF NOT EXISTS computed_price numeric;

-- ============================================================
-- TIMESTAMP TRIGGERS
-- ============================================================

CREATE TRIGGER trg_pricing_pool_sizes_updated
  BEFORE UPDATE ON public.pricing_pool_sizes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_pricing_frequencies_updated
  BEFORE UPDATE ON public.pricing_frequencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_pricing_addons_updated
  BEFORE UPDATE ON public.pricing_addons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_pricing_grandfathered_plans_updated
  BEFORE UPDATE ON public.pricing_grandfathered_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_homeowner_custom_charges_updated
  BEFORE UPDATE ON public.homeowner_custom_charges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- BILLING CALCULATION FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_homeowner_monthly(p_homeowner_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles;
  v_pool public.pools;
  v_pool_price numeric := 0;
  v_freq_delta numeric := 0;
  v_freq_mult numeric := 1;
  v_addons numeric := 0;
  v_custom numeric := 0;
  v_total numeric := 0;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_homeowner_id;
  IF v_profile IS NULL THEN RETURN 0; END IF;

  -- Grandfathered override wins
  IF v_profile.is_grandfathered THEN
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

  SELECT COALESCE(SUM(amount),0) INTO v_custom
    FROM public.homeowner_custom_charges
   WHERE homeowner_id = p_homeowner_id AND active AND billing_type = 'monthly';

  v_total := (v_pool_price * v_freq_mult) + v_freq_delta + v_addons + v_custom;
  RETURN ROUND(v_total::numeric, 2);
END;
$$;

GRANT EXECUTE ON FUNCTION public.compute_homeowner_monthly(uuid) TO authenticated;

-- ============================================================
-- ADMIN CANCEL WITH OUTSTANDING BALANCE
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_cancel_subscription(
  p_homeowner_id uuid,
  p_effective_end date,
  p_preserve_balance boolean,
  p_reason text
) RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_status public.subscription_status;
  v_profile public.profiles;
BEGIN
  IF v_uid IS NULL OR NOT private.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can cancel homeowner accounts';
  END IF;
  IF p_effective_end IS NULL THEN RAISE EXCEPTION 'Effective end date required'; END IF;

  v_status := CASE WHEN p_effective_end <= CURRENT_DATE
                   THEN 'cancelled'::public.subscription_status
                   ELSE 'pending_cancellation'::public.subscription_status END;

  UPDATE public.profiles
     SET subscription_status = v_status,
         subscription_cancelled_at = now(),
         subscription_effective_end_date = p_effective_end,
         subscription_cancellation_reason = NULLIF(btrim(p_reason),''),
         balance_due_after_cancellation = (p_preserve_balance AND outstanding_balance > 0)
   WHERE id = p_homeowner_id
  RETURNING * INTO v_profile;

  UPDATE public.services
     SET status = 'cancelled',
         cancellation_reason = NULLIF(btrim(p_reason),''),
         cancelled_at = now()
   WHERE homeowner_id = p_homeowner_id
     AND service_date > p_effective_end
     AND status IN ('scheduled','in_progress');

  INSERT INTO public.subscription_events
    (homeowner_id, event_type, reason, effective_end_date, status_after, actor_id)
  VALUES
    (p_homeowner_id,
     CASE WHEN v_status = 'cancelled' THEN 'admin_cancelled' ELSE 'admin_pending_cancellation' END,
     NULLIF(btrim(p_reason),''),
     p_effective_end, v_status, v_uid);

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_cancel_subscription(uuid, date, boolean, text) TO authenticated;

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_pool_sizes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_frequencies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_addons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_grandfathered_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.homeowner_custom_charges;

-- ============================================================
-- SEED DEFAULTS
-- ============================================================

INSERT INTO public.pricing_pool_sizes (size, display_name, base_monthly_price, sort_order) VALUES
  ('small',  'Small Pool',  150, 1),
  ('medium', 'Medium Pool', 175, 2),
  ('large',  'Large Pool',  200, 3)
ON CONFLICT (size) DO NOTHING;

INSERT INTO public.pricing_frequencies (frequency, display_name, price_delta, multiplier, sort_order) VALUES
  ('weekly',   'Weekly',     0, 1,    1),
  ('biweekly', 'Bi-Weekly',  0, 0.6,  2),
  ('monthly',  'Monthly',    0, 0.35, 3)
ON CONFLICT (frequency) DO NOTHING;

INSERT INTO public.pricing_addons (key, name, description, price, billing_type, sort_order) VALUES
  ('filter_clean',    'Filter Cleaning',          'Full cartridge or DE filter cleaning', 75,  'one_time', 1),
  ('salt_cell_clean', 'Salt Cell Cleaning',       'Descale and inspect salt chlorinator', 65,  'one_time', 2),
  ('chemical_balance','Chemical Balance Check',   'Comprehensive water chemistry tune-up',45,  'one_time', 3),
  ('equipment_check', 'Equipment Inspection',     'Pump, heater, and plumbing inspection',55,  'one_time', 4),
  ('algae_treatment', 'Algae Treatment',          'Shock treatment and brushing',          95,  'one_time', 5)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.pricing_grandfathered_plans (name, description, monthly_price) VALUES
  ('Legacy Standard 2022', 'Pre-2023 standard monthly rate',  125),
  ('Legacy Premium 2022',  'Pre-2023 premium monthly rate',   165)
ON CONFLICT DO NOTHING;
