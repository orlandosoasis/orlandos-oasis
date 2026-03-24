import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

export type PoolSize = "small" | "medium" | "large";
export type ServiceFrequency = "weekly" | "twice-weekly" | "three-weekly";

export interface ServiceConfig {
  poolSize: PoolSize;
  frequency: ServiceFrequency;
}

const POOL_SIZES: { value: PoolSize; label: string; sublabel: string; price: number }[] = [
  { value: "small", label: "Small Pool", sublabel: "Standard residential", price: 120 },
  { value: "medium", label: "Medium Pool", sublabel: "Mid-size residential", price: 140 },
  { value: "large", label: "Large Pool", sublabel: "Large or custom", price: 170 },
];

const FREQUENCIES: { value: ServiceFrequency; label: string; description: string; priceCopy: string; multiplier: number; isMostPopular: boolean }[] = [
  { value: "weekly", label: "Weekly Service", description: "Ideal for most residential pools", priceCopy: "Included in base price", multiplier: 1, isMostPopular: true },
  { value: "twice-weekly", label: "Twice Per Week", description: "Add an extra weekly visit for high-use or problem pools", priceCopy: "", multiplier: 2, isMostPopular: false },
  { value: "three-weekly", label: "Three Times Per Week", description: "Add two extra weekly visits for premium care & maximum clarity", priceCopy: "", multiplier: 3, isMostPopular: false },
];

const KEY_SERVICES = [
  "Surface skimming, wall brushing & vacuuming",
  "Water chemistry testing & chemical balancing",
  "Filter system check & equipment inspection",
];

const ALL_SERVICES = [
  "Skimming surface debris (leaves, bugs, etc.)",
  "Brushing walls, steps, and tile line",
  "Vacuuming pool as needed",
  "Emptying skimmer and pump baskets",
  "Water chemistry testing and balancing",
  "Adding necessary chemicals (chlorine, acid, etc.)",
  "Filter system check (backwash/clean as needed)",
  "Equipment inspection (pump, timer, system)",
  "Water level monitoring",
];

export function getMonthlyPrice(config: ServiceConfig): number {
  const sizeOption = POOL_SIZES.find((s) => s.value === config.poolSize)!;
  const freqOption = FREQUENCIES.find((f) => f.value === config.frequency)!;
  return sizeOption.price * freqOption.multiplier;
}

export function getDiscountPrice(config: ServiceConfig): number {
  return getMonthlyPrice(config) - 25;
}

export function getFrequencyLabel(frequency: ServiceFrequency): string {
  return FREQUENCIES.find((f) => f.value === frequency)?.label ?? "";
}

interface ServiceConfigStepProps {
  config: ServiceConfig;
  onConfigChange: (config: ServiceConfig) => void;
}

const ServiceConfigStep = ({ config, onConfigChange }: ServiceConfigStepProps) => {
  const [showAllServices, setShowAllServices] = useState(false);
  const basePrice = POOL_SIZES.find((s) => s.value === config.poolSize)!.price;
  const freqOption = FREQUENCIES.find((f) => f.value === config.frequency)!;
  const extraPrice = basePrice * (freqOption.multiplier - 1);
  const monthlyPrice = getMonthlyPrice(config);
  const firstMonthPrice = monthlyPrice - 25;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-primary rounded-2xl p-5 text-center">
        <p className="text-primary-foreground font-semibold text-[15px] leading-snug">
          Build your plan below — pricing updates as you choose.
        </p>
        <p className="text-primary-foreground/80 text-sm mt-1">
          Save $25 on your first month · 100% refundable if not used
        </p>
      </div>

      {/* Section A: Pool Size */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-0.5">Pool Size</h3>
        <p className="text-xs text-muted-foreground mb-2.5">Sets your base monthly price</p>
        <RadioGroup
          value={config.poolSize}
          onValueChange={(val) => onConfigChange({ ...config, poolSize: val as PoolSize })}
          className="space-y-2"
        >
          {POOL_SIZES.map((size) => {
            const isSelected = config.poolSize === size.value;
            return (
              <label
                key={size.value}
                className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={size.value} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {size.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{size.sublabel}</p>
                </div>
                <p className={`text-lg font-bold shrink-0 tabular-nums text-right ${isSelected ? "text-primary" : "text-foreground"}`}>
                  ${size.price}<span className="text-xs font-medium text-muted-foreground">/mo</span>
                </p>
              </label>
            );
          })}
        </RadioGroup>
      </div>

      {/* Section B: Service Frequency */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-0.5">Service Frequency</h3>
        <p className="text-xs text-muted-foreground mb-2.5">Weekly is included — add extra visits if needed</p>
        <RadioGroup
          value={config.frequency}
          onValueChange={(val) => onConfigChange({ ...config, frequency: val as ServiceFrequency })}
          className="space-y-2"
        >
          {FREQUENCIES.map((freq) => {
            const isSelected = config.frequency === freq.value;
            const addOn = basePrice * (freq.multiplier - 1);
            return (
              <label
                key={freq.value}
                className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                {freq.isMostPopular && (
                  <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-xs">
                    Most Popular
                  </Badge>
                )}
                <RadioGroupItem value={freq.value} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {freq.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{freq.description}</p>
                </div>
                <p className={`text-sm font-bold shrink-0 tabular-nums text-right min-w-[90px] ${
                  freq.multiplier === 1
                    ? "text-accent"
                    : isSelected ? "text-primary" : "text-foreground"
                }`}>
                  {freq.multiplier === 1
                    ? "Included"
                    : `+$${addOn}/mo`}
                </p>
              </label>
            );
          })}
        </RadioGroup>
      </div>

      {/* Section C: What's Included (collapsed) */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">What's Included</h3>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2.5">
          {(showAllServices ? ALL_SERVICES : KEY_SERVICES).map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{item}</p>
            </div>
          ))}
          <button
            onClick={() => setShowAllServices(!showAllServices)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-1"
          >
            {showAllServices ? (
              <>Show less <ChevronUp className="h-3.5 w-3.5" /></>
            ) : (
              <>View all 9 services <ChevronDown className="h-3.5 w-3.5" /></>
            )}
          </button>
        </div>
      </div>

      {/* Section D: Pricing Breakdown */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">
          Price Breakdown
        </p>

        {/* Line items */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {POOL_SIZES.find(s => s.value === config.poolSize)!.label}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">${basePrice}/mo</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {freqOption.label}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {freqOption.multiplier === 1 ? "Included" : `+$${extraPrice}/mo`}
            </p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">First-month voucher</p>
            <p className="text-sm font-semibold text-primary tabular-nums">−$25</p>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Due today — primary focus */}
        <div className="flex justify-between items-center bg-primary/5 rounded-xl px-4 py-4 -mx-1">
          <div>
            <p className="text-base font-bold text-foreground">Today you pay</p>
            <p className="text-xs text-primary font-medium">$25 off applied</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-primary tabular-nums">${firstMonthPrice}</span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Then ${monthlyPrice}/mo. Final price may vary based on pool condition.
        </p>
      </div>
    </div>
  );
};

export default ServiceConfigStep;
