import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBooking } from "@/contexts/BookingContext";
import { useToast } from "@/hooks/use-toast";
import BackLink from "@/components/BackLink";
import {
  ManagePlanForm,
  type MembershipConfig,
  type PoolSize,
  type ServiceFrequency,
  type ServicePlan,
  getFrequencyLabel,
  getPoolSizeLabel,
  getMembershipMonthlyPrice,
} from "@/components/ManageMembershipModal";
import CancelMembershipModal from "@/components/CancelMembershipModal";
import { useToast as _ } from "@/hooks/use-toast";

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const MEMBERSHIP_STORAGE_KEY = "oo_membership_config";

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

const ManagePlan = () => {
  const navigate = useNavigate();
  const { booking, checkoutData } = useBooking();
  const { toast } = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);

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

  const handleSaved = (next: MembershipConfig, _plan: ServicePlan) => {
    try {
      localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("oo:membership-updated"));
    } catch {
      // ignore
    }
    navigate(-1);
  };

  return (
    <>
      <main className="max-w-[760px] mx-auto px-5 py-6 pb-16">
        <BackLink to="/account-settings/payment-methods" label="Back to billing" />

        <header className="mt-4 mb-6 space-y-1.5">
          <h1 className="text-2xl font-bold text-foreground">Manage Plan</h1>
          <p className="text-sm text-muted-foreground">
            Update your service. Changes apply next billing cycle.
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

          <ManagePlanForm
            hideHeader
            nextServiceDate={nextDateStr}
            current={current}
            onCancel={() => navigate(-1)}
            onCancelMembership={() => setCancelOpen(true)}
            onSaved={handleSaved}
          />
        </section>

        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <Link to="/terms" className="text-primary hover:underline">Terms</Link>
          <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
          <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
        </footer>
      </main>

      <CancelMembershipModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        nextServiceDate={nextDateStr}
        onConfirm={() => {
          setCancelOpen(false);
          toast({
            title: "Subscription cancelled",
            description: "Your recurring service will no longer renew.",
            variant: "success",
          });
          navigate(-1);
        }}
      />
    </>
  );
};

export default ManagePlan;
