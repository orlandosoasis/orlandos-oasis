import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Plus,
  Trash2,
  RefreshCw,
  Calendar,
  BadgePercent,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  Star,
  Wrench,
  Repeat,
  PlusCircle,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BackLink from "@/components/BackLink";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useBooking } from "@/contexts/BookingContext";
import ManageMembershipModal, {
  type MembershipConfig,
  type ServicePlan,
  type PoolSize,
  type ServiceFrequency,
  getMembershipMonthlyPrice,
  getActiveAddons,
  getFrequencyLabel,
  getPoolSizeLabel,
} from "@/components/ManageMembershipModal";
import PayNowModal from "@/components/PayNowModal";
import CancelSubscriptionModal from "@/components/CancelSubscriptionModal";
import { useSubscription, useReactivateSubscription, formatEndDate } from "@/hooks/useSubscription";



interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
  isDefault?: boolean;
}

type PaymentState = "healthy" | "failed" | "warning" | "suspended";

interface InvoiceRow {
  id: string;
  date: string;
  amount: number;
  status: "Paid" | "Failed" | "Pending";
}

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Map booking-context frequency strings into membership frequencies
const toMembershipFrequency = (f?: string): ServiceFrequency => {
  if (f === "twice-weekly" || f === "three-weekly") return f;
  return "weekly";
};
const toMembershipPoolSize = (s?: string): PoolSize => {
  if (s === "medium" || s === "large") return s;
  return "small";
};

