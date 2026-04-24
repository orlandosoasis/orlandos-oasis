import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useBooking } from "@/contexts/BookingContext";
import ManageMembershipModal, { type ServicePlan } from "@/components/ManageMembershipModal";
import PayNowModal from "@/components/PayNowModal";
import CancelSubscriptionModal from "@/components/CancelSubscriptionModal";

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

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  "twice-weekly": "Twice per week",
  "three-weekly": "Three times per week",
  biweekly: "Every two weeks",
  monthly: "Monthly",
  once: "One-time",
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
  const [cancelled, setCancelled] = useState(false);
  const [overridePlan, setOverridePlan] = useState<ServicePlan | null>(null);

  // ===== Test / dev simulators =====
  const [paymentState, setPaymentState] = useState<PaymentState>("healthy");
  const [outstandingBalance, setOutstandingBalance] = useState<number>(0);
  const [payNowOpen, setPayNowOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  // Mock usage data (would come from service_completions)
  const [usage] = useState({
    servicesCompleted: 3,
    estimatedCharges: 285,
    addOnsTotal: 45,
  });

  // Mock invoices (would come from /invoices)
  const [invoices, setInvoices] = useState<InvoiceRow[]>([
    { id: "INV-104", date: "Mar 15, 2026", amount: 95, status: "Paid" },
    { id: "INV-103", date: "Feb 15, 2026", amount: 95, status: "Paid" },
    { id: "INV-102", date: "Jan 15, 2026", amount: 95, status: "Paid" },
  ]);

  const isMonthly = booking?.frequency === "monthly";
  const d = booking?.scheduleData?.selectedDate || new Date();

  const planName =
    overridePlan?.name ||
    checkoutData?.serviceName ||
    booking?.selectedPass?.label ||
    booking?.selectedPlan?.label ||
    "Pool Care Membership";
  const discountPrice = overridePlan
    ? overridePlan.discountPrice
    : checkoutData?.discountPrice ?? booking?.selectedPass?.discountPrice ?? null;
  const originalPrice = overridePlan
    ? overridePlan.originalPrice
    : checkoutData?.originalPrice ?? booking?.selectedPass?.originalPrice ?? null;
  const hasVoucher = discountPrice !== null && originalPrice !== null && discountPrice < originalPrice;
  const savings = hasVoucher ? originalPrice! - discountPrice! : 0;
  const frequency = overridePlan?.frequency || checkoutData?.frequency || booking?.frequency || "weekly";
  const frequencyLabel = FREQUENCY_LABELS[frequency] || frequency;

  const formatDate = (date: Date) =>
    `${FULL_DAYS[date.getDay()]}, ${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

  const getNextBillingDate = () => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return formatDate(next);
  };
  const nextDateStr = getNextBillingDate();

  const handleRemove = (id: string) => {
    // Block removing the last available card while a balance is owed
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
    // Promote a new default if the removed card was the default
    if (target?.isDefault && remaining.length > 0 && !remaining.some((c) => c.isDefault)) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }
    setCards(remaining);
    toast({
      title: "Card removed.",
      description: target?.isDefault && remaining.length > 0
        ? `${remaining[0].brand} •••• ${remaining[0].last4} is now your default.`
        : undefined,
      variant: "success",
    });
  };

  const handleSetDefault = (id: string) => {
    const target = cards.find((c) => c.id === id);
    if (!target || target.isDefault) return;
    setCards(cards.map((c) => ({ ...c, isDefault: c.id === id })));
    toast({
      title: "Default payment method updated.",
      description: `${target.brand} •••• ${target.last4} will be used for future charges.`,
      variant: "success",
    });
  };

  const handleAdd = () => {
    if (!newCard.number || !newCard.expiry) return;
    const last4 = newCard.number.replace(/\s/g, "").slice(-4);
    const isFirst = cards.length === 0;
    setCards([
      ...cards,
      { id: `card-${Date.now()}`, last4, brand: "Card", expiry: newCard.expiry, isDefault: isFirst },
    ]);
    setNewCard({ number: "", expiry: "", cvc: "" });
    setShowAdd(false);
    toast({ title: "Card added.", variant: "success" });

    // Flow 1: if there's a failed payment, retry immediately
    if (paymentState === "failed" || paymentState === "warning") {
      toast({ title: "Retrying payment with new card…" });
      setTimeout(() => {
        setPaymentState("healthy");
        setOutstandingBalance(0);
        toast({ title: "Payment recovered", description: "Your account is back in good standing.", variant: "success" });
      }, 900);
    }
  };

  const handleCancelled = () => {
    setCancelled(true);
    toast({
      title: "Membership cancelled successfully",
      description: "Your recurring service will no longer renew.",
    });
  };

  const handlePaymentSuccess = () => {
    setOutstandingBalance(0);
    setPaymentState("healthy");
    setInvoices([
      { id: `INV-${Math.floor(Math.random() * 999)}`, date: formatDate(new Date()), amount: outstandingBalance, status: "Paid" },
      ...invoices,
    ]);
  };

  // ===== Banner config =====
  const bannerConfig: Record<PaymentState, { tone: string; icon: any; title: string; cta?: string } | null> = {
    healthy: null,
    failed: {
      tone: "bg-amber-50 border-amber-200 text-amber-900",
      icon: AlertTriangle,
      title: "Payment issue detected. Please update your payment method.",
      cta: "Update Payment Method",
    },
    warning: {
      tone: "bg-orange-50 border-orange-200 text-orange-900",
      icon: AlertTriangle,
      title: "Payment overdue. Service may be paused soon.",
      cta: "Pay Now",
    },
    suspended: {
      tone: "bg-destructive/10 border-destructive/30 text-destructive",
      icon: XCircle,
      title: "Your service is paused due to unpaid balance.",
      cta: "Pay Now",
    },
  };
  const banner = bannerConfig[paymentState];

  return (
    <>
      <main className="max-w-[760px] mx-auto px-5 py-8 pb-16 space-y-8">
        <h1 className="text-2xl font-bold text-foreground">Payment & Membership</h1>

        {/* A. Payment Status Banner */}
        {banner && (
          <div className={`rounded-2xl border ${banner.tone} p-4 flex items-start gap-3`}>
            <banner.icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{banner.title}</p>
            </div>
            {banner.cta && (
              <Button
                size="sm"
                onClick={() => {
                  if (banner.cta === "Update Payment Method") {
                    setShowAdd(true);
                    document.getElementById("payment-methods-section")?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    setPayNowOpen(true);
                  }
                }}
              >
                {banner.cta}
              </Button>
            )}
          </div>
        )}

        {/* B. Outstanding Balance */}
        {outstandingBalance > 0 && (
          <section className="bg-card rounded-2xl border border-border shadow-sm p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              <p className="text-2xl font-bold text-foreground mt-1">${outstandingBalance.toFixed(2)}</p>
            </div>
            <Button onClick={() => setPayNowOpen(true)}>Pay Now</Button>
          </section>
        )}

        {/* C + D: Next Billing & This Cycle */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <p className="text-sm font-medium">Next Billing</p>
            </div>
            <p className="text-[15px] font-semibold text-foreground">{cancelled ? "—" : nextDateStr}</p>
            <p className="text-sm text-muted-foreground">
              Estimated: <span className="text-foreground font-medium">${originalPrice ?? "—"}</span>
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wrench className="h-4 w-4" />
              <p className="text-sm font-medium">This Billing Cycle</p>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Services completed</span>
                <span className="font-medium text-foreground">{usage.servicesCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated charges</span>
                <span className="font-medium text-foreground">${usage.estimatedCharges}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Add-ons used</span>
                <span className="font-medium text-foreground">${usage.addOnsTotal}</span>
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

          {isMonthly ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 space-y-3">
                <h3 className="text-[15px] font-semibold text-foreground">Membership Status</h3>

                {cancelled && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm">
                    <p className="font-medium text-destructive">Your membership has been cancelled.</p>
                    <p className="text-destructive/80 mt-1">No future recurring services will be scheduled.</p>
                  </div>
                )}

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium text-foreground">{planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency</span>
                    <span className="font-medium text-foreground">{frequencyLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium text-foreground">${originalPrice ?? "—"}/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract</span>
                    <span className="font-medium text-foreground">Month-to-month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium ${cancelled ? "text-destructive" : "text-primary"}`}>
                      {cancelled ? "Cancelled" : "Active"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auto-renew</span>
                    <span className="font-medium text-foreground">{cancelled ? "No" : "Yes"}</span>
                  </div>
                </div>

                {hasVoucher && !cancelled && (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-sm">
                    <BadgePercent className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-primary font-medium">${savings} discount applied to first month</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="p-6 space-y-3">
                <Button className="w-full" disabled={cancelled} onClick={() => setManageOpen(true)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {cancelled ? "Membership Cancelled" : "Manage Plan"}
                </Button>
                {!cancelled && (
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
          ) : (
            <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No active membership found.</p>
            </div>
          )}
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
              🧪 Test Panel — simulate payment states
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
                <Button size="sm" variant="outline" onClick={() => { setOutstandingBalance(190); setPaymentState("suspended"); }}>
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
        onCancelled={handleCancelled}
        onPlanChanged={(plan) => {
          setOverridePlan(plan);
          setCancelled(false);
        }}
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
          servicesCompleted: usage.servicesCompleted,
          serviceCharges: usage.estimatedCharges,
          addOnsCharges: usage.addOnsTotal,
          penalty: 0,
        }}
        onConfirmed={handleCancelled}
      />
    </>
  );
};

export default PaymentMethods;
