
-- Audit log for route issues
CREATE TABLE public.route_issue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_issue_id uuid NOT NULL REFERENCES public.route_issues(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'created','service_affected','service_updated','notification_sent',
    'status_changed','reschedule_approved'
  )),
  actor_id uuid,
  actor_role text,
  service_id uuid,
  homeowner_id uuid,
  notification_id uuid,
  summary text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX route_issue_events_issue_idx ON public.route_issue_events(route_issue_id, created_at);
CREATE INDEX route_issue_events_type_idx ON public.route_issue_events(event_type);

GRANT SELECT, INSERT ON public.route_issue_events TO authenticated;
GRANT ALL ON public.route_issue_events TO service_role;

ALTER TABLE public.route_issue_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all route_issue_events"
  ON public.route_issue_events FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Affected homeowner views route_issue_events"
  ON public.route_issue_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.route_issue_services ris
    WHERE ris.route_issue_id = route_issue_events.route_issue_id
      AND ris.homeowner_id = auth.uid()
  ));

CREATE POLICY "Technician views own route_issue_events"
  ON public.route_issue_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.route_issues ri
    WHERE ri.id = route_issue_events.route_issue_id
      AND (ri.technician_id = auth.uid() OR ri.reassigned_to_id = auth.uid() OR ri.reported_by_id = auth.uid())
  ));

ALTER PUBLICATION supabase_realtime ADD TABLE public.route_issue_events;

