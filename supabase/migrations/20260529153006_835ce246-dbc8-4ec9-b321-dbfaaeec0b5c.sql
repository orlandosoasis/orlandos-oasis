
-- Helper column on services
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS delay_minutes integer NOT NULL DEFAULT 0;

-- ============================================================
-- TABLES (create first, policies later)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.route_issues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_type        text NOT NULL CHECK (issue_type IN ('sick','breakdown','late','other')),
  other_text        text,
  reported_by_role  text NOT NULL CHECK (reported_by_role IN ('admin','technician')),
  reported_by_id    uuid NOT NULL,
  technician_id     uuid,
  route_date        date NOT NULL DEFAULT CURRENT_DATE,
  scope             text NOT NULL CHECK (scope IN ('all','specific')),
  action_taken      text NOT NULL CHECK (action_taken IN ('notify','delay','reschedule','reassign')),
  delay_minutes     integer,
  new_service_date  date,
  new_time_window   text,
  reassigned_to_id  uuid,
  message_to_homeowners text NOT NULL DEFAULT '',
  status            text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','pending_approval','resolved','cancelled')),
  resolved_at       timestamptz,
  resolved_by_id    uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS route_issues_status_idx     ON public.route_issues(status);
CREATE INDEX IF NOT EXISTS route_issues_technician_idx ON public.route_issues(technician_id);
CREATE INDEX IF NOT EXISTS route_issues_created_at_idx ON public.route_issues(created_at DESC);

CREATE TABLE IF NOT EXISTS public.route_issue_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_issue_id uuid NOT NULL REFERENCES public.route_issues(id) ON DELETE CASCADE,
  service_id     uuid NOT NULL,
  homeowner_id   uuid NOT NULL,
  previous_status        text,
  previous_time_window   text,
  previous_service_date  date,
  previous_technician_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS route_issue_services_issue_idx     ON public.route_issue_services(route_issue_id);
CREATE INDEX IF NOT EXISTS route_issue_services_service_idx   ON public.route_issue_services(service_id);
CREATE INDEX IF NOT EXISTS route_issue_services_homeowner_idx ON public.route_issue_services(homeowner_id);

CREATE TABLE IF NOT EXISTS public.homeowner_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id   uuid NOT NULL,
  route_issue_id uuid REFERENCES public.route_issues(id) ON DELETE CASCADE,
  service_id     uuid,
  kind           text NOT NULL CHECK (kind IN ('route_notify','route_delay','route_reschedule','route_reassign')),
  title          text NOT NULL,
  body           text NOT NULL DEFAULT '',
  cta_route      text,
  dismissed_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS homeowner_notifications_owner_idx
  ON public.homeowner_notifications(homeowner_id, dismissed_at, created_at DESC);

-- ============================================================
-- GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.route_issues             TO authenticated;
GRANT ALL                    ON public.route_issues             TO service_role;
GRANT SELECT, INSERT         ON public.route_issue_services     TO authenticated;
GRANT ALL                    ON public.route_issue_services     TO service_role;
GRANT SELECT, UPDATE         ON public.homeowner_notifications  TO authenticated;
GRANT ALL                    ON public.homeowner_notifications  TO service_role;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.route_issues             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_issue_services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homeowner_notifications  ENABLE ROW LEVEL SECURITY;

-- route_issues policies
CREATE POLICY "Admins manage all route issues"
  ON public.route_issues
  FOR ALL TO authenticated
  USING      (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Reporter views own route issue"
  ON public.route_issues
  FOR SELECT TO authenticated
  USING (reported_by_id = auth.uid());

CREATE POLICY "Affected homeowner views route issue"
  ON public.route_issues
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.route_issue_services ris
    WHERE ris.route_issue_id = route_issues.id
      AND ris.homeowner_id   = auth.uid()
  ));

CREATE POLICY "Assigned tech views route issue"
  ON public.route_issues
  FOR SELECT TO authenticated
  USING (technician_id = auth.uid() OR reassigned_to_id = auth.uid());

CREATE TRIGGER route_issues_set_updated_at
  BEFORE UPDATE ON public.route_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- route_issue_services policies
CREATE POLICY "Admins manage all route_issue_services"
  ON public.route_issue_services
  FOR ALL TO authenticated
  USING      (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Homeowner views own route_issue_services"
  ON public.route_issue_services
  FOR SELECT TO authenticated
  USING (homeowner_id = auth.uid());

CREATE POLICY "Technician views assigned route_issue_services"
  ON public.route_issue_services
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.route_issues ri
    WHERE ri.id = route_issue_services.route_issue_id
      AND (ri.technician_id = auth.uid() OR ri.reassigned_to_id = auth.uid())
  ));

-- homeowner_notifications policies
CREATE POLICY "Admins view all notifications"
  ON public.homeowner_notifications
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Homeowner reads own notifications"
  ON public.homeowner_notifications
  FOR SELECT TO authenticated
  USING (homeowner_id = auth.uid());

CREATE POLICY "Homeowner dismisses own notifications"
  ON public.homeowner_notifications
  FOR UPDATE TO authenticated
  USING (homeowner_id = auth.uid())
  WITH CHECK (homeowner_id = auth.uid());

