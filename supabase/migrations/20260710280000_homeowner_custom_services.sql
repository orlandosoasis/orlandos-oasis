-- Per-homeowner custom services: admin-created services with customer-specific pricing.
-- These are independent of the service_catalog and only visible to the assigned homeowner.

CREATE TABLE IF NOT EXISTS public.homeowner_custom_services (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  price           numeric(10,2) NOT NULL DEFAULT 0,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homeowner_custom_services ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "admin_all_homeowner_custom_services"
  ON public.homeowner_custom_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Homeowners can read their own active custom services
CREATE POLICY "homeowner_read_own_custom_services"
  ON public.homeowner_custom_services
  FOR SELECT
  TO authenticated
  USING (homeowner_id = auth.uid() AND active = true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_homeowner_custom_services()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_homeowner_custom_services_updated
  BEFORE UPDATE ON public.homeowner_custom_services
  FOR EACH ROW EXECUTE FUNCTION public.touch_homeowner_custom_services();
