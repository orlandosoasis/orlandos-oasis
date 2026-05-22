import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarX, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCancelSubscription, formatEndDate } from "@/hooks/useSubscription";

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Last day the homeowner has access — typically the end of the current billing cycle. ISO date (YYYY-MM-DD). */
  effectiveEndDate: string;
  /** Optional: shown on the review step so the user knows what they've used this cycle. */
  cycleSummary?: {
    servicesCompleted: number;
    upcomingCancelled: number;
  };
  onConfirmed: () => void;
}

const REASONS = [
  "Too expensive",
  "Moving / selling property",
  "Service quality concerns",
  "Switching providers",
  "Pausing temporarily",
  "Other",
];

type Step = "review" | "confirm" | "success";

/**
 * Two-step cancellation:
 *   1. review – Explain what will happen. Effective end date prominent. Reason chips below summary.
 *      Destructive CTA is secondary ("Continue to cancel") until confirm step.
 *   2. confirm – Final, explicit destructive action with loading state.
 *   3. success – Confirmation with end date.
 *
 * Backend: hits the cancel_subscription RPC which marks the profile and
 * cancels future scheduled services in a single transaction.
 */
const CancelSubscriptionModal = ({
  open,
  onOpenChange,
  effectiveEndDate,
  cycleSummary,
  onConfirmed,
}: CancelSubscriptionModalProps) => {
  const { toast } = useToast();
  const cancel = useCancelSubscription();

  const [step, setStep] = useState<Step>("review");
  const [reason, setReason] = useState("");

  const endDateLong = useMemo(() => formatEndDate(effectiveEndDate), [effectiveEndDate]);

  // Reset state every time the modal opens.
  useEffect(() => {
    if (open) {
      setStep("review");
      setReason("");
    }
  }, [open]);

  const handleClose = (next: boolean) => {
    if (cancel.isPending) return;
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    try {
      await cancel.mutateAsync({ reason, effectiveEndDate });
      setStep("success");
      onConfirmed();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try again or contact support.";
      toast({ title: "Cancellation failed", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[520px] pt-10 max-h-[90vh] overflow-y-auto">
        {step === "review" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Cancel subscription</DialogTitle>
              <DialogDescription>
                Review what will happen before we cancel your recurring pool service.
              </DialogDescription>
            </DialogHeader>

            {/* Prominent effective end date */}
            <div className="mt-2 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <CalendarX className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    You keep service until
                  </p>
                  <p className="text-lg font-bold text-foreground leading-tight mt-1">{endDateLong}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your plan remains active through this date. Cancellation takes effect the day after.
                  </p>
                </div>
              </div>
            </div>

            {/* What happens list */}
            <ul className="space-y-2 text-sm mt-1">
              <Bullet>Future recurring services stop renewing.</Bullet>
              <Bullet>Already completed visits remain billed as normal.</Bullet>
              <Bullet>Upcoming visits after {endDateLong} are cancelled automatically.</Bullet>
              <Bullet>Your assigned technician is notified.</Bullet>
            </ul>

            {cycleSummary && (cycleSummary.servicesCompleted > 0 || cycleSummary.upcomingCancelled > 0) && (
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Visits completed this cycle</span>
                  <span className="font-medium tabular-nums">{cycleSummary.servicesCompleted}</span>
                </div>
                {cycleSummary.upcomingCancelled > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Future visits to be cancelled</span>
                    <span className="font-medium tabular-nums">{cycleSummary.upcomingCancelled}</span>
                  </div>
                )}
              </div>
            )}

            <Separator className="my-2" />

            {/* Reason picker — below the primary summary */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">
                Reason for cancelling{" "}
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </legend>
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
            </fieldset>

            {/* Destructive CTA is secondary at this stage */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setStep("confirm")}
              >
                Continue to cancel
              </Button>
              <Button className="flex-1" onClick={() => handleClose(false)}>
                Keep my plan
              </Button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Are you sure?</DialogTitle>
              <DialogDescription>
                Your subscription will be cancelled effective <span className="font-medium text-foreground">{endDateLong}</span>.
                This will stop future renewals and cancel all visits after that date.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("review")}
                disabled={cancel.isPending}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleConfirm}
                disabled={cancel.isPending}
              >
                {cancel.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
                    Cancelling…
                  </>
                ) : (
                  "Yes, cancel subscription"
                )}
              </Button>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-50 mx-auto mb-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden />
              </div>
              <DialogTitle className="text-center text-xl font-bold">Subscription cancelled</DialogTitle>
              <DialogDescription className="text-center">
                You'll keep service through <span className="font-medium text-foreground">{endDateLong}</span>.
                We've notified your technician and cancelled future visits.
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full mt-4" onClick={() => handleClose(false)}>
              Done
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2">
    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden />
    <span className="text-foreground/90">{children}</span>
  </li>
);

export default CancelSubscriptionModal;
