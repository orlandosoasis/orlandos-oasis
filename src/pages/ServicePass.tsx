import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Ticket, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PassOption {
  id: string;
  label: string;
  durationMinutes: number;
  description: string;
  originalPriceCents: number;
  discountPriceCents: number;
  percentOff: number;
  isMostPopular: boolean;
}

const PASS_OPTIONS: PassOption[] = [
  {
    id: "pass-30",
    label: "30-Min Chemical Check",
    durationMinutes: 30,
    description: "Ideal for balancing pH + chlorine",
    originalPriceCents: 4900,
    discountPriceCents: 2900,
    percentOff: 41,
    isMostPopular: false,
  },
  {
    id: "pass-60",
    label: "60-Min Standard Pool Service",
    durationMinutes: 60,
    description: "Skim, brush, empty baskets, quick vacuum",
    originalPriceCents: 8900,
    discountPriceCents: 4900,
    percentOff: 45,
    isMostPopular: true,
  },
  {
    id: "pass-90",
    label: "90-Min Deep Service",
    durationMinutes: 90,
    description: "More vacuum time + detailed brushing",
    originalPriceCents: 12900,
    discountPriceCents: 7900,
    percentOff: 39,
    isMostPopular: false,
  },
  {
    id: "pass-120",
    label: "120-Min Recovery / Reset",
    durationMinutes: 120,
    description: "Best for neglected pools or heavy debris",
    originalPriceCents: 16900,
    discountPriceCents: 9900,
    percentOff: 41,
    isMostPopular: false,
  },
];

const MOCK_OFFER = {
  inventoryRemaining: 7,
  maxPercentOff: 45,
};

const ServicePass = () => {
  const navigate = useNavigate();
  const [selectedPass, setSelectedPass] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 59 });
  const [isProcessing, setIsProcessing] = useState(false);

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

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  const handleContinue = async () => {
    if (!selectedPass) return;
    
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Route the user back to the dashboard, where the BookingFlow modal
    // continues the purchase (date picker, time window, access details).
    // TODO(payments): when Lovable Payments is wired, redirect here to the
    // checkout URL returned by `payments-checkout` Edge Function instead.
    navigate(`/dashboard?purchase_id=${selectedPass}`);
  };

  return (
    <>
      <main className="flex-1 py-8 px-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Top Assurance Banner */}
          <div className="bg-primary/10 border-2 border-primary rounded-xl p-6 text-center">
            <p className="text-lg font-bold text-navy leading-tight">
              Limited passes available - lock in your first pool service.
            </p>
            <p className="text-base font-semibold text-navy mt-1">
              100% refundable if not used.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Valid for 90 days.
            </p>
          </div>

          {/* Scarcity + Time Block */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
              <Ticket className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Only</p>
              <p className="text-xl font-bold text-navy">{MOCK_OFFER.inventoryRemaining} passes</p>
              <p className="text-sm text-muted-foreground">remaining</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
              <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Time left</p>
              <p className="text-2xl font-bold text-navy tabular-nums">
                {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
              </p>
            </div>
          </div>

          {/* Title + Subtitle */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-navy">Get a Service Pass</h1>
            <p className="text-muted-foreground mt-2">
              Choose a session length for Orlando's Oasis (up to {MOCK_OFFER.maxPercentOff}% off)
            </p>
          </div>

          {/* Pass Options */}
          <RadioGroup
            value={selectedPass || ""}
            onValueChange={setSelectedPass}
            className="space-y-3"
          >
            {PASS_OPTIONS.map((pass) => (
              <label
                key={pass.id}
                className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedPass === pass.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={pass.id} className="mt-0.5" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy">{pass.label}</span>
                    {pass.isMostPopular && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        Most Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {pass.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm text-muted-foreground line-through">
                    {formatPrice(pass.originalPriceCents)}
                  </p>
                  <p className="text-xl font-bold text-navy">
                    {formatPrice(pass.discountPriceCents)}
                  </p>
                  <p className="text-xs font-semibold text-primary">
                    {pass.percentOff}% off
                  </p>
                </div>

                {selectedPass === pass.id && (
                  <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </label>
            ))}
          </RadioGroup>

          {/* Trust Footnote */}
          <p className="text-sm text-muted-foreground text-center px-4">
            Pass covers the full price of your first service. Your technician is paid in full.
          </p>

          {/* CTA Button */}
          <Button
            onClick={handleContinue}
            disabled={!selectedPass || isProcessing}
            className="w-full h-14 text-lg font-semibold"
          >
            {isProcessing
              ? "Processing..."
              : selectedPass
              ? "Continue"
              : "Select a pass to continue"}
          </Button>

          {/* Additional Trust Line */}
          <p className="text-xs text-muted-foreground text-center">
            Pass applies to one standard service in eligible areas. Add-ons billed separately.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ServicePass;
