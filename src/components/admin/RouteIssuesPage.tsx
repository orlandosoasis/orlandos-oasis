import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle, ChevronLeft, Activity, CalendarClock, UserCheck, Bell,
  CheckCircle2, XCircle, Clock, MapPin, MessageSquare, FileText,
  Users, AlertTriangle, ChevronDown, ChevronRight, Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminRouteIssues, useRouteIssueEvents, useResolveRouteIssue,
  type AdminRouteIssueRow, type RouteIssueEventRow,
} from "@/hooks/useRouteIssues";

const ISSUE_TYPE_LABEL: Record<string, string> = {
  sick: "Technician Sick", breakdown: "Vehicle Breakdown",
  late: "Running Late", other: "Other",
};
const ACTION_LABEL: Record<string, string> = {
  notify: "Notify Only", delay: "Delay Services",
  reschedule: "Reschedule Services", reassign: "Reassign Technician",
};

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active: "bg-blue-50 text-blue-600 border-blue-200",
    pending_approval: "bg-amber-50 text-amber-600 border-amber-200",
    resolved: "bg-emerald-50 text-emerald-600 border-emerald-200",
    cancelled: "bg-muted text-muted-foreground border-border",
  };
  const label: Record<string, string> = {
    active: "Active", pending_approval: "Pending Approval",
    resolved: "Resolved", cancelled: "Cancelled",
  };
  return (
    <Badge variant="outline" className={`${map[status] ?? ""} font-medium`}>
      {label[status] ?? status}
    </Badge>
  );
};

const EventIcon = ({ type }: { type: RouteIssueEventRow["event_type"] }) => {
  const cls = "h-4 w-4";
  switch (type) {
    case "created": return <AlertCircle className={`${cls} text-blue-600`} />;
    case "service_affected": return <MapPin className={`${cls} text-violet-600`} />;
    case "service_updated": return <CalendarClock className={`${cls} text-amber-600`} />;
    case "notification_sent": return <Bell className={`${cls} text-sky-600`} />;
    case "status_changed": return <CheckCircle2 className={`${cls} text-emerald-600`} />;
    case "reschedule_approved": return <UserCheck className={`${cls} text-emerald-600`} />;
    default: return <Activity className={cls} />;
  }
};

