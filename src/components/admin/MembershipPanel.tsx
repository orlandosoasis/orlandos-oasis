import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSubscriptionEvents } from "@/hooks/useAdmin";
import { formatEndDate } from "@/hooks/useSubscription";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AdminHomeowner } from "@/types/admin";
import { CalendarX, CheckCircle2, Clock, RefreshCw, AlertTriangle, XCircle } from "lucide-react";

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

function useAdminReactivate(homeownerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_cancelled_at: null,
          subscription_effective_end_date: null,
          subscription_cancellation_reason: null,
        })
        .eq("id", homeownerId);
      if (error) throw error;
      await supabase.from("subscription_events").insert({
        homeowner_id: homeownerId,
        event_type: "reactivated",
        reason: "Reactivated by admin",
        effective_end_date: null,
        status_after: "active",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-homeowners"] });
      qc.invalidateQueries({ queryKey: ["subscription-events", homeownerId] });
    },
  });
}

function useAdminCancelAccount(homeownerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reason: string) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_status: "cancelled",
          subscription_cancelled_at: now,
          subscription_effective_end_date: now,
          subscription_cancellation_reason: reason,
        })
        .eq("id", homeownerId);
      if (error) throw error;
      await supabase.from("subscription_events").insert({
        homeowner_id: homeownerId,
        event_type: "cancelled",
        reason,
        effective_end_date: now,
        status_after: "cancelled",
      });
      // Notify the homeowner
      await supabase.from("homeowner_notifications").insert({
        homeowner_id: homeownerId,
        kind: "account_cancelled",
        title: "Your account has been cancelled",
        body: "Your Orlando's Oasis account has been cancelled by an administrator. Please contact support if you have questions.",
        cta_route: "/settings",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-homeowners"] });
      qc.invalidateQueries({ queryKey: ["subscription-events", homeownerId] });
    },
  });
}

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  homeowner: AdminHomeowner;
  onConfirm: (reason: string) => Promise<void>;
  isPending: boolean;
}

function CancelAccountDialog({ open, onOpenChange, homeowner, onConfirm, isPending }: CancelDialogProps) {
  const [step, setStep] = useState<"check-balance" | "confirm">("check-balance");
  const [outstandingAmount, setOutstandingAmount] = useState("");
  const [balanceCollected, setBalanceCollected] = useState(false);
  const [reason, setReason] = useState("");

  const hasBalance = parseFloat(outstandingAmount) > 0;

  const handleClose = (v: boolean) => {
    if (!v) {
      setStep("check-balance");
      setOutstandingAmount("");
      setBalanceCollected(false);
      setReason("");
    }
    onOpenChange(v);
  };

  const handleNext = () => {
    if (hasBalance && !balanceCollected) return;
    setStep("confirm");
  };

  const handleConfirm = async () => {
    const fullReason = [
      reason.trim() || "Cancelled by admin",
      hasBalance ? `Outstanding balance of $${parseFloat(outstandingAmount).toFixed(2)} collected before cancellation.` : "",
    ].filter(Boolean).join(" — ");
    await onConfirm(fullReason);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Cancel Account — {homeowner.name}
          </DialogTitle>
        </DialogHeader>

        {step === "check-balance" && (
          <div className="space-y-4 py-1">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Before cancelling, confirm any outstanding balance has been collected. Account cancellation is immediate and cannot be undone without admin action.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Outstanding Balance ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={outstandingAmount}
                onChange={(e) => {
                  setOutstandingAmount(e.target.value);
                  setBalanceCollected(false);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter any amount owed. Leave as 0 if account is fully paid up.
              </p>
            </div>

            {hasBalance && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm font-semibold text-destructive mb-2">
                  Outstanding: ${parseFloat(outstandingAmount).toFixed(2)}
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={balanceCollected}
                    onChange={(e) => setBalanceCollected(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-foreground">
                    I confirm that the outstanding balance of <strong>${parseFloat(outstandingAmount).toFixed(2)}</strong> has been collected from the customer.
                  </span>
                </label>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleNext}
                disabled={hasBalance && !balanceCollected}
              >
                Continue
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-sm">Cancellation Reason</Label>
              <Textarea
                rows={3}
                placeholder="Reason for cancellation…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="resize-none"
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1">
              <p><span className="font-semibold">Account:</span> {homeowner.name}</p>
              <p><span className="font-semibold">Plan:</span> {homeowner.plan || "—"}</p>
              {hasBalance && (
                <p className="text-emerald-700 font-semibold">
                  ✓ Balance of ${parseFloat(outstandingAmount).toFixed(2)} confirmed collected
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              This will immediately cancel the account and notify the homeowner. The account can be reactivated later by an admin.
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("check-balance")} disabled={isPending}>
                Back
              </Button>
              <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
                {isPending ? "Cancelling…" : "Confirm Cancellation"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const MembershipPanel = ({ homeowner }: { homeowner: AdminHomeowner }) => {
  const { data: events = [], isLoading } = useSubscriptionEvents(homeowner.id);
  const { toast } = useToast();
  const reactivate = useAdminReactivate(homeowner.id);
  const cancelAccount = useAdminCancelAccount(homeowner.id);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const status = homeowner.subscriptionStatus ?? "active";

  const handleCancel = async (reason: string) => {
    try {
      await cancelAccount.mutateAsync(reason);
      toast({ title: "Account cancelled", description: `${homeowner.name}'s account has been cancelled.`, variant: "destructive" });
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : "Please try again.";
      toast({ title: "Cancellation failed", description: m, variant: "destructive" });
      throw err;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm">Membership Status</CardTitle>
          <div className="flex items-center gap-2">
            {(status === "cancelled" || status === "pending_cancellation") && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                disabled={reactivate.isPending}
                onClick={async () => {
                  try {
                    await reactivate.mutateAsync();
                    toast({ title: "Subscription reactivated", description: `${homeowner.name}'s plan is active again.`, variant: "success" });
                  } catch (err: unknown) {
                    const m = err instanceof Error ? err.message : "Please try again.";
                    toast({ title: "Reactivation failed", description: m, variant: "destructive" });
                  }
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {reactivate.isPending ? "Reactivating…" : "Reactivate"}
              </Button>
            )}
            {status === "active" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel Account
              </Button>
            )}
          </div>
        </CardHeader>
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

      <CancelAccountDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        homeowner={homeowner}
        onConfirm={handleCancel}
        isPending={cancelAccount.isPending}
      />
    </div>
  );
};

export default MembershipPanel;
