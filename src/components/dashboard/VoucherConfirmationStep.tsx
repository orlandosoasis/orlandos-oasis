import { Check, Clock } from "lucide-react";
import type { VoucherPlan } from "./VoucherSelectionStep";
import type { ServiceConfig } from "@/components/ServiceConfigStep";
import { ADDONS, getAddonsTotal, getSelectedAddons } from "@/components/AddonsStep";

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

interface VoucherConfirmationStepProps {
  plan: VoucherPlan;
  serviceConfig: ServiceConfig;
  selectedAddons?: string[];
  timeLeft: { minutes: number; seconds: number };
}

const VoucherConfirmationStep = ({ plan, serviceConfig, selectedAddons = [], timeLeft }: VoucherConfirmationStepProps) => {
  const poolLabel = POOL_SIZE_LABELS[serviceConfig.poolSize] || serviceConfig.poolSize;
  const freqLabel = FREQUENCY_LABELS[serviceConfig.frequency] || serviceConfig.frequency;
  const addonsTotal = getAddonsTotal(selectedAddons);
  const selectedAddonObjects = getSelectedAddons(selectedAddons);
  const totalDueToday = plan.discountPrice + addonsTotal;

  return (
    <div className="space-y-2 animate-fade-in">
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

      {/* Top Banner */}
      <div className="bg-primary rounded-2xl p-5 text-center">
        <p className="text-primary-foreground font-semibold text-[15px] leading-snug">
          Congrats! You save ${plan.savings} on your first month.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-card rounded-2xl p-5 px-6 border border-border shadow-sm">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          YOU'RE GETTING
        </p>
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="font-bold text-foreground text-sm">
              First Month of {freqLabel} Pool Service
            </p>
            <p className="text-sm text-muted-foreground">{poolLabel}</p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="text-sm text-muted-foreground line-through">${plan.originalPrice}</span>
              <span className="font-extrabold text-foreground leading-none text-lg">${plan.discountPrice}</span>
            </div>
            <p className="text-[11px] font-bold text-primary tracking-wide mt-1">SAVE ${plan.savings}</p>
          </div>
        </div>
      </div>

      {/* Add-ons Summary */}
      {selectedAddonObjects.length > 0 && (
        <div className="bg-card rounded-2xl p-5 px-6 border border-border shadow-sm">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
            ADD-ONS
          </p>
          <div className="space-y-2.5">
            {selectedAddonObjects.map((addon) => (
              <div key={addon.id} className="flex items-center justify-between">
                <p className="text-sm text-foreground">{addon.title}</p>
                <span className="text-sm font-semibold text-foreground">${addon.price}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2.5 mt-2.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Add-ons total</p>
                <span className="text-sm font-bold text-foreground">${addonsTotal}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Total Due Today — only shown when add-ons are selected */}
      {selectedAddonObjects.length > 0 && (
        <div className="bg-card rounded-2xl p-5 px-6 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-foreground">Total due today</p>
            <span className="font-extrabold text-foreground leading-none text-lg">${totalDueToday}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Base service ${plan.discountPrice} + Add-ons ${addonsTotal}
          </p>
        </div>
      )}

      {/* Voucher Details Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">

        <div>
          <p className="font-bold text-foreground mb-4">Discount Voucher and Membership Details</p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                This discount voucher is valid for your first month of {freqLabel.toLowerCase()} pool cleanings ({poolLabel}), for only <strong>${plan.discountPrice} total</strong>.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Your discount voucher <strong>saves ${plan.savings}</strong> on your first month of pool cleaning.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Billing will continue at the regular rate of <strong>${plan.originalPrice}/month</strong> after your first month, if not canceled.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Cancel future pool service anytime. No commitment required.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VoucherConfirmationStep;
