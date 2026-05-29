import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";
import { useToast } from "@/hooks/use-toast";
import BackLink from "@/components/BackLink";
import { Button } from "@/components/ui/button";
import {
  type MembershipConfig,
  type PoolSize,
  type ServiceFrequency,
  getFrequencyLabel,
  getPoolSizeLabel,
  getMembershipMonthlyPrice,
} from "@/components/ManageMembershipModal";
import { MEMBERSHIP_STORAGE_KEY } from "./ManagePlan";

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
  const { booking, checkoutData } = useBooking();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const current: MembershipConfig = useMemo(() => {
    const stored = readStoredMembership();
    if (stored) return stored;
    return {
      poolSize: toMembershipPoolSize(checkoutData?.poolSize ?? booking?.pool?.poolSize),
      frequency: toMembershipFrequency(checkoutData?.frequency || booking?.frequency),
      activeAddonIds: booking?.scheduleData?.addons?.map((a) => a.id) ?? ["tile-cleaning", "pool-inspections"],
    };
  }, [booking, checkoutData]);

  const d = booking?.scheduleData?.selectedDate || new Date();
  const nextBilling = useMemo(() => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return next;
  }, [d]);
  const nextDateStr = `${FULL_DAYS[nextBilling.getDay()]}, ${SHORT_MONTHS[nextBilling.getMonth()]} ${nextBilling.getDate()}, ${nextBilling.getFullYear()}`;
  const currentMonthlyTotal = getMembershipMonthlyPrice(current);

  const handleConfirm = () => {
    setSubmitting(true);
    toast({
      title: "Membership cancelled",
      description: "Your recurring pool service has been cancelled.",
      variant: "success",
    });
    setTimeout(() => navigate("/account-settings/payment-methods"), 200);
  };

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
        <div className="px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-[13px] text-muted-foreground">
                {getFrequencyLabel(current.frequency)} Pool Service · {getPoolSizeLabel(current.poolSize)}
              </p>
              <p className="text-[11px] text-muted-foreground">Renews {nextDateStr}</p>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              ${currentMonthlyTotal}
              <span className="text-sm font-medium text-muted-foreground">/mo</span>
            </p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">You will lose your scheduled service</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                You will no longer receive recurring pool services after your current billing period ends.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-muted/40 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Your plan will remain active until{" "}
              <span className="font-medium text-foreground">{nextDateStr}</span>.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">What happens next</p>
            <ul className="space-y-1.5 text-[13px] text-muted-foreground list-disc pl-5">
              <li>Future services after {nextDateStr} will be cancelled.</li>
              <li>You will not be charged again after the current period.</li>
              <li>You can resubscribe anytime from your account settings.</li>
            </ul>
          </div>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-3">
          <Button className="w-full" onClick={() => navigate(-1)} disabled={submitting}>
            Keep My Plan
          </Button>
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground hover:border-transparent"
            onClick={handleConfirm}
            disabled={submitting}
          >
            Yes, Cancel Membership
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
