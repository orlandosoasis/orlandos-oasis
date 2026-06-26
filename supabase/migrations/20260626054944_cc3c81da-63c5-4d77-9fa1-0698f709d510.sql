
CREATE OR REPLACE FUNCTION public.submit_route_issue(p_issue_type text, p_other_text text, p_technician_id uuid, p_route_date date, p_scope text, p_service_ids uuid[], p_action text, p_delay_minutes integer, p_new_service_date date, p_new_time_window text, p_reassign_to uuid, p_message text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
  v_body text;
  v_notif_id uuid;
  v_affected_count int := 0;
  v_date_str text;
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

      IF p_action = 'delay' THEN
        v_title := 'Service delay';
        v_body  := 'Your technician is running behind schedule and may arrive later than expected.';
      ELSIF p_action = 'reschedule' THEN
        IF p_new_service_date IS NOT NULL THEN
          v_date_str := to_char(p_new_service_date, 'Mon DD, YYYY');
          v_title := 'New service date';
          v_body  := format('Your pool service has been rescheduled to %s%s.',
                            v_date_str,
                            CASE WHEN NULLIF(btrim(p_new_time_window),'') IS NOT NULL
                                 THEN ', between ' || p_new_time_window ELSE '' END);
        ELSE
          v_title := 'Service rescheduled';
          v_body  := 'Today''s pool service has been rescheduled due to an unexpected route issue.';
        END IF;
      ELSIF p_action = 'reassign' THEN
        v_title := 'A new technician has been assigned';
        v_body  := 'A new technician will be handling your scheduled pool service.';
      ELSE
        v_title := 'Service update from your technician';
        v_body  := 'There''s an update about your scheduled pool service.';
      END IF;

      IF NULLIF(btrim(p_message),'') IS NOT NULL THEN
        v_body := v_body || E'\n' || p_message;
      END IF;

      INSERT INTO public.homeowner_notifications
        (homeowner_id, route_issue_id, service_id, kind, title, body, cta_route)
      VALUES
        (v_svc.homeowner_id, v_issue_id, v_svc.id, v_kind, v_title, v_body,
         '/service/' || v_svc.id::text)
      RETURNING id INTO v_notif_id;

      INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
        service_id, homeowner_id, notification_id, summary, details)
      VALUES (v_issue_id, 'notification_sent', v_uid, v_role_text,
        v_svc.id, v_svc.homeowner_id, v_notif_id,
        format('Notification sent: %s', v_title),
        jsonb_build_object('kind', v_kind, 'title', v_title, 'body', v_body));
    END IF;
  END LOOP;

  RETURN v_issue_id;
END;
$function$;

-- Resolve: notify "back on track"
CREATE OR REPLACE FUNCTION public.resolve_route_issue(p_id uuid, p_status text)
 RETURNS route_issues
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.route_issues;
  v_prev text;
  v_svc record;
  v_notif_id uuid;
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

  IF p_status = 'resolved' THEN
    FOR v_svc IN
      SELECT ris.service_id, ris.homeowner_id
        FROM public.route_issue_services ris
       WHERE ris.route_issue_id = p_id
    LOOP
      INSERT INTO public.homeowner_notifications
        (homeowner_id, route_issue_id, service_id, kind, title, body, cta_route)
      VALUES (v_svc.homeowner_id, p_id, v_svc.service_id, 'route_notify',
        'Service update',
        'Your scheduled pool service is back on track and will proceed as planned.',
        '/service/' || v_svc.service_id::text)
      RETURNING id INTO v_notif_id;

      INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
        service_id, homeowner_id, notification_id, summary)
      VALUES (p_id, 'notification_sent', v_uid, 'admin',
        v_svc.service_id, v_svc.homeowner_id, v_notif_id,
        'Notification sent: Service back on track');
    END LOOP;
  END IF;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
    summary, details)
  VALUES (p_id, 'status_changed', v_uid, 'admin',
    format('Status changed: %s → %s', COALESCE(v_prev,''), p_status),
    jsonb_build_object('from', v_prev, 'to', p_status));

  RETURN v_row;
END;
$function$;
