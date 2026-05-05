-- 1. Profile contract & billing fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS contract_start_date date,
  ADD COLUMN IF NOT EXISTS contract_locked boolean NOT NULL DEFAULT false;

-- 2. Pool ↔ technician assignment (separate from per-service assignment)
ALTER TABLE public.pools
  ADD COLUMN IF NOT EXISTS assigned_technician_id uuid;

-- Allow assigned tech to view their pools
DROP POLICY IF EXISTS "Technicians view assigned pools" ON public.pools;
CREATE POLICY "Technicians view assigned pools"
  ON public.pools FOR SELECT
  USING (
    private.has_role(auth.uid(), 'technician'::app_role)
    AND (
      assigned_technician_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.services s WHERE s.pool_id = pools.id AND s.technician_id = auth.uid())
    )
  );

-- 3. Messages: optional pool reference for grouping
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS pool_id uuid;

-- 4. Service requests (ad-hoc)
CREATE TYPE public.service_request_status AS ENUM ('open', 'in_progress', 'resolved', 'cancelled');

CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id uuid NOT NULL,
  pool_id uuid,
  request_type text NOT NULL,
  description text NOT NULL,
  status public.service_request_status NOT NULL DEFAULT 'open',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners manage own service requests"
  ON public.service_requests FOR ALL
  USING (auth.uid() = homeowner_id)
  WITH CHECK (auth.uid() = homeowner_id);

CREATE POLICY "Admins manage all service requests"
  ON public.service_requests FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Admin-only notes (target = technician | homeowner | pool)
CREATE TYPE public.admin_note_target AS ENUM ('technician', 'homeowner', 'pool');

CREATE TABLE public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type public.admin_note_target NOT NULL,
  target_id uuid NOT NULL,
  body text NOT NULL,
  author_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_notes_target_idx ON public.admin_notes(target_type, target_id);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all admin notes"
  ON public.admin_notes FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER admin_notes_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();