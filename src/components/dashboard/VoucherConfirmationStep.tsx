import { Check } from "lucide-react";
import type { VoucherPlan } from "./VoucherSelectionStep";

interface VoucherConfirmationStepProps {
  plan: VoucherPlan;
}

const VoucherConfirmationStep = ({ plan }: VoucherConfirmationStepProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-primary rounded-2xl p-5 text-center">
        <p className="text-primary-foreground font-semibold text-[15px] leading-snug">
          Congratulations, your first pool cleaning will be covered by your ${plan.discountPrice} voucher! If you like your cleaner...
        </p>
      </div>

      {/* Voucher Details Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="text-center mb-5">
          <p className="text-base font-bold text-foreground">
            Save ${plan.savings} with your voucher on
          </p>
          <p className="text-base text-foreground">
            your <span className="font-semibold">first month</span> of weekly pool service.
          </p>
        </div>

        <div className="text-center mb-6">
          <p className="text-lg font-bold text-foreground">
            Get your first month of pool cleaning
          </p>
          <p className="text-lg font-bold text-foreground">
            for <span className="text-primary">only ${plan.discountPrice}!</span>{" "}
            <span className="text-muted-foreground font-normal">
              , regularly <span className="line-through">${plan.originalPrice}</span>
            </span>
          </p>
        </div>

        <div>
          <p className="font-bold text-foreground mb-4">Discount Voucher and Membership Details</p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                This discount voucher is valid for 4 weekly pool cleanings over your first month—for only <strong>${plan.discountPrice} total</strong>.
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
                Cancel future pool service anytime—no commitment required.
              </p>
            </div>
          </div>

          <p className="text-sm italic text-muted-foreground mt-4">
            *Last 30-day average price based on your zip code
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="border-t border-border pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              YOU'RE GETTING
            </p>
            <p className="text-base font-bold text-foreground mt-1">
              First Month of Weekly Pool Service
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground line-through">${plan.originalPrice}</p>
            <p className="text-2xl font-bold text-foreground">${plan.discountPrice}</p>
            <p className="text-sm font-semibold text-primary">SAVE ${plan.savings}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherConfirmationStep;
