import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface PayNowCard {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
}

interface PayNowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  cards: PayNowCard[];
  defaultCardId?: string;
  onSuccess: () => void;
  /** Force the test outcome: success | failed | requires_auth. If undefined, infer from card last4 */
  forcedOutcome?: "success" | "failed" | "requires_auth";
}

const PayNowModal = ({ open, onOpenChange, amount, cards, defaultCardId, onSuccess, forcedOutcome }: PayNowModalProps) => {
  const { toast } = useToast();
  const [selectedCardId, setSelectedCardId] = useState(defaultCardId || cards[0]?.id || "");
  const [processing, setProcessing] = useState(false);
  const [authStep, setAuthStep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  const resolveOutcome = (): "success" | "failed" | "requires_auth" => {
    if (forcedOutcome) return forcedOutcome;
    if (!selectedCard) return "failed";
    // Stripe-like test card mapping by last4
    if (selectedCard.last4 === "0002") return "failed";
    if (selectedCard.last4 === "3155") return "requires_auth";
    return "success";
  };

  const reset = () => {
    setProcessing(false);
    setAuthStep(false);
    setError(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleConfirm = async () => {
    setError(null);
    setProcessing(true);
    const outcome = resolveOutcome();

    await new Promise((r) => setTimeout(r, 700));

    if (outcome === "requires_auth" && !authStep) {
      setProcessing(false);
      setAuthStep(true);
      return;
    }

    if (outcome === "failed") {
      setProcessing(false);
      setError("Your card was declined. Please try a different payment method.");
      toast({ title: "Payment failed", description: "Card declined. Retry scheduled.", variant: "destructive" });
      return;
    }

    setProcessing(false);
    toast({ title: "Payment successful", description: `$${amount.toFixed(2)} charged to ${selectedCard?.brand} •••• ${selectedCard?.last4}`, variant: "success" });
    onSuccess();
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[460px] pt-10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Pay Outstanding Balance</DialogTitle>
          <DialogDescription>Review the amount and confirm your payment method.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="bg-muted/50 border border-border rounded-xl p-5 text-center">
            <p className="text-sm text-muted-foreground">Outstanding Balance</p>
            <p className="text-3xl font-bold text-foreground mt-1">${amount.toFixed(2)}</p>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-[15px] font-semibold text-foreground">Select Payment Method</h3>
            {cards.length === 0 ? (
              <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" /> No payment methods on file. Add one first.
              </div>
            ) : (
              <div className="space-y-2">
                {cards.map((card) => {
                  const isSelected = card.id === selectedCardId;
                  return (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      className={`w-full text-left rounded-xl border-2 p-3.5 transition-all flex items-center justify-between ${
                        isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{card.brand} •••• {card.last4}</p>
                          <p className="text-xs text-muted-foreground">Expires {card.expiry}</p>
                        </div>
                      </div>
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {authStep && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm space-y-2">
              <p className="font-medium text-primary">3D Secure verification</p>
              <p className="text-foreground/80">Your bank requires extra authentication. Confirm to simulate approval.</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">{error}</div>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>Cancel</Button>
            <Button className="flex-1" disabled={!selectedCard || processing} onClick={handleConfirm}>
              {processing ? "Processing…" : authStep ? "Approve & Pay" : `Pay $${amount.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayNowModal;
