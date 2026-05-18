import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface CancelBreakdown {
  servicesCompleted: number;
  serviceCharges: number;
  addOnsCharges: number;
  penalty: number;
}

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  breakdown: CancelBreakdown;
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

/**
 * Simplified single-screen cancel flow.
 *
 * Previously this was a 3-step retention "fight" (review charges -> ask
 * reason + force consent -> confirm charge). Multi-step cancellation flows
 * are increasingly classified as dark patterns (California AB-2863, FTC
 * click-to-cancel rule) and they erode trust. Pattern now:
 *
 * 1. Show the user exactly what they're about to be charged.
 * 2. Single optional "tell us why" picker (NOT required).
 * 3. One button to cancel. One button to keep.
 *
 * No coerced consent checkbox. No staged steps. Cancellation is the
 * primary action; staying is the secondary one.
 */
const CancelSubscriptionModal = ({ open, onOpenChange, breakdown, onConfirmed }: CancelSubscriptionModalProps) => {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const total = breakdown.serviceCharges + breakdown.addOnsCharges + breakdown.penalty;

  const reset = () => {
    setReason("");
    setProcessing(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleCancel = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      // TODO(payments): when Lovable Payments is wired, charge the breakdown
      // total here and only finalize cancellation after the charge succeeds.
      await new Promise((r) => setTimeout(r, 800));
      // TODO(feedback): persist `reason` to a cancellation_feedback table
      // so the team can review churn reasons.
      toast({
        title: "Subscription cancelled",
        description: total > 0
          ? `Final charge of $${total.toFixed(2)} processed.`
          : "Your membership has been cancelled.",
        variant: "success",
      });
      onConfirmed();
      handleClose(false);
    } catch (err: any) {
      toast({
        title: "Cancellation failed",
        description: err?.message ?? "Please try again or contact support.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[520px] pt-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mx-auto mb-2">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">Cancel subscription</DialogTitle>
          <DialogDescription className="text-center">
            We're sorry to see you go. Here's exactly what will happen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* What you'll be charged */}
          {total > 0 ? (
            <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Final charge
              </p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Services completed this cycle</span>
                <span className="font-medium text-foreground">{breakdown.servicesCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service charges</span>
                <span className="font-medium text-foreground">${breakdown.serviceCharges.toFixed(2)}</span>
              </div>
              {breakdown.addOnsCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Add-ons used</span>
                  <span className="font-medium text-foreground">${breakdown.addOnsCharges.toFixed(2)}</span>
                </div>
              )}
              {breakdown.penalty > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Early cancellation fee</span>
                  <span className="font-medium text-destructive">${breakdown.penalty.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base pt-1">
                <span className="font-semibold text-foreground">Total today</span>
                <span className="font-bold text-foreground">${total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Charged to your default payment method on file.
              </p>
            </div>
          ) : (
            <div className="bg-muted/50 border border-border rounded-xl p-4 text-center text-sm text-muted-foreground">
              No charges due. Your membership ends today.
            </div>
          )}

          {/* Optional reason picker */}
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

          {/* Actions: cancel is primary action, keep is secondary */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => handleClose(false)} disabled={processing}>
              Keep my plan
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
              disabled={processing}
            >
              {processing
                ? "Cancelling..."
                : total > 0
                ? `Cancel and pay $${total.toFixed(2)}`
                : "Cancel my subscription"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CancelSubscriptionModal;
