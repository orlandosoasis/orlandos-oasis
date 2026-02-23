import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface PassOption {
  id: string;
  hours: number;
  label: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  percentOff: number;
  isMostPopular: boolean;
}

interface ScheduleData {
  selectedDate: Date;
  timeWindow: "morning" | "afternoon" | "evening";
  accessMethod: "home" | "gate" | "key" | "other";
  accessDetail: string;
  addons: { id: string; name: string; price: number }[];
  addonsTotal: number;
}

interface Step5Props {
  selectedPass: PassOption;
  onChangePass: (passId: string) => void;
  passOptions: PassOption[];
  onConfirm?: (data: ScheduleData) => void;
}

type TimeWindow = "morning" | "afternoon" | "evening" | null;
type AccessMethod = "home" | "gate" | "key" | "other" | null;

interface AddonItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  badge?: string;
}

const ADDONS: AddonItem[] = [
{ id: "chemical", name: "Chemical Balance Treatment", desc: "pH test + chemical balancing for safe, clear water", price: 25, badge: "Most Popular" },
{ id: "filter", name: "Filter Deep Clean", desc: "Full cartridge or DE filter cleaning & inspection", price: 35 },
{ id: "tile", name: "Tile Scrub & Waterline Clean", desc: "Removes calcium deposits & waterline buildup", price: 20 },
{ id: "algae", name: "Algae Prevention Dose", desc: "Algaecide treatment to keep your pool cleaner, longer", price: 15 }];


const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
"January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"];


