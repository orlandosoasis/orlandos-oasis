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
                <TableHead className="w-[60px]"></TableHead>
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

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                {ISSUE_TYPE_LABEL[issue.issue_type] ?? issue.issue_type}
              </CardTitle>
              <div className="text-xs text-muted-foreground mt-1">Issue ID · <span className="font-mono">{issue.id.slice(0,8)}</span></div>
            </div>
            <StatusPill status={issue.status} />
          </div>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <InfoRow label="Reported By" value={`${issue.reporter_name ?? "—"} (${issue.reported_by_role})`} />
          <InfoRow label="Technician" value={issue.technician_name ?? "—"} />
          <InfoRow label="Route Date" value={format(new Date(issue.route_date), "MMM d, yyyy")} />
          <InfoRow label="Reported At" value={format(new Date(issue.created_at), "MMM d, yyyy h:mm a")} />
          <InfoRow label="Scope" value={issue.scope === "all" ? "Entire Route (Today)" : "Selected Services"} />
          <InfoRow label="Action Taken" value={ACTION_LABEL[issue.action_taken] ?? issue.action_taken} />
          {issue.action_taken === "delay" && <InfoRow label="Delay" value={`${issue.delay_minutes ?? 0} minutes`} />}
          {issue.action_taken === "reschedule" && (
            <>
              <InfoRow label="New Date" value={issue.new_service_date ? format(new Date(issue.new_service_date), "MMM d, yyyy") : "—"} />
              <InfoRow label="New Window" value={issue.new_time_window ?? "—"} />
            </>
          )}
          {issue.action_taken === "reassign" && (
            <InfoRow label="Reassigned To" value={issue.reassigned_to_name ?? "—"} />
          )}
          <InfoRow label="Affected Homeowners" value={String(issue.affected_homeowner_count)} />
          <InfoRow label="Affected Appointments" value={String(issue.affected_service_count)} />
          {issue.resolved_at && (
            <InfoRow label="Resolved At" value={format(new Date(issue.resolved_at), "MMM d, yyyy h:mm a")} />
          )}
          {issue.message_to_homeowners && (
            <div className="md:col-span-2 mt-2 p-3.5 bg-muted rounded-lg">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Message to Homeowners
              </div>
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{issue.message_to_homeowners}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b"><CardTitle className="text-sm">Affected Appointments</CardTitle></CardHeader>
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
          <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {eventsLoading ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : !events || events.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">No activity recorded yet.</div>
          ) : (
            <ol className="relative border-l border-border ml-2 space-y-5">
              {events.map(ev => (
                <li key={ev.id} className="pl-5 relative">
                  <span className="absolute -left-[9px] top-0.5 h-4 w-4 bg-card border border-border rounded-full flex items-center justify-center">
                    <EventIcon type={ev.event_type} />
                  </span>
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div className="text-sm font-medium text-foreground">{ev.summary}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(ev.created_at), "MMM d, yyyy h:mm:ss a")}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {ev.actor_name ? `By ${ev.actor_name}` : ev.actor_role ? `By ${ev.actor_role}` : ""}
                    {ev.homeowner_name ? ` · Homeowner: ${ev.homeowner_name}` : ""}
                  </div>
                  {ev.details && Object.keys(ev.details).length > 0 && (
                    <pre className="mt-1.5 text-[11px] bg-muted text-muted-foreground rounded p-2 overflow-x-auto leading-relaxed">
{JSON.stringify(ev.details, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border py-1.5">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
    <span className="text-sm text-foreground text-right">{value}</span>
  </div>
);
