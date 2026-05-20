import { useState } from "react";
import { Clock, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { VoucherPlan } from "@/components/dashboard/VoucherSelectionStep";
import type { ServiceConfig } from "@/components/ServiceConfigStep";
import { getMonthlyPrice, getDiscountPrice } from "@/components/ServiceConfigStep";

export interface LandingFormData {
  firstName: string;
  lastName: string;
  email: string;
  zipcode: string;
  phone: string;
  frequency: string;
}

const POOL_SIZE_LABELS: Record<string, string> = {
  small: "Small Pool",
  medium: "Medium Pool",
  large: "Large Pool",
};

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  "twice-weekly": "Twice per week",
  "three-weekly": "Three times per week",
};

interface LandingContactStepProps {
  selectedPlan: VoucherPlan;
  serviceConfig: ServiceConfig;
  timeLeft: { minutes: number; seconds: number };
  formData: LandingFormData;
  onFormDataChange: (data: LandingFormData) => void;
  onSubmit: () => void;
  onChangePlan: (planId?: string) => void;
}

const LandingContactStep = ({
  selectedPlan,
  serviceConfig,
  timeLeft,
  formData,
  onFormDataChange,
  onSubmit,
  onChangePlan,
}: LandingContactStepProps) => {
  const [errors, setErrors] = useState<Partial<Record<keyof LandingFormData, string>>>({});
  const [touched, setTouched] = useState(false);

  const monthlyPrice = getMonthlyPrice(serviceConfig);
  const discountPrice = getDiscountPrice(serviceConfig);

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
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const inputErrorClass = (field: keyof LandingFormData) =>
    errors[field] ? "border-destructive focus-visible:border-destructive" : "";

  return (
    <div className="space-y-5 animate-fade-in">

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

      {/* Order Summary with pool size & frequency details */}
      <div className="bg-card rounded-2xl p-5 px-6 border border-border">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">Your Plan</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Pool Size:</span>
                <span className="text-sm font-semibold text-foreground">{POOL_SIZE_LABELS[serviceConfig.poolSize]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Frequency:</span>
                <span className="text-sm font-semibold text-foreground">{FREQUENCY_LABELS[serviceConfig.frequency]}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="text-sm text-muted-foreground line-through">${monthlyPrice}</span>
              <span className="font-extrabold text-foreground text-lg">${discountPrice}</span>
            </div>
            <p className="text-[11px] font-bold text-primary tracking-wide mt-0.5">$25 OFF</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Then ${monthlyPrice}/mo after first month</p>
          <button
            onClick={() => onChangePlan()}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground border border-border rounded-full px-3 py-1 hover:border-primary hover:text-primary transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        </div>
      </div>

      {/* Heading */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-0.5">Enter Your Name & Email</h3>
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
              className={`rounded-lg text-[15px] placeholder:text-muted-foreground/60 ${inputErrorClass("firstName")}`}
            />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="flex-1 space-y-1">
            <Input
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              className={`rounded-lg text-[15px] placeholder:text-muted-foreground/60 ${inputErrorClass("lastName")}`}
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
            className={`rounded-lg text-[15px] placeholder:text-muted-foreground/60 ${inputErrorClass("email")}`}
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
            className={`rounded-lg text-[15px] placeholder:text-muted-foreground/60 ${inputErrorClass("phone")}`}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
      </div>

      {/* Consent */}
      <p className="text-xs text-muted-foreground text-center leading-relaxed px-1">
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
    </div>
  );
};

export default LandingContactStep;
