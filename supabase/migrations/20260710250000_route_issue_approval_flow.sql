-- Route issue approval flow:
-- 1. All technician-submitted issues go to pending_approval (not just reschedule)
-- 2. approve_route_issue: applies service changes + sends homeowner notifications + notifies tech
-- 3. reject_route_issue: cancels without notifying homeowners, notifies tech of rejection

-- ─────────────────────────────────────────────────────────────────
-- 1. Update submit_route_issue: technicians always get pending_approval
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_route_issue(
  p_issue_type    text,
  p_other_text    text    DEFAULT NULL,
  p_technician_id uuid    DEFAULT NULL,
  p_route_date    date    DEFAULT NULL,
  p_scope         text    DEFAULT 'all',
  p_service_ids   uuid[]  DEFAULT '{}',
  p_action        text    DEFAULT 'notify',
  p_delay_minutes integer DEFAULT 0,
  p_new_service_date date DEFAULT NULL,
  p_new_time_window  text DEFAULT NULL,
  p_reassign_to   uuid   DEFAULT NULL,
  p_message       text   DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_uid          uuid := auth.uid();
  v_role_text    text;
  v_status       text;
  v_issue_id     uuid;
  v_svc          public.services%ROWTYPE;
  v_affected_count int := 0;
  v_kind         text;
  v_title        text;
  v_notif_id     uuid;
BEGIN
  SELECT CASE role WHEN 'admin' THEN 'admin' WHEN 'technician' THEN 'technician' ELSE NULL END
    INTO v_role_text
    FROM public.profiles WHERE id = v_uid;

  IF v_role_text IS NULL THEN RAISE EXCEPTION 'Only admins or technicians can report route issues'; END IF;
  IF p_action = 'reassign' AND v_role_text <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can reassign a technician';
  END IF;

  -- Technicians always need admin approval before homeowners are notified
  v_status := CASE WHEN v_role_text = 'technician' THEN 'pending_approval' ELSE 'active' END;

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

  -- Link affected services
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

    -- Only apply service changes + notify homeowners immediately for admin submissions
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

  -- Notify technician that their report is pending review (for their own submission)
  IF v_status = 'pending_approval' THEN
    INSERT INTO public.tech_notifications (
      technician_id, kind, title, body, cta_route, request_id
    ) VALUES (
      v_uid,
      'route_issue_pending',
      'Route issue submitted for review',
      'Your route issue report has been submitted and is awaiting admin approval. You will be notified once reviewed.',
      '/tech/jobs',
      v_issue_id::text
    );
  END IF;

  RETURN v_issue_id;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────
-- 2. approve_route_issue: admin approves → apply changes + notify homeowners + notify tech
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_route_issue(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_role_text text;
  v_issue     public.route_issues%ROWTYPE;
  v_svc_link  RECORD;
  v_svc       public.services%ROWTYPE;
  v_kind      text;
  v_title     text;
  v_notif_id  uuid;
BEGIN
  SELECT CASE role WHEN 'admin' THEN 'admin' ELSE NULL END
    INTO v_role_text
    FROM public.profiles WHERE id = v_uid;
  IF v_role_text IS NULL THEN RAISE EXCEPTION 'Admin only'; END IF;

  SELECT * INTO v_issue FROM public.route_issues WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Route issue not found'; END IF;
  IF v_issue.status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Route issue is not pending approval (current status: %)', v_issue.status;
  END IF;

  -- Mark active
  UPDATE public.route_issues
     SET status = 'active', updated_at = now()
   WHERE id = p_id;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role, summary, details)
  VALUES (p_id, 'status_changed', v_uid, 'admin', 'Route issue approved by admin',
    jsonb_build_object('from', 'pending_approval', 'to', 'active'));

  -- Apply service changes and send homeowner notifications for each linked service
  FOR v_svc_link IN
    SELECT ris.*, s.*
      FROM public.route_issue_services ris
      JOIN public.services s ON s.id = ris.service_id
     WHERE ris.route_issue_id = p_id
  LOOP
    SELECT * INTO v_svc FROM public.services WHERE id = v_svc_link.service_id;

    IF v_issue.action_taken = 'delay' THEN
      UPDATE public.services
         SET delay_minutes = COALESCE(NULLIF(v_issue.delay_minutes,0), delay_minutes)
       WHERE id = v_svc.id;
    ELSIF v_issue.action_taken = 'reschedule' THEN
      UPDATE public.services
         SET service_date = COALESCE(v_issue.new_service_date, service_date),
             time_window  = COALESCE(v_issue.new_time_window::public.time_window, time_window),
             delay_minutes = 0
       WHERE id = v_svc.id;
    ELSIF v_issue.action_taken = 'reassign' THEN
      UPDATE public.services SET technician_id = v_issue.reassigned_to_id WHERE id = v_svc.id;
      UPDATE public.pools    SET assigned_technician_id = v_issue.reassigned_to_id WHERE id = v_svc.pool_id;
    END IF;

    v_kind  := 'route_' || v_issue.action_taken;
    v_title := CASE v_issue.action_taken
                 WHEN 'notify'     THEN 'Service update from your technician'
                 WHEN 'delay'      THEN 'Your service may be delayed'
                 WHEN 'reschedule' THEN 'Your service has been rescheduled'
                 WHEN 'reassign'   THEN 'A new technician has been assigned'
               END;

    INSERT INTO public.homeowner_notifications
      (homeowner_id, route_issue_id, service_id, kind, title, body, cta_route)
    VALUES
      (v_svc_link.homeowner_id, p_id, v_svc.id, v_kind, v_title,
       COALESCE(NULLIF(btrim(v_issue.message_to_homeowners),''),''),
       '/service/' || v_svc.id::text)
    RETURNING id INTO v_notif_id;

    INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role,
      service_id, homeowner_id, notification_id, summary, details)
    VALUES (p_id, 'notification_sent', v_uid, 'admin',
      v_svc.id, v_svc_link.homeowner_id, v_notif_id,
      format('Homeowner notified: %s', v_title),
      jsonb_build_object('kind', v_kind, 'title', v_title));
  END LOOP;

  -- Notify the technician who submitted
  IF v_issue.reported_by_role = 'technician' THEN
    INSERT INTO public.tech_notifications (
      technician_id, kind, title, body, cta_route, request_id
    ) VALUES (
      v_issue.reported_by_id,
      'route_issue_approved',
      'Route issue approved',
      'Your route issue report has been approved by an admin. Affected homeowners have been notified.',
      '/tech/jobs',
      p_id::text
    );
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.approve_route_issue(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 3. reject_route_issue: admin rejects → no homeowner notifications, notify tech
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_route_issue(p_id uuid, p_reason text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_role_text text;
  v_issue     public.route_issues%ROWTYPE;
BEGIN
  SELECT CASE role WHEN 'admin' THEN 'admin' ELSE NULL END
    INTO v_role_text
    FROM public.profiles WHERE id = v_uid;
  IF v_role_text IS NULL THEN RAISE EXCEPTION 'Admin only'; END IF;

  SELECT * INTO v_issue FROM public.route_issues WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Route issue not found'; END IF;
  IF v_issue.status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Route issue is not pending approval';
  END IF;

  UPDATE public.route_issues
     SET status = 'cancelled', resolved_at = now(), resolved_by_id = v_uid, updated_at = now()
   WHERE id = p_id;

  INSERT INTO public.route_issue_events (route_issue_id, event_type, actor_id, actor_role, summary, details)
  VALUES (p_id, 'status_changed', v_uid, 'admin', 'Route issue rejected by admin',
    jsonb_build_object('from', 'pending_approval', 'to', 'cancelled',
      'reason', COALESCE(p_reason,'')));

  -- Notify the technician of rejection
  IF v_issue.reported_by_role = 'technician' THEN
    INSERT INTO public.tech_notifications (
      technician_id, kind, title, body, cta_route, request_id
    ) VALUES (
      v_issue.reported_by_id,
      'route_issue_rejected',
      'Route issue not approved',
      CASE WHEN p_reason <> ''
           THEN 'Your route issue report was not approved. Reason: ' || p_reason
           ELSE 'Your route issue report was reviewed but not approved by an admin.'
      END,
      '/tech/jobs',
      p_id::text
    );
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.reject_route_issue(uuid, text) TO authenticated;
