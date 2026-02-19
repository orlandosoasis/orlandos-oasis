import { useState, useEffect } from "react";
import { Clock, Bell, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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

interface Step2Props {
  selectedPass: PassOption;
  timeLeft: {minutes: number;seconds: number;};
  vouchersRemaining: number;
  onBack: () => void;
}

const Step2Form = ({ selectedPass, timeLeft, vouchersRemaining, onBack }: Step2Props) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    zipcode: "",
    phone: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    console.log("Step 2 submitted:", { pass: selectedPass.id, ...form });
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
          {selectedPass.hours} Hours of Cleaning for ${selectedPass.discountPrice} – {selectedPass.percentOff}% Off
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
        <Input
          name="firstName"
          placeholder="First Name"
          value={form.firstName}
          onChange={handleChange}
          className="h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary" />

        <Input
          name="lastName"
          placeholder="Last Name"
          value={form.lastName}
          onChange={handleChange}
          className="h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary" />

        <Input
          name="email"
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          className="h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary" />

        <Input
          name="zipcode"
          placeholder="Zipcode"
          value={form.zipcode}
          onChange={handleChange}
          className="h-12 rounded-xl border-[1.5px] border-border bg-background shadow-sm text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:border-primary" />

        <Input
          name="phone"
          type="tel"
          placeholder="Phone Number"
          value={form.phone}
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
          <p className="text-xs text-muted-foreground mb-1">You're Getting</p>
          <div className="flex items-center gap-2.5">
            <p className="text-[15px] font-bold text-foreground">{selectedPass.label}</p>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground border border-border rounded-full px-3 py-1 hover:border-primary hover:text-primary transition-colors">

              ✏️ Edit
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
        onClick={handleSubmit}
        className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg">

        Lock in your discount!
      </Button>
    </div>);

};

/* ──────────────────────────── Main ──────────────────────────── */

const ServicePassSection = () => {
  const [selectedPass, setSelectedPass] = useState<string>("pass-3");
  const [step, setStep] = useState<1 | 2>(1);
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 59 });
  const [vouchersRemaining] = useState(31);

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

  if (step === 2) {
    return (
      <div id="discount-voucher">
        <Step2Form
          selectedPass={selectedPassData}
          timeLeft={timeLeft}
          vouchersRemaining={vouchersRemaining}
          onBack={() => setStep(1)} />

      </div>);

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