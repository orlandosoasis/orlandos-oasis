import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check, ArrowLeft, CreditCard, CheckCircle2, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useBooking, matchTechnician } from "@/contexts/BookingContext";
import type { PassOption, ScheduleData } from "@/contexts/BookingContext";

/* ── Duration options ── */
const DURATION_OPTIONS: PassOption[] = [
  { id: "hrs-2", hours: 2, label: "2-Hour Pool Service", description: "Quick maintenance — skim, brush & chemical check", originalPrice: 89, discountPrice: 89, percentOff: 0, isMostPopular: false },
  { id: "hrs-3", hours: 3, label: "3-Hour Pool Service", description: "Full clean — skim, vacuum, brush, chemicals & filter rinse", originalPrice: 129, discountPrice: 129, percentOff: 0, isMostPopular: true },
  { id: "hrs-4", hours: 4, label: "4-Hour Pool Service", description: "Deep service — thorough vacuum, tile scrub & full chemical balance", originalPrice: 169, discountPrice: 169, percentOff: 0, isMostPopular: false },
  { id: "hrs-6", hours: 6, label: "6-Hour Pool Service", description: "Complete restoration — ideal for neglected or green pools", originalPrice: 249, discountPrice: 249, percentOff: 0, isMostPopular: false },
];

/* ── Add-ons ── */
interface AddonDef { id: string; name: string; desc: string; price: number; badge?: string; }
const ADDONS: AddonDef[] = [
  { id: "chemical", name: "Chemical Balance Treatment", desc: "pH test + chemical balancing for safe, clear water", price: 25, badge: "Most Popular" },
  { id: "filter", name: "Filter Deep Clean", desc: "Full cartridge or DE filter cleaning & inspection", price: 35 },
  { id: "tile", name: "Tile Scrub & Waterline Clean", desc: "Removes calcium deposits & waterline buildup", price: 20 },
  { id: "algae", name: "Algae Prevention Dose", desc: "Algaecide treatment to keep your pool cleaner, longer", price: 15 },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type TimeWindow = "morning" | "afternoon" | "evening";
type AccessMethod = "home" | "gate" | "key" | "other";

interface BookingFlowProps {
  onClose: () => void;
  onComplete: () => void;
}

const BookingFlow = ({ onClose, onComplete }: BookingFlowProps) => {
  const { setBooking } = useBooking();
  const [step, setStep] = useState(1);

  // Step 1 — Duration
  const [selectedDuration, setSelectedDuration] = useState<string>("hrs-3");

  // Step 2 — Date
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // Step 3 — Arrival
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("morning");

  // Step 4 — Details
  const [address, setAddress] = useState("123 Main Street");
  const [city, setCity] = useState("Miami");
  const [state, setState] = useState("FL");
  const [zip, setZip] = useState("33101");
  const [poolType, setPoolType] = useState("Inground");
  const [poolSize, setPoolSize] = useState("Small (<10k gal)");
  const [accessMethod, setAccessMethod] = useState<AccessMethod | null>(null);
  const [gateCode, setGateCode] = useState("");
  const [gateNotes, setGateNotes] = useState("");
  const [keyLocation, setKeyLocation] = useState("");
  const [otherInstructions, setOtherInstructions] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  // Step 5 — Add-ons
  const [addons, setAddons] = useState<string[]>([]);

  // Step 6 — Payment
  type PaymentMethod = "google_pay" | "card" | "paypal";
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [savePayment, setSavePayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const selectedPass = DURATION_OPTIONS.find(o => o.id === selectedDuration)!;
  const addonsTotal = addons.reduce((s, id) => s + (ADDONS.find(a => a.id === id)?.price || 0), 0);
  const totalPrice = selectedPass.discountPrice + addonsTotal;

  const toggleAddon = (id: string) => setAddons(p => p.includes(id) ? p.filter(a => a !== id) : [...p, id]);

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const isPrevDisabled = calYear === today.getFullYear() && calMonth === today.getMonth();
  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); };

  const canProceed = () => {
    if (step === 1) return !!selectedDuration;
    if (step === 2) return !!selectedDate;
    if (step === 3) return !!timeWindow;
    if (step === 4) {
      if (!accessMethod) return false;
      if (accessMethod === "gate" && !gateCode.trim()) return false;
      if (accessMethod === "key" && !keyLocation.trim()) return false;
      if (accessMethod === "other" && !otherInstructions.trim()) return false;
      return true;
    }
    if (step === 6) return !!paymentMethod;
    return true;
  };

  const TIME_LABELS: Record<string, string> = {
    morning: "8:00 AM – 12:00 PM",
    afternoon: "12:00 PM – 4:00 PM",
    evening: "4:00 PM – 6:00 PM",
  };

  const handlePayment = async () => {
    if (!paymentMethod) return;
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2200));
    setIsProcessing(false);
    setPaymentSuccess(true);

    // Build booking data and persist
    let accessDetail = "";
    if (accessMethod === "gate") accessDetail = gateCode + (gateNotes ? ` · ${gateNotes}` : "");
    else if (accessMethod === "key") accessDetail = keyLocation;
    else if (accessMethod === "other") accessDetail = otherInstructions;

    const scheduleData: ScheduleData = {
      selectedDate,
      timeWindow,
      accessMethod: accessMethod!,
      accessDetail,
      addons: ADDONS.filter(a => addons.includes(a.id)).map(a => ({ id: a.id, name: a.name, price: a.price })),
      addonsTotal,
    };

    setBooking({
      selectedPass,
      scheduleData,
      technician: matchTechnician(),
    });
  };

  const TOTAL_STEPS = 6;
  const STEP_LABELS = ["Duration", "Date", "Arrival", "Details", "Add-Ons", "Payment"];

  // Success screen
  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <div className="max-w-[760px] mx-auto px-5 py-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mb-5">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Payment Successful!</h2>
          <p className="text-sm text-muted-foreground mb-8">Your pool service has been booked.</p>

          <div className="w-full bg-card rounded-2xl border border-border p-6 shadow-sm text-left space-y-3 mb-8">
            <h3 className="text-sm font-semibold text-foreground mb-3">Booking Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium text-foreground">{selectedPass.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-foreground">{FULL_DAYS[selectedDate.getDay()]}, {MONTHS[selectedDate.getMonth()].slice(0,3)} {selectedDate.getDate()}, {selectedDate.getFullYear()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Arrival Window</span>
              <span className="font-medium text-foreground">{TIME_LABELS[timeWindow]}</span>
            </div>
            {addons.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Add-Ons</span>
                <span className="font-medium text-foreground">
                  {ADDONS.filter(a => addons.includes(a.id)).map(a => a.name).join(", ")}
                </span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex justify-between text-sm">
              <span className="font-semibold text-foreground">Total Paid</span>
              <span className="text-lg font-bold text-primary">${totalPrice}</span>
            </div>
          </div>

          <Button onClick={onComplete} className="w-full h-14 text-[17px] font-bold rounded-2xl shadow-lg">
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
        {/* ── Step 1: Duration ── */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Select Service Duration</h2>
              <p className="text-sm text-muted-foreground">Choose how long you need your technician.</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {DURATION_OPTIONS.map(opt => {
                const isSelected = selectedDuration === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedDuration(opt.id)}
                    className={`relative flex items-center gap-3.5 rounded-xl border-2 p-4 transition-all text-left select-none ${
                      isSelected ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"
                    }`}>
                      <Check className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-foreground">{opt.hours} Hours of Pool Service</span>
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
        )}

        {/* ── Step 2: Date ── */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Choose Your Service Date</h2>
              <p className="text-sm text-muted-foreground">Earlier appointments fill quickly.</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
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
        )}

        {/* ── Step 3: Arrival Window ── */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Select Arrival Window</h2>
              <p className="text-sm text-muted-foreground">Choose a time range for your technician's arrival.</p>
            </div>
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
        )}

        {/* ── Step 4: Service Details ── */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Service Details</h2>
              <p className="text-sm text-muted-foreground">Tell us about your pool and how to access it.</p>
            </div>

            {/* Location */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">SERVICE LOCATION</p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Address</label>
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

            {/* Pool Info */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">POOL INFORMATION</p>
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

              <div className="mt-5 pt-4 border-t border-border">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Special Instructions (optional)</label>
                  <Textarea placeholder="Anything else your technician should know…" value={specialNotes} onChange={e => setSpecialNotes(e.target.value)} rows={2} className="rounded-[10px] border-2 border-border bg-muted/30 text-sm resize-y min-h-[60px]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Add-Ons ── */}
        {step === 5 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Optional Add-Ons</h2>
              <p className="text-sm text-muted-foreground">Extras at a discounted rate while booking.</p>
            </div>

            <p className="text-xs text-muted-foreground mb-0.5">Your service</p>
            <p className="text-sm font-medium text-foreground mb-4">{selectedPass.label}</p>

            <div className="flex flex-col gap-2.5">
              {ADDONS.map(addon => {
                const isSelected = addons.includes(addon.id);
                return (
                  <button key={addon.id} type="button" onClick={() => toggleAddon(addon.id)}
                    className={`flex items-center gap-3.5 rounded-xl border-2 p-4 transition-all text-left select-none ${
                      isSelected ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/40 hover:bg-primary/5"
                    }`}>
                    <div className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center shrink-0 text-xs transition-all ${
                      isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"
                    }`}>✓</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-0.5">{addon.name}</p>
                      <p className="text-xs text-muted-foreground">{addon.desc}</p>
                      {addon.badge && (
                        <span className="inline-block mt-1 text-[10px] font-medium bg-amber-500/[0.18] text-amber-700 border border-amber-500/40 rounded-full px-[7px] py-[2px]">{addon.badge}</span>
                      )}
                    </div>
                    <span className="text-[15px] font-semibold text-primary whitespace-nowrap">+${addon.price}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3.5 pt-3.5 border-t border-border flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">Add-ons total</span>
              <span className="text-lg font-bold text-primary">{addonsTotal > 0 ? `+$${addonsTotal}` : "$0"}</span>
            </div>
          </div>
        )}

        {/* ── Step 6: Payment ── */}
        {step === 6 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Payment</h2>
              <p className="text-sm text-muted-foreground">Select a payment method to complete your booking.</p>
            </div>

            {/* Order summary */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-3">ORDER SUMMARY</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{selectedPass.label}</span>
                  <span className="font-medium text-foreground">${selectedPass.discountPrice}</span>
                </div>
                {addons.length > 0 && ADDONS.filter(a => addons.includes(a.id)).map(a => (
                  <div key={a.id} className="flex justify-between">
                    <span className="text-muted-foreground">{a.name}</span>
                    <span className="font-medium text-foreground">${a.price}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-lg font-bold text-primary">${totalPrice}</span>
                </div>
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

            {/* Save payment */}
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
              {selectedPass.hours}h service{addonsTotal > 0 ? ` + add-ons` : ""}
            </span>
            <span className="text-lg font-bold text-foreground">${totalPrice}</span>
          </div>
          {step < 6 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="w-full h-12 text-[15px] font-bold rounded-xl">
              {step === 5 ? "Proceed to Payment" : "Continue"}
            </Button>
          ) : (
            <Button onClick={handlePayment} disabled={!canProceed() || isProcessing} className="w-full h-14 text-[17px] font-bold rounded-2xl shadow-lg">
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Processing…
                </span>
              ) : (
                `Pay $${totalPrice}`
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;
