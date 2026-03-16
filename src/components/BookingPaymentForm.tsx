import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreditCard, Lock } from "lucide-react";

interface BookingPaymentFormProps {
  onSubmit: () => void;
  onBack: () => void;
}

const BookingPaymentForm = ({ onSubmit, onBack }: BookingPaymentFormProps) => {
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!card.name.trim()) errs.name = "Required";
    if (!card.number.trim()) errs.number = "Required";
    if (!card.expiry.trim()) errs.expiry = "Required";
    if (!card.cvc.trim()) errs.cvc = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <CreditCard className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Payment Information</h3>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cardName">Name on Card</Label>
        <Input
          id="cardName"
          value={card.name}
          onChange={(e) => setCard({ ...card, name: e.target.value })}
          placeholder="John Doe"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cardNumber">Card Number</Label>
        <Input
          id="cardNumber"
          value={card.number}
          onChange={(e) => setCard({ ...card, number: e.target.value })}
          placeholder="4242 4242 4242 4242"
          maxLength={19}
        />
        {errors.number && <p className="text-xs text-destructive">{errors.number}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="expiry">Expiry</Label>
          <Input
            id="expiry"
            value={card.expiry}
            onChange={(e) => setCard({ ...card, expiry: e.target.value })}
            placeholder="MM/YY"
            maxLength={5}
          />
          {errors.expiry && <p className="text-xs text-destructive">{errors.expiry}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cvc">CVC</Label>
          <Input
            id="cvc"
            value={card.cvc}
            onChange={(e) => setCard({ ...card, cvc: e.target.value })}
            placeholder="123"
            maxLength={4}
          />
          {errors.cvc && <p className="text-xs text-destructive">{errors.cvc}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
        <Lock className="h-3.5 w-3.5" />
        <span>Your payment info is encrypted and secure.</span>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1" disabled={isProcessing}>
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isProcessing}>
          {isProcessing ? "Processing..." : "Pay & Book"}
        </Button>
      </div>
    </form>
  );
};

export default BookingPaymentForm;