const Step5Schedule = ({ selectedPass, onChangePass, passOptions, onConfirm }: Step5Props) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("morning");
  const [accessMethod, setAccessMethod] = useState<AccessMethod>(null);
  const [gateCode, setGateCode] = useState("");
  const [gateNotes, setGateNotes] = useState("");
  const [keyLocation, setKeyLocation] = useState("");
  const [otherInstructions, setOtherInstructions] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [poolType, setPoolType] = useState("Inground");
  const [poolSize, setPoolSize] = useState("Small (<10k gal)");
  const [hasPets, setHasPets] = useState(false);
  const [addons, setAddons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const earliestDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 3);
    return d;
  }, [today]);

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const prevMonth = () => {
    if (calMonth === 0) {setCalMonth(11);setCalYear(calYear - 1);} else
    setCalMonth(calMonth - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) {setCalMonth(0);setCalYear(calYear + 1);} else
    setCalMonth(calMonth + 1);
  };

  const isPrevDisabled = calYear === today.getFullYear() && calMonth === today.getMonth();

  const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const toggleAddon = (id: string) => {
    setAddons((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const addonsTotal = addons.reduce((sum, id) => {
    const addon = ADDONS.find((a) => a.id === id);
    return sum + (addon?.price || 0);
  }, 0);

  const isFormValid = () => {
    if (!selectedDate || !timeWindow || !accessMethod) return false;
    if (accessMethod === "gate" && !gateCode.trim()) return false;
    if (accessMethod === "key" && !keyLocation.trim()) return false;
    if (accessMethod === "other" && !otherInstructions.trim()) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1800));
    setIsSubmitting(false);
    setIsConfirmed(true);

    // Build access detail string
    let accessDetail = "";
    if (accessMethod === "gate") accessDetail = gateCode + (gateNotes ? ` · ${gateNotes}` : "");
    else if (accessMethod === "key") accessDetail = keyLocation;
    else if (accessMethod === "other") accessDetail = otherInstructions;

    const selectedAddons = ADDONS.filter((a) => addons.includes(a.id)).map((a) => ({
      id: a.id, name: a.name, price: a.price,
    }));

    if (onConfirm && selectedDate && timeWindow && accessMethod) {
      // Small delay so user sees the confirmed state briefly
      setTimeout(() => {
        onConfirm({
          selectedDate,
          timeWindow,
          accessMethod,
          accessDetail,
          addons: selectedAddons,
          addonsTotal,
        });
      }, 1200);
    }
  };

  const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const formatDateLabel = (d: Date) => `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()} ${fullDayNames[d.getDay()]}`;
  const displayLabel = selectedDate ? formatDateLabel(selectedDate) : formatDateLabel(earliestDate);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ① Confirmation Alert */}
      <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
        <span className="text-lg leading-none">🎉</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Success! Your payment is confirmed.
          </p>
        </div>
      </div>

      {/* ③ Choose Date */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <p className="text-[11px] font-medium tracking-[1.2px] uppercase text-muted-foreground mb-3.5">Step 1</p>
        <h3 className="font-semibold text-foreground mb-1 text-base">Choose Your Service Date</h3>
        <p className="text-muted-foreground mb-4 text-sm">Earlier appointments fill quickly.</p>

        {/* Calendar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3.5">
            <button
              onClick={prevMonth}
              disabled={isPrevDisabled}
              className="w-[30px] h-[30px] rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">

              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[15px] font-semibold text-foreground">{MONTHS[calMonth]} {calYear}</span>
            <button
              onClick={nextMonth}
              className="w-[30px] h-[30px] rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">

              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) =>
            <div key={d} className="text-center text-[10px] font-medium tracking-[0.6px] text-muted-foreground py-1 pb-2">
                {d}
              </div>
            )}
            {Array.from({ length: firstDayOfWeek }).map((_, i) =>
            <div key={`empty-${i}`} className="aspect-square" />
            )}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const thisDate = new Date(calYear, calMonth, day);
              const isPast = thisDate < today;
              const isSelected = selectedDate && isSameDay(thisDate, selectedDate);
              const isEarliest = isSameDay(thisDate, earliestDate);
              const isToday = isSameDay(thisDate, today);

              return (
                <button
                  key={day}
                  disabled={isPast}
                  onClick={() => !isPast && setSelectedDate(thisDate)}
                  className={`aspect-square flex items-center justify-center rounded-[10px] text-[13px] transition-all border-2 relative ${
                  isPast ?
                  "text-muted-foreground/25 cursor-not-allowed border-transparent" :
                  isSelected ?
                  "bg-primary text-primary-foreground font-semibold border-primary shadow-md" :
                  isEarliest ?
                  "bg-primary/10 border-primary/40 text-primary font-medium" :
                  isToday ?
                  "font-semibold text-primary border-transparent" :
                  "text-foreground border-transparent hover:bg-primary/10 hover:text-primary cursor-pointer"}`
                  }>

                  {day}
                  {isEarliest && !isPast && !isSelected &&
                  <span className="absolute bottom-0.5 text-[5px] text-primary">●</span>
                  }
                </button>);

            })}
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-secondary-foreground text-sm">{selectedDate ? "Selected" : "Next available"}: <strong>{displayLabel}</strong>
        </p>
      </div>

      {/* ④ Arrival Window */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <p className="text-[11px] font-medium tracking-[1.2px] uppercase text-muted-foreground mb-3.5">Step 2</p>
        <h3 className="font-semibold text-foreground mb-3.5 text-base">Select Arrival Window</h3>
        <div className="grid grid-cols-3 gap-2.5">
          {([
          { value: "morning", icon: "🌅", label: "8am–12pm" },
          { value: "afternoon", icon: "☀️", label: "12pm–4pm" },
          { value: "evening", icon: "🌤️", label: "4pm–6pm" }] as
          const).map((opt) =>
          <button
            key={opt.value}
            type="button"
            onClick={() => setTimeWindow(opt.value)}
            className={`flex flex-col items-center justify-center rounded-xl border-2 py-3.5 px-2 transition-all text-center ${
            timeWindow === opt.value ?
            "border-primary bg-primary/[0.07] text-primary" :
            "border-border hover:border-primary/40 hover:bg-primary/5"}`
            }>

              <span className="text-xl mb-1">{opt.icon}</span>
              <span className="text-[15px] font-semibold">{opt.label}</span>
            </button>
          )}
        </div>
      </div>

      {/* ⑤ Pool & Property Details */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <p className="text-[11px] font-medium tracking-[1.2px] uppercase text-muted-foreground mb-3.5">Step 3</p>
        <h3 className="font-semibold text-foreground mb-4 text-base">Pool Details</h3>

        {/* A — Pool Information */}
        <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">POOL INFORMATION</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Pool Type</label>
            <select
              value={poolType}
              onChange={(e) => setPoolType(e.target.value)}
              className="h-10 rounded-[10px] border-2 border-border bg-muted/30 px-3 text-sm text-foreground outline-none focus:border-primary/40 focus:bg-background transition-colors appearance-none">

              <option>Inground</option>
              <option>Above Ground</option>
              <option>Lap Pool</option>
              <option>Spa / Hot Tub</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Pool Size</label>
            <select
              value={poolSize}
              onChange={(e) => setPoolSize(e.target.value)}
              className="h-10 rounded-[10px] border-2 border-border bg-muted/30 px-3 text-sm text-foreground outline-none focus:border-primary/40 focus:bg-background transition-colors appearance-none">

              <option>Small (&lt;10k gal)</option>
              <option>Medium (10–20k)</option>
              <option>Large (20k+)</option>
            </select>
          </div>
        </div>

        {/* B — Pool Access */}
        <div className="mt-5 pt-[18px] border-t border-border">
          <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted-foreground mb-2.5">POOL ACCESS</p>
          <p className="text-[13px] text-muted-foreground mb-3">How will we access your pool?</p>
          <div className="grid grid-cols-2 gap-2.5">
            {([
            { value: "home", icon: "🏠", label: "I will be home" },
            { value: "gate", icon: "🔢", label: "Gate code provided" },
            { value: "key", icon: "🗝️", label: "Key on property" },
            { value: "other", icon: "📝", label: "Other instructions" }] as
            const).map((opt) =>
            <button
              key={opt.value}
              type="button"
              onClick={() => setAccessMethod(opt.value)}
              className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-3.5 transition-all text-left ${
              accessMethod === opt.value ?
              "border-primary bg-primary/[0.06]" :
              "border-border hover:border-primary/40 hover:bg-primary/5"}`
              }>

                <span className="text-xl leading-none">{opt.icon}</span>
                <span className="text-[13px] font-medium text-foreground leading-snug">{opt.label}</span>
              </button>
            )}
          </div>

          {/* Conditional: Gate */}
          {accessMethod === "gate" &&
          <div className="mt-3.5 flex flex-col gap-2.5 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Gate Code <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. 4821" value={gateCode} onChange={(e) => setGateCode(e.target.value)} maxLength={12} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Additional gate notes (optional)</label>
                <Input placeholder="e.g. Blue door on left side of house" value={gateNotes} onChange={(e) => setGateNotes(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
              </div>
            </div>
          }

          {/* Conditional: Key */}
          {accessMethod === "key" &&
          <div className="mt-3.5 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Where is the key located? <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. Under the welcome mat, front door" value={keyLocation} onChange={(e) => setKeyLocation(e.target.value)} className="h-10 rounded-[10px] border-2 border-border bg-muted/30 text-sm" />
              </div>
            </div>
          }

          {/* Conditional: Other */}
          {accessMethod === "other" &&
          <div className="mt-3.5 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Access Instructions <span className="text-destructive">*</span></label>
                <Textarea placeholder="Describe how our technician should access the pool…" value={otherInstructions} onChange={(e) => setOtherInstructions(e.target.value)} rows={3} className="rounded-[10px] border-2 border-border bg-muted/30 text-sm resize-y min-h-[72px]" />
              </div>
            </div>
          }
        </div>

        {/* Special Instructions */}
        <div className="mt-5 pt-[18px] border-t border-border">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Special Instructions (optional)</label>
            <Textarea placeholder="Anything else your technician should know…" value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} rows={2} className="rounded-[10px] border-2 border-border bg-muted/30 text-sm resize-y min-h-[60px]" />
          </div>
        </div>
      </div>

      {/* ⑥ Add-Ons */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <p className="text-[11px] font-medium tracking-[1.2px] uppercase text-muted-foreground mb-3.5">Step 4 — Optional</p>
        <h3 className="text-[17px] font-semibold text-foreground mb-1">Select Add-Ons</h3>
        <p className="text-xs text-muted-foreground mb-4">Add extras at a discounted rate while booking.</p>

        {/* Purchased Service Summary */}
        <p className="text-xs text-muted-foreground mb-0.5">Your service</p>
        <p className="text-sm font-medium text-foreground mb-4">{selectedPass.label}</p>

        <div className="flex flex-col gap-2.5">
          {ADDONS.map((addon) => {
            const isSelected = addons.includes(addon.id);
            return (
              <button
                key={addon.id}
                type="button"
                onClick={() => toggleAddon(addon.id)}
                className={`flex items-center gap-3.5 rounded-xl border-2 p-4 transition-all text-left select-none ${
                isSelected ?
                "border-primary bg-primary/[0.06]" :
                "border-border hover:border-primary/40 hover:bg-primary/5"}`
                }>

                <div className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center shrink-0 text-xs transition-all ${
                isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"}`
                }>
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-0.5">{addon.name}</p>
                  <p className="text-xs text-muted-foreground">{addon.desc}</p>
                  {addon.badge &&
                  <span className="inline-block mt-1 text-[10px] font-medium bg-amber-500/[0.18] text-amber-700 border border-amber-500/40 rounded-full px-[7px] py-[2px]">
                      {addon.badge}
                    </span>
                  }
                </div>
                <span className="text-[15px] font-semibold text-primary whitespace-nowrap">+${addon.price}</span>
              </button>);

          })}
        </div>

        <div className="mt-3.5 pt-3.5 border-t border-border flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Add-ons total</span>
          <span className="text-lg font-bold text-primary">
            {addonsTotal > 0 ? `+$${addonsTotal}` : "$0"}
          </span>
        </div>
      </div>

      {/* ⑦ CTA */}
      <div className="pt-1">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid() || isSubmitting || isConfirmed}
          className={`w-full h-14 text-[17px] font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all ${
          isConfirmed ? "bg-green-600 hover:bg-green-600" : ""}`
          }>

          {isSubmitting ?
          "Confirming..." :
          isConfirmed ?
          "Confirmed! ✓ See you soon" :
          "Confirm My First Cleaning"}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-2.5">
          You'll receive a confirmation text &amp; email.
        </p>
      </div>
    </div>);

};

export default Step5Schedule;