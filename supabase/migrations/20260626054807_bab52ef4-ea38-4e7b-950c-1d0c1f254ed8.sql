
-- Extend homeowner_notifications for issue notifications and read state
ALTER TABLE public.homeowner_notifications
  ADD COLUMN IF NOT EXISTS issue_id uuid REFERENCES public.issues(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

ALTER TABLE public.homeowner_notifications DROP CONSTRAINT IF EXISTS homeowner_notifications_kind_check;
ALTER TABLE public.homeowner_notifications ADD CONSTRAINT homeowner_notifications_kind_check
  CHECK (kind = ANY (ARRAY[
    'route_notify','route_delay','route_reschedule','route_reassign',
    'issue_submitted','issue_in_progress','issue_assigned','issue_resolved'
  ]));

CREATE INDEX IF NOT EXISTS homeowner_notifications_unread_idx
  ON public.homeowner_notifications (homeowner_id, read_at, created_at DESC);

-- Trigger: create homeowner notifications on issue events
CREATE OR REPLACE FUNCTION public.handle_issue_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cta text;
  v_label text;
  v_tech_name text;
BEGIN
  v_cta := CASE WHEN NEW.service_id IS NOT NULL
                THEN '/service/' || NEW.service_id::text
                ELSE '/dashboard' END;
  v_label := COALESCE(NULLIF(btrim(NEW.type), ''), 'service');

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.homeowner_notifications
      (homeowner_id, issue_id, service_id, kind, title, body, cta_route)
    VALUES (NEW.homeowner_id, NEW.id, NEW.service_id, 'issue_submitted',
      'Issue submitted',
      format('We''ve received your %s report and our team will review it shortly.', v_label),
      v_cta);
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'in_progress' THEN
      INSERT INTO public.homeowner_notifications
        (homeowner_id, issue_id, service_id, kind, title, body, cta_route)
      VALUES (NEW.homeowner_id, NEW.id, NEW.service_id, 'issue_in_progress',
        'Issue in progress',
        format('Your %s issue is currently being reviewed.', v_label),
        v_cta);
    ELSIF NEW.status = 'resolved' THEN
      INSERT INTO public.homeowner_notifications
        (homeowner_id, issue_id, service_id, kind, title, body, cta_route)
      VALUES (NEW.homeowner_id, NEW.id, NEW.service_id, 'issue_resolved',
        'Issue resolved',
        format('Your %s issue has been resolved. Tap to view the resolution details.', v_label),
        v_cta);
    END IF;
  END IF;

  IF NEW.assigned_technician_id IS DISTINCT FROM OLD.assigned_technician_id
     AND NEW.assigned_technician_id IS NOT NULL THEN
    SELECT COALESCE(full_name, email, 'A technician')
      INTO v_tech_name FROM public.profiles WHERE id = NEW.assigned_technician_id;
    INSERT INTO public.homeowner_notifications
      (homeowner_id, issue_id, service_id, kind, title, body, cta_route)
    VALUES (NEW.homeowner_id, NEW.id, NEW.service_id, 'issue_assigned',
      'Technician assigned',
      format('%s has been assigned to your issue.', COALESCE(v_tech_name, 'A technician')),
      v_cta);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS issues_notify_homeowner ON public.issues;
CREATE TRIGGER issues_notify_homeowner
AFTER INSERT OR UPDATE ON public.issues
FOR EACH ROW EXECUTE FUNCTION public.handle_issue_notification();

-- RPCs for read state
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.homeowner_notifications
     SET read_at = COALESCE(read_at, now())
   WHERE id = p_id AND homeowner_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.homeowner_notifications
     SET read_at = now()
   WHERE homeowner_id = auth.uid() AND read_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
