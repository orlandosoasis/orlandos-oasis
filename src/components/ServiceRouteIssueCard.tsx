import { AlertTriangle, Clock, CalendarClock, UserRoundCog, BellRing } from "lucide-react";
import { useServiceRouteIssue, type RouteIssueRow } from "@/hooks/useRouteIssues";

const ACTION_LABEL: Record<RouteIssueRow["action_taken"], string> = {
  notify: "Service update",
  delay: "Service delayed",
  reschedule: "Service rescheduled",
  reassign: "Technician reassigned",
};

const ICON: Record<RouteIssueRow["action_taken"], any> = {
  notify: BellRing,
  delay: Clock,
  reschedule: CalendarClock,
  reassign: UserRoundCog,
};

const ISSUE_LABEL: Record<RouteIssueRow["issue_type"], string> = {
  sick: "Technician unavailable",
  breakdown: "Vehicle issue",
  late: "Running late",
  other: "Other",
};

const TIME_LABEL: Record<string, string> = {
  morning: "8:00 AM – 12:00 PM",
  afternoon: "12:00 PM – 4:00 PM",
  evening: "4:00 PM – 6:00 PM",
};

const formatTimestamp = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} • ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground text-right">{value}</span>
  </div>
);

const ServiceRouteIssueCard = ({ serviceId }: { serviceId?: string }) => {
  const { data: issue } = useServiceRouteIssue(serviceId);
  if (!issue) return null;

  const Icon = ICON[issue.action_taken] ?? AlertTriangle;
  const isPending = issue.status === "pending_approval";

  return (
    <div className="bg-card rounded-2xl border border-primary/30 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 bg-primary/5 px-6 py-4 border-b border-primary/20">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-bold text-foreground">Issue Updates</h2>
          <p className="text-xs text-muted-foreground">
            {ACTION_LABEL[issue.action_taken]}
            {isPending && " (awaiting approval)"}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-3">
        {issue.message_to_homeowners && (
          <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-lg p-3">
            {issue.message_to_homeowners}
          </p>
        )}

        <Row label="Reason" value={issue.other_text || ISSUE_LABEL[issue.issue_type]} />
        <Row label="Reported by" value={issue.reported_by_role === "admin" ? "Admin team" : "Your technician"} />
        <Row label="Reported" value={formatTimestamp(issue.created_at)} />

        {issue.action_taken === "delay" && issue.delay_minutes && (
          <Row label="Estimated delay" value={`${issue.delay_minutes} min`} />
        )}
        {issue.action_taken === "reschedule" && (
          <>
            {issue.new_service_date && (
              <Row
                label="New date"
                value={new Date(issue.new_service_date + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              />
            )}
            {issue.new_time_window && (
              <Row label="New arrival window" value={TIME_LABEL[issue.new_time_window] ?? issue.new_time_window} />
            )}
          </>
        )}
        {issue.action_taken === "reassign" && (
          <Row label="Status" value="A replacement technician has been assigned to your service." />
        )}

        <Row label="Last updated" value={formatTimestamp(issue.updated_at)} />
      </div>
    </div>
  );
};

export default ServiceRouteIssueCard;
