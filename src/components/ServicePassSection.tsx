import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Clock, Bell, Check, ArrowLeft, Pencil } from "lucide-react";
import Step4Checkout from "@/components/Step4Checkout";
import Step5Schedule from "@/components/Step5Schedule";
import Step6Confirmation from "@/components/Step6Confirmation";
import StepProgressIndicator from "@/components/StepProgressIndicator";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PassOption {
  id: string;
  hours: number;
  label: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  percentOff: number;
  isMostPopular: boolean;
}

const PASS_OPTIONS: PassOption[] = [
{
  id: "pass-2",
  hours: 2,
  label: "2 Hours of pool service",
  description: "Ideal for a quick touch up",
  originalPrice: 50,
  discountPrice: 9,
  percentOff: 82,
  isMostPopular: false
},
{
  id: "pass-3",
  hours: 3,
  label: "3 Hours of pool service",
  description: "Ideal for standard-sized pools",
  originalPrice: 75,
  discountPrice: 19,
  percentOff: 75,
  isMostPopular: true
},
{
  id: "pass-4",
  hours: 4,
  label: "4 Hours of pool service",
  description: "Ideal for larger pools",
  originalPrice: 100,
  discountPrice: 39,
  percentOff: 61,
  isMostPopular: false
},
{
  id: "pass-6",
  hours: 6,
  label: "6 Hours of pool service",
  description: "Ideal for neglected or extra-large pools",
  originalPrice: 150,
  discountPrice: 79,
  percentOff: 47,
  isMostPopular: false
}];


/* ──────────────────────────── Step 2 ──────────────────────────── */

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  zipcode: string;
  phone: string;
}

interface Step2Props {
  selectedPass: PassOption;
  timeLeft: {minutes: number;seconds: number;};
  vouchersRemaining: number;
  onBack: () => void;
  onChangePass: (passId: string) => void;
  formData: FormData;
  onFormDataChange: (data: FormData) => void;
  onSubmit: () => void;
}

