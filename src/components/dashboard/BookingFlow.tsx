import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useBooking, matchTechnician } from "@/contexts/BookingContext";
import type { PassOption, CleaningFrequency, TimeWindow, AccessMethod, ScheduleData } from "@/contexts/BookingContext";

const SERVICE_CATEGORIES = [
  {
    label: "Cleaning & Maintenance",
    services: [
      { id: "weekly-cleaning", title: "Weekly Pool / Spa Cleaning", description: "Regular service that includes skimming debris, brushing walls, vacuuming the pool or spa, and emptying baskets to keep the water clean and clear." },
      { id: "chemical-balancing", title: "Chemical Testing & Balancing", description: "Technicians test and adjust chlorine, pH, alkalinity, and other chemicals to keep pool water safe and properly balanced." },
      { id: "filter-cleaning", title: "Filter / Salt Cell Cleaning", description: "Cleaning the filtration system and salt cell to maintain proper circulation and chlorine generation." },
      { id: "tile-cleaning", title: "Tile & Surface Cleaning", description: "Removal of calcium buildup and stains from waterline tile and pool surfaces." },
    ],
  },
  {
    label: "Repairs & Equipment",
    services: [
      { id: "equipment-inspection", title: "Pool Equipment Inspection", description: "Inspection of pumps, motors, valves, and heaters to identify potential issues early." },
      { id: "equipment-repair", title: "Pool Equipment Repair", description: "Repair or replacement of pumps, motors, lights, and other pool equipment when needed." },
    ],
  },
  {
    label: "Deep Cleaning & Restoration",
    services: [
      { id: "algae-treatment", title: "Green-to-Clean / Algae Treatment", description: "Deep cleaning and chemical treatment to restore pools affected by algae or green water." },
      { id: "acid-washing", title: "Acid Washing", description: "Deep surface cleaning to remove stains, mineral buildup, and embedded algae." },
    ],
  },
  {
    label: "Pool Setup & Evaluation",
    services: [
      { id: "pool-inspections", title: "Pool Inspections", description: "Evaluation of pool condition including water clarity, equipment performance, and safety components." },
      { id: "pool-startups", title: "Pool Startups", description: "Initial service after a new pool build or resurfacing to balance chemicals and start equipment." },
    ],
  },
];

/* ── Duration options (one-time) ── */
const DURATION_OPTIONS: PassOption[] = [
{ id: "hrs-2", hours: 2, label: "2-Hour Pool Service", description: "Quick maintenance — skim, brush & chemical check", originalPrice: 89, discountPrice: 89, percentOff: 0, isMostPopular: false },
{ id: "hrs-3", hours: 3, label: "3-Hour Pool Service", description: "Full clean — skim, vacuum, brush, chemicals & filter rinse", originalPrice: 129, discountPrice: 129, percentOff: 0, isMostPopular: true },
{ id: "hrs-4", hours: 4, label: "4-Hour Pool Service", description: "Deep service — thorough vacuum, tile scrub & full chemical balance", originalPrice: 169, discountPrice: 169, percentOff: 0, isMostPopular: false },
{ id: "hrs-6", hours: 6, label: "6-Hour Pool Service", description: "Complete restoration — ideal for neglected or green pools", originalPrice: 249, discountPrice: 249, percentOff: 0, isMostPopular: false }];



const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_LABELS: Record<string, string> = {
  morning: "8:00 AM – 12:00 PM",
  afternoon: "12:00 PM – 4:00 PM",
  evening: "4:00 PM – 6:00 PM"
};

export interface SelectedServiceInfo {
  title: string;
  description: string;
}

interface BookingFlowProps {
  onClose: () => void;
  onComplete: () => void;
  selectedService?: SelectedServiceInfo | null;
}

