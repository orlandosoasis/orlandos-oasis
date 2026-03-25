import { Check, Clock, Pencil } from "lucide-react";
import type { ServiceConfig } from "@/components/ServiceConfigStep";
import { getMonthlyPrice, getDiscountPrice } from "@/components/ServiceConfigStep";

export interface Addon {
  id: string;
  title: string;
  description: string;
  price: number;
}

export const ADDONS: Addon[] = [
  {
    id: "chemical-testing",
    title: "Chemical Testing & Balancing",
    description: "Maintain safe and balanced water by adjusting chlorine, pH, and alkalinity.",
    price: 35,
  },
  {
    id: "filter-cleaning",
    title: "Filter Cleaning / Salt Cell Cleaning & Backwashing",
    description: "Improve filtration and circulation by cleaning the system and removing buildup from the salt cell.",
    price: 45,
  },
  {
    id: "equipment-inspection",
    title: "Pool Equipment Inspection",
    description: "Check pumps, motors, valves, and heaters to identify issues early.",
    price: 25,
  },
  {
    id: "equipment-repair",
    title: "Pool Equipment Repair",
    description: "Repair or replace malfunctioning pool equipment such as pumps, motors, or lights.",
    price: 75,
  },
  {
    id: "algae-treatment",
    title: "Green-to-Clean / Algae Treatment",
    description: "Restore green or algae-filled pools using deep cleaning and chemical treatment.",
    price: 85,
  },
  {
    id: "tile-cleaning",
    title: "Tile & Surface Cleaning",
    description: "Remove calcium buildup and stains from tiles and pool surfaces.",
    price: 50,
  },
  {
    id: "acid-washing",
    title: "Acid Washing",
    description: "Deep clean surfaces to remove stubborn stains and embedded algae.",
    price: 95,
  },
  {
    id: "pool-inspections",
    title: "Pool Inspections",
    description: "Evaluate overall pool condition, including water clarity and equipment performance.",
    price: 30,
  },
  {
    id: "pool-startups",
    title: "Pool Startups",
    description: "Prepare newly built or resurfaced pools for use by balancing chemicals and starting equipment.",
    price: 60,
  },
];

/** Calculate total price of selected add-ons */
export function getAddonsTotal(selectedIds: string[]): number {
  return ADDONS.filter((a) => selectedIds.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
}

/** Get selected addon objects */
export function getSelectedAddons(selectedIds: string[]): Addon[] {
  return ADDONS.filter((a) => selectedIds.includes(a.id));
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

interface AddonsStepProps {
  selectedAddons: string[];
  onToggleAddon: (id: string) => void;
  serviceConfig: ServiceConfig;
  timeLeft: { minutes: number; seconds: number };
  onChangePlan: () => void;
}

const AddonsStep = ({ selectedAddons, onToggleAddon, serviceConfig, timeLeft, onChangePlan }: AddonsStepProps) => {
  const monthlyPrice = getMonthlyPrice(serviceConfig);
  const discountPrice = getDiscountPrice(serviceConfig);

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

      {/* Order Summary */}
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
              <span className="text-[22px] font-extrabold text-foreground">${discountPrice}</span>
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
        <h2 className="text-2xl font-extrabold text-foreground">Add-ons</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select any additional services you'd like to include.
        </p>
      </div>

      <div className="space-y-3">
        {ADDONS.map((addon) => {
          const isSelected = selectedAddons.includes(addon.id);
          return (
            <button
              key={addon.id}
              type="button"
              onClick={() => onToggleAddon(addon.id)}
              className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground leading-snug">{addon.title}</p>
                    <span className="text-sm font-bold text-foreground shrink-0">${addon.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{addon.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AddonsStep;
