
-- ─── Enums ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.day_off_status AS ENUM ('pending','approved','denied','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.day_off_resolution AS ENUM ('reassign','unassigned','reschedule','notify_only');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── day_off_requests ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.day_off_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status public.day_off_status NOT NULL DEFAULT 'pending',
  resolution_action public.day_off_resolution,
  decided_by_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT day_off_requests_range_chk CHECK (end_date >= start_date)
);

GRANT SELECT, INSERT, UPDATE ON public.day_off_requests TO authenticated;
GRANT ALL ON public.day_off_requests TO service_role;
ALTER TABLE public.day_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tech can view own requests" ON public.day_off_requests
  FOR SELECT TO authenticated
  USING (technician_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role));

CREATE POLICY "Tech can insert own requests" ON public.day_off_requests
  FOR INSERT TO authenticated
  WITH CHECK (technician_id = auth.uid());

CREATE POLICY "Admin can update requests" ON public.day_off_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role) OR technician_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role) OR technician_id = auth.uid());

CREATE TRIGGER trg_day_off_requests_updated
  BEFORE UPDATE ON public.day_off_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── technician_unavailability ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.technician_unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  reason text,
  source text NOT NULL DEFAULT 'day_off_request',
  request_id uuid REFERENCES public.day_off_requests(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (technician_id, date)
);

GRANT SELECT ON public.technician_unavailability TO authenticated;
GRANT ALL ON public.technician_unavailability TO service_role;
ALTER TABLE public.technician_unavailability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view unavailability" ON public.technician_unavailability
  FOR SELECT TO authenticated USING (true);

-- ─── day_off_request_events ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.day_off_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.day_off_requests(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role text,
  summary text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.day_off_request_events TO authenticated;
GRANT ALL ON public.day_off_request_events TO service_role;
ALTER TABLE public.day_off_request_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View events for own or admin" ON public.day_off_request_events
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin'::public.app_role) OR EXISTS (
      SELECT 1 FROM public.day_off_requests r
      WHERE r.id = request_id AND r.technician_id = auth.uid()
    )
  );

-- ─── tech_notifications ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tech_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  cta_route text,
  request_id uuid REFERENCES public.day_off_requests(id) ON DELETE SET NULL,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.tech_notifications TO authenticated;
GRANT ALL ON public.tech_notifications TO service_role;
ALTER TABLE public.tech_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tech reads own notifications" ON public.tech_notifications
  FOR SELECT TO authenticated
  USING (technician_id = auth.uid() OR public.has_role(auth.uid(),'admin'::public.app_role));

CREATE POLICY "Tech updates own notifications" ON public.tech_notifications
  FOR UPDATE TO authenticated
  USING (technician_id = auth.uid())
  WITH CHECK (technician_id = auth.uid());

-- ─── Realtime ──────────────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.day_off_requests;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.day_off_request_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tech_notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.technician_unavailability;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── RPC: submit ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_day_off_request(
  p_start date, p_end date, p_reason text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  IF v_role IS DISTINCT FROM 'technician' THEN
    RAISE EXCEPTION 'Only technicians can submit day-off requests';
  END IF;
  IF p_end < p_start THEN RAISE EXCEPTION 'End date before start date'; END IF;

  INSERT INTO public.day_off_requests (technician_id, start_date, end_date, reason)
  VALUES (v_uid, p_start, p_end, NULLIF(btrim(p_reason),''))
  RETURNING id INTO v_id;

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary, details)
  VALUES (v_id, 'submitted', v_uid, 'technician',
    format('Day off request submitted for %s to %s', p_start, p_end),
    jsonb_build_object('start_date', p_start, 'end_date', p_end, 'reason', p_reason));

  RETURN v_id;
END $$;

