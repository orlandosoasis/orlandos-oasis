import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check, ArrowLeft, CreditCard, CheckCircle2, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useBooking, matchTechnician } from "@/contexts/BookingContext";
import type { PassOption, MonthlyPlan, CleaningFrequency, Recurrence, TimeWindow, AccessMethod, ScheduleData } from "@/contexts/BookingContext";

/* ── Duration options (one-time) ── */
const DURATION_OPTIONS: PassOption[] = [
  { id: "hrs-2", hours: 2, label: "2-Hour Pool Service", description: "Quick maintenance — skim, brush & chemical check", originalPrice: 89, discountPrice: 89, percentOff: 0, isMostPopular: false },
  { id: "hrs-3", hours: 3, label: "3-Hour Pool Service", description: "Full clean — skim, vacuum, brush, chemicals & filter rinse", originalPrice: 129, discountPrice: 129, percentOff: 0, isMostPopular: true },
  { id: "hrs-4", hours: 4, label: "4-Hour Pool Service", description: "Deep service — thorough vacuum, tile scrub & full chemical balance", originalPrice: 169, discountPrice: 169, percentOff: 0, isMostPopular: false },
  { id: "hrs-6", hours: 6, label: "6-Hour Pool Service", description: "Complete restoration — ideal for neglected or green pools", originalPrice: 249, discountPrice: 249, percentOff: 0, isMostPopular: false },
];

