import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
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

const CancelSubscriptionModal = ({ open, onOpenChange, breakdown, onConfirmed }: CancelSubscriptionModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reason, setReason] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);

  const total = breakdown.serviceCharges + breakdown.addOnsCharges + breakdown.penalty;

  const reset = () => {
    setStep(1);
    setReason("");
    setAgreed(false);
    setProcessing(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleCharge = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 800));
    setProcessing(false);
    toast({
      title: "Subscription cancelled",
      description: total > 0 ? `Final charge of $${total.toFixed(2)} processed.` : "Your membership has been cancelled.",
      variant: "success",
    });
    onConfirmed();
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[520px] pt-10">
        <DialogHeader>
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mx-auto mb-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">Cancel Subscription</DialogTitle>
          <DialogDescription className="text-center">
            {step === 1 && "Review the final charges before cancelling."}
            {step === 2 && "Help us improve — tell us why you're leaving."}
            {step === 3 && "Confirm your final payment to complete cancellation."}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1 — Breakdown */}
        {step === 1 && (
          <div className="space-y-4 mt-2">
            <div className="bg-muted/50 border border-border rounded-xl p-5 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Services completed this cycle</span>
                <span className="font-medium text-foreground">{breakdown.servicesCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service charges</span>
                <span className="font-medium text-foreground">${breakdown.serviceCharges.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Add-ons used</span>
                <span className="font-medium text-foreground">${breakdown.addOnsCharges.toFixed(2)}</span>
              </div>
              {breakdown.penalty > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Early cancellation fee</span>
                  <span className="font-medium text-destructive">${breakdown.penalty.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-semibold text-foreground">Total due today</span>
                <span className="font-bold text-foreground">${total.toFixed(2)}</span>
              </div>
            </div>
            {breakdown.servicesCompleted === 0 && (
              <p className="text-xs text-muted-foreground text-center">Minimum of one service charge applies even if no services were completed.</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>Keep My Plan</Button>
              <Button className="flex-1 gap-2" onClick={() => setStep(2)}>Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 2 — Reason */}
        {step === 2 && (
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <p className="text-[15px] font-semibold text-foreground">Reason for cancelling</p>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`w-full text-left rounded-xl border-2 px-4 py-3 text-sm transition-all ${
                      reason === r ? "border-primary bg-primary/5 text-foreground" : "border-border bg-card hover:border-primary/40 text-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
              <span className="text-foreground">I understand my recurring service will end and ${total.toFixed(2)} will be charged today.</span>
            </label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button className="flex-1 gap-2" disabled={!reason || !agreed} onClick={() => setStep(3)}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Charge */}
        {step === 3 && (
          <div className="space-y-4 mt-2">
            <div className="bg-muted/50 border border-border rounded-xl p-5 text-center">
              <p className="text-sm text-muted-foreground">Final charge</p>
              <p className="text-3xl font-bold text-foreground mt-1">${total.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">Charged to your default payment method on file.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(2)} disabled={processing}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground hover:border-transparent"
                onClick={handleCharge}
                disabled={processing}
              >
                {processing ? "Processing…" : "Charge & Cancel"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CancelSubscriptionModal;
