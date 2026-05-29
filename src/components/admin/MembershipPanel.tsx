import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscriptionEvents } from "@/hooks/useAdmin";
import { formatEndDate } from "@/hooks/useSubscription";
import type { AdminHomeowner } from "@/types/admin";
import { CalendarX, CheckCircle2, Clock } from "lucide-react";

const StatusPill = ({ status }: { status?: string }) => {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending_cancellation: "bg-amber-50 text-amber-700 border-amber-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };
  const label =
    status === "cancelled" ? "Cancelled"
      : status === "pending_cancellation" ? "Pending Cancellation"
      : "Active";
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status ?? "active"] ?? map.active}`}>
      {label}
    </span>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex py-2.5 border-b border-border last:border-0">
    <span className="w-48 text-xs font-semibold text-muted-foreground shrink-0">{label}</span>
    <span className="text-sm text-foreground font-medium">{value || "—"}</span>
  </div>
);

const fmtDateTime = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
};

const MembershipPanel = ({ homeowner }: { homeowner: AdminHomeowner }) => {
  const { data: events = [], isLoading } = useSubscriptionEvents(homeowner.id);
  const status = homeowner.subscriptionStatus ?? "active";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Membership Status</CardTitle></CardHeader>
        <CardContent>
          <Row label="Current Status" value={<StatusPill status={status} />} />
          <Row label="Plan" value={homeowner.plan} />
          <Row label="Monthly Amount" value={homeowner.monthlyAmount ? `$${homeowner.monthlyAmount}` : "—"} />
          <Row label="Cancellation Date" value={fmtDateTime(homeowner.subscriptionCancelledAt ?? null)} />
          <Row label="Effective End Date" value={homeowner.subscriptionEffectiveEndDate ? formatEndDate(homeowner.subscriptionEffectiveEndDate) : "—"} />
          <Row label="Cancellation Reason" value={homeowner.subscriptionCancellationReason || "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Cancellation History</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-3">Loading history…</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3">No membership changes recorded yet.</p>
          ) : (
            <ol className="space-y-3">
              {events.map((e) => {
                const Icon = e.eventType === "reactivated" ? CheckCircle2 : e.eventType === "pending_cancellation" ? Clock : CalendarX;
                const tone = e.eventType === "reactivated" ? "text-emerald-600" : e.eventType === "pending_cancellation" ? "text-amber-600" : "text-red-600";
                const label = e.eventType === "reactivated" ? "Reactivated" : e.eventType === "pending_cancellation" ? "Cancellation Scheduled" : "Cancelled";
                return (
                  <li key={e.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${tone}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{label}</span>
                        <span className="text-xs text-muted-foreground">{fmtDateTime(e.createdAt)}</span>
                      </div>
                      {e.effectiveEndDate && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Effective end: {formatEndDate(e.effectiveEndDate)}
                        </p>
                      )}
                      {e.reason && (
                        <p className="text-xs text-muted-foreground mt-0.5">Reason: {e.reason}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MembershipPanel;
