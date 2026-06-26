
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
      v_kind := 'route_reassign';
      v_title := 'A new technician has been assigned';
    ELSIF p_action = 'unassigned' THEN
      UPDATE public.services SET technician_id = NULL WHERE id = v_svc.id;
      v_kind := 'route_reassign';
      v_title := 'Your technician is being reassigned';
    ELSIF p_action = 'reschedule' THEN
      UPDATE public.services SET service_date = p_reschedule_to WHERE id = v_svc.id;
      v_kind := 'route_reschedule';
      v_title := 'Your service has been rescheduled';
    ELSE
      v_kind := 'route_notify';
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

  INSERT INTO public.tech_notifications (technician_id, kind, title, body, cta_route, request_id)
  VALUES (v_req.technician_id, 'day_off_approved',
    format('Your day off request for %s to %s has been approved.', v_req.start_date, v_req.end_date),
    COALESCE(NULLIF(btrim(p_message),''),''),
    '/tech/time-off', p_id);

  INSERT INTO public.day_off_request_events (request_id, event_type, actor_id, actor_role, summary)
  VALUES (p_id, 'tech_notified', v_uid, 'admin', 'Technician notified of approval');

  RETURN p_id;
END $$;