const BookingFlow = ({ onClose, onComplete, selectedService: selectedServiceProp }: BookingFlowProps) => {
  const { setBooking } = useBooking();
  const hasPreselectedService = !!selectedServiceProp;
  const [step, setStep] = useState(hasPreselectedService ? 1 : 0);

  // Step 0 — Service selection (only when opened from Dashboard CTA)
  const allServices = useMemo(() => SERVICE_CATEGORIES.flatMap((c) => c.services), []);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const pickedService = useMemo(() => allServices.find((s) => s.id === selectedServiceId) || null, [allServices, selectedServiceId]);
  const selectedService = selectedServiceProp || (pickedService ? { title: pickedService.title, description: pickedService.description } : null);

  // Step 1 — Frequency & Plan & Schedule
  const [frequency, setFrequency] = useState<CleaningFrequency>("monthly");
  const [selectedDuration, setSelectedDuration] = useState<string>("hrs-3");

  const today = useMemo(() => {const d = new Date();d.setHours(0, 0, 0, 0);return d;}, []);
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

  // Step 2 — Notes
  const [specialNotes, setSpecialNotes] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const selectedPass = DURATION_OPTIONS.find((o) => o.id === selectedDuration)!;
  const totalPrice = selectedPass.discountPrice;

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const isPrevDisabled = calYear === today.getFullYear() && calMonth === today.getMonth();
  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const prevMonth = () => {if (calMonth === 0) {setCalMonth(11);setCalYear(calYear - 1);} else setCalMonth(calMonth - 1);};
  const nextMonth = () => {if (calMonth === 11) {setCalMonth(0);setCalYear(calYear + 1);} else setCalMonth(calMonth + 1);};

  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) {
      if (!address.trim()) return false;
      if (accessMethod === "gate" && !gateCode.trim()) return false;
      if (accessMethod === "key" && !keyLocation.trim()) return false;
      if (accessMethod === "other" && !otherInstructions.trim()) return false;
      return true;
    }
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

  const handleConfirmBooking = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsProcessing(false);

    const scheduleData: ScheduleData = {
      selectedDate,
      timeWindow,
      accessMethod,
      accessDetail: getAccessDetail(),
      addons: [],
      addonsTotal: 0
    };

    const bookedPass = selectedService
      ? { ...selectedPass, label: selectedService.title, description: selectedService.description }
      : selectedPass;

    setBooking({
      frequency,
      selectedPass: bookedPass,
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
        accessDetail: getAccessDetail()
      }
    });

    setBookingSuccess(true);
  };

  const TOTAL_STEPS = 2;
  const STEP_LABELS = ["Service Setup", "Pool / Property"];

  // Success screen
  if (bookingSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <div className="max-w-[760px] mx-auto px-5 py-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mb-5">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Service Booked!</h2>
          <p className="text-sm text-muted-foreground mb-8">Your pool service has been scheduled.</p>

          <div className="w-full bg-card rounded-2xl border border-border p-6 shadow-sm text-left space-y-3 mb-8">
            <h3 className="text-sm font-semibold text-foreground mb-3">Booking Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium text-foreground">{selectedService ? selectedService.title : selectedPass.label}</span>
            </div>
            {selectedService && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Details</span>
                <span className="font-medium text-foreground text-right max-w-[60%]">{selectedService.description}</span>
              </div>
            )}
            {frequency === "monthly" &&
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recurrence</span>
                <span className="font-medium text-foreground">Monthly</span>
              </div>
            }
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{frequency === "once" ? "Date" : "Select Date"}</span>
              <span className="font-medium text-foreground">{FULL_DAYS[selectedDate.getDay()]}, {MONTHS[selectedDate.getMonth()].slice(0, 3)} {selectedDate.getDate()}, {selectedDate.getFullYear()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Arrival Window</span>
              <span className="font-medium text-foreground">{TIME_LABELS[timeWindow]}</span>
            </div>

            <div className="border-t border-border pt-3" />
            <h3 className="text-sm font-semibold text-foreground mb-3">Pool Details</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium text-foreground text-right max-w-[60%]">{[address, city, state, zip].filter(Boolean).join(", ")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pool Type</span>
              <span className="font-medium text-foreground">{poolType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pool Size</span>
              <span className="font-medium text-foreground">{poolSize}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Access</span>
              <span className="font-medium text-foreground">
                {accessMethod === "home" ? "Owner will be home" : accessMethod === "gate" ? "Gate code" : accessMethod === "key" ? "Key on property" : "Custom instructions"}
              </span>
            </div>
          </div>

          <Button onClick={() => onComplete()} className="w-full h-14 text-[17px] font-bold rounded-2xl shadow-lg">
            Go to Dashboard
          </Button>
        </div>
      </div>);

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
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${step / TOTAL_STEPS * 100}%` }} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[760px] mx-auto px-5 py-6 pb-32">

        {/* ── Step 1: Service Setup ── */}
        {step === 1 &&
        <div className="space-y-6 animate-fade-in">
            {/* Selected Service from checkout (if any) */}
            {selectedService && (
              <div>
                <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">SELECTED SERVICE</p>
                <div className="flex items-center gap-3.5 rounded-xl border-2 border-primary bg-primary/5 p-4">
                  <div className="w-[22px] h-[22px] rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground">{selectedService.title}</span>
                    <p className="text-xs text-muted-foreground">{selectedService.description}</p>
                  </div>
                </div>
              </div>
            )}


            {/* Date picker */}
            <div>
              <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">
                {frequency === "once" ? "SERVICE DATE" : "SELECT DATE"}
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
                  {DAYS.map((d) =>
                <div key={d} className="text-center text-[10px] font-medium tracking-[0.6px] text-muted-foreground py-1 pb-2">{d}</div>
                )}
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
                    "text-foreground border-transparent hover:bg-primary/10 hover:text-primary cursor-pointer"}`
                    }>
                        {day}
                      </button>);

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
              <p className="text-xs text-muted-foreground mb-3">
                Arrival time cannot be guaranteed, but we will do our best to arrive as close to the scheduled time as possible.
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {[
              { value: "morning" as const, icon: "🌅", title: "Morning", label: "8am–12pm" },
              { value: "afternoon" as const, icon: "☀️", title: "Afternoon", label: "12pm–4pm" },
              { value: "evening" as const, icon: "🌤️", title: "Evening", label: "4pm–6pm" }].
              map((opt) =>
              <button key={opt.value} type="button" onClick={() => setTimeWindow(opt.value)}
              className={`flex flex-col items-center justify-center rounded-xl border-2 py-5 px-2 transition-all text-center ${
              timeWindow === opt.value ? "border-primary bg-primary/[0.07] text-primary" : "border-border hover:border-primary/40 hover:bg-primary/5"}`
              }>
                    <span className="text-2xl mb-1.5">{opt.icon}</span>
                    <span className="font-semibold mb-0.5 text-sm">{opt.title}</span>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
              )}
              </div>
            </div>
          </div>
        }

        {/* ── Step 2: Pool / Property ── */}
        {step === 2 &&
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
                    <Input placeholder="Street address" value={address} onChange={(e) => setAddress(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">City</label>
                      <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">State</label>
                      <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">ZIP</label>
                      <Input placeholder="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">POOL DETAILS</p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Pool Type</label>
                    <select value={poolType} onChange={(e) => setPoolType(e.target.value)}
                  className="h-10 rounded-[10px] border-2 border-border bg-muted/30 px-3 text-sm text-foreground outline-none focus:border-primary/40 focus:bg-background transition-colors appearance-none">
                      <option>Inground</option><option>Above Ground</option><option>Lap Pool</option><option>Spa / Hot Tub</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Pool Size</label>
                    <select value={poolSize} onChange={(e) => setPoolSize(e.target.value)}
                  className="h-10 rounded-[10px] border-2 border-border bg-muted/30 px-3 text-sm text-foreground outline-none focus:border-primary/40 focus:bg-background transition-colors appearance-none">
                      <option>Small (&lt;10k gal)</option><option>Medium (10–20k)</option><option>Large (20k+)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">POOL ACCESS</p>
                  <p className="text-[13px] text-muted-foreground mb-3">How will we access your pool?</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                  { value: "home" as const, icon: "🏠", label: "I will be home" },
                  { value: "gate" as const, icon: "🔢", label: "Gate code provided" },
                  { value: "key" as const, icon: "🗝️", label: "Key on property" },
                  { value: "other" as const, icon: "📝", label: "Other instructions" }].
                  map((opt) =>
                  <button key={opt.value} type="button" onClick={() => setAccessMethod(opt.value)}
                  className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-3.5 transition-all text-left ${
                  accessMethod === opt.value ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/40 hover:bg-primary/5"}`
                  }>
                        <span className="text-xl leading-none">{opt.icon}</span>
                        <span className="text-[13px] font-medium text-foreground leading-snug">{opt.label}</span>
                      </button>
                  )}
                  </div>

                  {accessMethod === "gate" &&
                <div className="mt-3.5 flex flex-col gap-2.5 animate-fade-in">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Gate Code <span className="text-destructive">*</span></label>
                        <Input placeholder="e.g. 4821" value={gateCode} onChange={(e) => setGateCode(e.target.value)} maxLength={12} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Additional gate notes (optional)</label>
                        <Input placeholder="e.g. Blue door on left side" value={gateNotes} onChange={(e) => setGateNotes(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                      </div>
                    </div>
                }
                  {accessMethod === "key" &&
                <div className="mt-3.5 animate-fade-in">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Where is the key? <span className="text-destructive">*</span></label>
                        <Input placeholder="e.g. Under the welcome mat" value={keyLocation} onChange={(e) => setKeyLocation(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                      </div>
                    </div>
                }
                  {accessMethod === "other" &&
                <div className="mt-3.5 animate-fade-in">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Access Instructions <span className="text-destructive">*</span></label>
                        <Textarea placeholder="Describe how to access the pool…" value={otherInstructions} onChange={(e) => setOtherInstructions(e.target.value)} rows={3} className="rounded-[10px] border-2 border-border bg-muted/30 text-sm resize-y min-h-[72px]" />
                      </div>
                    </div>
                }
                </div>

                {/* Cleaning Notes */}
                <div className="mt-5">
                  <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">CLEANING NOTES (OPTIONAL)</p>
                  <Textarea
                  placeholder="Anything the technician should know about your pool?"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  rows={3}
                  className="rounded-[10px] border-2 border-border bg-muted/30 text-sm resize-y min-h-[72px]" />
                
                </div>
              </div>
            </div>
          </div>
        }

      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-[760px] mx-auto px-5 py-4">
          {step < 2 ?
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="w-full h-12 text-[15px] font-bold rounded-xl">
              Continue
            </Button> :

          <Button onClick={handleConfirmBooking} disabled={!canProceed() || isProcessing} className="w-full h-12 text-[15px] font-bold rounded-xl">
              {isProcessing ?
            <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Scheduling…
                </span> :

            "Confirm Booking"
            }
            </Button>
          }
        </div>
      </div>
    </div>);

};

export default BookingFlow;