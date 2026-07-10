-- Service catalog: admin-managed bookable specialty services
CREATE TABLE public.service_catalog (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  description  text,
  price        numeric     NOT NULL DEFAULT 0,
  duration_hours numeric   NOT NULL DEFAULT 1,
  category     text,
  active       boolean     NOT NULL DEFAULT true,
  sort_order   integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone (including unauthenticated) can read active catalog entries
CREATE POLICY "Anyone can view active service catalog"
  ON public.service_catalog FOR SELECT
  USING (active = true);

-- Admins can read all (including inactive)
CREATE POLICY "Admins can view all service catalog"
  ON public.service_catalog FOR SELECT
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can insert / update / delete
CREATE POLICY "Admins can manage service catalog"
  ON public.service_catalog FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_service_catalog_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_service_catalog_updated_at
  BEFORE UPDATE ON public.service_catalog
  FOR EACH ROW EXECUTE FUNCTION public.set_service_catalog_updated_at();

-- Seed the four specialty services
INSERT INTO public.service_catalog (name, description, price, duration_hours, sort_order, category) VALUES
  ('Robot Pool Cleaner Drop-off', 'We drop off and set up a robotic pool cleaner for your pool. The robot runs a full cleaning cycle while you relax — no effort required.', 75, 1, 1, 'Equipment'),
  ('Hose Bags', 'Supply and installation of filter hose bags to keep your pool water clean and free of fine debris.', 35, 0.5, 2, 'Supplies'),
  ('Plumbing Services', 'Professional pool plumbing repair and maintenance including pipe repairs, valve replacement, and fitting adjustments.', 120, 2, 3, 'Repair'),
  ('Leak Detection & Repair', 'Expert leak detection using pressure testing and visual inspection, followed by professional repair to stop water loss.', 150, 3, 4, 'Repair');
