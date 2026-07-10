import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BackLink from "@/components/BackLink";
import { Button } from "@/components/ui/button";
import { useCancelSubscription, useSubscription, formatEndDate } from "@/hooks/useSubscription";
import {
  type MembershipConfig,
  type PoolSize,
  type ServiceFrequency,
  getFrequencyLabel,
  getPoolSizeLabel,
  getMembershipMonthlyPrice,
} from "@/components/ManageMembershipModal";
import { useAddons } from "@/components/AddonsStep";
import { MEMBERSHIP_STORAGE_KEY } from "./ManagePlan";

const REASONS = [
  "Too expensive",
  "Moving / selling property",
  "Service quality concerns",
  "Switching providers",
  "Pausing temporarily",
  "Other",
];

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toMembershipFrequency = (f?: string): ServiceFrequency => {
  if (f === "twice-weekly" || f === "three-weekly") return f;
  return "weekly";
};
const toMembershipPoolSize = (s?: string): PoolSize => {
  if (s === "medium" || s === "large") return s;
  return "small";
};

function readStoredMembership(): MembershipConfig | null {
  try {
    const raw = localStorage.getItem(MEMBERSHIP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MembershipConfig;
    if (!parsed?.poolSize || !parsed?.frequency || !Array.isArray(parsed?.activeAddonIds)) return null;
    return parsed;
  } catch {
    return null;
  }
}

const CancelPlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const cancel = useCancelSubscription();
  const { data: subscription } = useSubscription();
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const current: MembershipConfig = useMemo(() => {
    const stored = readStoredMembership();
    if (stored) return stored;
    return {
      poolSize: toMembershipPoolSize(undefined),
      frequency: toMembershipFrequency(undefined),
      activeAddonIds: [],
    };
  }, []);

  // Effective end = last day of current billing cycle (end of next-month period - 1 day)
  const effectiveEndIso = useMemo(() => {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    next.setDate(next.getDate() - 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
  }, []);

  const endDateFormatted = useMemo(() => {
    const d = new Date(effectiveEndIso + "T00:00:00");
    return `${FULL_DAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }, [effectiveEndIso]);

  const allAddons = useAddons();
  const currentMonthlyTotal = getMembershipMonthlyPrice(current, allAddons);
  const alreadyCancelled = subscription?.status === "cancelled" || subscription?.status === "pending_cancellation";

  const handleConfirm = async () => {
    try {
      await cancel.mutateAsync({ reason, effectiveEndDate: effectiveEndIso });
      setConfirmed(true);
      toast({
        title: "Membership cancelled",
        description: `You keep service through ${endDateFormatted}. Your technician has been notified.`,
        variant: "success",
      });
      setTimeout(() => navigate("/account-settings/payment-methods"), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try again or contact support.";
      toast({ title: "Cancellation failed", description: message, variant: "destructive" });
    }
  };

  if (alreadyCancelled) {
    return (
      <main className="max-w-[760px] mx-auto px-5 py-6 pb-16">
        <BackLink to="/account-settings/payment-methods" label="Back to billing" />
        <header className="mt-4 mb-6 space-y-1.5">
          <h1 className="text-2xl font-bold text-foreground">Cancel Plan</h1>
        </header>
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {subscription?.status === "pending_cancellation" ? "Cancellation already scheduled" : "Subscription already cancelled"}
              </p>
              <p className="text-[13px] text-muted-foreground mt-1">
                {subscription?.effectiveEndDate
                  ? `Your service ends on ${formatEndDate(subscription.effectiveEndDate)}.`
                  : "No further action is needed."}
              </p>
            </div>
          </div>
          <Button className="w-full" onClick={() => navigate("/account-settings/payment-methods")}>
            Back to Billing
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[760px] mx-auto px-5 py-6 pb-16">
      <BackLink to="/account-settings/manage-plan" label="Back to plan" />

      <header className="mt-4 mb-6 space-y-1.5">
        <h1 className="text-2xl font-bold text-foreground">Cancel Plan</h1>
        <p className="text-sm text-muted-foreground">
          Review your current membership before cancelling.
        </p>
      </header>

      <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Current plan summary */}
        <div className="px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-[13px] text-muted-foreground">
                {getFrequencyLabel(current.frequency)} Pool Service · {getPoolSizeLabel(current.poolSize)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Service ends {endDateFormatted}
              </p>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              ${currentMonthlyTotal}
              <span className="text-sm font-medium text-muted-foreground">/mo</span>
            </p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* Warning */}
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">You will lose your scheduled service</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                You will no longer receive recurring pool services after your current billing period ends on{" "}
                <span className="font-medium text-foreground">{endDateFormatted}</span>.
              </p>
            </div>
          </div>

          {/* What happens */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">What happens next</p>
            <ul className="space-y-1.5 text-[13px] text-muted-foreground list-disc pl-5">
              <li>Future services after {endDateFormatted} will be cancelled.</li>
              <li>You will not be charged again after the current period.</li>
              <li>Your assigned technician will be notified.</li>
              <li>You can reactivate anytime from your billing settings.</li>
            </ul>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Reason for cancelling{" "}
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(reason === r ? "" : r)}
                  aria-pressed={reason === r}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                    reason === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-3">
          <Button className="w-full" onClick={() => navigate(-1)} disabled={cancel.isPending || confirmed}>
            Keep My Plan
          </Button>
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground hover:border-transparent"
            onClick={handleConfirm}
            disabled={cancel.isPending || confirmed}
          >
            {cancel.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cancelling…</>
            ) : (
              "Yes, Cancel Membership"
            )}
          </Button>
        </div>
      </section>

      <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
        <Link to="/terms" className="text-primary hover:underline">Terms</Link>
        <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
        <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
      </footer>
    </main>
  );
};

export default CancelPlan;