const PaymentMethods = () => {
  const { toast } = useToast();
  const { booking, checkoutData } = useBooking();

  const [cards, setCards] = useState<SavedCard[]>([
    { id: "card-1", last4: "4242", brand: "Visa", expiry: "12/27", isDefault: true },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCard, setNewCard] = useState({ number: "", expiry: "", cvc: "" });

  const [manageOpen, setManageOpen] = useState(false);

  // Subscription state lives in the database; this card just reads it.
  const { data: subscription } = useSubscription();
  const reactivate = useReactivateSubscription();
  const subStatus = subscription?.status ?? "active";
  const isCancelled = subStatus === "cancelled" || subStatus === "pending_cancellation";

  // ===== Test / dev simulators =====
  const [paymentState, setPaymentState] = useState<PaymentState>("healthy");
  const [outstandingBalance, setOutstandingBalance] = useState<number>(0);
  const [payNowOpen, setPayNowOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);



  // ===== Single source of truth for membership config =====
  // Initialised from booking/checkout, then mutated via Manage Plan modal.
  const [membership, setMembership] = useState<MembershipConfig>({
    poolSize: toMembershipPoolSize(checkoutData?.poolSize),
    frequency: toMembershipFrequency(checkoutData?.frequency || booking?.frequency),
    activeAddonIds: ["tile-cleaning", "pool-inspections"], // mock active add-ons
  });

  // Cycle progress (mock - would come from service_completions)
  const [usage] = useState({
    visitsCompleted: 3,
    extraVisitCharges: 0, // e.g. 1-time emergency visits beyond plan
  });

  const [invoices, setInvoices] = useState<InvoiceRow[]>([
    { id: "INV-104", date: "Mar 15, 2026", amount: 95, status: "Paid" },
    { id: "INV-103", date: "Feb 15, 2026", amount: 95, status: "Paid" },
    { id: "INV-102", date: "Jan 15, 2026", amount: 95, status: "Paid" },
  ]);

  // ===== Derived pricing =====
  const POOL_BASE: Record<PoolSize, number> = { small: 120, medium: 140, large: 170 };
  const FREQ_MULT: Record<ServiceFrequency, number> = { weekly: 1, "twice-weekly": 2, "three-weekly": 3 };

  const basePrice = POOL_BASE[membership.poolSize];
  const frequencyMultiplier = FREQ_MULT[membership.frequency];
  const frequencyUpgradeCost = basePrice * (frequencyMultiplier - 1);
  const activeAddons = useMemo(() => getActiveAddons(membership.activeAddonIds), [membership.activeAddonIds]);
  const addonsTotal = activeAddons.reduce((sum, a) => sum + a.price, 0);
  const monthlyTotal = getMembershipMonthlyPrice(membership);

  // Voucher detection (intro discount)
  const hasIntroDiscount =
    !!checkoutData &&
    checkoutData.discountPrice < checkoutData.originalPrice &&
    invoices.length <= 1; // assume voucher applies only to first cycle
  const voucherSavings = hasIntroDiscount
    ? checkoutData!.originalPrice - checkoutData!.discountPrice
    : 0;

  const d = booking?.scheduleData?.selectedDate || new Date();
  const formatDate = (date: Date) =>
    `${FULL_DAYS[date.getDay()]}, ${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  const formatShort = (date: Date) =>
    `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;
  const nextBilling = useMemo(() => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return next;
  }, [d]);
  const nextDateStr = formatDate(nextBilling);
  const nextDateShort = formatShort(nextBilling);

  // ===== Card mutations =====
  const normalizeDefault = (list: SavedCard[], preferredDefaultId?: string): SavedCard[] => {
    if (list.length === 0) return list;
    const chosenId = preferredDefaultId && list.some((c) => c.id === preferredDefaultId)
      ? preferredDefaultId
      : list.find((c) => c.isDefault)?.id ?? list[0].id;
    return list.map((c) => ({ ...c, isDefault: c.id === chosenId }));
  };
  const commitCards = (next: SavedCard[], preferredDefaultId?: string) => {
    setCards(normalizeDefault(next, preferredDefaultId));
  };

  const handleRemove = (id: string) => {
    if (outstandingBalance > 0 && cards.length <= 1) {
      toast({
        title: "Cannot remove card",
        description: "You must pay your outstanding balance before removing your last payment method.",
        variant: "destructive",
      });
      return;
    }
    const target = cards.find((c) => c.id === id);
    const remaining = cards.filter((c) => c.id !== id);
    commitCards(remaining);
    const newDefault = remaining.find((c) => c.id !== id && (c.isDefault || remaining.indexOf(c) === 0));
    toast({
      title: "Card removed.",
      description: target?.isDefault && newDefault
        ? `${newDefault.brand} •••• ${newDefault.last4} is now your default.`
        : undefined,
      variant: "success",
    });
  };

  const handleSetDefault = (id: string) => {
    const target = cards.find((c) => c.id === id);
    if (!target || target.isDefault) return;
    commitCards(cards, id);
    toast({
      title: "Default payment method updated.",
      description: `${target.brand} •••• ${target.last4} will be used for future charges.`,
      variant: "success",
    });
  };

  const handleAdd = () => {
    if (!newCard.number || !newCard.expiry) return;
    const last4 = newCard.number.replace(/\s/g, "").slice(-4);
    const newId = `card-${Date.now()}`;
    const isFirst = cards.length === 0;
    const next: SavedCard[] = [
      ...cards,
      { id: newId, last4, brand: "Card", expiry: newCard.expiry, isDefault: false },
    ];
    commitCards(next, isFirst ? newId : undefined);
    setNewCard({ number: "", expiry: "", cvc: "" });
    setShowAdd(false);
    toast({ title: "Card added.", variant: "success" });

    if (paymentState === "failed" || paymentState === "warning") {
      toast({ title: "Retrying payment with new card…" });
      setTimeout(() => {
        setPaymentState("healthy");
        setOutstandingBalance(0);
        toast({ title: "Payment recovered", description: "Your account is back in good standing.", variant: "success" });
      }, 900);
    }
  };

  const handleRetryPayment = () => {
    if (cards.length === 0) {
      setShowAdd(true);
      document.getElementById("payment-methods-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    toast({ title: "Retrying payment…" });
    setTimeout(() => {
      setPaymentState("healthy");
      setOutstandingBalance(0);
      toast({ title: "Payment recovered", description: "Your account is back in good standing.", variant: "success" });
    }, 900);
  };

  const handleCancelled = () => {
    toast({
      title: "Subscription cancelled",
      description: "Your recurring service will no longer renew.",
      variant: "success",
    });
  };

  const handleReactivate = async () => {
    try {
      await reactivate.mutateAsync();
      toast({ title: "Subscription reactivated", description: "Your plan is active again.", variant: "success" });
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : "Please try again.";
      toast({ title: "Couldn't reactivate", description: m, variant: "destructive" });
    }
  };

  const handlePaymentSuccess = () => {
    setInvoices([
      { id: `INV-${Math.floor(Math.random() * 999)}`, date: formatDate(new Date()), amount: outstandingBalance, status: "Paid" },
      ...invoices,
    ]);
    setOutstandingBalance(0);
    setPaymentState("healthy");
  };

  const handlePlanSaved = (next: MembershipConfig, _plan: ServicePlan) => {
    setMembership(next);
  };

  // Effective end of the current billing cycle (used as cancellation effective date).
  const effectiveEndIso = useMemo(() => {
    const end = new Date(nextBilling);
    end.setDate(end.getDate() - 1);
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  }, [nextBilling]);


  // ===== Banner config - now amount-aware =====
  const banner: { tone: string; icon: any; title: string; subtitle?: string; cta?: string; onCta?: () => void } | null =
    paymentState === "healthy"
      ? null
      : paymentState === "failed"
      ? {
          tone: "bg-amber-50 border-amber-200 text-amber-900",
          icon: AlertTriangle,
          title: "Payment issue detected",
          subtitle:
            outstandingBalance > 0
              ? `$${outstandingBalance.toFixed(0)} failed to process. Update your card or retry.`
              : "Please update your payment method.",
          cta: "Retry Payment",
          onCta: handleRetryPayment,
        }
      : paymentState === "warning"
      ? {
          tone: "bg-orange-50 border-orange-200 text-orange-900",
          icon: AlertTriangle,
          title: `$${outstandingBalance.toFixed(0)} overdue`,
          subtitle: "Pay now to avoid service pause.",
          cta: "Pay Now",
          onCta: () => setPayNowOpen(true),
        }
      : {
          tone: "bg-destructive/10 border-destructive/30 text-destructive",
          icon: XCircle,
          title: "Service paused",
          subtitle: `$${outstandingBalance.toFixed(0)} unpaid. Pay now to resume service.`,
          cta: "Pay Now",
          onCta: () => setPayNowOpen(true),
        };

  // Cycle running total
  const cycleRunningTotal = basePrice + frequencyUpgradeCost + addonsTotal + usage.extraVisitCharges;

  return (
    <>
      <main className="max-w-[760px] mx-auto px-5 py-8 pb-16 space-y-8">
        <div>
          <BackLink />
          <h1 className="text-2xl font-bold text-foreground">Payment & Membership</h1>
        </div>

        {/* A. Payment Status Banner */}
        {banner && (
          <div className={`rounded-2xl border ${banner.tone} p-4 flex items-start gap-3`}>
            <banner.icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{banner.title}</p>
              {banner.subtitle && <p className="text-sm mt-0.5 opacity-90">{banner.subtitle}</p>}
            </div>
            {banner.cta && (
              <Button size="sm" onClick={banner.onCta}>
                {banner.cta}
              </Button>
            )}
          </div>
        )}

        {/* B. Outstanding Balance */}
        {outstandingBalance > 0 && paymentState === "healthy" && (
          <section className="bg-card rounded-2xl border border-border shadow-sm p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              <p className="text-2xl font-bold text-foreground mt-1">${outstandingBalance.toFixed(2)}</p>
            </div>
            <Button onClick={() => setPayNowOpen(true)}>Pay Now</Button>
          </section>
        )}

        {/* C + D: Next Billing & This Cycle (now itemised) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Next Billing */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <p className="text-sm font-medium">Next Billing</p>
            </div>
            <p className="text-[15px] font-semibold text-foreground">{isCancelled ? "-" : nextDateStr}</p>
            <p className="text-sm text-muted-foreground">
              Estimated: <span className="text-foreground font-semibold">${monthlyTotal}</span>
            </p>
          </div>

          {/* This Billing Cycle */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <p className="text-sm font-medium">This Billing Cycle</p>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visits completed</span>
                <span className="font-medium text-foreground">{usage.visitsCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base plan</span>
                <span className="font-medium text-foreground tabular-nums">${basePrice}</span>
              </div>
              {frequencyUpgradeCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequency upgrade</span>
                  <span className="font-medium text-foreground tabular-nums">+${frequencyUpgradeCost}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Add-ons</span>
                <span className="font-medium text-foreground tabular-nums">${addonsTotal}</span>
              </div>
              {usage.extraVisitCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Extra visits</span>
                  <span className="font-medium text-foreground tabular-nums">+${usage.extraVisitCharges}</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 mt-1.5 border-t border-border">
                <span className="font-semibold text-foreground">Running total</span>
                <span className="font-bold text-foreground tabular-nums">${cycleRunningTotal}</span>
              </div>
            </div>
          </div>
        </section>

        {/* E. Payment Methods */}
        <section id="payment-methods-section" className="space-y-3">
          <h2 className="text-[17px] font-bold text-foreground">Payment Methods</h2>
          <div className="space-y-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CreditCard className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[15px] font-semibold text-foreground">
                        {card.brand} •••• {card.last4}
                      </p>
                      {card.isDefault && (
                        <span className="text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Expires {card.expiry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!card.isDefault && cards.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(card.id)}>
                      <Star className="h-4 w-4 mr-1" /> Set default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(card.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {showAdd ? (
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="4242 4242 4242 4242"
                    value={newCard.number}
                    onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={newCard.expiry}
                      onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      placeholder="123"
                      value={newCard.cvc}
                      onChange={(e) => setNewCard({ ...newCard, cvc: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAdd}>Add Card</Button>
                  <Button variant="outline" onClick={() => setShowAdd(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2 hover:bg-primary hover:text-primary-foreground hover:border-transparent"
                onClick={() => setShowAdd(true)}
              >
                <Plus className="h-4 w-4" /> Add New Card
              </Button>
            )}
          </div>
        </section>

        <Separator />

        {/* F. Membership */}
        <section className="space-y-4">
          <h2 className="text-[17px] font-bold text-foreground">Membership</h2>

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Top: status + price */}
            <div className="p-6">
              {isCancelled && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-sm mb-4 space-y-1">
                  <p className="font-semibold text-destructive">
                    {subStatus === "pending_cancellation" ? "Cancellation scheduled" : "Subscription cancelled"}
                  </p>
                  <p className="text-destructive/80">
                    {subStatus === "pending_cancellation"
                      ? `You keep service through ${formatEndDate(subscription?.effectiveEndDate ?? null)}. No future visits will be scheduled after that date.`
                      : `Ended on ${formatEndDate(subscription?.effectiveEndDate ?? null)}. No recurring service is scheduled.`}
                  </p>
                  {subscription?.cancellationReason && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Reason: {subscription.cancellationReason}
                    </p>
                  )}
                </div>
              )}


              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        subStatus === "cancelled"
                          ? "bg-destructive"
                          : subStatus === "pending_cancellation"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      aria-hidden
                    />
                    <span
                      className={`text-sm font-semibold ${
                        subStatus === "cancelled"
                          ? "text-destructive"
                          : subStatus === "pending_cancellation"
                          ? "text-amber-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {subStatus === "cancelled"
                        ? "Cancelled"
                        : subStatus === "pending_cancellation"
                        ? "Pending cancellation"
                        : "Active"}
                    </span>
                  </div>
                  <p className="text-[15px] font-semibold text-foreground">
                    {getFrequencyLabel(membership.frequency)} Pool Service
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getPoolSizeLabel(membership.poolSize)} ·{" "}
                    {isCancelled ? "Ends after current cycle" : `Renews ${nextDateShort}`} ·{" "}
                    Auto-renew {isCancelled ? "Off" : "On"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground tabular-nums leading-none">
                    ${monthlyTotal}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">/month</p>
                </div>
              </div>

              {/* Intro discount (contextual) */}
              {hasIntroDiscount && !isCancelled && (
                <div className="mt-4 flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-sm">
                  <BadgePercent className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-primary font-semibold">Intro discount applied (first billing only)</p>
                    <p className="text-primary/80 mt-0.5 text-xs">
                      Original: <span className="line-through">${checkoutData!.originalPrice}</span> · Discounted:{" "}
                      <span className="font-semibold">${checkoutData!.discountPrice}</span> · You saved ${voucherSavings}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Monthly Plan Breakdown */}
            <div className="p-6 space-y-3">
              <h3 className="text-[15px] font-semibold text-foreground">Monthly Plan Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Base Plan ({getPoolSizeLabel(membership.poolSize)}, {getFrequencyLabel(membership.frequency)})
                  </span>
                  <span className="font-medium text-foreground tabular-nums">${basePrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequency Upgrade</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {frequencyUpgradeCost > 0 ? `+$${frequencyUpgradeCost}` : "$0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Add-ons {activeAddons.length > 0 && `(${activeAddons.length})`}
                  </span>
                  <span className="font-medium text-foreground tabular-nums">${addonsTotal}</span>
                </div>
                <div className="flex justify-between pt-2.5 mt-1 border-t border-border">
                  <span className="font-semibold text-foreground">Estimated Total This Cycle</span>
                  <span className="font-bold text-foreground tabular-nums">${monthlyTotal}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Quick actions */}
            {!isCancelled && (
              <>
                <div className="p-6 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 hover:bg-primary hover:text-primary-foreground hover:border-transparent"
                    onClick={() => setManageOpen(true)}
                  >
                    <Repeat className="h-4 w-4" />
                    Change frequency
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 hover:bg-primary hover:text-primary-foreground hover:border-transparent"
                    onClick={() => setManageOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add services
                  </Button>
                </div>
                <Separator />
              </>
            )}

            {/* Primary actions */}
            <div className="p-6 space-y-3">
              <Button className="w-full" disabled={isCancelled} onClick={() => setManageOpen(true)}>
                <Settings2 className="h-4 w-4 mr-2" />
                {isCancelled ? "Membership Cancelled" : "Manage Plan"}
              </Button>
              {isCancelled ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleReactivate}
                  disabled={reactivate.isPending}
                >
                  {reactivate.isPending ? "Reactivating…" : "Reactivate plan"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground hover:border-transparent"
                  onClick={() => setCancelOpen(true)}
                >
                  Cancel Subscription
                </Button>
              )}
            </div>

          </div>
        </section>

        <Separator />

        {/* G. Payment History */}
        <section className="space-y-3">
          <h2 className="text-[17px] font-bold text-foreground">Payment History</h2>
          {invoices.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground text-sm">
              No invoices yet.
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              {invoices.map((inv, i) => {
                const StatusIcon =
                  inv.status === "Paid" ? CheckCircle2 : inv.status === "Failed" ? XCircle : Clock;
                const statusColor =
                  inv.status === "Paid"
                    ? "text-primary"
                    : inv.status === "Failed"
                    ? "text-destructive"
                    : "text-muted-foreground";
                return (
                  <div
                    key={inv.id}
                    className={`flex items-center justify-between p-4 ${i !== invoices.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{inv.date}</p>
                        <p className="text-xs text-muted-foreground">{inv.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-foreground">${inv.amount.toFixed(2)}</span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${statusColor}`}>
                        <StatusIcon className="h-3.5 w-3.5" /> {inv.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* DEV / TEST PANEL */}
        <section className="space-y-3">
          <details className="bg-muted/40 rounded-2xl border border-dashed border-border p-5">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">
              🧪 Test Panel - simulate payment states
            </summary>
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Account state</Label>
                  <Select value={paymentState} onValueChange={(v) => setPaymentState(v as PaymentState)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthy">Healthy (no banner)</SelectItem>
                      <SelectItem value="failed">Failed payment</SelectItem>
                      <SelectItem value="warning">Final warning</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Outstanding balance ($)</Label>
                  <Input
                    type="number"
                    value={outstandingBalance}
                    onChange={(e) => setOutstandingBalance(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-foreground">Test cards (use in Add Card → last 4 digits drive outcome)</p>
                <ul className="space-y-1 text-muted-foreground text-xs list-disc pl-5">
                  <li><code className="font-mono">4242 4242 4242 4242</code> → success</li>
                  <li><code className="font-mono">4000 0000 0000 0002</code> → declined / failed</li>
                  <li><code className="font-mono">4000 0025 0000 3155</code> → 3D Secure required</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => { setOutstandingBalance(95); setPaymentState("failed"); }}>
                  Simulate failed payment
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setOutstandingBalance(190); setPaymentState("warning"); }}>
                  Simulate final warning
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setOutstandingBalance(285); setPaymentState("suspended"); }}>
                  Simulate suspension
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setOutstandingBalance(0); setPaymentState("healthy"); }}>
                  Reset to healthy
                </Button>
              </div>
            </div>
          </details>
        </section>

        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <Link to="/terms" className="text-primary hover:underline">Terms</Link>
          <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
          <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
        </footer>
      </main>

      <ManageMembershipModal
        open={manageOpen}
        onOpenChange={setManageOpen}
        nextServiceDate={nextDateStr}
        current={membership}
        onCancelled={handleCancelled}
        onSaved={handlePlanSaved}
      />

      <PayNowModal
        open={payNowOpen}
        onOpenChange={setPayNowOpen}
        amount={outstandingBalance}
        cards={cards}
        defaultCardId={cards.find((c) => c.isDefault)?.id}
        onSuccess={handlePaymentSuccess}
      />

      <CancelSubscriptionModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        breakdown={{
          servicesCompleted: usage.visitsCompleted,
          serviceCharges: basePrice + frequencyUpgradeCost,
          addOnsCharges: addonsTotal,
          penalty: 0,
        }}
        onConfirmed={handleCancelled}
      />
    </>
  );
};

export default PaymentMethods;
