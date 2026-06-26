ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_type text NOT NULL DEFAULT 'per_service' CHECK (payout_type IN ('hourly','per_service','daily')),
  ADD COLUMN IF NOT EXISTS payout_rate numeric(10,2),
  ADD COLUMN IF NOT EXISTS payout_effective_date date,
  ADD COLUMN IF NOT EXISTS payout_updated_at timestamptz;

-- Backfill payout_rate from legacy payout_per_pool for technicians
UPDATE public.profiles
   SET payout_rate = payout_per_pool
 WHERE role = 'technician' AND payout_rate IS NULL;