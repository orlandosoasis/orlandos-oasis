import { useState, useEffect } from "react";
import { Clock, Bell, Star, Check } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

export interface VoucherPlan {
  id: string;
  label: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  savings: number;
  isMostPopular: boolean;
}

const VOUCHER_PLANS: VoucherPlan[] = [
{
  id: "weekly",
  label: "Most Popular – Weekly Pool Service",
  description: "Ideal for most residential pools",
  originalPrice: 120,
  discountPrice: 95,
  savings: 25,
  isMostPopular: true
},
{
  id: "twice-weekly",
  label: "Twice-Per-Week Pool Service",
  description: "Best for larger pools or heavy usage",
  originalPrice: 240,
  discountPrice: 215,
  savings: 25,
  isMostPopular: false
},
{
  id: "three-weekly",
  label: "Three-Times-Per-Week Pool Service",
  description: "Ideal for luxury pools or high-traffic pools",
  originalPrice: 360,
  discountPrice: 335,
  savings: 25,
  isMostPopular: false
}];


interface VoucherSelectionStepProps {
  selectedPlanId: string;
  onSelectPlan: (id: string) => void;
}

const VoucherSelectionStep = ({ selectedPlanId, onSelectPlan }: VoucherSelectionStepProps) => {
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 53 });
  const vouchersRemaining = 31;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-primary rounded-2xl p-5 text-center">
        <p className="text-primary-foreground font-semibold text-[15px] leading-snug">
          Limited quantities—lock in your savings now.
        </p>
        <p className="text-primary-foreground font-semibold text-[15px] mt-1">
          100% refundable if not used!
        </p>
      </div>

      {/* Scarcity + Timer */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
          <Bell className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          
          <p className="font-bold text-foreground text-base">
            {vouchersRemaining} Discount Vouchers
          </p>
          <p className="text-sm text-muted-foreground">Remaining</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
          <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Time Left</p>
          <p className="font-bold text-foreground tabular-nums text-lg">
            {String(timeLeft.minutes).padStart(2, "0")}:
            {String(timeLeft.seconds).padStart(2, "0")}
          </p>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Get a Discount Voucher</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose your pool service plan from Orlando's Oasis.
        </p>
        <p className="text-sm font-semibold text-primary mt-1">
          Save $25 on your first month of service
        </p>
      </div>

      {/* Plan Options */}
      <RadioGroup value={selectedPlanId} onValueChange={onSelectPlan} className="space-y-3">
        {VOUCHER_PLANS.map((plan) =>
        <label
          key={plan.id}
          className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
          selectedPlanId === plan.id ?
          "border-primary bg-primary/5 shadow-md" :
          "border-border bg-card hover:border-primary/50"}`
          }>
          
            {plan.isMostPopular &&
          <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-xs">
                Most Popular
              </Badge>
          }
            <RadioGroupItem value={plan.id} className="mt-0.5 shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {plan.isMostPopular && <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />}
                <span className="font-semibold text-foreground text-sm">{plan.label}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm text-muted-foreground line-through">${plan.originalPrice}</p>
              <p className="text-xl font-bold text-foreground">${plan.discountPrice}*</p>
              <p className="text-xs text-muted-foreground">first month*</p>
              <p className="text-xs font-semibold text-primary">Save ${plan.savings}</p>
            </div>

            {selectedPlanId === plan.id &&
          <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
          }
          </label>
        )}
      </RadioGroup>

      {/* Footnote */}
      <p className="text-sm text-muted-foreground text-center px-4">
        *Voucher applies $25 off your first month of weekly pool service.
        <br />
        Don't worry—your technician will still be paid in full!
      </p>
    </div>);

};

export { VOUCHER_PLANS };
export default VoucherSelectionStep;