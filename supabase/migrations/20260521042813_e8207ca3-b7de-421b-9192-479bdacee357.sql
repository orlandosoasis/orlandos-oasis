ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.pools REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pools;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;