const Step2Form = ({ selectedPass, timeLeft, vouchersRemaining, onBack, onChangePass, formData, onFormDataChange, onSubmit }: Step2Props) => {
  const [editOpen, setEditOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Confirmation Banner */}
      <div className="bg-primary rounded-2xl py-5 px-6 text-center">
        <p className="text-base font-bold text-primary-foreground leading-relaxed">
          Congratulations, you reserved one of our last<br />remaining discount vouchers for…
        </p>
      </div>

      {/* Package Summary */}
      <div className="bg-muted rounded-xl py-3 px-5 text-center">
        <p className="text-[15px] font-bold text-foreground">
          {selectedPass.label} for ${selectedPass.discountPrice} – {selectedPass.percentOff}% Off
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
        <h2 className="text-2xl font-extrabold text-foreground">Enter Your Details</h2>
      </div>

      {/* Form Fields */}
      <div className="space-y-2.5">
        <div className="flex gap-2.5">
          <Input
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            className="h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary" />
          <Input
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            className="h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary" />
        </div>

        <Input
          name="email"
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          className="h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary" />

        <Input
          name="zipcode"
          placeholder="Zipcode"
          value={formData.zipcode}
          onChange={handleChange}
          className="h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary" />

        <Input
          name="phone"
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary" />

      </div>

      {/* Consent */}
      <p className="text-xs text-muted-foreground text-center leading-relaxed px-1">
        <span className="font-semibold text-muted-foreground/80">Get exclusive deals and updates by signing up!</span>{" "}
        By submitting your details, you agree to <span className="font-semibold text-muted-foreground/80">receive our best discounts</span> — via emails, phone calls, and automated SMS and you agree to our{" "}
        <a href="#" className="text-primary hover:underline">Terms</a> and{" "}
        <a href="#" className="text-primary hover:underline">Privacy Policy</a>.{" "}
        <span className="font-semibold text-muted-foreground/80">Opt-out anytime.</span>
      </p>

      {/* Order Summary */}
      <div className="bg-background rounded-xl p-4 px-5 flex items-center justify-between shadow-sm border border-border">
        <div>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest mb-0.5">You're Getting</p>
          <div className="flex items-center gap-2.5">
            <p className="text-[15px] font-bold text-foreground">{selectedPass.label}</p>
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground border border-border rounded-full px-3 py-1 hover:border-primary hover:text-primary transition-colors">
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="text-sm text-muted-foreground line-through">${selectedPass.originalPrice}</span>
            <span className="text-[22px] font-extrabold text-foreground">${selectedPass.discountPrice}</span>
          </div>
          <p className="text-[11px] font-bold text-muted-foreground tracking-wide mt-0.5">
            {selectedPass.percentOff}% OFF
          </p>
        </div>
      </div>

      {/* CTA */}
      <Button
        onClick={onSubmit}
        className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg">
        Lock in your discount!
      </Button>

      {/* Edit Package Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Change Package</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Select your preferred service package</DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={selectedPass.id}
            onValueChange={(val) => {
              onChangePass(val);
              setEditOpen(false);
            }}
            className="space-y-3 mt-2"
          >
            {PASS_OPTIONS.map((pass) => (
              <label
                key={pass.id}
                className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedPass.id === pass.id
                    ? "border-foreground bg-background shadow-sm"
                    : "border-border bg-background hover:border-muted-foreground"
                }`}
              >
                {pass.isMostPopular && (
                  <Badge className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </Badge>
                )}
                <RadioGroupItem
                  value={pass.id}
                  className="h-5 w-5 border-2 border-muted-foreground data-[state=checked]:border-foreground data-[state=checked]:bg-foreground"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-[15px]">{pass.label}</p>
                  <p className="text-sm text-muted-foreground">{pass.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-muted-foreground">
                    <span className="line-through">${pass.originalPrice}</span>{" "}
                    <span className="text-lg font-bold text-foreground">${pass.discountPrice}</span>
                    <span className="text-foreground">*</span>
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    {pass.percentOff}% OFF
                  </p>
                </div>
              </label>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground text-center px-2 mt-1">
            *Vouchers cover the full price of your first pool service. Don't worry - your technician will be paid in full!
          </p>
        </DialogContent>
      </Dialog>
    </div>);

};

/* ──────────────────────────── Step 3 ──────────────────────────── */

interface Step3Props {
  selectedPass: PassOption;
  onChangePass: (passId: string) => void;
  onContinue: () => void;
}

const Step3Membership = ({ selectedPass, onChangePass, onContinue }: Step3Props) => {
  const [editOpen, setEditOpen] = useState(false);
  const hourlyRate = 19;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Banner */}
      <div className="bg-primary rounded-2xl py-5 px-6 text-center">
        <p className="text-base font-bold text-primary-foreground leading-relaxed">
          Congratulations, your first {selectedPass.hours}-hour cleaning will be covered by your{" "}
          <strong>${selectedPass.discountPrice} voucher!</strong> If you like your cleaner...
        </p>
      </div>

      {/* Card */}
      <div className="bg-card rounded-2xl p-7 border border-border">
        <h2 className="text-[22px] font-bold text-foreground text-center leading-snug mb-6" style={{ fontFamily: 'inherit' }}>
          Get unlimited follow-up pool services at your{" "}
           <span className="text-primary">discounted rate of ${hourlyRate}/hr *</span>
          <br />
          <span className="text-primary">— a {selectedPass.percentOff}% savings!</span>
        </h2>

        <p className="text-base font-bold text-foreground tracking-wide mb-4">
          Discount Voucher and Membership Details
        </p>

        <div className="flex flex-col gap-3.5 mb-4">
          {[
            "This discount voucher requires a 6-month Orlando's Oasis membership",
            <>For only $59/month book unlimited pool services at your <strong className="text-foreground">discounted rate of ${hourlyRate}/hr * - saving you {selectedPass.percentOff}% off.</strong></>,
            <>The discount voucher is fully refundable until used. <strong className="text-foreground">Your membership begins after your first cleaning.</strong></>,
            "Cancelling before 6 months results in your first pool service being charged at full price.",
          ].map((text, i) => (
            <div key={i} className="flex gap-3 items-start">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground italic">
          *Last 30-day average price based on your zip code
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Summary */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest mb-0.5">You're Getting</p>
          <div className="flex items-center gap-2.5">
            <p className="text-[15px] font-bold text-foreground">{selectedPass.label}</p>
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground border border-border rounded-full px-3 py-1 hover:border-primary hover:text-primary transition-colors">
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground line-through">${selectedPass.originalPrice}</p>
          <p className="text-[22px] font-extrabold text-foreground">${selectedPass.discountPrice}</p>
          <p className="text-[11px] font-bold text-primary tracking-wide">{selectedPass.percentOff}% OFF</p>
        </div>
      </div>

      {/* CTA */}
      <Button onClick={onContinue} className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg">
        Continue
      </Button>

      {/* Edit Package Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Change Package</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Select your preferred service package</DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={selectedPass.id}
            onValueChange={(val) => {
              onChangePass(val);
              setEditOpen(false);
            }}
            className="space-y-3 mt-2"
          >
            {PASS_OPTIONS.map((pass) => (
              <label
                key={pass.id}
                className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedPass.id === pass.id
                    ? "border-foreground bg-background shadow-sm"
                    : "border-border bg-background hover:border-muted-foreground"
                }`}
              >
                {pass.isMostPopular && (
                  <Badge className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </Badge>
                )}
                <RadioGroupItem
                  value={pass.id}
                  className="h-5 w-5 border-2 border-muted-foreground data-[state=checked]:border-foreground data-[state=checked]:bg-foreground"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-[15px]">{pass.label}</p>
                  <p className="text-sm text-muted-foreground">{pass.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-muted-foreground">
                    <span className="line-through">${pass.originalPrice}</span>{" "}
                    <span className="text-lg font-bold text-foreground">${pass.discountPrice}</span>
                    <span className="text-foreground">*</span>
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    {pass.percentOff}% OFF
                  </p>
                </div>
              </label>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground text-center px-2 mt-1">
            *Vouchers cover the full price of your first pool service. Don't worry - your technician will be paid in full!
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ──────────────────────────── Main ──────────────────────────── */

const ServicePassSection = () => {
  const [selectedPass, setSelectedPass] = useState<string>("pass-3");
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 59 });
  const [vouchersRemaining] = useState(31);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    zipcode: "",
    phone: "",
  });
  const [scheduleData, setScheduleData] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleGetPass = () => {
    setStep(2);
  };

  const selectedPassData = PASS_OPTIONS.find((p) => p.id === selectedPass)!;

  // Render step indicator via portal callback
  const portalTarget = typeof document !== "undefined" ? document.getElementById("step-indicator-portal") : null;
  const stepIndicator = step >= 2 && step <= 5 && portalTarget
    ? createPortal(<StepProgressIndicator currentStep={step} onStepClick={(s) => setStep(s as 1 | 2 | 3 | 4 | 5 | 6)} />, portalTarget)
    : null;

  if (step === 6 && scheduleData) {
    return (
      <div id="discount-voucher">
        <Step6Confirmation
          selectedPass={selectedPassData}
          scheduleData={scheduleData}
        />
      </div>
    );
  }

  if (step === 5) {
    return (
      <>
        {stepIndicator}
        <div id="discount-voucher">
          <Step5Schedule
            selectedPass={selectedPassData}
            onChangePass={setSelectedPass}
            passOptions={PASS_OPTIONS}
            onConfirm={(data) => {
              setScheduleData(data);
              setStep(6);
            }}
          />
        </div>
      </>
    );
  }

  if (step === 4) {
    return (
      <>
        {stepIndicator}
        <div id="discount-voucher">
          <Step4Checkout
            selectedPass={selectedPassData}
            timeLeft={timeLeft}
            email={formData.email}
            onChangePass={setSelectedPass}
            passOptions={PASS_OPTIONS}
            onContinue={() => {
              // Payment success — redirect to dashboard with auto-open booking
              window.location.href = "/dashboard?openBooking=true";
            }}
          />
        </div>
      </>
    );
  }

  if (step === 3) {
    return (
      <>
        {stepIndicator}
        <div id="discount-voucher">
          <Step3Membership
            selectedPass={selectedPassData}
            onChangePass={setSelectedPass}
            onContinue={() => setStep(4)}
          />
        </div>
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        {stepIndicator}
        <div id="discount-voucher">
          <Step2Form
            selectedPass={selectedPassData}
            timeLeft={timeLeft}
            vouchersRemaining={vouchersRemaining}
            onBack={() => setStep(1)}
            onChangePass={setSelectedPass}
            formData={formData}
            onFormDataChange={setFormData}
            onSubmit={() => setStep(3)}
          />
        </div>
      </>
    );
  }

  return (
    <div id="discount-voucher" className="space-y-6">
      {/* Top Assurance Banner */}
      <div className="bg-primary rounded-2xl py-5 px-6 text-center">
        <p className="text-lg font-bold text-primary-foreground leading-tight">
          Limited quantities-lock in your savings now.
        </p>
        <p className="text-lg font-bold text-primary-foreground">
          100% refundable if not used!
        </p>
      </div>

      {/* Scarcity + Time Block */}
      <div className="flex items-center justify-center divide-x divide-border">
        <div className="flex-1 text-center px-4 py-2">
          <Bell className="h-6 w-6 mx-auto mb-2 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm text-foreground">
            Only <span className="font-bold">{vouchersRemaining} Discount Vouchers</span>
          </p>
          <p className="text-sm text-foreground">Remaining</p>
        </div>
        <div className="flex-1 text-center px-4 py-2">
          <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm text-foreground">Time Left</p>
          <p className="text-lg font-semibold text-foreground tabular-nums">
            {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
          </p>
        </div>
      </div>

      {/* Title + Subtitle */}
      <div className="text-center pt-2">
        <h2 className="text-2xl font-bold text-foreground">Get a Discount Voucher</h2>
        <p className="text-muted-foreground mt-2">
          Two, Three, Four, or Six Hours of Pool Service from Orlando's Oasis (Up to 82% Off)
        </p>
      </div>

      {/* Pass Options */}
      <RadioGroup
        value={selectedPass}
        onValueChange={setSelectedPass}
        className="space-y-3">

        {PASS_OPTIONS.map((pass) =>
        <label
          key={pass.id}
          className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
          selectedPass === pass.id ?
          "border-foreground bg-background shadow-sm" :
          "border-border bg-background hover:border-muted-foreground"}`
          }>

            {pass.isMostPopular &&
          <Badge className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                Most Popular
              </Badge>
          }
            
            <RadioGroupItem
            value={pass.id}
            className="h-5 w-5 border-2 border-muted-foreground data-[state=checked]:border-foreground data-[state=checked]:bg-foreground" />

            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-lg">{pass.label}</p>
              <p className="text-sm text-muted-foreground">
                {pass.description}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-muted-foreground">
                <span className="line-through">${pass.originalPrice}</span>{" "}
                <span className="text-xl font-bold text-foreground">${pass.discountPrice}</span>
                <span className="text-foreground">*</span>
              </p>
              <p className="text-sm font-semibold text-muted-foreground uppercase">
                {pass.percentOff}% OFF
              </p>
            </div>
          </label>
        )}
      </RadioGroup>

      {/* Trust Footnote */}
      <p className="text-sm text-muted-foreground text-center px-4">
        *Vouchers cover the full price of your first pool service. Don't worry - your technician will be paid in full!
      </p>

      {/* CTA Button */}
      <Button
        onClick={handleGetPass}
        className="w-full h-14 text-lg font-semibold rounded-full">

        Get your pool cleaned!
      </Button>
    </div>);

};

export default ServicePassSection;