import { Check, Clock, Pencil, Loader2 } from "lucide-react";
import type { ServiceConfig } from "@/components/ServiceConfigStep";
import { getMonthlyPrice, getDiscountPrice } from "@/components/ServiceConfigStep";
import { useServiceCatalog, type ServiceCatalogItem } from "@/hooks/useServiceCatalog";

export interface Addon {
  id: string;
  title: string;
  description: string;
  price: number;
}

/** Maps a catalog item to the Addon interface used throughout the booking flow */
function catalogToAddon(item: ServiceCatalogItem): Addon {
  return {
    id: item.id,
    title: item.name,
    description: item.description ?? "",
    price: item.price,
  };
}

/**
 * Hook that returns live add-ons from the service_catalog table.
 * Falls back to an empty array while loading.
 */
export function useAddons(): Addon[] {
  const { data = [] } = useServiceCatalog(false);
  return data.map(catalogToAddon);
}

/** Calculate total price of selected add-ons */
export function getAddonsTotal(selectedIds: string[], addons: Addon[]): number {
  return addons.filter((a) => selectedIds.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
}

/** Get selected addon objects */
export function getSelectedAddons(selectedIds: string[], addons: Addon[]): Addon[] {
  return addons.filter((a) => selectedIds.includes(a.id));
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
  const { data: catalogItems = [], isLoading } = useServiceCatalog(false);
  const addons = catalogItems.map(catalogToAddon);
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
        <h3 className="text-lg font-bold text-foreground mb-0.5">Add-ons</h3>
        <p className="text-muted-foreground text-sm">
          Select any additional services you'd like to include.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading add-ons…</span>
        </div>
      ) : addons.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No add-ons available at this time.</p>
      ) : (
        <div className="space-y-3">
          {addons.map((addon) => {
            const isSelected = selectedAddons.includes(addon.id);
            return (
              <button
                key={addon.id}
                type="button"
                onClick={() => onToggleAddon(addon.id)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
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
                    {addon.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{addon.description}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AddonsStep;