-- Rewire submit_route_issue to emit audit events
CREATE OR REPLACE FUNCTION public.submit_route_issue(
  p_issue_type text, p_other_text text, p_technician_id uuid, p_route_date date,
  p_scope text, p_service_ids uuid[], p_action text, p_delay_minutes integer,
  p_new_service_date date, p_new_time_window text, p_reassign_to uuid, p_message text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_role_text text;
  v_issue_id uuid;
  v_status text;
  v_svc record;
  v_kind text;
  v_title text;
  v_notif_id uuid;
  v_affected_count int := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  v_role_text := CASE WHEN v_role = 'admin' THEN 'admin'
                      WHEN v_role = 'technician' THEN 'technician'
                      ELSE NULL END;
  IF v_role_text IS NULL THEN RAISE EXCEPTION 'Only admins or technicians can report route issues'; END IF;
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
  ) RETURNING id INTO v_issue_id;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role, summary, details)
  VALUES (v_issue_id, 'created', v_uid, v_role_text,
    'Route issue reported',
    jsonb_build_object('issue_type', p_issue_type, 'scope', p_scope, 'action', p_action,
      'route_date', COALESCE(p_route_date, CURRENT_DATE), 'status', v_status));

  FOR v_svc IN
    SELECT s.* FROM public.services s
     WHERE ( p_scope = 'specific' AND s.id = ANY(p_service_ids) )
        OR ( p_scope = 'all'
             AND s.service_date = COALESCE(p_route_date, CURRENT_DATE)
             AND ( p_technician_id IS NULL OR s.technician_id = p_technician_id )
             AND s.status IN ('scheduled','in_progress') )
  LOOP
    IF v_role_text = 'technician' AND v_svc.technician_id IS DISTINCT FROM v_uid THEN CONTINUE; END IF;

    INSERT INTO public.route_issue_services (
      route_issue_id, service_id, homeowner_id,
      previous_status, previous_time_window, previous_service_date, previous_technician_id
    ) VALUES (
      v_issue_id, v_svc.id, v_svc.homeowner_id,
      v_svc.status::text, v_svc.time_window::text, v_svc.service_date, v_svc.technician_id
    );
    v_affected_count := v_affected_count + 1;

    INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
      service_id, homeowner_id, summary, details)
    VALUES (v_issue_id, 'service_affected', v_uid, v_role_text,
      v_svc.id, v_svc.homeowner_id,
      'Appointment linked to route issue',
      jsonb_build_object(
        'previous_status', v_svc.status::text,
        'previous_time_window', v_svc.time_window::text,
        'previous_service_date', v_svc.service_date,
        'previous_technician_id', v_svc.technician_id
      ));

    IF v_status = 'active' THEN
      IF p_action = 'delay' THEN
        UPDATE public.services
           SET delay_minutes = COALESCE(NULLIF(p_delay_minutes,0), delay_minutes)
         WHERE id = v_svc.id;
        INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
          service_id, homeowner_id, summary, details)
        VALUES (v_issue_id, 'service_updated', v_uid, v_role_text, v_svc.id, v_svc.homeowner_id,
          format('Delay added (%s min)', COALESCE(p_delay_minutes,0)),
          jsonb_build_object('action','delay','delay_minutes', p_delay_minutes));
      ELSIF p_action = 'reschedule' THEN
        UPDATE public.services
           SET service_date = COALESCE(p_new_service_date, service_date),
               time_window  = COALESCE(NULLIF(btrim(p_new_time_window),'')::public.time_window, time_window),
               delay_minutes = 0
         WHERE id = v_svc.id;
        INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
          service_id, homeowner_id, summary, details)
        VALUES (v_issue_id, 'service_updated', v_uid, v_role_text, v_svc.id, v_svc.homeowner_id,
          'Appointment rescheduled',
          jsonb_build_object('action','reschedule',
            'new_service_date', p_new_service_date,
            'new_time_window', p_new_time_window,
            'previous_service_date', v_svc.service_date,
            'previous_time_window', v_svc.time_window::text));
      ELSIF p_action = 'reassign' THEN
        UPDATE public.services SET technician_id = p_reassign_to WHERE id = v_svc.id;
        UPDATE public.pools    SET assigned_technician_id = p_reassign_to WHERE id = v_svc.pool_id;
        INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
          service_id, homeowner_id, summary, details)
        VALUES (v_issue_id, 'service_updated', v_uid, v_role_text, v_svc.id, v_svc.homeowner_id,
          'Technician reassigned',
          jsonb_build_object('action','reassign',
            'previous_technician_id', v_svc.technician_id,
            'new_technician_id', p_reassign_to));
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
         COALESCE(NULLIF(btrim(p_message),''),''), '/service/' || v_svc.id::text)
      RETURNING id INTO v_notif_id;

      INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
        service_id, homeowner_id, notification_id, summary, details)
      VALUES (v_issue_id, 'notification_sent', v_uid, v_role_text,
        v_svc.id, v_svc.homeowner_id, v_notif_id,
        format('Notification sent: %s', v_title),
        jsonb_build_object('kind', v_kind, 'title', v_title, 'body', COALESCE(p_message,'')));
    END IF;
  END LOOP;

  RETURN v_issue_id;
END;
$function$;

-- Rewire resolve_route_issue to emit status_changed event
CREATE OR REPLACE FUNCTION public.resolve_route_issue(p_id uuid, p_status text)
RETURNS public.route_issues
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.route_issues;
  v_prev text;
BEGIN
  IF v_uid IS NULL OR NOT private.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can resolve route issues';
  END IF;
  IF p_status NOT IN ('resolved','cancelled') THEN
    RAISE EXCEPTION 'Invalid status %', p_status;
  END IF;

  SELECT status INTO v_prev FROM public.route_issues WHERE id = p_id;

  UPDATE public.route_issues
     SET status = p_status, resolved_at = now(), resolved_by_id = v_uid
   WHERE id = p_id
  RETURNING * INTO v_row;

  IF p_status = 'resolved' AND v_row.action_taken = 'delay' THEN
    UPDATE public.services s
       SET delay_minutes = 0
      FROM public.route_issue_services ris
     WHERE ris.route_issue_id = p_id AND s.id = ris.service_id;
  END IF;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
    summary, details)
  VALUES (p_id, 'status_changed', v_uid, 'admin',
    format('Status changed: %s → %s', COALESCE(v_prev,''), p_status),
    jsonb_build_object('from', v_prev, 'to', p_status));

  RETURN v_row;
END;
$function$;