-- ============================================================
-- RPC: submit_route_issue
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_route_issue(
  p_issue_type       text,
  p_other_text       text,
  p_technician_id    uuid,
  p_route_date       date,
  p_scope            text,
  p_service_ids      uuid[],
  p_action           text,
  p_delay_minutes    integer,
  p_new_service_date date,
  p_new_time_window  text,
  p_reassign_to      uuid,
  p_message          text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_role_text text;
  v_issue_id uuid;
  v_status text;
  v_svc record;
  v_kind text;
  v_title text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  v_role_text := CASE WHEN v_role = 'admin' THEN 'admin'
                      WHEN v_role = 'technician' THEN 'technician'
                      ELSE NULL END;
  IF v_role_text IS NULL THEN
    RAISE EXCEPTION 'Only admins or technicians can report route issues';
  END IF;

  IF p_action = 'reassign' AND v_role_text <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can reassign a technician';
  END IF;

  v_status := CASE WHEN p_action = 'reschedule' AND v_role_text = 'technician'
                   THEN 'pending_approval' ELSE 'active' END;

  INSERT INTO public.route_issues (
    issue_type, other_text, reported_by_role, reported_by_id,
    technician_id, route_date, scope, action_taken,
    delay_minutes, new_service_date, new_time_window, reassigned_to_id,
    message_to_homeowners, status
  ) VALUES (
    p_issue_type, NULLIF(btrim(p_other_text),''), v_role_text, v_uid,
    p_technician_id, COALESCE(p_route_date, CURRENT_DATE), p_scope, p_action,
    NULLIF(p_delay_minutes,0), p_new_service_date, NULLIF(btrim(p_new_time_window),''), p_reassign_to,
    COALESCE(p_message,''), v_status
  )
  RETURNING id INTO v_issue_id;

  FOR v_svc IN
    SELECT s.*
      FROM public.services s
     WHERE
       ( p_scope = 'specific' AND s.id = ANY(p_service_ids) )
       OR
       ( p_scope = 'all'
         AND s.service_date = COALESCE(p_route_date, CURRENT_DATE)
         AND ( p_technician_id IS NULL OR s.technician_id = p_technician_id )
         AND s.status IN ('scheduled','in_progress')
       )
  LOOP
    IF v_role_text = 'technician' AND v_svc.technician_id IS DISTINCT FROM v_uid THEN
      CONTINUE;
    END IF;

    INSERT INTO public.route_issue_services (
      route_issue_id, service_id, homeowner_id,
      previous_status, previous_time_window, previous_service_date, previous_technician_id
    ) VALUES (
      v_issue_id, v_svc.id, v_svc.homeowner_id,
      v_svc.status::text, v_svc.time_window::text, v_svc.service_date, v_svc.technician_id
    );

    IF v_status = 'active' THEN
      IF p_action = 'delay' THEN
        UPDATE public.services
           SET delay_minutes = COALESCE(NULLIF(p_delay_minutes,0), delay_minutes)
         WHERE id = v_svc.id;
      ELSIF p_action = 'reschedule' THEN
        UPDATE public.services
           SET service_date = COALESCE(p_new_service_date, service_date),
               time_window  = COALESCE(NULLIF(btrim(p_new_time_window),'')::public.time_window, time_window),
               delay_minutes = 0
         WHERE id = v_svc.id;
      ELSIF p_action = 'reassign' THEN
        UPDATE public.services SET technician_id = p_reassign_to WHERE id = v_svc.id;
        UPDATE public.pools    SET assigned_technician_id = p_reassign_to WHERE id = v_svc.pool_id;
      END IF;

      v_kind  := 'route_' || p_action;
      v_title := CASE p_action
                   WHEN 'notify'     THEN 'Service update from your technician'
                   WHEN 'delay'      THEN 'Your service may be delayed'
                   WHEN 'reschedule' THEN 'Your service has been rescheduled'
                   WHEN 'reassign'   THEN 'A new technician has been assigned'
                 END;

      INSERT INTO public.homeowner_notifications
        (homeowner_id, route_issue_id, service_id, kind, title, body, cta_route)
      VALUES
        (v_svc.homeowner_id, v_issue_id, v_svc.id, v_kind, v_title,
         COALESCE(NULLIF(btrim(p_message),''),''), '/service/' || v_svc.id::text);
    END IF;
  END LOOP;

  RETURN v_issue_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_route_issue(text,text,uuid,date,text,uuid[],text,integer,date,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_route_issue(text,text,uuid,date,text,uuid[],text,integer,date,text,uuid,text) TO authenticated;

-- ============================================================
-- RPC: resolve_route_issue (admins)
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_route_issue(p_id uuid, p_status text)
RETURNS public.route_issues
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.route_issues;
BEGIN
  IF v_uid IS NULL OR NOT private.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can resolve route issues';
  END IF;
  IF p_status NOT IN ('resolved','cancelled') THEN
    RAISE EXCEPTION 'Invalid status %', p_status;
  END IF;

  UPDATE public.route_issues
     SET status = p_status, resolved_at = now(), resolved_by_id = v_uid
   WHERE id = p_id
  RETURNING * INTO v_row;

  IF p_status = 'resolved' AND v_row.action_taken = 'delay' THEN
    UPDATE public.services s
       SET delay_minutes = 0
      FROM public.route_issue_services ris
     WHERE ris.route_issue_id = p_id
       AND s.id = ris.service_id;
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_route_issue(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_route_issue(uuid,text) TO authenticated;

-- ============================================================
-- RPC: dismiss_homeowner_notification
-- ============================================================
CREATE OR REPLACE FUNCTION public.dismiss_homeowner_notification(p_id uuid)
RETURNS public.homeowner_notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.homeowner_notifications;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.homeowner_notifications
     SET dismissed_at = now()
   WHERE id = p_id AND homeowner_id = v_uid
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.dismiss_homeowner_notification(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dismiss_homeowner_notification(uuid) TO authenticated;

-- ============================================================
-- Realtime
-- ============================================================
ALTER TABLE public.route_issues             REPLICA IDENTITY FULL;
ALTER TABLE public.route_issue_services     REPLICA IDENTITY FULL;
ALTER TABLE public.homeowner_notifications  REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.route_issues;             EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.route_issue_services;     EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.homeowner_notifications;  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
