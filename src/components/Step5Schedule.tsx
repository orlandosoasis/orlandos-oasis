import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Pencil, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

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

interface Step5Props {
  selectedPass: PassOption;
  onChangePass: (passId: string) => void;
  passOptions: PassOption[];
}

type TimeWindow = "morning" | "afternoon" | "flexible" | null;
type AccessMethod = "home" | "gate" | "key" | "other" | null;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const Step5Schedule = ({ selectedPass, onChangePass, passOptions }: Step5Props) => {
  const [editOpen, setEditOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("flexible");
  const [accessMethod, setAccessMethod] = useState<AccessMethod>("home");
  const [gateCode, setGateCode] = useState("");
  const [otherInstructions, setOtherInstructions] = useState("");
  const [addons, setAddons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);

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

  // Set default selected date to earliest
  useState(() => {
    setSelectedDate(earliestDate);
  });

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const isPrevDisabled = calYear === today.getFullYear() && calMonth === today.getMonth();

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const toggleAddon = (value: string) => {
    setAddons((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  };

  const isFormValid = () => {
    if (!selectedDate || !timeWindow || !accessMethod) return false;
    if (accessMethod === "gate" && !gateCode.trim()) return false;
    if (accessMethod === "other" && !otherInstructions.trim()) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1800));
    setIsSubmitting(false);
    setIsScheduled(true);
    setTimeout(() => setIsScheduled(false), 3000);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Banner */}
      <div className="bg-primary rounded-2xl py-6 px-6 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-primary-foreground/10 pointer-events-none" />
        <h2 className="text-xl font-bold text-primary-foreground leading-snug mb-1">
          Congratulations! Your ${selectedPass.discountPrice} pool service is reserved.
        </h2>
        <p className="text-[15px] font-medium text-primary-foreground/90">
          You secured {selectedPass.percentOff}% off your first cleaning. Let's schedule it now.
        </p>
        <p className="text-xs text-primary-foreground/60 mt-2">
          We'll hold this discounted rate for your first visit.
        </p>
      </div>

      {/* Value Summary Card */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest mb-3">You're Getting</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-medium text-foreground">{selectedPass.label}</span>
          <button
            onClick={() => setEditOpen(true)}
            className="text-sm font-medium text-primary border-b border-dashed border-primary hover:opacity-80 transition-opacity"
          >
            Edit
          </button>
        </div>
        <div className="flex items-baseline gap-2.5 mb-1">
          <span className="text-3xl font-extrabold text-foreground">${selectedPass.discountPrice}</span>
          <span className="text-base text-muted-foreground line-through">${selectedPass.originalPrice}</span>
          <Badge variant="secondary" className="text-xs font-semibold bg-primary/10 text-primary border-0">
            {selectedPass.percentOff}% OFF
          </Badge>
        </div>
        <div className="border-t border-border mt-4 pt-3">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            After your first cleaning, continue with unlimited follow-up pool services at your discounted membership rate of <strong className="text-foreground">$139/month</strong>.
          </p>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-foreground mb-1">Choose Your First Cleaning Date</h2>
          <p className="text-sm text-muted-foreground">The sooner you schedule, the sooner your pool stays swim-ready.</p>
        </div>

        {/* Calendar */}
        <div className="border border-border rounded-xl overflow-hidden mb-5">
          <div className="flex items-center justify-between px-4 py-3 bg-primary/5">
            <button
              onClick={prevMonth}
              disabled={isPrevDisabled}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {MONTHS[calMonth]} {calYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 p-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const thisDate = new Date(calYear, calMonth, day);
              const isPast = thisDate < today;
              const isSelected = selectedDate && isSameDay(thisDate, selectedDate);
              const isEarliest = isSameDay(thisDate, earliestDate);

              return (
                <button
                  key={day}
                  disabled={isPast}
                  onClick={() => !isPast && setSelectedDate(thisDate)}
                  className={`relative h-10 rounded-lg text-sm transition-all ${
                    isPast
                      ? "text-muted-foreground/30 cursor-default"
                      : isSelected
                      ? "bg-foreground text-background font-semibold"
                      : "text-foreground hover:bg-primary/10 cursor-pointer"
                  }`}
                >
                  {isEarliest && !isPast && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-primary-foreground bg-primary px-1.5 py-px rounded-full whitespace-nowrap">
                      Best
                    </span>
                  )}
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Window */}
        <p className="text-sm font-medium text-foreground mb-2.5">Preferred Time Window</p>
        <div className="flex flex-col gap-2 mb-1">
          {([
            { value: "morning", label: "Morning" },
            { value: "afternoon", label: "Afternoon" },
            { value: "flexible", label: "Flexible", note: "Best availability" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTimeWindow(opt.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                timeWindow === opt.value
                  ? "border-foreground bg-muted/40"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                timeWindow === opt.value ? "border-foreground" : "border-muted-foreground/40"
              }`}>
                {timeWindow === opt.value && <div className="w-2 h-2 rounded-full bg-foreground" />}
              </div>
              <span className="text-sm font-medium text-foreground">
                {opt.label}
                {"note" in opt && (
                  <span className="text-xs font-semibold text-primary ml-1.5">({opt.note})</span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pool Access */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h2 className="text-base font-bold text-foreground mb-3">How will we access your pool?</h2>
        <div className="flex flex-col gap-2">
          {([
            { value: "home", label: "I will be home" },
            { value: "gate", label: "Gate code provided" },
            { value: "key", label: "Key on property" },
            { value: "other", label: "Other instructions" },
          ] as const).map((opt) => (
            <div key={opt.value}>
              <button
                type="button"
                onClick={() => setAccessMethod(opt.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                  accessMethod === opt.value
                    ? "border-foreground bg-muted/40"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  accessMethod === opt.value ? "border-foreground" : "border-muted-foreground/40"
                }`}>
                  {accessMethod === opt.value && <div className="w-2 h-2 rounded-full bg-foreground" />}
                </div>
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
              </button>
              {opt.value === "gate" && accessMethod === "gate" && (
                <div className="mt-2 ml-7 animate-fade-in">
                  <Input
                    placeholder="Enter gate code"
                    value={gateCode}
                    onChange={(e) => setGateCode(e.target.value)}
                    maxLength={20}
                    className="h-11 rounded-lg border-border bg-muted/30 text-sm"
                  />
                </div>
              )}
              {opt.value === "other" && accessMethod === "other" && (
                <div className="mt-2 ml-7 animate-fade-in">
                  <Textarea
                    placeholder="Describe access instructions..."
                    value={otherInstructions}
                    onChange={(e) => setOtherInstructions(e.target.value)}
                    maxLength={250}
                    rows={3}
                    className="rounded-lg border-border bg-muted/30 text-sm resize-y"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add-ons */}
      <div className="bg-muted/30 rounded-xl border border-dashed border-border p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Optional Add-Ons</p>
        <div className="flex flex-col gap-2.5">
          {[
            { value: "filter", title: "Filter Cleaning", desc: "Improves water circulation and clarity." },
            { value: "chemical", title: "Chemical Balancing", desc: "Ensures safe and properly treated water." },
            { value: "equipment", title: "Equipment Inspection", desc: "Checks pumps and system performance." },
          ].map((addon) => (
            <button
              key={addon.value}
              type="button"
              onClick={() => toggleAddon(addon.value)}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                addons.includes(addon.value)
                  ? "border-foreground bg-muted/40"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <Checkbox
                checked={addons.includes(addon.value)}
                className="mt-0.5 pointer-events-none"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{addon.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{addon.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid() || isSubmitting || isScheduled}
          className={`w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg transition-all ${
            isScheduled ? "bg-green-500 hover:bg-green-500" : ""
          }`}
        >
          {isSubmitting
            ? "Scheduling..."
            : isScheduled
            ? "✓ Cleaning Scheduled!"
            : "Schedule My First Cleaning"}
        </Button>
        <div className="text-center mt-3 space-y-0.5">
          <p className="text-xs text-muted-foreground">Free rescheduling up to 24 hours before service</p>
          <p className="text-xs text-muted-foreground">Cancel anytime after your first month</p>
        </div>
      </div>

      {/* Edit Package Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Change Package</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Select your preferred service package</DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={selectedPass.id}
            onValueChange={(val) => {
              onChangePass(val);
              setEditOpen(false);
            }}
            className="space-y-3 mt-2"
          >
            {passOptions.map((pass) => (
              <label
                key={pass.id}
                className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedPass.id === pass.id
                    ? "border-foreground bg-background shadow-sm"
                    : "border-border bg-background hover:border-muted-foreground"
                }`}
              >
                {pass.isMostPopular && (
                  <Badge className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </Badge>
                )}
                <RadioGroupItem
                  value={pass.id}
                  className="h-5 w-5 border-2 border-muted-foreground data-[state=checked]:border-foreground data-[state=checked]:bg-foreground"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-[15px]">{pass.label}</p>
                  <p className="text-sm text-muted-foreground">{pass.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-muted-foreground">
                    <span className="line-through">${pass.originalPrice}</span>{" "}
                    <span className="text-lg font-bold text-foreground">${pass.discountPrice}</span>
                    <span className="text-foreground">*</span>
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    {pass.percentOff}% OFF
                  </p>
                </div>
              </label>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground text-center px-2 mt-1">
            *Vouchers cover the full price of your first pool service. Don't worry - your technician will be paid in full!
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Step5Schedule;