/* ── Monthly plans ── */
const MONTHLY_PLANS: MonthlyPlan[] = [
  { id: "basic", label: "Basic Monthly", description: "Skim, brush & chemical check every visit", monthlyPrice: 149, isMostPopular: false },
  { id: "standard", label: "Standard Monthly", description: "Full clean — vacuum, brush, chemicals & filter rinse", monthlyPrice: 219, isMostPopular: true },
  { id: "premium", label: "Premium Monthly", description: "Complete care — deep vacuum, tile scrub, filter & chemical balance", monthlyPrice: 319, isMostPopular: false },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_LABELS: Record<string, string> = {
  morning: "8:00 AM – 12:00 PM",
  afternoon: "12:00 PM – 4:00 PM",
  evening: "4:00 PM – 6:00 PM",
};

interface BookingFlowProps {
  onClose: () => void;
  onComplete: () => void;
}

const BookingFlow = ({ onClose, onComplete }: BookingFlowProps) => {
  const { setBooking } = useBooking();
  const [step, setStep] = useState(1);

  // Step 1 — Frequency & Plan & Schedule
  const [frequency, setFrequency] = useState<CleaningFrequency>("once");
  const [selectedDuration, setSelectedDuration] = useState<string>("hrs-3");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("standard");
  const [recurrence, setRecurrence] = useState<Recurrence>("biweekly");

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("morning");

  // Step 2 — Pool / Property
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>("pool-1");
  const [showNewPool, setShowNewPool] = useState(false);
  const [address, setAddress] = useState("123 Main Street");
  const [city, setCity] = useState("Miami");
  const [state, setState] = useState("FL");
  const [zip, setZip] = useState("33101");
  const [poolType, setPoolType] = useState("Inground");
  const [poolSize, setPoolSize] = useState("Small (<10k gal)");
  const [accessMethod, setAccessMethod] = useState<AccessMethod>("home");
  const [gateCode, setGateCode] = useState("");
  const [gateNotes, setGateNotes] = useState("");
  const [keyLocation, setKeyLocation] = useState("");
  const [otherInstructions, setOtherInstructions] = useState("");

  // Step 3 — Notes + Payment
  const [specialNotes, setSpecialNotes] = useState("");
  type PaymentMethod = "google_pay" | "card" | "paypal";
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [savePayment, setSavePayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Mock existing pools
  const existingPools = [
    { id: "pool-1", label: "Pool A — 123 Main St", address: "123 Main Street", city: "Miami", state: "FL", zip: "33101", poolType: "Inground", poolSize: "Medium (10–20k)", accessMethod: "home" as AccessMethod, accessDetail: "" },
  ];

  const selectedPass = DURATION_OPTIONS.find(o => o.id === selectedDuration)!;
  const selectedPlan = MONTHLY_PLANS.find(p => p.id === selectedPlanId)!;
  const totalPrice = frequency === "once" ? selectedPass.discountPrice : selectedPlan.monthlyPrice;

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const isPrevDisabled = calYear === today.getFullYear() && calMonth === today.getMonth();
  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); };

  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) {
      if (showNewPool) {
        if (!address.trim()) return false;
        if (accessMethod === "gate" && !gateCode.trim()) return false;
        if (accessMethod === "key" && !keyLocation.trim()) return false;
        if (accessMethod === "other" && !otherInstructions.trim()) return false;
      }
      return true;
    }
    if (step === 3) return !!paymentMethod;
    return true;
  };

  // Get next billing date (one month from start)
  const getNextBillingDate = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + 1);
    return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const getAccessDetail = () => {
    if (accessMethod === "gate") return gateCode + (gateNotes ? ` · ${gateNotes}` : "");
    if (accessMethod === "key") return keyLocation;
    if (accessMethod === "other") return otherInstructions;
    return "";
  };

  const handlePayment = async () => {
    if (!paymentMethod) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2200));
    setIsProcessing(false);
    setPaymentSuccess(true);

    const scheduleData: ScheduleData = {
      selectedDate,
      timeWindow,
      accessMethod,
      accessDetail: getAccessDetail(),
      addons: [],
      addonsTotal: 0,
    };

    setBooking({
      frequency,
      selectedPass: frequency === "once" ? selectedPass : { ...selectedPass, label: selectedPlan.label, discountPrice: selectedPlan.monthlyPrice, originalPrice: selectedPlan.monthlyPrice },
      selectedPlan: frequency === "monthly" ? selectedPlan : undefined,
      recurrence: frequency === "monthly" ? recurrence : undefined,
      scheduleData,
      technician: matchTechnician(),
      specialNotes: specialNotes || undefined,
    });
  };

  const TOTAL_STEPS = 3;
  const STEP_LABELS = ["Service Setup", "Pool / Property", "Notes & Payment"];

  // Success screen
  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <div className="max-w-[760px] mx-auto px-5 py-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mb-5">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            {frequency === "once" ? "Payment Successful!" : "Monthly Plan Started!"}
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            {frequency === "once" ? "Your pool service has been booked." : "Your recurring pool service is set up."}
          </p>

          <div className="w-full bg-card rounded-2xl border border-border p-6 shadow-sm text-left space-y-3 mb-8">
            <h3 className="text-sm font-semibold text-foreground mb-3">Booking Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium text-foreground">{frequency === "once" ? selectedPass.label : selectedPlan.label}</span>
            </div>
            {frequency === "monthly" && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recurrence</span>
                <span className="font-medium text-foreground capitalize">{recurrence}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{frequency === "once" ? "Date" : "Start Date"}</span>
              <span className="font-medium text-foreground">{FULL_DAYS[selectedDate.getDay()]}, {MONTHS[selectedDate.getMonth()].slice(0, 3)} {selectedDate.getDate()}, {selectedDate.getFullYear()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Arrival Window</span>
              <span className="font-medium text-foreground">{TIME_LABELS[timeWindow]}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-sm">
              <span className="font-semibold text-foreground">{frequency === "once" ? "Total Paid" : "Today's Charge"}</span>
              <span className="text-lg font-bold text-primary">${totalPrice}</span>
            </div>
            {frequency === "monthly" && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Next billing</span>
                <span className="font-medium text-foreground">{getNextBillingDate()}</span>
              </div>
            )}
          </div>

          <Button onClick={() => onComplete()} className="w-full h-14 text-[17px] font-bold rounded-2xl shadow-lg">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-[760px] mx-auto px-5 h-[56px] flex items-center gap-3">
          <button onClick={step === 1 ? onClose : () => setStep(step - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground flex-1">Book a Service</span>
          <span className="text-xs text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
        </div>
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[760px] mx-auto px-5 py-6 pb-32">

        {/* ── Step 1: Service Setup ── */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* Frequency */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">How often do you need service?</h2>
              <p className="text-sm text-muted-foreground mb-4">This determines your pricing and scheduling options.</p>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { value: "once" as const, label: "Clean once", desc: "One-time service" },
                  { value: "monthly" as const, label: "Clean monthly", desc: "Recurring plan" },
                ] as const).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setFrequency(opt.value)}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 py-5 px-3 transition-all text-center ${
                      frequency === opt.value ? "border-primary bg-primary/[0.07]" : "border-border hover:border-primary/40 hover:bg-primary/5"
                    }`}>
                    <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic: One-time duration OR Monthly plans */}
            {frequency === "once" ? (
              <div>
                <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">SERVICE DURATION</p>
                <div className="flex flex-col gap-2.5">
                  {DURATION_OPTIONS.map(opt => {
                    const isSelected = selectedDuration === opt.id;
                    return (
                      <button key={opt.id} type="button" onClick={() => setSelectedDuration(opt.id)}
                        className={`relative flex items-center gap-3.5 rounded-xl border-2 p-4 transition-all text-left select-none ${
                          isSelected ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/40 hover:bg-primary/5"
                        }`}>
                        <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"
                        }`}>
                          <Check className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-foreground">{opt.hours} Hours</span>
                            {opt.isMostPopular && (
                              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">Most Popular</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{opt.description}</p>
                        </div>
                        <span className="text-lg font-bold text-primary whitespace-nowrap">${opt.discountPrice}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">MONTHLY PLAN</p>
                  <div className="flex flex-col gap-2.5">
                    {MONTHLY_PLANS.map(plan => {
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <button key={plan.id} type="button" onClick={() => setSelectedPlanId(plan.id)}
                          className={`relative flex items-center gap-3.5 rounded-xl border-2 p-4 transition-all text-left select-none ${
                            isSelected ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/40 hover:bg-primary/5"
                          }`}>
                          <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"
                          }`}>
                            <Check className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-foreground">{plan.label}</span>
                              {plan.isMostPopular && (
                                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">Most Popular</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{plan.description}</p>
                          </div>
                          <span className="text-lg font-bold text-primary whitespace-nowrap">${plan.monthlyPrice}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">RECURRENCE</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {([
                      { value: "weekly" as const, label: "Weekly" },
                      { value: "biweekly" as const, label: "Biweekly" },
                    ]).map(opt => (
                      <button key={opt.value} type="button" onClick={() => setRecurrence(opt.value)}
                        className={`flex items-center justify-center rounded-xl border-2 py-3.5 px-3 transition-all text-center ${
                          recurrence === opt.value ? "border-primary bg-primary/[0.07]" : "border-border hover:border-primary/40 hover:bg-primary/5"
                        }`}>
                        <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Date picker */}
            <div>
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">
                {frequency === "once" ? "SERVICE DATE" : "START DATE"}
              </p>
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3.5">
                  <button onClick={prevMonth} disabled={isPrevDisabled} className="w-[30px] h-[30px] rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[15px] font-semibold text-foreground">{MONTHS[calMonth]} {calYear}</span>
                  <button onClick={nextMonth} className="w-[30px] h-[30px] rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map(d => (
                    <div key={d} className="text-center text-[10px] font-medium tracking-[0.6px] text-muted-foreground py-1 pb-2">{d}</div>
                  ))}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const thisDate = new Date(calYear, calMonth, day);
                    const isPast = thisDate < today;
                    const isSelected = isSameDay(thisDate, selectedDate);
                    return (
                      <button key={day} disabled={isPast} onClick={() => !isPast && setSelectedDate(thisDate)}
                        className={`aspect-square flex items-center justify-center rounded-[10px] text-[13px] transition-all border-2 ${
                          isPast ? "text-muted-foreground/25 cursor-not-allowed border-transparent" :
                          isSelected ? "bg-primary text-primary-foreground font-semibold border-primary shadow-md" :
                          "text-foreground border-transparent hover:bg-primary/10 hover:text-primary cursor-pointer"
                        }`}>
                        {day}
                      </button>
                    );
                  })}
                </div>
                <p className="flex items-center gap-1.5 text-secondary-foreground text-sm mt-4">
                  Selected: <strong>{MONTHS[selectedDate.getMonth()].slice(0, 3)} {selectedDate.getDate()}, {selectedDate.getFullYear()} — {FULL_DAYS[selectedDate.getDay()]}</strong>
                </p>
              </div>
            </div>

            {/* Arrival window */}
            <div>
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">
                {frequency === "once" ? "ARRIVAL WINDOW" : "PREFERRED ARRIVAL WINDOW"}
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {([
                  { value: "morning" as const, icon: "🌅", label: "8am–12pm" },
                  { value: "afternoon" as const, icon: "☀️", label: "12pm–4pm" },
                  { value: "evening" as const, icon: "🌤️", label: "4pm–6pm" },
                ]).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setTimeWindow(opt.value)}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 py-5 px-2 transition-all text-center ${
                      timeWindow === opt.value ? "border-primary bg-primary/[0.07] text-primary" : "border-border hover:border-primary/40 hover:bg-primary/5"
                    }`}>
                    <span className="text-2xl mb-1.5">{opt.icon}</span>
                    <span className="text-[15px] font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Pool / Property ── */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Pool & Property</h2>
              <p className="text-sm text-muted-foreground">Select an existing pool or add a new one.</p>
            </div>

            {/* Pool selector */}
            <div className="flex flex-col gap-2.5">
              {existingPools.map(pool => (
                <button key={pool.id} type="button"
                  onClick={() => { setSelectedPoolId(pool.id); setShowNewPool(false); }}
                  className={`flex items-center gap-3.5 rounded-xl border-2 p-4 transition-all text-left select-none ${
                    selectedPoolId === pool.id && !showNewPool ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/40 hover:bg-primary/5"
                  }`}>
                  <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selectedPoolId === pool.id && !showNewPool ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"
                  }`}>
                    <Check className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{pool.label}</p>
                    <p className="text-xs text-muted-foreground">{pool.poolType} · {pool.poolSize}</p>
                  </div>
                </button>
              ))}

              <button type="button"
                onClick={() => { setShowNewPool(true); setSelectedPoolId(null); }}
                className={`flex items-center gap-3.5 rounded-xl border-2 p-4 transition-all text-left select-none ${
                  showNewPool ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/40 hover:bg-primary/5"
                }`}>
                <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  showNewPool ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"
                }`}>
                  <Check className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Add New Pool</p>
                  <p className="text-xs text-muted-foreground">Enter a new property and pool details</p>
                </div>
              </button>
            </div>

            {/* New pool form */}
            {showNewPool && (
              <div className="space-y-5 animate-fade-in">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">ADDRESS</p>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Street Address</label>
                      <Input placeholder="Street address" value={address} onChange={e => setAddress(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">City</label>
                        <Input placeholder="City" value={city} onChange={e => setCity(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">State</label>
                        <Input placeholder="State" value={state} onChange={e => setState(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">ZIP</label>
                        <Input placeholder="ZIP" value={zip} onChange={e => setZip(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">POOL DETAILS</p>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Pool Type</label>
                      <select value={poolType} onChange={e => setPoolType(e.target.value)}
                        className="h-10 rounded-[10px] border-2 border-border bg-muted/30 px-3 text-sm text-foreground outline-none focus:border-primary/40 focus:bg-background transition-colors appearance-none">
                        <option>Inground</option><option>Above Ground</option><option>Lap Pool</option><option>Spa / Hot Tub</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Pool Size</label>
                      <select value={poolSize} onChange={e => setPoolSize(e.target.value)}
                        className="h-10 rounded-[10px] border-2 border-border bg-muted/30 px-3 text-sm text-foreground outline-none focus:border-primary/40 focus:bg-background transition-colors appearance-none">
                        <option>Small (&lt;10k gal)</option><option>Medium (10–20k)</option><option>Large (20k+)</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">POOL ACCESS</p>
                    <p className="text-[13px] text-muted-foreground mb-3">How will we access your pool?</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {([
                        { value: "home" as const, icon: "🏠", label: "I will be home" },
                        { value: "gate" as const, icon: "🔢", label: "Gate code provided" },
                        { value: "key" as const, icon: "🗝️", label: "Key on property" },
                        { value: "other" as const, icon: "📝", label: "Other instructions" },
                      ]).map(opt => (
                        <button key={opt.value} type="button" onClick={() => setAccessMethod(opt.value)}
                          className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-3.5 transition-all text-left ${
                            accessMethod === opt.value ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/40 hover:bg-primary/5"
                          }`}>
                          <span className="text-xl leading-none">{opt.icon}</span>
                          <span className="text-[13px] font-medium text-foreground leading-snug">{opt.label}</span>
                        </button>
                      ))}
                    </div>

                    {accessMethod === "gate" && (
                      <div className="mt-3.5 flex flex-col gap-2.5 animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Gate Code <span className="text-destructive">*</span></label>
                          <Input placeholder="e.g. 4821" value={gateCode} onChange={e => setGateCode(e.target.value)} maxLength={12} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Additional gate notes (optional)</label>
                          <Input placeholder="e.g. Blue door on left side" value={gateNotes} onChange={e => setGateNotes(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                        </div>
                      </div>
                    )}
                    {accessMethod === "key" && (
                      <div className="mt-3.5 animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Where is the key? <span className="text-destructive">*</span></label>
                          <Input placeholder="e.g. Under the welcome mat" value={keyLocation} onChange={e => setKeyLocation(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                        </div>
                      </div>
                    )}
                    {accessMethod === "other" && (
                      <div className="mt-3.5 animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Access Instructions <span className="text-destructive">*</span></label>
                          <Textarea placeholder="Describe how to access the pool…" value={otherInstructions} onChange={e => setOtherInstructions(e.target.value)} rows={3} className="rounded-[10px] border-2 border-border bg-muted/30 text-sm resize-y min-h-[72px]" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Notes + Payment ── */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Notes & Payment</h2>
              <p className="text-sm text-muted-foreground">Add any special instructions and complete your booking.</p>
            </div>

            {/* Special Notes */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">SPECIAL NOTES (OPTIONAL)</p>
              <Textarea
                placeholder="Anything your technician should know…"
                value={specialNotes}
                onChange={e => setSpecialNotes(e.target.value)}
                rows={3}
                className="rounded-[10px] border-2 border-border bg-muted/30 text-sm resize-y min-h-[72px]"
              />
            </div>

            {/* Order summary */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-3">ORDER SUMMARY</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{frequency === "once" ? selectedPass.label : selectedPlan.label}</span>
                  <span className="font-medium text-foreground">${totalPrice}{frequency === "monthly" ? "/mo" : ""}</span>
                </div>
                {frequency === "monthly" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recurrence</span>
                      <span className="font-medium text-foreground capitalize">{recurrence}</span>
                    </div>
                  </>
                )}
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold text-foreground">
                    {frequency === "once" ? "Total" : "Today's charge"}
                  </span>
                  <span className="text-lg font-bold text-primary">${totalPrice}</span>
                </div>
                {frequency === "monthly" && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Ongoing monthly charge</span>
                      <span className="font-medium text-foreground">${selectedPlan.monthlyPrice}/mo</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Next billing date</span>
                      <span className="font-medium text-foreground">{getNextBillingDate()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment methods */}
            <div className="flex flex-col gap-2.5">
              {([
                { value: "google_pay" as const, icon: "🅖", label: "Google Pay", sub: "Fast & secure checkout" },
                { value: "card" as const, icon: "💳", label: "Credit / Debit Card", sub: "Visa, Mastercard, Amex" },
                { value: "paypal" as const, icon: "🅿️", label: "PayPal", sub: "Pay with your PayPal account" },
              ]).map(opt => {
                const isSelected = paymentMethod === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => setPaymentMethod(opt.value)}
                    className={`flex items-center gap-3.5 rounded-xl border-2 p-4 transition-all text-left select-none ${
                      isSelected ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/40 hover:bg-primary/5"
                    }`}>
                    <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"
                    }`}>
                      <Check className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.sub}</p>
                    </div>
                    <span className="text-xl">{opt.icon}</span>
                  </button>
                );
              })}
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border p-4 cursor-pointer hover:bg-muted/30 transition-colors">
              <Checkbox checked={savePayment} onCheckedChange={(v) => setSavePayment(v === true)} />
              <div>
                <p className="text-sm font-medium text-foreground">Save this payment method</p>
                <p className="text-xs text-muted-foreground">For faster checkout on future bookings</p>
              </div>
            </label>

            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span>Your payment info is encrypted and securely processed.</span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-[760px] mx-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              {frequency === "once" ? `${selectedPass.hours}h service` : `${selectedPlan.label}`}
            </span>
            <span className="text-lg font-bold text-foreground">${totalPrice}{frequency === "monthly" ? "/mo" : ""}</span>
          </div>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="w-full h-12 text-[15px] font-bold rounded-xl">
              Continue
            </Button>
          ) : (
            <Button onClick={handlePayment} disabled={!canProceed() || isProcessing} className="w-full h-14 text-[17px] font-bold rounded-2xl shadow-lg">
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Processing…
                </span>
              ) : frequency === "once" ? (
                `Pay $${totalPrice}`
              ) : (
                "Start Monthly Plan"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;