export function RouteIssuesListPage({ onOpen }: { onOpen: (id: string) => void }) {
  const { data, isLoading } = useAdminRouteIssues();
  const [tab, setTab] = useState<"all" | "active" | "resolved" | "cancelled">("all");

  const rows = data ?? [];
  const counts = useMemo(() => ({
    all: rows.length,
    active: rows.filter(r => r.status === "active" || r.status === "pending_approval").length,
    resolved: rows.filter(r => r.status === "resolved").length,
    cancelled: rows.filter(r => r.status === "cancelled").length,
  }), [rows]);

  const filtered = rows.filter(r =>
    tab === "all" ? true :
    tab === "active" ? (r.status === "active" || r.status === "pending_approval") :
    r.status === tab
  );

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3">
          <CardTitle className="text-base">Route Issues</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {(["all","active","resolved","cancelled"] as const).map(k => (
              <button key={k} onClick={() => setTab(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${tab === k ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>
                {k.charAt(0).toUpperCase() + k.slice(1)} <span className="ml-1 opacity-70">({counts[k]})</span>
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="No route issues yet"
            description="When a technician or admin submits a route issue report, it will appear here with a full activity log."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Affected</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r.id)}>
                  <TableCell>
                    <div className="font-semibold text-sm">{ISSUE_TYPE_LABEL[r.issue_type] ?? r.issue_type}</div>
                    {r.other_text && <div className="text-xs text-muted-foreground line-clamp-1">{r.other_text}</div>}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{r.reporter_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground capitalize">{r.reported_by_role}</div>
                  </TableCell>
                  <TableCell className="text-sm">{r.technician_name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{ACTION_LABEL[r.action_taken] ?? r.action_taken}</TableCell>
                  <TableCell className="text-sm">
                    {r.affected_homeowner_count} homeowner{r.affected_homeowner_count === 1 ? "" : "s"} · {r.affected_service_count} appt{r.affected_service_count === 1 ? "" : "s"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell><StatusPill status={r.status} /></TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onOpen(r.id); }}>View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function RouteIssueDetailPage({ issueId, onBack }: { issueId: string; onBack: () => void }) {
  const { data: list } = useAdminRouteIssues();
  const issue: AdminRouteIssueRow | undefined = (list ?? []).find(r => r.id === issueId);
  const { data: events, isLoading: eventsLoading } = useRouteIssueEvents(issueId);
  const resolve = useResolveRouteIssue();
  const { toast } = useToast();

  if (!issue) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="h-4 w-4 mr-1" /> Back to Route Issues</Button>
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading route issue…</CardContent></Card>
      </div>
    );
  }

  const isOpen = issue.status === "active" || issue.status === "pending_approval";

  const handleResolve = async (status: "resolved" | "cancelled") => {
    try {
      await resolve.mutateAsync({ id: issue.id, status });
      toast({ title: status === "resolved" ? "Issue resolved" : "Issue cancelled", variant: "success" });
    } catch (e) {
      toast({ title: "Update failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="h-4 w-4 mr-1" /> Back to Route Issues</Button>
        {isOpen && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleResolve("cancelled")} disabled={resolve.isPending}>
              <XCircle className="h-4 w-4 mr-1.5" /> Cancel Issue
            </Button>
            <Button size="sm" onClick={() => handleResolve("resolved")} disabled={resolve.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark Resolved
            </Button>
          </div>
        )}
      </div>

      {/* Incident hero card */}
      <Card className="overflow-hidden border-l-4 border-l-amber-500">
        <CardHeader className="bg-amber-50/40 border-b">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h2 className="text-lg font-semibold text-foreground">
                  {ISSUE_TYPE_LABEL[issue.issue_type] ?? issue.issue_type}
                </h2>
                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                  {ISSUE_TYPE_LABEL[issue.issue_type] ?? issue.issue_type}
                </Badge>
                <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                  {ACTION_LABEL[issue.action_taken] ?? issue.action_taken}
                </Badge>
                <StatusPill status={issue.status} />
              </div>
              <div className="text-sm text-muted-foreground">
                Reported by <span className="font-medium text-foreground">{issue.reporter_name ?? "—"}</span>
                {" · "}
                {format(new Date(issue.created_at), "MMM d, yyyy · h:mm a")}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Technician: {issue.technician_name ?? "—"} · Route Date: {format(new Date(issue.route_date), "MMM d, yyyy")}
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Impact metrics */}
        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border-b">
            <Metric
              icon={<Wrench className="h-4 w-4 text-violet-600" />}
              value={String(issue.affected_service_count)}
              label={`Service${issue.affected_service_count === 1 ? "" : "s"} Affected`}
            />
            <Metric
              icon={<Users className="h-4 w-4 text-sky-600" />}
              value={String(issue.affected_homeowner_count)}
              label={`Homeowner${issue.affected_homeowner_count === 1 ? "" : "s"} Notified`}
            />
            <Metric
              icon={<Clock className="h-4 w-4 text-amber-600" />}
              value={
                issue.action_taken === "delay" ? `${issue.delay_minutes ?? 0} min` :
                issue.action_taken === "reschedule" ? "Rescheduled" :
                issue.action_taken === "reassign" ? "Reassigned" :
                "Notify only"
              }
              label="Action Applied"
            />
          </div>

          {/* Action specifics */}
          {(issue.action_taken === "reschedule" || issue.action_taken === "reassign" || issue.scope !== "all") && (
            <div className="px-5 py-3 bg-muted/30 border-b text-xs text-muted-foreground flex flex-wrap gap-x-5 gap-y-1">
              <span>Scope: <span className="text-foreground font-medium">{issue.scope === "all" ? "Entire Route" : "Selected Services"}</span></span>
              {issue.action_taken === "reschedule" && issue.new_service_date && (
                <span>New date: <span className="text-foreground font-medium">{format(new Date(issue.new_service_date), "MMM d, yyyy")}</span></span>
              )}
              {issue.action_taken === "reschedule" && issue.new_time_window && (
                <span>New window: <span className="text-foreground font-medium">{issue.new_time_window}</span></span>
              )}
              {issue.action_taken === "reassign" && (
                <span>Reassigned to: <span className="text-foreground font-medium">{issue.reassigned_to_name ?? "—"}</span></span>
              )}
              {issue.resolved_at && (
                <span>Resolved: <span className="text-foreground font-medium">{format(new Date(issue.resolved_at), "MMM d, yyyy h:mm a")}</span></span>
              )}
            </div>
          )}

          {issue.message_to_homeowners && (
            <div className="m-5 p-3.5 bg-muted/50 rounded-lg border border-border">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Message Sent to Homeowners
              </div>
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{issue.message_to_homeowners}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" /> Affected Homeowners & Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {issue.affected.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">No appointments linked.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Homeowner</TableHead>
                  <TableHead>Previous Date</TableHead>
                  <TableHead>Previous Window</TableHead>
                  <TableHead>Previous Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issue.affected.map(a => (
                  <TableRow key={a.service_id}>
                    <TableCell className="text-sm font-medium">{a.homeowner_name ?? "—"}</TableCell>
                    <TableCell className="text-sm">{a.previous_service_date ? format(new Date(a.previous_service_date), "MMM d, yyyy") : "—"}</TableCell>
                    <TableCell className="text-sm">{a.previous_time_window ?? "—"}</TableCell>
                    <TableCell className="text-sm capitalize">{a.previous_status ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {eventsLoading ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : !events || events.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">No activity recorded yet.</div>
          ) : (
            <ol className="relative border-l border-border ml-2 space-y-3">
              {events.map(ev => (
                <TimelineItem key={ev.id} event={ev} />
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const Metric = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="px-5 py-4 flex items-center gap-3">
    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">{icon}</div>
    <div>
      <div className="text-xl font-semibold text-foreground leading-tight">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  </div>
);

const EVENT_LABEL: Record<string, string> = {
  created: "Route issue reported",
  service_affected: "Service marked as affected",
  service_updated: "Appointment updated",
  notification_sent: "Notification sent",
  status_changed: "Status changed",
  reschedule_approved: "Reschedule approved",
};

const formatDetailKey = (k: string) =>
  k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const formatDetailValue = (v: unknown): string => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string" || typeof v === "number") return String(v);
  return JSON.stringify(v);
};

const TimelineItem = ({ event: ev }: { event: RouteIssueEventRow }) => {
  const [open, setOpen] = useState(false);
  const hasDetails = ev.details && Object.keys(ev.details).length > 0;
  const label = EVENT_LABEL[ev.event_type] ?? ev.summary;

  return (
    <li className="pl-5 relative">
      <span className="absolute -left-[9px] top-1.5 h-4 w-4 bg-card border border-border rounded-full flex items-center justify-center">
        <EventIcon type={ev.event_type} />
      </span>
      <div className="rounded-lg border border-border bg-card">
        <button
          type="button"
          onClick={() => hasDetails && setOpen(o => !o)}
          className={`w-full flex items-start gap-3 px-3 py-2.5 text-left ${hasDetails ? "hover:bg-muted/50" : "cursor-default"}`}
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground">{label}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(ev.created_at), "MMM d, yyyy · h:mm a")}</span>
              {ev.actor_name && <span>· By {ev.actor_name}</span>}
              {ev.homeowner_name && <span>· Homeowner: {ev.homeowner_name}</span>}
            </div>
          </div>
          {hasDetails && (
            open ? <ChevronDown className="h-4 w-4 text-muted-foreground mt-1" />
                 : <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
          )}
        </button>
        {hasDetails && open && (
          <div className="px-3 pb-3 pt-1 border-t border-dashed border-border">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              {Object.entries(ev.details as Record<string, unknown>).map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-2">
                  <dt className="text-muted-foreground capitalize shrink-0">{formatDetailKey(k)}:</dt>
                  <dd className="text-foreground font-medium break-words">{formatDetailValue(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </li>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border py-1.5">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
    <span className="text-sm text-foreground text-right">{value}</span>
  </div>
);
