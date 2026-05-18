ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_grandfathered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_placeholder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS grandfathered_note text;