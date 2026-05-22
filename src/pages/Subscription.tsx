import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useBooking } from "@/contexts/BookingContext";
import { useToast } from "@/hooks/use-toast";
import ManageMembershipModal from "@/components/ManageMembershipModal";
import CancelSubscriptionModal from "@/components/CancelSubscriptionModal";
import { useSubscription, useReactivateSubscription, formatEndDate } from "@/hooks/useSubscription";

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Subscription = () => {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const { toast } = useToast();
  const [manageOpen, setManageOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: subscription } = useSubscription();
  const reactivate = useReactivateSubscription();
  const status = subscription?.status ?? "active";
  const isCancelled = status === "cancelled" || status === "pending_cancellation";

  const isMonthly = booking?.frequency === "monthly";
  const d = booking?.scheduleData?.selectedDate || new Date();

  const planName = booking?.selectedPass?.label || booking?.selectedPlan?.label || "Pool Care Membership";

  const nextBilling = useMemo(() => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return next;
  }, [d]);
  const nextDateStr = `${FULL_DAYS[nextBilling.getDay()]}, ${SHORT_MONTHS[nextBilling.getMonth()]} ${nextBilling.getDate()}, ${nextBilling.getFullYear()}`;
  const effectiveEndIso = useMemo(() => {
    const end = new Date(nextBilling);
    end.setDate(end.getDate() - 1);
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  }, [nextBilling]);

  const handleReactivate = async () => {
    try {
      await reactivate.mutateAsync();
      toast({ title: "Subscription reactivated", description: "Your plan is active again.", variant: "success" });
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : "Please try again.";
      toast({ title: "Couldn't reactivate", description: m, variant: "destructive" });
    }
  };

  const statusLabel =
    status === "cancelled" ? "Cancelled" : status === "pending_cancellation" ? "Pending cancellation" : "Active";
  const statusClass =
    status === "cancelled" ? "text-destructive" : status === "pending_cancellation" ? "text-amber-700" : "text-primary";

  return (
    <>
      <main className="max-w-[760px] mx-auto px-5 py-8 pb-16 space-y-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">Subscription</h1>

        {isMonthly ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 space-y-3">
              <h2 className="text-[17px] font-bold text-foreground">Membership Status</h2>

              {isCancelled && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-sm space-y-1">
                  <p className="font-semibold text-destructive">
                    {status === "pending_cancellation" ? "Cancellation scheduled" : "Subscription cancelled"}
                  </p>
                  <p className="text-destructive/80">
                    {status === "pending_cancellation"
                      ? `You keep service through ${formatEndDate(subscription?.effectiveEndDate ?? null)}. No future visits will be scheduled after that date.`
                      : `Ended on ${formatEndDate(subscription?.effectiveEndDate ?? null)}.`}
                  </p>
                  {subscription?.cancellationReason && (
                    <p className="text-xs text-muted-foreground pt-1">Reason: {subscription.cancellationReason}</p>
                  )}
                </div>
              )}

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium text-foreground">{planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${statusClass}`}>{statusLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Cycle</span>
                  <span className="font-medium text-foreground">Monthly</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isCancelled ? "Access ends" : "Next Billing Date"}
                  </span>
                  <span className="font-medium text-foreground">
                    {isCancelled ? formatEndDate(subscription?.effectiveEndDate ?? null) : nextDateStr}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auto-renew</span>
                  <span className="font-medium text-foreground">{isCancelled ? "No" : "Yes"}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="p-6 space-y-3">
              {isCancelled ? (
                <Button className="w-full" onClick={handleReactivate} disabled={reactivate.isPending}>
                  {reactivate.isPending ? "Reactivating…" : "Reactivate plan"}
                </Button>
              ) : (
                <>
                  <Button className="w-full" onClick={() => setManageOpen(true)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Manage Plan
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground hover:border-transparent"
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel Subscription
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active subscription found.</p>
            <Button className="mt-4" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        )}

        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <Link to="/terms" className="text-primary hover:underline">Terms</Link>
          <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
          <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
        </footer>
      </main>

      <ManageMembershipModal
        open={manageOpen}
        onOpenChange={setManageOpen}
        nextServiceDate={nextDateStr}
        current={{
          poolSize: (booking?.pool?.poolSize as "small" | "medium" | "large") || "small",
          frequency:
            booking?.frequency === "monthly"
              ? "weekly"
              : ((booking?.frequency as "weekly" | "twice-weekly" | "three-weekly") || "weekly"),
          activeAddonIds: booking?.scheduleData?.addons?.map((a) => a.id) || [],
        }}
        onCancelled={() => setCancelOpen(true)}
        onSaved={() => {}}
      />

      <CancelSubscriptionModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        effectiveEndDate={effectiveEndIso}
        onConfirmed={() =>
          toast({
            title: "Subscription cancelled",
            description: "Your recurring service will no longer renew.",
            variant: "success",
          })
        }
      />
    </>
  );
};

export default Subscription;
