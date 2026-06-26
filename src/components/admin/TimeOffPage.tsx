import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CalendarClock, ChevronLeft, Users, Calendar, Clock, CheckCircle2, XCircle, History } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import {
  useAllDayOffRequests, useDayOffRequest, useDayOffEvents, useDayOffImpact,
  useApproveDayOffRequest, useDenyDayOffRequest, useUnavailableTechIds,
  type DayOffRequest, type DayOffStatus, type DayOffAction,
} from "@/hooks/useDayOffRequests";
import { useAdminTechnicians } from "@/hooks/useAdmin";

type Filter = "pending" | "approved" | "denied" | "all";

const STATUS_META: Record<DayOffStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending:   { label: "Pending",   color: "bg-amber-100 text-amber-800",     icon: Clock },
  approved:  { label: "Approved",  color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  denied:    { label: "Denied",    color: "bg-red-100 text-red-800",         icon: XCircle },
  cancelled: { label: "Withdrawn", color: "bg-muted text-muted-foreground",  icon: XCircle },
};

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// ─────────────── List ───────────────
function TimeOffList({ onOpen }: { onOpen: (id: string) => void }) {
  const { data: requests = [], isLoading } = useAllDayOffRequests();
  const [filter, setFilter] = useState<Filter>("pending");

  const counts = useMemo(() => ({
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    denied: requests.filter(r => r.status === "denied").length,
    all: requests.length,
  }), [requests]);

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter(r => r.status === filter);
  }, [requests, filter]);

  const tabs: { key: Filter; label: string }[] = [
    { key: "pending", label: `Pending (${counts.pending})` },
    { key: "approved", label: `Approved (${counts.approved})` },
    { key: "denied", label: `Denied (${counts.denied})` },
    { key: "all", label: `All (${counts.all})` },
  ];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">Time Off Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and act on technician day-off requests.</p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filter === t.key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card className="p-6"><div className="text-sm text-muted-foreground">Loading…</div></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarClock} title="No requests in this view"
            description="Day-off requests from technicians will appear here." />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const meta = STATUS_META[r.status];
            const StatusIcon = meta.icon;
            return (
              <Card key={r.id} className="p-4 cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => onOpen(r.id)}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{r.technician_name}</h3>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                        <StatusIcon className="h-3 w-3" /> {meta.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {fmt(r.start_date)}{r.start_date !== r.end_date ? ` – ${fmt(r.end_date)}` : ""}
                    </p>
                    {r.reason && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.reason}</p>}
                  </div>
                  <div className="text-xs text-muted-foreground">{fmtDateTime(r.created_at)}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────── Approve Modal ───────────────
