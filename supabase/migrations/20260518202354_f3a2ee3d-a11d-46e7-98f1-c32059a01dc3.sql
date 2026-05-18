ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_freds boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.profiles.is_freds IS 'Fred''s account tag: suppress all emails and notifications, but track service data.';
COMMENT ON COLUMN public.profiles.notifications_enabled IS 'When false, suppress all outbound emails and notifications for this profile.';