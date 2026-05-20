import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Check, ArrowLeft, CheckCircle2, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useBooking, matchTechnician } from "@/contexts/BookingContext";
import { useAuth } from "@/contexts/AuthContext";
import type { PassOption, CleaningFrequency, TimeWindow, AccessMethod, ScheduleData } from "@/contexts/BookingContext";
import { VOUCHER_PLANS } from "./VoucherSelectionStep";

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
  standalone?: boolean;
}

const TOTAL_STEPS = 2;

const PENDING_KEY = "orlandos_oasis_pending_schedule";

type PendingState = {
  step?: number;
  selectedDate?: string;
  calYear?: number;
  calMonth?: number;
  timeWindow?: TimeWindow;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  poolType?: string;
  accessMethod?: AccessMethod;
  gateCode?: string;
  gateNotes?: string;
  keyLocation?: string;
  otherInstructions?: string;
  specialNotes?: string;
  hasPets?: boolean;
};

function loadPending(): PendingState {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingState) : {};
  } catch {
    return {};
  }
}

const BookingFlow = ({ onClose, onComplete, selectedService: selectedServiceProp, standalone }: BookingFlowProps) => {
  const { setBooking, checkoutData } = useBooking();
  const { user, updateUser } = useAuth();
  const pending = useMemo(() => loadPending(), []);
  const [step, setStep] = useState<number>(pending.step ?? 0);

  const selectedPlanId = "weekly";
  const selectedVoucherPlan = useMemo(() => VOUCHER_PLANS.find((p) => p.id === selectedPlanId)!, [selectedPlanId]);

  const selectedService = selectedServiceProp || {
    title: selectedVoucherPlan.label.replace("Most Popular – ", ""),
    description: selectedVoucherPlan.description
  };

  const selectedPass: PassOption = useMemo(() => ({
    id: selectedVoucherPlan.id,
    hours: 2,
    label: selectedService.title,
    description: selectedService.description,
    originalPrice: selectedVoucherPlan.originalPrice,
    discountPrice: selectedVoucherPlan.discountPrice,
    percentOff: Math.round(selectedVoucherPlan.savings / selectedVoucherPlan.originalPrice * 100),
    isMostPopular: selectedVoucherPlan.isMostPopular
  }), [selectedVoucherPlan, selectedService]);

  // Step 0 - Schedule
  const [frequency] = useState<CleaningFrequency>("monthly");
  const today = useMemo(() => {const d = new Date();d.setHours(0, 0, 0, 0);return d;}, []);
  const initialDate = pending.selectedDate ? new Date(pending.selectedDate) : today;
  const [selectedDate, setSelectedDate] = useState<Date>(isNaN(initialDate.getTime()) ? today : initialDate);
  const [calYear, setCalYear] = useState(pending.calYear ?? today.getFullYear());
  const [calMonth, setCalMonth] = useState(pending.calMonth ?? today.getMonth());
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(pending.timeWindow ?? "morning");

  // Step 1 - Pool / Property
  const [address, setAddress] = useState(pending.address ?? user?.streetAddress ?? "");
  const [city, setCity] = useState(pending.city ?? user?.city ?? "");
  const [state, setState] = useState(pending.state ?? user?.state ?? "");
  const [zip, setZip] = useState(pending.zip ?? user?.zipCode ?? "");
  const [poolType, setPoolType] = useState(pending.poolType ?? "Inground");
  const POOL_SIZE_DISPLAY: Record<string, string> = { small: "Small (<10k gal)", medium: "Medium (10–20k)", large: "Large (20k+)" };
  const poolSize = POOL_SIZE_DISPLAY[checkoutData?.poolSize || "small"] || "Small (<10k gal)";
  const [accessMethod, setAccessMethod] = useState<AccessMethod>(pending.accessMethod ?? "home");
  const [gateCode, setGateCode] = useState(pending.gateCode ?? "");
  const [gateNotes, setGateNotes] = useState(pending.gateNotes ?? "");
  const [keyLocation, setKeyLocation] = useState(pending.keyLocation ?? "");
  const [otherInstructions, setOtherInstructions] = useState(pending.otherInstructions ?? "");
  const [specialNotes, setSpecialNotes] = useState(pending.specialNotes ?? "");
  const [hasPets, setHasPets] = useState(pending.hasPets ?? false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstSaveRef = useRef(true);

  // Persist partial state so the flow can resume on next login if abandoned.
  useEffect(() => {
    if (bookingSuccess) return;
    setSaveStatus("saving");
    const t = setTimeout(() => {
      try {
        const snapshot: PendingState = {
          step, selectedDate: selectedDate.toISOString(), calYear, calMonth, timeWindow,
          address, city, state, zip, poolType, accessMethod,
          gateCode, gateNotes, keyLocation, otherInstructions, specialNotes, hasPets,
        };
        localStorage.setItem(PENDING_KEY, JSON.stringify(snapshot));
      } catch { /* storage may be unavailable */ }
      setSaveStatus("saved");
      isFirstSaveRef.current = false;
    }, 400);
    return () => clearTimeout(t);
  }, [bookingSuccess, step, selectedDate, calYear, calMonth, timeWindow, address, city, state, zip, poolType, accessMethod, gateCode, gateNotes, keyLocation, otherInstructions, specialNotes, hasPets]);


  const markTouched = (field: string) => setTouched((p) => ({ ...p, [field]: true }));
  const fieldError = (field: string, value: string) => touched[field] && !value.trim();

  // Scroll to top when step changes
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const isPrevDisabled = calYear === today.getFullYear() && calMonth === today.getMonth();
  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const prevMonth = () => {if (calMonth === 0) {setCalMonth(11);setCalYear(calYear - 1);} else setCalMonth(calMonth - 1);};
  const nextMonth = () => {if (calMonth === 11) {setCalMonth(0);setCalYear(calYear + 1);} else setCalMonth(calMonth + 1);};

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) {
      if (!address.trim() || !city.trim() || !state.trim() || !zip.trim()) return false;
      if (accessMethod === "gate" && !gateCode.trim()) return false;
      if (accessMethod === "key" && !keyLocation.trim()) return false;
      if (accessMethod === "other" && !otherInstructions.trim()) return false;
      return true;
    }
    return true;
  };

  const getAccessDetail = () => {
    if (accessMethod === "gate") return gateCode + (gateNotes ? ` · ${gateNotes}` : "");
    if (accessMethod === "key") return keyLocation;
    if (accessMethod === "other") return otherInstructions;
    return "";
  };

  const handleConfirmBooking = async () => {
    // Idempotency guard: ignore extra clicks once submission is in flight.
    // Prevents accidental double-bookings if the user mashes the button.
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      // TODO(backend-wire-up): replace the simulated delay with a real
      // supabase.from('services').insert(...) once the booking-to-DB wiring
      // is in place. Until then, the booking lives only in BookingContext +
      // localStorage and won't appear in the technician's queue.
      await new Promise((r) => setTimeout(r, 1200));

      // Persist address to user profile (only if logged in)
      if (user) {
        updateUser({ streetAddress: address, city, state, zipCode: zip });
      }

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
        recurrence: "monthly",
        scheduleData,
        technician: matchTechnician(),
        specialNotes: specialNotes || undefined,
        pool: {
          address, city, state, zip, poolType, poolSize, accessMethod,
          accessDetail: getAccessDetail(), hasPets,
        },
      });

      // Scheduling complete — drop the saved partial-progress snapshot.
      try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }



      if (standalone) {
        // In standalone mode, skip the success screen and call onComplete directly.
        onComplete();
      } else {
        setBookingSuccess(true);
      }
      // Intentionally do NOT reset isProcessing on success — the success
      // screen replaces this form, and re-enabling the button here would
      // briefly expose it during the React re-render.
    } catch (err) {
      // Reset so user can retry. Toast intentionally left to the wired-up
      // Supabase version; the simulated delay can't fail today.
      setIsProcessing(false);
      throw err;
    }
  };

  const displayStep = step + 1;

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
              <span className="font-medium text-foreground">{selectedService.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium text-foreground">${selectedVoucherPlan.discountPrice}/first month</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pets on Property</span>
              <span className="font-medium text-foreground">{hasPets ? "Yes" : "No"}</span>
            </div>
          </div>

          <Button onClick={() => onComplete()} className="w-full h-14 text-[17px] font-bold rounded-2xl shadow-lg">
            Go to Dashboard
          </Button>
        </div>
      </div>);
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-[760px] mx-auto px-5 h-[56px] flex items-center gap-3">
          <button onClick={step === 0 ? onClose : () => setStep(step - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground flex-1">Book a Service</span>
          {!bookingSuccess && saveStatus !== "idle" && (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              aria-live="polite"
            >
              {saveStatus === "saving" ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving your progress…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  Progress saved
                </>
              )}
            </span>
          )}
          <span className="text-xs text-muted-foreground">Step {displayStep} of {TOTAL_STEPS}</span>
        </div>
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${displayStep / TOTAL_STEPS * 100}%` }} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[760px] mx-auto px-5 py-5 pb-24">

        {/* Step 0: Schedule */}
        {step === 0 &&
        <div className="space-y-4 animate-fade-in">
            {/* Dynamic inline service label */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selectedService.title}</h2>
                <p className="text-xs text-muted-foreground">${selectedVoucherPlan.discountPrice}/first month</p>
              </div>
            </div>

            {/* Arrival estimate notice */}
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[13px] text-amber-700 leading-relaxed">
                Arrival time cannot be guaranteed. Our team will do their best to arrive as close to the selected time window as possible.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
              {/* Date picker - compressed */}
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <button onClick={prevMonth} disabled={isPrevDisabled} className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-sm font-semibold text-foreground">{MONTHS[calMonth]} {calYear}</span>
                  <button onClick={nextMonth} className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {DAYS.map((d) =>
                <div key={d} className="text-center text-[10px] font-medium tracking-[0.5px] text-muted-foreground py-0.5 pb-1">{d}</div>
                )}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const thisDate = new Date(calYear, calMonth, day);
                  const isPast = thisDate < today;
                  const isSelected = isSameDay(thisDate, selectedDate);
                  return (
                    <button key={day} disabled={isPast} onClick={() => !isPast && setSelectedDate(thisDate)}
                    className={`aspect-square flex items-center justify-center rounded-lg text-[12px] transition-all border ${
                    isPast ? "text-muted-foreground/25 cursor-not-allowed border-transparent" :
                    isSelected ? "bg-primary text-primary-foreground font-semibold border-primary shadow-md" :
                    "text-foreground border-transparent hover:bg-primary/10 hover:text-primary cursor-pointer"}`
                    }>
                      {day}
                    </button>);
                })}
                </div>
              </div>

              {/* Arrival window - compressed */}
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col">
                <p className="text-[10px] font-semibold tracking-[0.6px] uppercase text-muted-foreground mb-2">ARRIVAL WINDOW</p>
                <div className="flex flex-col gap-2 flex-1">
                  {[
                { value: "morning" as const, icon: "🌅", title: "Morning", label: "8am–12pm" },
                { value: "afternoon" as const, icon: "☀️", title: "Afternoon", label: "12pm–4pm" },
                { value: "evening" as const, icon: "🌤️", title: "Evening", label: "4pm–6pm" }].
                map((opt) =>
                <button key={opt.value} type="button" onClick={() => setTimeWindow(opt.value)}
                className={`flex items-center gap-2.5 rounded-xl border-2 py-2 px-3 transition-all text-left flex-1 ${
                timeWindow === opt.value ? "border-primary bg-primary/[0.07] text-primary" : "border-border hover:border-primary/40 hover:bg-primary/5"}`
                }>
                    <span className="text-lg">{opt.icon}</span>
                    <div>
                      <span className="font-semibold text-[13px] block leading-tight">{opt.title}</span>
                      <span className="text-[11px] font-medium">{opt.label}</span>
                    </div>
                  </button>
                )}
                </div>
                <div className="flex items-start gap-1.5 mt-2.5 bg-primary/10 rounded-lg px-3 py-2">
                  <Info className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-primary leading-tight">
                    Arrival time cannot be guaranteed. Our team will do their best to arrive as close to the selected time window as possible.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }

        {/* Step 1: Pool & Property */}
        {step === 1 &&
        <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Pool & Property</h2>
              <p className="text-sm text-muted-foreground">Enter your pool details below.</p>
            </div>

            <div className="space-y-5">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">ADDRESS</p>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Street Address <span className="text-destructive">*</span></label>
                    <Input placeholder="Street address" value={address} onChange={(e) => setAddress(e.target.value)} onBlur={() => markTouched("address")} className={`h-10 rounded-[10px] border-2 bg-muted/30 text-sm ${fieldError("address", address) ? "border-destructive" : "border-border"}`} />
                    {fieldError("address", address) && <p className="text-[11px] text-destructive">This field is required</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">City <span className="text-destructive">*</span></label>
                      <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => markTouched("city")} className={`h-10 rounded-[10px] border-2 bg-muted/30 text-sm ${fieldError("city", city) ? "border-destructive" : "border-border"}`} />
                      {fieldError("city", city) && <p className="text-[11px] text-destructive">This field is required</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">State <span className="text-destructive">*</span></label>
                      <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} onBlur={() => markTouched("state")} className={`h-10 rounded-[10px] border-2 bg-muted/30 text-sm ${fieldError("state", state) ? "border-destructive" : "border-border"}`} />
                      {fieldError("state", state) && <p className="text-[11px] text-destructive">This field is required</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">ZIP <span className="text-destructive">*</span></label>
                      <Input placeholder="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} onBlur={() => markTouched("zip")} className={`h-10 rounded-[10px] border-2 bg-muted/30 text-sm ${fieldError("zip", zip) ? "border-destructive" : "border-border"}`} />
                      {fieldError("zip", zip) && <p className="text-[11px] text-destructive">This field is required</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">POOL DETAILS</p>
                <div className="grid grid-cols-1 gap-3 mb-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Pool Size</label>
                    <div className="h-10 rounded-[10px] border-2 border-border bg-muted/40 px-3 text-sm text-foreground flex items-center">
                      {poolSize}
                    </div>
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
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Gate Code <span className="text-destructive">*</span></label>
                        <Input placeholder="e.g. 4821" value={gateCode} onChange={(e) => setGateCode(e.target.value)} onBlur={() => markTouched("gateCode")} maxLength={12} className={`h-10 rounded-[10px] border-2 bg-muted/30 text-sm ${fieldError("gateCode", gateCode) ? "border-destructive" : "border-border"}`} />
                        {fieldError("gateCode", gateCode) && <p className="text-[11px] text-destructive">This field is required</p>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Additional gate notes (optional)</label>
                        <Input placeholder="e.g. Blue door on left side" value={gateNotes} onChange={(e) => setGateNotes(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
                      </div>
                    </div>
                }
                  {accessMethod === "key" &&
                <div className="mt-3.5 animate-fade-in">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Where is the key? <span className="text-destructive">*</span></label>
                        <Input placeholder="e.g. Under the welcome mat" value={keyLocation} onChange={(e) => setKeyLocation(e.target.value)} onBlur={() => markTouched("keyLocation")} className={`h-10 rounded-[10px] border-2 bg-muted/30 text-sm ${fieldError("keyLocation", keyLocation) ? "border-destructive" : "border-border"}`} />
                        {fieldError("keyLocation", keyLocation) && <p className="text-[11px] text-destructive">This field is required</p>}
                      </div>
                    </div>
                }
                  {accessMethod === "other" &&
                <div className="mt-3.5 animate-fade-in">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Access Instructions <span className="text-destructive">*</span></label>
                        <Textarea placeholder="Describe how to access the pool…" value={otherInstructions} onChange={(e) => setOtherInstructions(e.target.value)} onBlur={() => markTouched("otherInstructions")} rows={3} className={`rounded-[10px] border-2 bg-muted/30 text-sm resize-y min-h-[72px] ${fieldError("otherInstructions", otherInstructions) ? "border-destructive" : "border-border"}`} />
                        {fieldError("otherInstructions", otherInstructions) && <p className="text-[11px] text-destructive">This field is required</p>}
                      </div>
                    </div>
                }
                </div>

                {/* Pets on Property */}
                <div className="mt-5 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Pets on Property</p>
                      <p className="text-xs text-muted-foreground">Let the technician know if you have pets</p>
                    </div>
                    <Switch checked={hasPets} onCheckedChange={setHasPets} />
                  </div>
                </div>

                {/* Cleaning Notes */}
                <div className="mt-5 pt-4 border-t border-border">
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
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-20">
        <div className="max-w-[760px] mx-auto px-5 py-4">
          {step < 1 ?
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
