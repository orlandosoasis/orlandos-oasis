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
  const [errors, setErrors] = useState<Partial<Record<keyof LandingFormData, string>>>({});
  const [touched, setTouched] = useState(false);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof LandingFormData, string>> = {};
    if (!formData.firstName.trim()) errs.firstName = "First name is required";
    if (!formData.lastName.trim()) errs.lastName = "Last name is required";
    if (!formData.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = "Please enter a valid email";
    if (!formData.phone.trim()) errs.phone = "Phone number is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    setTouched(true);
    if (validate()) {
      onSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({ ...formData, [e.target.name]: e.target.value });
    if (touched) {
      // Clear error for this field on change
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const inputErrorClass = (field: keyof LandingFormData) =>
    errors[field] ? "border-destructive focus-visible:ring-destructive focus-visible:border-destructive" : "";

  const serviceName = selectedPlan.label.replace("Most Popular – ", "");

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Confirmation Banner */}
      <div className="bg-primary rounded-2xl py-5 px-6 text-center">
        <p className="text-base font-bold text-primary-foreground leading-relaxed">
          Congratulations, you reserved one of our last<br />remaining discount cleanings for…
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-card rounded-2xl p-5 px-6 flex items-center justify-between border border-border">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-0.5 font-semibold">You're Getting</p>
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
          <div className="flex-1 space-y-1">
            <Input
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              className={`h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary ${inputErrorClass("firstName")}`}
            />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="flex-1 space-y-1">
            <Input
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              className={`h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary ${inputErrorClass("lastName")}`}
            />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
          </div>
        </div>
        <div className="space-y-1">
          <Input
            name="email"
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className={`h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary ${inputErrorClass("email")}`}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1">
          <Input
            name="phone"
            type="tel"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            className={`h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary ${inputErrorClass("phone")}`}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
      </div>


      {/* Consent */}
      <p className="text-xs text-muted-foreground text-center leading-relaxed px-1">
        <span className="font-semibold text-muted-foreground/80">Get exclusive deals and updates by signing up!</span>{" "}
        By submitting your details, you agree to <span className="font-semibold text-muted-foreground/80">receive our best discounts</span> via emails, phone calls, and automated SMS and you agree to our{" "}
        <a href="/terms" className="text-primary hover:underline">Terms</a> and{" "}
        <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.{" "}
        <span className="font-semibold text-muted-foreground/80">Opt-out anytime.</span>
      </p>


      {/* CTA */}
      <Button
        onClick={handleSubmit}
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
              const isSelected = selectedPlan.id === plan.id;
              return (
                <label
                  key={plan.id}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  {plan.isMostPopular && (
                    <Badge className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                      Most Popular
                    </Badge>
                  )}
                  <RadioGroupItem
                    value={plan.id}
                    className="h-5 w-5 border-2 border-muted-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>{name}</p>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground line-through">${plan.originalPrice}</p>
                    <p className={`text-lg font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>${plan.discountPrice}</p>
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
