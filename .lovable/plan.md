# Technician Day-Off Requests

There is no day-off feature yet, so this builds the full workflow end-to-end: tech submits → admin reviews impact → admin approves with a chosen resolution → system applies appointment changes, technician unavailability, notifications, and an audit log. Denials follow the same notification + audit pattern.

## Database (new)

**`technician_unavailability`** — source of truth for "tech is off on date X". Used to block assignment dropdowns.
- `technician_id`, `date`, `reason`, `source` ('day_off_request' | 'manual'), `request_id`.

**`day_off_requests`**
- `technician_id`, `start_date`, `end_date`, `reason` (text), `status` ('pending' | 'approved' | 'denied' | 'cancelled'), `decided_by_id`, `decided_at`, `decision_note`, `resolution_action` ('reassign' | 'unassigned' | 'reschedule' | 'notify_only').

**`day_off_request_events`** — append-only activity log
- `request_id`, `event_type` ('submitted' | 'approved' | 'denied' | 'cancelled' | 'tech_notified' | 'availability_updated' | 'appointments_updated'), `actor_id`, `actor_role`, `summary`, `details` (jsonb), `created_at`.

**`tech_notifications`** — mirrors `homeowner_notifications` for technician in-app alerts
- `technician_id`, `kind`, `title`, `body`, `cta_route`, `request_id`, `read_at`, `dismissed_at`.

All four tables: RLS (tech sees own rows, admin sees all), `GRANT` to authenticated + service_role, added to `supabase_realtime` publication.

## RPCs (SECURITY DEFINER)

- `submit_day_off_request(start_date, end_date, reason)` — tech-only; inserts request + event.
- `preview_day_off_impact(request_id)` — returns `{ affected_services: [...], affected_homeowner_count, dates: [...] }` so the approval modal can show real numbers before confirmation.
- `approve_day_off_request(request_id, action, reassign_to_id?, reschedule_to_date?, message?)` — admin-only:
  1. Status → `approved`, sets `decided_by_id` and `resolution_action`.
  2. Inserts one `technician_unavailability` row per date in the range.
  3. Applies action to every service for that tech in the date range (`scheduled`/`in_progress` only):
     - `reassign` → update `services.technician_id`, also bump `pools.assigned_technician_id` and emit homeowner notification "A new technician has been assigned".
     - `unassigned` → set `services.technician_id = null`, notify homeowner "Your technician is being reassigned".
     - `reschedule` → push `service_date` to `reschedule_to_date` (or next available date), notify homeowner.
     - `notify_only` → leave service untouched, notify homeowner with optional `message`.
  4. Emits a `tech_notifications` row ("Your day off request for {range} has been approved.").
  5. Writes events: `approved`, `availability_updated`, `appointments_updated` (with count), `tech_notified`.
- `deny_day_off_request(request_id, reason?)` — admin-only; status → `denied`, tech notification ("Your day off request … was not approved." + optional reason), events: `denied`, `tech_notified`.
- `cancel_day_off_request(request_id)` — tech can withdraw a pending request.

## Assignment guardrails

Update the existing tech-assignment dropdowns in admin (`useAdminHomeowners`, `useAssignPoolToTech`, the reassign-to picker in `ReportRouteIssueModal`) to filter out technicians who have a `technician_unavailability` row covering the appointment's `service_date`. A helper hook `useUnavailableTechIds(date)` keeps it simple.

## UI

### Technician portal — new page `/tech/time-off`
- Sidebar entry "Time Off".
- "Request Day Off" button → modal with date range + reason.
- List of own requests with status badges, withdraw button on pending, expandable activity log.
- Uses `EmptyState` when no requests.

### Admin dashboard — new "Time Off" tab
- List of all requests with filters Pending / Approved / Denied / All, badges, technician name + dates.
- Row click opens detail page:
  - Request summary (tech, dates, reason, submitted at).
  - **Impact preview** card (from `preview_day_off_impact`): affected appointments table with homeowner, date, current status; affected homeowner count.
  - "Approve" button → confirmation modal with the four resolution options as radio buttons. Reassign reveals a technician picker (filtered by availability). Reschedule reveals a date picker. Notify-only reveals an optional message field. On confirm, calls `approve_day_off_request`.
  - "Deny" button → modal with optional reason, calls `deny_day_off_request`.
  - Activity log section (real-time, fed by `day_off_request_events`).

### Homeowner side
No new screens — the existing `homeowner_notifications` banner + `ServiceRouteIssueCard` already render reassign/reschedule/notify messages. The new RPC writes through that table so updates surface automatically.

### Technician notifications
Lightweight bell/banner in `TechLayout` reading `tech_notifications` with realtime subscription + dismiss. Toast on first arrival.

## Hooks & files

- `src/hooks/useDayOffRequests.ts` — list, submit, approve, deny, cancel, preview impact, events feed.
- `src/hooks/useTechNotifications.ts` — list, dismiss, realtime.
- `src/pages/TechTimeOff.tsx` — tech list view.
- `src/components/admin/TimeOffPage.tsx` + `TimeOffDetail.tsx` — admin views.
- `src/components/admin/ApproveDayOffModal.tsx`, `DenyDayOffModal.tsx`.
- `src/components/technician/TechNotificationBell.tsx`.
- Routing in `App.tsx`, tab plumbing in `AdminDashboard.tsx`, sidebar entry in `TechLayout.tsx`.

## Out of scope (kept explicit)
- Email/push delivery — schema and event hooks are in place but I won't wire Mailgun in this turn unless you confirm. In-app notifications are fully functional.
- Auto-pick of "next available date" for reschedule is a simple `+N days` shift; smarter routing optimization is out of scope.
- No editing of approved requests; admin must deny then re-submit (matches the audit-trail requirement).

Approve and I'll build it in one pass: migration first, then hooks/UI.