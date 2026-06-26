import { useState } from "react";
import TechLayout from "@/components/technician/TechLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { CalendarDays, Plus, Clock, CheckCircle2, XCircle, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import {
  useMyDayOffRequests, useSubmitDayOffRequest, useCancelDayOffRequest,
  useDayOffEvents, type DayOffRequest, type DayOffStatus,
} from "@/hooks/useDayOffRequests";

const STATUS_META: Record<DayOffStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending:   { label: "Pending",   color: "bg-amber-100 text-amber-800",  icon: Clock },
  approved:  { label: "Approved",  color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  denied:    { label: "Denied",    color: "bg-red-100 text-red-800",      icon: XCircle },
  cancelled: { label: "Withdrawn", color: "bg-muted text-muted-foreground", icon: XCircle },
};

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function RequestActivity({ requestId }: { requestId: string }) {
  const { data: events = [] } = useDayOffEvents(requestId);
  if (events.length === 0) return null;
  return (
    <div className="mt-4 pt-4 border-t border-border space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <History className="h-3.5 w-3.5" /> Activity
      </div>
      {events.map(e => (
        <div key={e.id} className="text-xs flex gap-2">
          <span className="text-muted-foreground tabular-nums w-32 shrink-0">{fmtDateTime(e.created_at)}</span>
          <span className="text-foreground">{e.summary}</span>
        </div>
      ))}
    </div>
  );
}

export default function TechTimeOff() {
  const { user } = useAuth();
  const techId = user?.id;
  const { data: requests = [], isLoading } = useMyDayOffRequests(techId);
  const submit = useSubmitDayOffRequest();
  const cancel = useCancelDayOffRequest();

  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const resetForm = () => { setStartDate(""); setEndDate(""); setReason(""); };

  const onSubmit = async () => {
    if (!startDate || !endDate) {
      toast.error("Select a start and end date");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date cannot be before start date");
      return;
    }
    try {
      await submit.mutateAsync({ startDate, endDate, reason });
      toast.success("Day off request submitted");
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onCancel = async (id: string) => {
    try {
      await cancel.mutateAsync(id);
      toast.success("Request withdrawn");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <TechLayout title="Time Off">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Time Off</h1>
          <p className="text-sm text-muted-foreground mt-1">Request and track your day off requests</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Request Day Off
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-6"><div className="text-sm text-muted-foreground">Loading…</div></Card>
      ) : requests.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="No day off requests yet"
            description="Submit a request and a manager will review it. You'll be notified once it's approved or denied."
            actionLabel="Request Day Off"
            onAction={() => setOpen(true)}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r: DayOffRequest) => {
            const meta = STATUS_META[r.status];
            const StatusIcon = meta.icon;
            const expanded = expandedId === r.id;
            return (
              <Card key={r.id} className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-[18px]">
                        {fmt(r.start_date)}{r.start_date !== r.end_date ? ` – ${fmt(r.end_date)}` : ""}
                      </h3>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                        <StatusIcon className="h-3 w-3" /> {meta.label}
                      </span>
                    </div>
                    {r.reason && <p className="text-sm text-muted-foreground">{r.reason}</p>}
                    <p className="text-xs text-muted-foreground mt-2">Submitted {fmtDateTime(r.created_at)}</p>
                    {r.status === "approved" && r.resolution_action && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Action taken: <span className="font-medium text-foreground">{r.resolution_action.replace("_", " ")}</span>
                      </p>
                    )}
                    {r.status === "denied" && r.decision_note && (
                      <p className="text-xs text-muted-foreground mt-1">Reason: {r.decision_note}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setExpandedId(expanded ? null : r.id)}>
                      {expanded ? "Hide" : "View"} activity
                    </Button>
                    {r.status === "pending" && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                        onClick={() => onCancel(r.id)}>
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
                {expanded && <RequestActivity requestId={r.id} />}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="pt-10">
          <DialogHeader>
            <DialogTitle>Request Day Off</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start">Start date</Label>
                <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="end">End date</Label>
                <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea id="reason" placeholder="Personal, family, medical, etc."
                value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSubmit} disabled={submit.isPending}>
              {submit.isPending ? "Submitting…" : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TechLayout>
  );
}
