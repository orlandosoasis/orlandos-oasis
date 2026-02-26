import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check, ArrowLeft, CreditCard, CheckCircle2, Loader2, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useBooking, matchTechnician } from "@/contexts/BookingContext";
import type { PassOption, CleaningFrequency, TimeWindow, AccessMethod, ScheduleData } from "@/contexts/BookingContext";

/* ── Duration options (one-time) ── */
const DURATION_OPTIONS: PassOption[] = [
  { id: "hrs-2", hours: 2, label: "2-Hour Pool Service", description: "Quick maintenance — skim, brush & chemical check", originalPrice: 89, discountPrice: 89, percentOff: 0, isMostPopular: false },
  { id: "hrs-3", hours: 3, label: "3-Hour Pool Service", description: "Full clean — skim, vacuum, brush, chemicals & filter rinse", originalPrice: 129, discountPrice: 129, percentOff: 0, isMostPopular: true },
  { id: "hrs-4", hours: 4, label: "4-Hour Pool Service", description: "Deep service — thorough vacuum, tile scrub & full chemical balance", originalPrice: 169, discountPrice: 169, percentOff: 0, isMostPopular: false },
  { id: "hrs-6", hours: 6, label: "6-Hour Pool Service", description: "Complete restoration — ideal for neglected or green pools", originalPrice: 249, discountPrice: 249, percentOff: 0, isMostPopular: false },
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
  const [frequency, setFrequency] = useState<CleaningFrequency>("monthly");
  const [selectedDuration, setSelectedDuration] = useState<string>("hrs-3");

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("morning");

  // Step 2 — Pool / Property
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
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
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const selectedPass = DURATION_OPTIONS.find(o => o.id === selectedDuration)!;
  const totalPrice = selectedPass.discountPrice;

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
      if (!address.trim()) return false;
      if (accessMethod === "gate" && !gateCode.trim()) return false;
      if (accessMethod === "key" && !keyLocation.trim()) return false;
      if (accessMethod === "other" && !otherInstructions.trim()) return false;
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
      selectedPass,
      recurrence: frequency === "monthly" ? "monthly" : undefined,
      scheduleData,
      technician: matchTechnician(),
      specialNotes: specialNotes || undefined,
      pool: {
        address,
        city,
        state,
        zip,
        poolType,
        poolSize,
        accessMethod,
        accessDetail: getAccessDetail(),
      },
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
              <span className="font-medium text-foreground">{selectedPass.label}</span>
            </div>
            {frequency === "monthly" && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recurrence</span>
                <span className="font-medium text-foreground">Monthly</span>
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
                        <span className="text-lg font-bold text-primary whitespace-nowrap">${opt.discountPrice}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                      </button>
                    );
                  })}
                </div>
              </div>
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
              <p className="text-sm text-muted-foreground">Enter your pool details below.</p>
            </div>

            <div className="space-y-5">
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

                {/* Cleaning Notes */}
                <div className="mt-5">
                  <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">CLEANING NOTES (OPTIONAL)</p>
                  <Textarea
                    placeholder="Anything the technician should know about your pool?"
                    value={specialNotes}
                    onChange={e => setSpecialNotes(e.target.value)}
                    rows={3}
                    className="rounded-[10px] border-2 border-border bg-muted/30 text-sm resize-y min-h-[72px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Payment ── */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Review & Pay</h2>
              <p className="text-sm text-muted-foreground">Confirm your details and complete your booking.</p>
            </div>

            {/* Service & Pool Details */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-3">SERVICE DETAILS</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium text-foreground">{selectedPass.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="font-medium text-foreground">{frequency === "monthly" ? "Monthly" : "One-time"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{frequency === "once" ? "Date" : "Start date"}</span>
                  <span className="font-medium text-foreground">{FULL_DAYS[selectedDate.getDay()]}, {MONTHS[selectedDate.getMonth()].slice(0, 3)} {selectedDate.getDate()}, {selectedDate.getFullYear()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Arrival window</span>
                  <span className="font-medium text-foreground">{TIME_LABELS[timeWindow]}</span>
                </div>
              </div>

              <div className="border-t border-border my-4" />

              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-3">POOL DETAILS</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium text-foreground text-right max-w-[60%]">{[address, city, state, zip].filter(Boolean).join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pool type</span>
                  <span className="font-medium text-foreground">{poolType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pool size</span>
                  <span className="font-medium text-foreground">{poolSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Access</span>
                  <span className="font-medium text-foreground">
                    {accessMethod === "home" ? "Owner will be home" : accessMethod === "gate" ? "Gate code" : accessMethod === "key" ? "Key on property" : "Custom instructions"}
                  </span>
                </div>
              </div>
              {specialNotes && (
                <>
                  <div className="border-t border-border my-3" />
                  <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-1.5">CLEANING NOTES</p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3">{specialNotes}</p>
                </>
              )}
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-3">PRICING</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base service</span>
                  <span className="font-medium text-foreground">${totalPrice}{frequency === "monthly" ? "/mo" : ""}</span>
                </div>
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
                      <span className="font-medium text-foreground">${totalPrice}/mo</span>
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
            <div className="space-y-4">
              {/* Google Pay — prominent top button */}
              <button
                type="button"
                onClick={() => setPaymentMethod("google_pay")}
                className={`w-full flex items-center justify-center gap-2.5 rounded-xl h-14 text-[17px] font-bold transition-all select-none ${
                  paymentMethod === "google_pay"
                    ? "bg-foreground text-background ring-2 ring-primary ring-offset-2"
                    : "bg-foreground text-background hover:opacity-90"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-auto" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#4285F4"/>
                </svg>
                Pay
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">Or pay with</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Card & PayPal options */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                {/* Credit / Debit Card */}
                <div>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`w-full flex items-center gap-3.5 p-4 transition-all text-left select-none ${
                      paymentMethod === "card" ? "bg-primary/[0.04]" : "hover:bg-muted/40"
                    }`}
                  >
                    <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      paymentMethod === "card" ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"
                    }`}>
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm font-medium text-foreground flex-1">Use credit or debit card</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold tracking-wide text-[#1a1f71]">VISA</span>
                      <span className="w-6 h-4 rounded-[3px] bg-gradient-to-br from-[#f79e1b] to-[#ea001b]" />
                      <span className="text-xs font-bold tracking-wide text-muted-foreground">AMEX</span>
                    </div>
                  </button>

                  {/* Card input fields — shown when selected */}
                  {paymentMethod === "card" && (
                    <div className="px-4 pb-4 space-y-3 animate-fade-in">
                      <Input
                        placeholder="Credit Card Number"
                        className="h-12 rounded-xl border-2 border-border bg-muted/30 text-sm"
                        maxLength={19}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Expiration"
                          className="h-12 rounded-xl border-2 border-border bg-muted/30 text-sm"
                          maxLength={5}
                        />
                        <div className="relative">
                          <Input
                            placeholder="CVC"
                            className="h-12 rounded-xl border-2 border-border bg-muted/30 text-sm pr-10"
                            maxLength={4}
                          />
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-border mx-4" />

                {/* PayPal */}
                <div>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("paypal")}
                    className={`w-full flex items-center gap-3.5 p-4 transition-all text-left select-none ${
                      paymentMethod === "paypal" ? "bg-primary/[0.04]" : "hover:bg-muted/40"
                    }`}
                  >
                    <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      paymentMethod === "paypal" ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"
                    }`}>
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm font-medium text-foreground flex-1">Use PayPal account</span>
                    <span className="text-sm font-bold">
                      <span className="text-[#003087]">Pay</span><span className="text-[#009cde]">Pal</span>
                    </span>
                  </button>

                  {/* PayPal yellow button — shown when selected */}
                  {paymentMethod === "paypal" && (
                    <div className="px-4 pb-4 animate-fade-in">
                      <button
                        type="button"
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full h-12 rounded-xl bg-[#ffc439] hover:bg-[#f0b72d] text-[#003087] font-bold text-base transition-colors flex items-center justify-center gap-1 disabled:opacity-60"
                      >
                        {isProcessing ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" /> Processing…
                          </span>
                        ) : (
                          <span className="text-base font-bold">
                            <span className="text-[#003087]">Pay</span><span className="text-[#009cde]">Pal</span>
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
              {`${selectedPass.hours}h service${frequency === "monthly" ? " · Monthly" : ""}`}
            </span>
            <span className="text-lg font-bold text-foreground">${totalPrice}{frequency === "monthly" ? "/mo" : ""}</span>
          </div>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="w-full h-12 text-[15px] font-bold rounded-xl">
              Continue
            </Button>
          ) : paymentMethod === "paypal" ? null : (
            <Button onClick={handlePayment} disabled={!canProceed() || isProcessing} className="w-full h-14 text-[17px] font-bold rounded-2xl shadow-lg">
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Processing…
                </span>
              ) : paymentMethod === "google_pay" ? (
                <span className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-5 w-auto" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="currentColor"/>
                  </svg>
                  Pay
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
