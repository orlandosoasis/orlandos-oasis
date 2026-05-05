
-- Add 'in_progress' to issue_status enum and admin_notes column
ALTER TYPE issue_status ADD VALUE IF NOT EXISTS 'in_progress' BEFORE 'resolved';

ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS assigned_technician_id uuid;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone;