-- ─── RPC: cancel (tech withdraws) ──────────────────────────
CREATE OR REPLACE FUNCTION public.cancel_day_off_request(p_id uuid)
RETURNS public.day_off_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.day_off_requests;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_row FROM public.day_off_requests WHERE id = p_id;
  IF v_row IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_row.technician_id <> v_uid THEN RAISE EXCEPTION 'Not your request'; END IF;
  IF v_row.status <> 'pending' THEN RAISE EXCEPTION 'Only pending requests can be cancelled'; END IF;

  UPDATE public.day_off_requests SET status = 'cancelled' WHERE id = p_id RETURNING * INTO v_row;
  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary)
  VALUES (p_id, 'cancelled', v_uid, 'technician', 'Request withdrawn by technician');
  RETURN v_row;
END $$;

-- ─── RPC: preview impact ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.preview_day_off_impact(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req public.day_off_requests;
  v_services jsonb;
  v_homeowner_count int;
BEGIN
  SELECT * INTO v_req FROM public.day_off_requests WHERE id = p_id;
  IF v_req IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin'::public.app_role) OR v_req.technician_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'service_id', s.id,
    'service_date', s.service_date,
    'service_type', s.service_type,
    'status', s.status::text,
    'homeowner_id', s.homeowner_id,
    'homeowner_name', COALESCE(p.full_name, p.email),
    'address', po.address
  ) ORDER BY s.service_date), '[]'::jsonb),
  COUNT(DISTINCT s.homeowner_id)::int
  INTO v_services, v_homeowner_count
  FROM public.services s
  LEFT JOIN public.profiles p ON p.id = s.homeowner_id
  LEFT JOIN public.pools po ON po.id = s.pool_id
  WHERE s.technician_id = v_req.technician_id
    AND s.service_date BETWEEN v_req.start_date AND v_req.end_date
    AND s.status IN ('scheduled','in_progress');

  RETURN jsonb_build_object(
    'affected_services', v_services,
    'affected_homeowner_count', v_homeowner_count,
    'days', (v_req.end_date - v_req.start_date) + 1
  );
END $$;

