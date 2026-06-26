import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { usePricingPoolSizes, usePricingFrequencies, usePricingAddons } from "@/hooks/usePricing";
import { ADDONS } from "@/components/AddonsStep";
import { supabase } from "@/integrations/supabase/client";

export type PoolSize = "small" | "medium" | "large";
export type ServiceFrequency = "weekly" | "twice-weekly" | "three-weekly";

export interface ServiceConfig {
  poolSize: PoolSize;
  frequency: ServiceFrequency;
}

// Mutable defaults — kept in sync with the admin pricing catalog by
// `PricingSync` (mounted at the app root) so that all `getMonthlyPrice`
// callers reflect updates made in the Pricing settings without a refresh.
export const POOL_SIZES: { value: PoolSize; label: string; sublabel: string; price: number }[] = [
  { value: "small", label: "Small Pool", sublabel: "Standard residential", price: 120 },
  { value: "medium", label: "Medium Pool", sublabel: "Mid-size residential", price: 140 },
  { value: "large", label: "Large Pool", sublabel: "Large or custom", price: 170 },
];

export const FREQUENCIES: { value: ServiceFrequency; label: string; description: string; priceCopy: string; multiplier: number; priceDelta: number; isMostPopular: boolean }[] = [
  { value: "weekly", label: "Weekly Pool Service", description: "Ideal for most residential pools", priceCopy: "Included in base price", multiplier: 1, priceDelta: 0, isMostPopular: true },
  { value: "twice-weekly", label: "Twice Per Week Pool Service", description: "Add an extra weekly visit for high-use or problem pools", priceCopy: "", multiplier: 2, priceDelta: 0, isMostPopular: false },
  { value: "three-weekly", label: "Three Times Per Week Pool Service", description: "Add two extra weekly visits for premium care & maximum clarity", priceCopy: "", multiplier: 3, priceDelta: 0, isMostPopular: false },
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

export function getPoolSizePrice(poolSize: PoolSize): number {
  return POOL_SIZES.find((s) => s.value === poolSize)?.price ?? 0;
}

export function getMonthlyPrice(config: ServiceConfig): number {
  const sizeOption = POOL_SIZES.find((s) => s.value === config.poolSize);
  const freqOption = FREQUENCIES.find((f) => f.value === config.frequency);
  if (!sizeOption || !freqOption) return 0;
  return sizeOption.price * freqOption.multiplier + freqOption.priceDelta;
}

export function getDiscountPrice(config: ServiceConfig): number {
  return getMonthlyPrice(config) - 25;
}

export function getFrequencyLabel(frequency: ServiceFrequency): string {
  return FREQUENCIES.find((f) => f.value === frequency)?.label ?? "";
}

/**
 * Keeps the module-level POOL_SIZES / FREQUENCIES arrays in sync with the
 * Pricing settings stored in the database. Mount once at the app root.
 */
export function PricingSync() {
  const { data: poolSizes } = usePricingPoolSizes(false);
  const { data: frequencies } = usePricingFrequencies(false);
  useEffect(() => {
    if (poolSizes) {
      poolSizes.forEach((row) => {
        const match = POOL_SIZES.find((p) => p.value === row.size);
        if (match) match.price = Number(row.base_monthly_price);
      });
    }
  }, [poolSizes]);
  useEffect(() => {
    if (frequencies) {
      frequencies.forEach((row) => {
        const match = FREQUENCIES.find((f) => f.value === row.frequency);
        if (match) {
          match.multiplier = Number(row.multiplier);
          match.priceDelta = Number(row.price_delta);
        }
      });
    }
  }, [frequencies]);
  const { data: addons } = usePricingAddons(false);
  useEffect(() => {
    if (addons) {
      addons.forEach((row) => {
        const match = ADDONS.find(
          (a) => a.title.toLowerCase() === String(row.name).toLowerCase(),
        );
        if (match) match.price = Number(row.price);
      });
    }
  }, [addons]);
  return null;
}

interface ServiceConfigStepProps {
  config: ServiceConfig;
  onConfigChange: (config: ServiceConfig) => void;
}

const ServiceConfigStep = ({ config, onConfigChange }: ServiceConfigStepProps) => {
  const [showAllServices, setShowAllServices] = useState(false);
  // Subscribe to live pricing so this step re-renders when admins update prices.
  usePricingPoolSizes(false);
  usePricingFrequencies(false);
  const basePrice = POOL_SIZES.find((s) => s.value === config.poolSize)!.price;
  const freqOption = FREQUENCIES.find((f) => f.value === config.frequency)!;
  const extraPrice = basePrice * (freqOption.multiplier - 1) + freqOption.priceDelta;
  const monthlyPrice = getMonthlyPrice(config);
  const firstMonthPrice = monthlyPrice - 25;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-primary rounded-2xl p-5 text-center">
        <p className="text-primary-foreground font-semibold text-[15px] leading-snug">
          Build your plan below.<br />Pricing updates as you make selections.
        </p>
        <p className="text-primary-foreground/80 text-sm mt-1">
          Save $25 on your first month · 100% refundable if not used
        </p>
      </div>

      {/* Section A: Pool Size */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-0.5">Pool Size</h3>
        <p className="text-muted-foreground mb-6 text-sm">Sets your base monthly price</p>
        <RadioGroup
          value={config.poolSize}
          onValueChange={(val) => onConfigChange({ ...config, poolSize: val as PoolSize })}
          className="space-y-1"
        >
          {POOL_SIZES.map((size) => {
            const isSelected = config.poolSize === size.value;
            return (
              <label
                key={size.value}
                className={`relative flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={size.value} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${isSelected ? "text-primary" : "text-foreground"} font-bold`}>
                    {size.label}
                  </p>
                  <p className="text-muted-foreground text-sm">{size.sublabel}</p>
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
        <p className="text-muted-foreground mb-6 text-sm">Weekly is included. Add extra visits if needed.</p>
        <RadioGroup
          value={config.frequency}
          onValueChange={(val) => onConfigChange({ ...config, frequency: val as ServiceFrequency })}
          className="space-y-1"
        >
          {FREQUENCIES.map((freq) => {
            const isSelected = config.frequency === freq.value;
            const addOn = basePrice * (freq.multiplier - 1) + freq.priceDelta;
            return (
              <label
                key={freq.value}
                className={`relative flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md ${
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
                  <p className={`text-sm ${isSelected ? "text-primary" : "text-foreground"} font-bold font-sans`}>
                    {freq.label}
                  </p>
                  <p className="text-muted-foreground text-sm">{freq.description}</p>
                </div>
                <p className={`text-sm font-bold shrink-0 tabular-nums text-right min-w-[90px] ${
                  isSelected ? "text-primary" : "text-card-foreground"
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
        <p className="text-muted-foreground uppercase tracking-widest text-xs font-bold">
          Price Breakdown
        </p>

        {/* Line items */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground text-sm">
              {POOL_SIZES.find(s => s.value === config.poolSize)!.label}
            </p>
            <p className="text-muted-foreground text-sm tabular-nums">${basePrice}/mo</p>
          </div>
          <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground text-sm">
              {freqOption.label}
            </p>
            <p className="text-muted-foreground text-sm tabular-nums">
              {freqOption.multiplier === 1 ? "Included" : `+$${extraPrice}/mo`}
            </p>
          </div>
          <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground text-sm">First-month voucher</p>
            <p className="text-sm font-semibold text-primary tabular-nums">−$25</p>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Due today - primary focus */}
        <div className="flex justify-between items-center bg-primary/5 rounded-xl px-4 py-4 -mx-1">
          <div>
            <p className="font-bold text-foreground text-sm">Today you pay</p>
            <p className="text-primary font-semibold text-sm">$25 off applied</p>
          </div>
          <div className="text-right">
            <span className="font-extrabold text-primary tabular-nums text-lg">${firstMonthPrice}</span>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed text-xs">
          Then ${monthlyPrice}/mo. Final price may vary based on pool condition.
        </p>
      </div>
    </div>
  );
};

export default ServiceConfigStep;