function ApproveModal({
  open, onOpenChange, request,
}: { open: boolean; onOpenChange: (v: boolean) => void; request: DayOffRequest }) {
  const [action, setAction] = useState<DayOffAction>("reassign");
  const [reassignTo, setReassignTo] = useState<string>("");
  const [rescheduleTo, setRescheduleTo] = useState<string>("");
  const [message, setMessage] = useState("");
  const { data: techs = [] } = useAdminTechnicians();
  // Filter out the requesting technician and any tech unavailable on the start date.
  const { data: unavailable } = useUnavailableTechIds(request.start_date);
  const eligibleTechs = useMemo(
    () => techs.filter(t => t.id !== request.technician_id && !(unavailable?.has(t.id))),
    [techs, request.technician_id, unavailable],
  );

  const approve = useApproveDayOffRequest();

  const submit = async () => {
    if (action === "reassign" && !reassignTo) { toast.error("Choose a technician"); return; }
    if (action === "reschedule" && !rescheduleTo) { toast.error("Choose a new service date"); return; }
    try {
      await approve.mutateAsync({
        id: request.id, action,
        reassignTo: action === "reassign" ? reassignTo : null,
        rescheduleTo: action === "reschedule" ? rescheduleTo : null,
        message,
      });
      toast.success("Request approved");
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const options: { value: DayOffAction; label: string; desc: string }[] = [
    { value: "reassign",   label: "Reassign technician",       desc: "Assign affected appointments to another technician." },
    { value: "unassigned", label: "Leave appointments unassigned", desc: "Clear the technician; an admin can re-assign later." },
    { value: "reschedule", label: "Reschedule services",       desc: "Move all affected appointments to a new date." },
    { value: "notify_only",label: "Notify homeowners only",    desc: "Send homeowners a heads-up without changing appointments." },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pt-10 max-w-lg">
        <DialogHeader>
          <DialogTitle>Approve Day Off Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose how affected appointments should be handled. The technician will be marked unavailable
            from {fmt(request.start_date)} to {fmt(request.end_date)}.
          </p>
          <RadioGroup value={action} onValueChange={(v) => setAction(v as DayOffAction)} className="space-y-2">
            {options.map(opt => (
              <label key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  action === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}>
                <RadioGroupItem value={opt.value} className="mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </div>
              </label>
            ))}
          </RadioGroup>

          {action === "reassign" && (
            <div>
              <Label>Assign to technician</Label>
              <Select value={reassignTo} onValueChange={setReassignTo}>
                <SelectTrigger><SelectValue placeholder="Select a technician" /></SelectTrigger>
                <SelectContent>
                  {eligibleTechs.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No available technicians for these dates.</div>
                  )}
                  {eligibleTechs.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name || t.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {action === "reschedule" && (
            <div>
              <Label htmlFor="rsdate">New service date</Label>
              <Input id="rsdate" type="date" value={rescheduleTo} onChange={(e) => setRescheduleTo(e.target.value)} />
            </div>
          )}

          <div>
            <Label htmlFor="msg">Message to homeowners (optional)</Label>
            <Textarea id="msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional note included in the homeowner notification." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={approve.isPending}>
            {approve.isPending ? "Approving…" : "Confirm Approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────── Deny Modal ───────────────
function DenyModal({
  open, onOpenChange, request,
}: { open: boolean; onOpenChange: (v: boolean) => void; request: DayOffRequest }) {
  const [reason, setReason] = useState("");
  const deny = useDenyDayOffRequest();
  const submit = async () => {
    try {
      await deny.mutateAsync({ id: request.id, reason });
      toast.success("Request denied");
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pt-10">
        <DialogHeader><DialogTitle>Deny Day Off Request</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The technician will be notified that their request for {fmt(request.start_date)}
            {request.start_date !== request.end_date ? ` – ${fmt(request.end_date)}` : ""} was not approved.
          </p>
          <div>
            <Label htmlFor="dreason">Reason (optional)</Label>
            <Textarea id="dreason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Coverage unavailable during the requested dates." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={deny.isPending}>
            {deny.isPending ? "Denying…" : "Confirm Denial"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────── Detail ───────────────
function TimeOffDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data: request, isLoading } = useDayOffRequest(id);
  const { data: events = [] } = useDayOffEvents(id);
  const { data: impact } = useDayOffImpact(id);
  const [approveOpen, setApproveOpen] = useState(false);
  const [denyOpen, setDenyOpen] = useState(false);

  if (isLoading || !request) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="p-6"><div className="text-sm text-muted-foreground">Loading…</div></Card>
      </div>
    );
  }

  const meta = STATUS_META[request.status];
  const StatusIcon = meta.icon;
  const canAct = request.status === "pending";

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1">
        <ChevronLeft className="h-4 w-4" /> Back to requests
      </Button>

      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{request.technician_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {fmt(request.start_date)}{request.start_date !== request.end_date ? ` – ${fmt(request.end_date)}` : ""}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
          <StatusIcon className="h-3.5 w-3.5" /> {meta.label}
        </span>
      </div>

      <Card className="p-5 mb-4 space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Reason</Label>
          <p className="text-sm text-foreground">{request.reason || "—"}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">Submitted</Label>
            <p>{fmtDateTime(request.created_at)}</p>
          </div>
          {request.decided_at && (
            <div>
              <Label className="text-xs text-muted-foreground">Decided</Label>
              <p>{fmtDateTime(request.decided_at)}</p>
            </div>
          )}
        </div>
        {request.decision_note && (
          <div>
            <Label className="text-xs text-muted-foreground">Note</Label>
            <p className="text-sm">{request.decision_note}</p>
          </div>
        )}
      </Card>

      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4" /> Impact preview
          </h2>
          {impact && (
            <div className="text-xs text-muted-foreground">
              {impact.affected_services.length} appointment(s) · {impact.affected_homeowner_count} homeowner(s) · {impact.days} day(s)
            </div>
          )}
        </div>
        {impact && impact.affected_services.length === 0 ? (
          <p className="text-xs text-muted-foreground">No scheduled appointments fall within these dates.</p>
        ) : (
          <div className="space-y-2">
            {impact?.affected_services.map(s => (
              <div key={s.service_id} className="flex items-center justify-between gap-2 text-xs border-b border-border pb-2 last:border-0 last:pb-0">
                <div>
                  <div className="font-medium text-foreground">{s.homeowner_name}</div>
                  <div className="text-muted-foreground">{s.address || "—"}</div>
                </div>
                <div className="text-right">
                  <div className="text-foreground">{fmt(s.service_date)}</div>
                  <div className="text-muted-foreground">{s.service_type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {canAct && (
        <Card className="p-5 mb-4 flex gap-2">
          <Button onClick={() => setApproveOpen(true)} className="flex-1">Approve</Button>
          <Button variant="outline" onClick={() => setDenyOpen(true)} className="flex-1 text-destructive hover:text-destructive">Deny</Button>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <History className="h-4 w-4" /> Activity Log
        </h2>
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map(e => (
              <div key={e.id} className="text-xs flex gap-3 border-l-2 border-border pl-3 py-1">
                <span className="text-muted-foreground tabular-nums w-32 shrink-0">{fmtDateTime(e.created_at)}</span>
                <div>
                  <div className="text-foreground">{e.summary}</div>
                  {e.actor_name && <div className="text-muted-foreground mt-0.5">by {e.actor_name}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {canAct && <ApproveModal open={approveOpen} onOpenChange={setApproveOpen} request={request} />}
      {canAct && <DenyModal open={denyOpen} onOpenChange={setDenyOpen} request={request} />}
    </div>
  );
}

// ─────────────── Root component used by AdminDashboard ───────────────
export default function TimeOffPage({
  detailId, onOpen, onBack,
}: { detailId: string | null; onOpen: (id: string) => void; onBack: () => void }) {
  if (detailId) return <TimeOffDetail id={detailId} onBack={onBack} />;
  return <TimeOffList onOpen={onOpen} />;
}
