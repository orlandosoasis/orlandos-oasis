import { useState, useEffect } from "react";
import { Clock, Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

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
    isMostPopular: false,
  },
  {
    id: "pass-3",
    hours: 3,
    label: "3 Hours of pool service",
    description: "Ideal for standard-sized pools",
    originalPrice: 75,
    discountPrice: 19,
    percentOff: 75,
    isMostPopular: true,
  },
  {
    id: "pass-4",
    hours: 4,
    label: "4 Hours of pool service",
    description: "Ideal for larger pools",
    originalPrice: 100,
    discountPrice: 39,
    percentOff: 61,
    isMostPopular: false,
  },
  {
    id: "pass-6",
    hours: 6,
    label: "6 Hours of pool service",
    description: "Ideal for neglected or extra-large pools",
    originalPrice: 150,
    discountPrice: 79,
    percentOff: 47,
    isMostPopular: false,
  },
];

const ServicePassSection = () => {
  const [selectedPass, setSelectedPass] = useState<string>("pass-3");
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
    console.log("Selected pass:", selectedPass);
    // Navigate to checkout or booking flow
  };

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
        className="space-y-3"
      >
        {PASS_OPTIONS.map((pass) => (
          <label
            key={pass.id}
            className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              selectedPass === pass.id
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
        ))}
      </RadioGroup>

      {/* Trust Footnote */}
      <p className="text-sm text-muted-foreground text-center px-4">
        *Vouchers cover the full price of your first pool service. Don't worry - your technician will be paid in full!
      </p>

      {/* CTA Button */}
      <Button
        onClick={handleGetPass}
        className="w-full h-14 text-lg font-semibold rounded-full"
      >
        Get your pool cleaned!
      </Button>
    </div>
  );
};

export default ServicePassSection;
