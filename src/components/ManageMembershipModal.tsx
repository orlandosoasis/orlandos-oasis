import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, AlertCircle, ArrowRight, BadgePercent, CalendarClock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBooking } from "@/contexts/BookingContext";
import CancelMembershipModal from "./CancelMembershipModal";

interface ManageMembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextServiceDate: string;
  onCancelled: () => void;
  onPlanChanged?: (plan: ServicePlan) => void;
}

export interface ServicePlan {
  id: string;
  name: string;
  frequency: string;
  frequencyLabel: string;
  originalPrice: number;
  discountPrice: number;
}

const SERVICE_PLANS: ServicePlan[] = [
  {
    id: "weekly",
    name: "Weekly Pool Service",
    frequency: "weekly",
    frequencyLabel: "Weekly",
    originalPrice: 120,
    discountPrice: 95,
  },
  {
    id: "twice-weekly",
    name: "Twice-Per-Week Pool Service",
    frequency: "twice-weekly",
    frequencyLabel: "Twice per week",
    originalPrice: 240,
    discountPrice: 215,
  },
  {
    id: "three-weekly",
    name: "Three-Times-Per-Week Pool Service",
    frequency: "three-weekly",
    frequencyLabel: "Three times per week",
    originalPrice: 360,
    discountPrice: 335,
  },
];

const ManageMembershipModal = ({
  open,
  onOpenChange,
  nextServiceDate,
  onCancelled,
  onPlanChanged,
}: ManageMembershipModalProps) => {
  const { toast } = useToast();
  const { checkoutData, setCheckoutData, booking } = useBooking();
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Determine current plan from context
  const currentFrequency = checkoutData?.frequency || booking?.frequency || "weekly";
  const currentPlan = SERVICE_PLANS.find((p) => p.frequency === currentFrequency) || SERVICE_PLANS[0];

  const [selectedPlanId, setSelectedPlanId] = useState(currentPlan.id);

  // Reset selection when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) setSelectedPlanId(currentPlan.id);
    onOpenChange(isOpen);
  };

  const selectedPlan = SERVICE_PLANS.find((p) => p.id === selectedPlanId)!;
  const isSamePlan = selectedPlanId === currentPlan.id;

  // Voucher logic: voucher is "used" if discount was already applied on the first billing cycle
  const hadVoucher =
    (checkoutData && checkoutData.discountPrice < checkoutData.originalPrice) ||
    (booking?.selectedPass && booking.selectedPass.discountPrice < booking.selectedPass.originalPrice);
  const voucherUsed = !!hadVoucher;
  // Voucher only applies to a NEW plan if it hasn't been used yet (in this mock, once used it's consumed)
  const voucherApplies = !voucherUsed && !isSamePlan;

  const effectiveFirstMonth = voucherApplies ? selectedPlan.discountPrice : selectedPlan.originalPrice;
  const recurringPrice = selectedPlan.originalPrice;

  // Schedule impact messaging
  const scheduleMessage = useMemo(() => {
    if (isSamePlan) return null;
    const fromLabel = currentPlan.frequencyLabel;
    const toLabel = selectedPlan.frequencyLabel;
    const isUpgrade = SERVICE_PLANS.indexOf(selectedPlan) > SERVICE_PLANS.indexOf(currentPlan);
    return isUpgrade
      ? `Your service frequency will increase from ${fromLabel} to ${toLabel} starting next billing cycle.`
      : `Your schedule will be reduced from ${fromLabel} to ${toLabel} starting next billing cycle.`;
  }, [isSamePlan, selectedPlan, currentPlan]);

  const handleConfirmChange = () => {
    // Update checkoutData in context so Dashboard re-renders with new plan
    setCheckoutData({
      serviceName: selectedPlan.name,
      serviceDescription: `${selectedPlan.frequencyLabel} pool cleaning service`,
      frequency: selectedPlan.frequency,
      originalPrice: selectedPlan.originalPrice,
      discountPrice: voucherApplies ? selectedPlan.discountPrice : selectedPlan.originalPrice,
      customerEmail: checkoutData?.customerEmail || "",
      customerFirstName: checkoutData?.customerFirstName || "",
      customerLastName: checkoutData?.customerLastName || "",
      customerPhone: checkoutData?.customerPhone || "",
      customerZipcode: checkoutData?.customerZipcode || "",
    });

    onPlanChanged?.(selectedPlan);
    onOpenChange(false);
    toast({
      title: "Plan updated",
      description: `You've switched to ${selectedPlan.name}.`,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto pt-10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Manage Plan</DialogTitle>
            <DialogDescription>Change your service plan, review pricing, or cancel your membership.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            {/* Plan Selection */}
            <div className="space-y-3">
              <h3 className="text-[15px] font-semibold text-foreground">Select Plan</h3>
              <div className="space-y-2.5">
                {SERVICE_PLANS.map((plan) => {
                  const isSelected = plan.id === selectedPlanId;
                  const isCurrent = plan.id === currentPlan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] font-semibold text-foreground">{plan.name}</span>
                            {isCurrent && (
                              <span className="text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            ${plan.originalPrice}/month · {plan.frequencyLabel}
                          </p>
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
            </div>

            <Separator />

            {/* Pricing / Billing Impact */}
            <div className="space-y-3">
              <h3 className="text-[15px] font-semibold text-foreground">Updated Billing</h3>

              {isSamePlan ? (
                <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">No changes to your current plan.</span>
                </div>
              ) : (
                <div className="space-y-2.5 text-sm">
                  {voucherApplies && (
                    <div className="flex justify-between items-baseline">
                      <span className="text-muted-foreground">First Month (with voucher)</span>
                      <span className="font-medium text-foreground">
                        <span className="text-primary">${effectiveFirstMonth}</span>
                        <span className="text-muted-foreground line-through ml-1.5 text-xs">
                          ${recurringPrice}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {voucherApplies ? "Recurring Payment" : "Next Payment"}
                    </span>
                    <span className="font-medium text-foreground">${recurringPrice}/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Billing Date</span>
                    <span className="font-medium text-foreground">{nextServiceDate}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Voucher Status */}
            {!isSamePlan && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-[15px] font-semibold text-foreground">Voucher</h3>
                  {voucherUsed ? (
                    <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-xl px-4 py-3 text-sm">
                      <BadgePercent className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Voucher already applied on first billing cycle.</span>
                    </div>
                  ) : voucherApplies ? (
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-sm">
                      <BadgePercent className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-primary font-medium">
                        ${selectedPlan.originalPrice - selectedPlan.discountPrice} discount applied to first month
                      </span>
                    </div>
                  ) : null}
                </div>
              </>
            )}

            {/* Schedule Impact */}
            {scheduleMessage && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-[15px] font-semibold text-foreground">Schedule Update</h3>
                  <div className="flex items-start gap-2 bg-accent/50 border border-border rounded-xl px-4 py-3 text-sm">
                    <CalendarClock className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                    <span className="text-foreground">{scheduleMessage}</span>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Confirm CTA */}
            <Button
              className="w-full gap-2"
              disabled={isSamePlan}
              onClick={handleConfirmChange}
            >
              Confirm Plan Change
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Separator />

            {/* Cancel Membership */}
            <div className="space-y-2">
              <h3 className="text-[15px] font-semibold text-foreground">Cancel Membership</h3>
              <p className="text-sm text-muted-foreground">
                Cancel your membership and stop future recurring cleanings.
              </p>
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground hover:border-transparent"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Membership
              </Button>
            </div>
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

export default ManageMembershipModal;
