-- Add frequency to pools so we can pre-seed recurring services per property
ALTER TABLE public.pools
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'monthly';

-- Ensure realtime publication includes services and pools (idempotent guards)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'services'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.services';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pools'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.pools';
  END IF;
END $$;

-- Make sure REPLICA IDENTITY FULL is set so updates carry old row data
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.pools REPLICA IDENTITY FULL;
