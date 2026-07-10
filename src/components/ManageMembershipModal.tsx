import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, ChevronDown, ChevronUp, X as XIcon, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAddons, type Addon } from "@/components/AddonsStep";
import CancelMembershipModal from "./CancelMembershipModal";

// ===== Types exported for parent state =====
export type PoolSize = "small" | "medium" | "large";
export type ServiceFrequency = "weekly" | "twice-weekly" | "three-weekly";

export interface MembershipConfig {
  poolSize: PoolSize;
  frequency: ServiceFrequency;
  activeAddonIds: string[];
}

export interface ServicePlan {
  id: string;
  name: string;
  frequency: string;
  frequencyLabel: string;
  originalPrice: number;
  discountPrice: number;
}

// ===== Pricing tables (shared with ServiceConfigStep — kept in sync by PricingSync) =====
import { POOL_SIZES as SHARED_POOL_SIZES, FREQUENCIES as SHARED_FREQUENCIES } from "@/components/ServiceConfigStep";
import { usePricingPoolSizes, usePricingFrequencies, usePricingAddons } from "@/hooks/usePricing";

// ===== Helpers (read from shared, live catalog) =====
function getBasePrice(size: PoolSize) {
  return SHARED_POOL_SIZES.find((s) => s.value === size)?.price ?? 0;
}
function getFrequencyMultiplier(freq: ServiceFrequency) {
  return SHARED_FREQUENCIES.find((f) => f.value === freq)?.multiplier ?? 1;
}
function getFrequencyDelta(freq: ServiceFrequency) {
  return SHARED_FREQUENCIES.find((f) => f.value === freq)?.priceDelta ?? 0;
}
export function getMembershipMonthlyPrice(config: MembershipConfig, allAddons: Addon[] = []) {
  const base = getBasePrice(config.poolSize);
  const mult = getFrequencyMultiplier(config.frequency);
  const delta = getFrequencyDelta(config.frequency);
  const addonsTotal = allAddons.filter((a) => config.activeAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  return base * mult + delta + addonsTotal;
}
export function getActiveAddons(ids: string[], allAddons: Addon[] = []): Addon[] {
  return allAddons.filter((a) => ids.includes(a.id));
}
export function getFrequencyLabel(freq: ServiceFrequency) {
  return SHARED_FREQUENCIES.find((f) => f.value === freq)?.label ?? "";
}
export function getPoolSizeLabel(size: PoolSize) {
  return SHARED_POOL_SIZES.find((s) => s.value === size)?.label ?? "";
}

// ============================================================
// ManagePlanForm — the editable plan UI, usable in a page or modal
// ============================================================
export interface ManagePlanFormProps {
  nextServiceDate: string;
  current: MembershipConfig;
  onCancel: () => void;
  onCancelMembership: () => void;
  onSaved: (next: MembershipConfig, plan: ServicePlan) => void;
  /** When true, omit the sticky header (page provides its own). */
  hideHeader?: boolean;
}

export const ManagePlanForm = ({
  nextServiceDate,
  current,
  onCancel,
  onSaved,
  hideHeader,
}: ManagePlanFormProps) => {
  const { toast } = useToast();
  // Subscribe to live pricing so this form re-renders when admins update prices.
  usePricingPoolSizes(false);
  usePricingFrequencies(false);
  usePricingAddons(false);
  const allAddons = useAddons();

  const [draft, setDraft] = useState<MembershipConfig>(current);
  const [showAllAddons, setShowAllAddons] = useState(false);

  useEffect(() => {
    setDraft(current);
  }, [current]);

  const currentBase = getBasePrice(current.poolSize);
  const draftBase = getBasePrice(draft.poolSize);

  const draftMultiplier = getFrequencyMultiplier(draft.frequency);
  const draftAddonsTotal = allAddons.filter((a) => draft.activeAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  const draftFreqUpgradeCost = draftBase * (draftMultiplier - 1);
  const draftMonthlyTotal = draftBase + draftFreqUpgradeCost + draftAddonsTotal;

  const currentMonthlyTotal = getMembershipMonthlyPrice(current, allAddons);
  const totalDelta = draftMonthlyTotal - currentMonthlyTotal;

  const hasChanges =
    draft.poolSize !== current.poolSize ||
    draft.frequency !== current.frequency ||
    draft.activeAddonIds.length !== current.activeAddonIds.length ||
    draft.activeAddonIds.some((id) => !current.activeAddonIds.includes(id));

  const sizeDelta = (size: PoolSize) => getBasePrice(size) - currentBase;
  const freqDelta = (freq: ServiceFrequency) => draftBase * (getFrequencyMultiplier(freq) - 1);

  const toggleAddon = (id: string) => {
    setDraft((d) => ({
      ...d,
      activeAddonIds: d.activeAddonIds.includes(id)
        ? d.activeAddonIds.filter((x) => x !== id)
        : [...d.activeAddonIds, id],
    }));
  };

  const activeAddons = useMemo(() => getActiveAddons(draft.activeAddonIds, allAddons), [draft.activeAddonIds, allAddons]);
  const activeAddonsTotal = activeAddons.reduce((sum, a) => sum + a.price, 0);

  const availableAddons = allAddons.filter((a) => !draft.activeAddonIds.includes(a.id));
  const visibleAvailableFlat = showAllAddons ? availableAddons : availableAddons.slice(0, 3);

  const handleSave = () => {
    const plan: ServicePlan = {
      id: `${draft.poolSize}-${draft.frequency}`,
      name: `${getFrequencyLabel(draft.frequency)} Pool Service`,
      frequency: draft.frequency,
      frequencyLabel: getFrequencyLabel(draft.frequency),
      originalPrice: draftBase * draftMultiplier,
      discountPrice: draftBase * draftMultiplier,
    };
    onSaved(draft, plan);
    toast({
      title: "Plan updated",
      description: `Your new monthly total is $${draftMonthlyTotal}. Changes apply next billing cycle.`,
    });
  };

  return (
    <div className="flex flex-col">
      {!hideHeader && (
        <div className="bg-card border-b border-border px-6 pt-6 pb-5">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground">Manage Plan</h2>
            <p className="text-sm text-muted-foreground">
              Update your service. Changes apply next billing cycle.
            </p>
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-[13px] text-muted-foreground">
                {getFrequencyLabel(current.frequency)} Pool Service · {getPoolSizeLabel(current.poolSize)}
              </p>
              <p className="text-[11px] text-muted-foreground">Renews {nextServiceDate}</p>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              ${currentMonthlyTotal}
              <span className="text-sm font-medium text-muted-foreground">/mo</span>
            </p>
          </div>
        </div>
      )}

      <div className="px-6 py-6 space-y-7">
        {/* Pool Size */}
        <section className="space-y-3">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Pool Size</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Affects base monthly price</p>
          </div>
          <div className="space-y-2">
            {SHARED_POOL_SIZES.map((size) => {
              const isSelected = size.value === draft.poolSize;
              const delta = sizeDelta(size.value);
              return (
                <button
                  key={size.value}
                  onClick={() => setDraft((d) => ({ ...d, poolSize: size.value }))}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[15px] font-semibold text-foreground">{size.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">${size.price}/month base</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {delta !== 0 && (
                        <span className={`text-xs font-medium tabular-nums ${delta > 0 ? "text-foreground" : "text-primary"}`}>
                          {delta > 0 ? `+$${delta}` : `−$${Math.abs(delta)}`}
                        </span>
                      )}
                      <div
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <Separator />

        {/* Frequency */}
        <section className="space-y-3">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Service Frequency</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Upgrade for higher usage pools</p>
          </div>
          <div className="space-y-2">
            {SHARED_FREQUENCIES.map((freq) => {
              const isSelected = freq.value === draft.frequency;
              const delta = freqDelta(freq.value);
              const helper = freq.multiplier === 1 ? "Included in base plan" : `+$${delta}/month`;
              return (
                <button
                  key={freq.value}
                  onClick={() => setDraft((d) => ({ ...d, frequency: freq.value }))}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[15px] font-semibold text-foreground">{freq.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{helper}</p>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Add-ons */}
        <section className="space-y-3">
          <h3 className="text-[15px] font-semibold text-foreground">Active Add-ons</h3>
          {activeAddons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              No add-ons selected. Browse available add-ons below.
            </div>
          ) : (
            <div className="space-y-2">
              {activeAddons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{addon.title}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">${addon.price}/cycle</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAddon(addon.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                  >
                    <XIcon className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
              <div className="flex justify-between pt-1 text-sm">
                <span className="text-muted-foreground">Add-ons subtotal</span>
                <span className="font-semibold text-foreground tabular-nums">${activeAddonsTotal}</span>
              </div>
            </div>
          )}
        </section>

        {/* Available Add-ons */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-foreground">Available Add-ons</h3>
            {availableAddons.length > 3 && (
              <button
                onClick={() => setShowAllAddons((v) => !v)}
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                {showAllAddons ? "Show less" : "View all"}
                {showAllAddons ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {visibleAvailableFlat.map((addon) => (
              <AddonRow key={addon.id} addon={addon} selected={false} onToggle={() => toggleAddon(addon.id)} />
            ))}
          </div>
        </section>
      </div>

      <div className="bg-card border-t border-border px-6 py-4 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">New Monthly Total</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              ${draftMonthlyTotal}
              <span className="text-sm font-medium text-muted-foreground">/mo</span>
            </p>
          </div>
          {totalDelta !== 0 && (
            <div
              className={`text-xs font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${
                totalDelta > 0
                  ? "bg-primary/10 text-primary"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              {totalDelta > 0 ? `+$${totalDelta}` : `−$${Math.abs(totalDelta)}`} vs current
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={!hasChanges} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Modal wrapper (kept for backward compatibility)
// ============================================================
interface ManageMembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextServiceDate: string;
  current: MembershipConfig;
  onCancelled: () => void;
  onSaved: (next: MembershipConfig, plan: ServicePlan) => void;
}

const ManageMembershipModal = ({
  open,
  onOpenChange,
  nextServiceDate,
  current,
  onCancelled,
  onSaved,
}: ManageMembershipModalProps) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[640px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col pt-0">
          <div className="sticky top-0 z-10 bg-card border-b border-border px-6 pt-10 pb-5">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl font-bold">Manage Plan</DialogTitle>
              <DialogDescription className="text-sm">
                Update your service. Changes apply next billing cycle.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ManagePlanForm
              nextServiceDate={nextServiceDate}
              current={current}
              hideHeader
              onCancel={() => onOpenChange(false)}
              onCancelMembership={() => setShowCancelModal(true)}
              onSaved={(next, plan) => {
                onSaved(next, plan);
                onOpenChange(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <CancelMembershipModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        nextServiceDate={nextServiceDate}
        onConfirm={() => {
          setShowCancelModal(false);
          onOpenChange(false);
          onCancelled();
        }}
      />
    </>
  );
};

// Small reusable row for available add-ons
const AddonRow = ({
  addon,
  selected,
  onToggle,
}: {
  addon: Addon;
  selected: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className={`w-full text-left rounded-xl border p-3.5 transition-all ${
      selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
        }`}
      >
        {selected && <Check className="h-3 w-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground leading-snug">{addon.title}</p>
          <span className="text-sm font-bold text-foreground shrink-0 tabular-nums">${addon.price}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
          {addon.description}
        </p>
      </div>
    </div>
  </button>
);

export default ManageMembershipModal;
