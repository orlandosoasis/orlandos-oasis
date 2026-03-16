import { useState } from "react";
import { Clock, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { VoucherPlan } from "@/components/dashboard/VoucherSelectionStep";
import { VOUCHER_PLANS } from "@/components/dashboard/VoucherSelectionStep";

export interface LandingFormData {
  firstName: string;
  lastName: string;
  email: string;
  zipcode: string;
  phone: string;
  frequency: string;
}

interface LandingContactStepProps {
  selectedPlan: VoucherPlan;
  timeLeft: { minutes: number; seconds: number };
  formData: LandingFormData;
  onFormDataChange: (data: LandingFormData) => void;
  onSubmit: () => void;
  onChangePlan: (planId: string) => void;
}

const FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "biweekly", label: "Every 2 weeks", isMostPopular: true },
  { value: "weekly", label: "Weekly" },
  { value: "once", label: "One-time" },
];

const LandingContactStep = ({
  selectedPlan,
  timeLeft,
  formData,
  onFormDataChange,
  onSubmit,
  onChangePlan,
}: LandingContactStepProps) => {
  const [editOpen, setEditOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({ ...formData, [e.target.name]: e.target.value });
  };

  const serviceName = selectedPlan.label.replace("Most Popular – ", "");

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Confirmation Banner */}
      <div className="bg-primary rounded-2xl py-5 px-6 text-center">
        <p className="text-base font-bold text-primary-foreground leading-relaxed">
          Congratulations, you reserved one of our last<br />remaining discount cleanings for…
        </p>
      </div>

      {/* Package Summary */}
      <div className="bg-muted rounded-xl py-3 px-5 text-center">
        <p className="text-[15px] font-bold text-foreground">
          {serviceName} for ${selectedPlan.discountPrice} – {Math.round(((selectedPlan.originalPrice - selectedPlan.discountPrice) / selectedPlan.originalPrice) * 100)}% off!
        </p>
      </div>

      {/* Hold Notice */}
      <div className="flex items-center justify-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.8} />
        <p className="text-sm text-muted-foreground">
          We'll hold it for you for the next
        </p>
        <span className="text-sm font-bold text-foreground tabular-nums ml-0.5">
          {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>

      {/* Heading */}
      <div>
        <h2 className="text-2xl font-extrabold text-foreground">Enter Your Name & Email</h2>
      </div>

      {/* Form Fields */}
      <div className="space-y-2.5">
        <div className="flex gap-2.5">
          <Input
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            className="h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary"
          />
          <Input
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            className="h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary"
          />
        </div>
        <Input
          name="email"
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          className="h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary"
        />
        <Input
          name="zipcode"
          placeholder="Zipcode"
          value={formData.zipcode}
          onChange={handleChange}
          className="h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary"
        />
        <Input
          name="phone"
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary"
        />
      </div>


      {/* Consent */}
      <p className="text-xs text-muted-foreground text-center leading-relaxed px-1">
        <span className="font-semibold text-muted-foreground/80">Get exclusive deals and updates by signing up!</span>{" "}
        By submitting your details, you agree to <span className="font-semibold text-muted-foreground/80">receive our best discounts</span> — via emails, phone calls, and automated SMS and you agree to our{" "}
        <a href="/terms" className="text-primary hover:underline">Terms</a> and{" "}
        <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.{" "}
        <span className="font-semibold text-muted-foreground/80">Opt-out anytime.</span>
      </p>

      {/* Order Summary */}
      <div className="bg-background rounded-xl p-4 px-5 flex items-center justify-between shadow-sm border border-border">
        <div>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest mb-0.5">You're Getting</p>
          <div className="flex items-center gap-2.5">
            <p className="text-[15px] font-bold text-foreground">{serviceName}</p>
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground border border-border rounded-full px-3 py-1 hover:border-primary hover:text-primary transition-colors"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="text-sm text-muted-foreground line-through">${selectedPlan.originalPrice}</span>
            <span className="text-[22px] font-extrabold text-foreground">${selectedPlan.discountPrice}</span>
          </div>
          <p className="text-[11px] font-bold text-muted-foreground tracking-wide mt-0.5">
            {Math.round(((selectedPlan.originalPrice - selectedPlan.discountPrice) / selectedPlan.originalPrice) * 100)}% OFF
          </p>
        </div>
      </div>

      {/* CTA */}
      <Button
        onClick={onSubmit}
        className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg"
      >
        Lock in your discount!
      </Button>

      {/* Edit Package Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Change Plan</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Select your preferred service plan</DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={selectedPlan.id}
            onValueChange={(val) => {
              onChangePlan(val);
              setEditOpen(false);
            }}
            className="space-y-3 mt-2"
          >
            {VOUCHER_PLANS.map((plan) => {
              const name = plan.label.replace("Most Popular – ", "");
              const pctOff = Math.round(((plan.originalPrice - plan.discountPrice) / plan.originalPrice) * 100);
              return (
                <label
                  key={plan.id}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedPlan.id === plan.id
                      ? "border-foreground bg-background shadow-sm"
                      : "border-border bg-background hover:border-muted-foreground"
                  }`}
                >
                  {plan.isMostPopular && (
                    <Badge className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                      Most Popular
                    </Badge>
                  )}
                  <RadioGroupItem
                    value={plan.id}
                    className="h-5 w-5 border-2 border-muted-foreground data-[state=checked]:border-foreground data-[state=checked]:bg-foreground"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground line-through">${plan.originalPrice}</p>
                    <p className="text-lg font-bold text-foreground">${plan.discountPrice}</p>
                    <p className="text-xs font-semibold text-primary">Save ${plan.savings}</p>
                  </div>
                </label>
              );
            })}
          </RadioGroup>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingContactStep;