-- ─── RPC: approve ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_day_off_request(
  p_id uuid,
  p_action public.day_off_resolution,
  p_reassign_to uuid,
  p_reschedule_to date,
  p_message text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_req public.day_off_requests;
  v_d date;
  v_svc record;
  v_affected int := 0;
  v_title text;
  v_kind text;
  v_notif_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid,'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can approve day-off requests';
  END IF;
  SELECT * INTO v_req FROM public.day_off_requests WHERE id = p_id FOR UPDATE;
  IF v_req IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_req.status <> 'pending' THEN RAISE EXCEPTION 'Request already %', v_req.status; END IF;

  IF p_action = 'reassign' AND p_reassign_to IS NULL THEN
    RAISE EXCEPTION 'Reassign target required';
  END IF;
  IF p_action = 'reschedule' AND p_reschedule_to IS NULL THEN
    RAISE EXCEPTION 'New service date required';
  END IF;

  UPDATE public.day_off_requests
     SET status='approved', resolution_action=p_action,
         decided_by_id=v_uid, decided_at=now(), decision_note=NULLIF(btrim(p_message),'')
   WHERE id = p_id;

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary, details)
  VALUES (p_id, 'approved', v_uid, 'admin',
    format('Approved with action: %s', p_action),
    jsonb_build_object('action', p_action, 'reassign_to', p_reassign_to,
      'reschedule_to', p_reschedule_to, 'message', p_message));

  -- Mark technician unavailable for every date in range
  v_d := v_req.start_date;
  WHILE v_d <= v_req.end_date LOOP
    INSERT INTO public.technician_unavailability (technician_id, date, reason, source, request_id)
    VALUES (v_req.technician_id, v_d, COALESCE(v_req.reason,'Approved day off'), 'day_off_request', p_id)
    ON CONFLICT (technician_id, date) DO NOTHING;
    v_d := v_d + 1;
  END LOOP;
  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary)
  VALUES (p_id, 'availability_updated', v_uid, 'admin',
    format('Technician marked unavailable %s – %s', v_req.start_date, v_req.end_date));

  -- Apply action to affected services
  FOR v_svc IN
    SELECT s.*
      FROM public.services s
     WHERE s.technician_id = v_req.technician_id
       AND s.service_date BETWEEN v_req.start_date AND v_req.end_date
       AND s.status IN ('scheduled','in_progress')
  LOOP
    v_affected := v_affected + 1;

    IF p_action = 'reassign' THEN
      UPDATE public.services SET technician_id = p_reassign_to WHERE id = v_svc.id;
      UPDATE public.pools SET assigned_technician_id = p_reassign_to WHERE id = v_svc.pool_id;
      v_kind := 'tech_reassigned';
      v_title := 'A new technician has been assigned';
    ELSIF p_action = 'unassigned' THEN
      UPDATE public.services SET technician_id = NULL WHERE id = v_svc.id;
      v_kind := 'tech_unassigned';
      v_title := 'Your technician is being reassigned';
    ELSIF p_action = 'reschedule' THEN
      UPDATE public.services SET service_date = p_reschedule_to WHERE id = v_svc.id;
      v_kind := 'service_rescheduled';
      v_title := 'Your service has been rescheduled';
    ELSE
      v_kind := 'service_update';
      v_title := 'Service update from your technician';
    END IF;

    INSERT INTO public.homeowner_notifications
      (homeowner_id, service_id, kind, title, body, cta_route)
    VALUES (v_svc.homeowner_id, v_svc.id, v_kind, v_title,
            COALESCE(NULLIF(btrim(p_message),''),''), '/service/' || v_svc.id::text)
    RETURNING id INTO v_notif_id;
  END LOOP;

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary, details)
  VALUES (p_id, 'appointments_updated', v_uid, 'admin',
    format('%s appointment(s) updated', v_affected),
    jsonb_build_object('count', v_affected, 'action', p_action));

  -- Notify technician
  INSERT INTO public.tech_notifications (technician_id, kind, title, body, cta_route, request_id)
  VALUES (v_req.technician_id, 'day_off_approved',
    format('Your day off request for %s to %s has been approved.', v_req.start_date, v_req.end_date),
    COALESCE(NULLIF(btrim(p_message),''),''),
    '/tech/time-off', p_id);

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary)
  VALUES (p_id, 'tech_notified', v_uid, 'admin', 'Technician notified of approval');

  RETURN p_id;
END $$;

-- ─── RPC: deny ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deny_day_off_request(p_id uuid, p_reason text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_req public.day_off_requests;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid,'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can deny day-off requests';
  END IF;
  SELECT * INTO v_req FROM public.day_off_requests WHERE id = p_id FOR UPDATE;
  IF v_req IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_req.status <> 'pending' THEN RAISE EXCEPTION 'Request already %', v_req.status; END IF;

  UPDATE public.day_off_requests
     SET status='denied', decided_by_id=v_uid, decided_at=now(),
         decision_note=NULLIF(btrim(p_reason),'')
   WHERE id = p_id;

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary, details)
  VALUES (p_id, 'denied', v_uid, 'admin', 'Request denied',
    jsonb_build_object('reason', p_reason));

  INSERT INTO public.tech_notifications (technician_id, kind, title, body, cta_route, request_id)
  VALUES (v_req.technician_id, 'day_off_denied',
    format('Your day off request for %s to %s was not approved.', v_req.start_date, v_req.end_date),
    COALESCE(NULLIF(btrim(p_reason),''),''),
    '/tech/time-off', p_id);

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary)
  VALUES (p_id, 'tech_notified', v_uid, 'admin', 'Technician notified of denial');

  RETURN p_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_day_off_request(date,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_day_off_request(date,date,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_day_off_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_day_off_request(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.preview_day_off_impact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_day_off_impact(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_day_off_request(uuid,public.day_off_resolution,uuid,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_day_off_request(uuid,public.day_off_resolution,uuid,date,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.deny_day_off_request(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deny_day_off_request(uuid,text) TO authenticated;
