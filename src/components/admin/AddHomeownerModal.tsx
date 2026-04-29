import { useState } from "react";
import { Check, ChevronLeft, User, Waves, Calendar as CalendarIcon, ClipboardList } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { ADDONS } from "@/components/AddonsStep";
import type { AdminHomeowner } from "@/types/admin";

interface AddHomeownerModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (h: AdminHomeowner) => void;
}

const STEPS = [
  { key: "info", label: "Information" },
  { key: "pool", label: "Pool & Plan" },
  { key: "schedule", label: "Schedule" },
  { key: "review", label: "Review" },
];

// ── Sourced from landing page (ServiceConfigStep.tsx) ──
const POOL_SIZES = [
  { value: "small", label: "Small Pool", sublabel: "Standard residential" },
  { value: "medium", label: "Medium Pool", sublabel: "Mid-size residential" },
  { value: "large", label: "Large Pool", sublabel: "Large or custom" },
];

const FREQUENCIES = [
  { value: "weekly", label: "Weekly Pool Service" },
  { value: "twice-weekly", label: "Twice Per Week Pool Service" },
  { value: "three-weekly", label: "Three Times Per Week Pool Service" },
];

const FREQUENCY_SHORT: Record<string, string> = {
  weekly: "Weekly",
  "twice-weekly": "Twice per week",
  "three-weekly": "Three times per week",
};

// ── Sourced from dashboard/landing booking flow (Step5Schedule / BookingFlow) ──
const TIME_WINDOWS = [
  { value: "morning", label: "Morning (8am–12pm)" },
  { value: "afternoon", label: "Afternoon (12pm–4pm)" },
  { value: "evening", label: "Evening (4pm–6pm)" },
];

const TIME_WINDOW_SHORT: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};



const AddHomeownerModal = ({ open, onClose, onCreate }: AddHomeownerModalProps) => {
  const [step, setStep] = useState(1);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  // Step 2
  const [poolSize, setPoolSize] = useState("");
  const [poolNotes, setPoolNotes] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Step 3
  const [timeWindow, setTimeWindow] = useState("morning");
  const [startDate, setStartDate] = useState("");
  const [autoRecurring, setAutoRecurring] = useState(true);
  const [paymentOption, setPaymentOption] = useState("offline");
  const [sendInvite, setSendInvite] = useState(false);

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const reset = () => {
    setStep(1); setFullName(""); setPhone(""); setEmail(""); setStreet(""); setCity("");
    setState(""); setZip(""); setPoolSize("");
    setPoolNotes(""); setFrequency("weekly"); setSelectedAddons([]);
    setTimeWindow("morning"); setStartDate(""); setAutoRecurring(true); setPaymentOption("offline");
    setSendInvite(false); setErrors({});
  };

  const handleClose = () => { reset(); onClose(); };

  const validateStep1 = () => {
    const e: Record<string, boolean> = {};
    if (!fullName.trim()) e.fullName = true;
    if (!phone.trim()) e.phone = true;
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) e.email = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(s => Math.min(s + 1, 4));
  };

  const back = () => setStep(s => Math.max(s - 1, 1));

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const poolSizeLabel = POOL_SIZES.find(p => p.value === poolSize)?.label ?? "—";
  const frequencyLabel = FREQUENCY_SHORT[frequency];
  const planLabel = poolSize ? `${poolSizeLabel} · ${frequencyLabel}` : "—";
  const addonTitles = ADDONS.filter(a => selectedAddons.includes(a.id)).map(a => a.title);

  const nextServiceDate = (() => {
    if (!startDate) return null;
    const base = new Date(startDate);
    if (isNaN(base.getTime())) return null;
    const daysToAdd = frequency === "twice-weekly" ? 3 : frequency === "three-weekly" ? 2 : 7;
    base.setDate(base.getDate() + daysToAdd);
    return base;
  })();

  const handleCreate = () => {
    const fullAddress = [street, city, state, zip].filter(Boolean).join(", ");
    const newHomeowner: AdminHomeowner = {
      id: Date.now(),
      name: fullName,
      email,
      phone,
      address: fullAddress || "—",
      plan: planLabel,
      startDate: startDate || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      pools: [{ address: street || fullAddress || "—", size: poolSizeLabel, technician: "Unassigned", nextService: startDate || "TBD" }],
      services: [],
      manuallyAdded: true,
      status: "Active",
      frequency: frequencyLabel,
      paymentMethod: paymentOption === "offline" ? "Pays Offline" : "Marked as Paid",
      notes: poolNotes,
    };
    onCreate(newHomeowner);
    reset();
  };

  // ── Stepper ──
  const Stepper = () => (
    <div className="flex items-center justify-between mb-6">
      {STEPS.map((s, i) => {
        const num = i + 1;
        const isCompleted = num < step;
        const isCurrent = num === step;
        return (
          <div key={s.key} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center h-9 w-9 rounded-full text-sm font-bold transition-colors ${
                isCompleted ? "bg-primary text-primary-foreground"
                  : isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}>
                {isCompleted ? <Check className="h-4 w-4" /> : num}
              </div>
              <span className={`text-xs mt-1.5 font-medium whitespace-nowrap ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 mb-5 ${num < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-foreground mb-3">{children}</h3>
  );

  const errClass = (k: string) => errors[k] ? "border-destructive focus-visible:border-destructive" : "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto pt-10 bg-white">
        <div>
          <h2 className="text-lg font-semibold mb-1">Add Homeowner</h2>
          <p className="text-sm text-muted-foreground mb-6">Manually add a homeowner to the platform.</p>

          <Stepper />

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <SectionTitle>Homeowner Info</SectionTitle>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="fullName" className="mb-1.5 block">Full Name <span className="text-destructive">*</span></Label>
                    <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className={errClass("fullName")} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="phone" className="mb-1.5 block">Phone Number <span className="text-destructive">*</span></Label>
                      <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} className={errClass("phone")} />
                    </div>
                    <div>
                      <Label htmlFor="email" className="mb-1.5 block">Email <span className="text-destructive">*</span></Label>
                      <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={errClass("email")} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <SectionTitle>Address</SectionTitle>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="street" className="mb-1.5 block">Street Address</Label>
                    <Input id="street" value={street} onChange={e => setStreet(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="city" className="mb-1.5 block">City</Label>
                      <Input id="city" value={city} onChange={e => setCity(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="state" className="mb-1.5 block">State</Label>
                      <Input id="state" value={state} onChange={e => setState(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="zip" className="mb-1.5 block">ZIP</Label>
                      <Input id="zip" value={zip} onChange={e => setZip(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <SectionTitle>Pool Info</SectionTitle>
                <div className="space-y-3">
                  <div>
                    <Label className="mb-1.5 block text-xs">Pool Size</Label>
                    <Select value={poolSize} onValueChange={setPoolSize}>
                      <SelectTrigger><SelectValue placeholder="Select pool size" /></SelectTrigger>
                      <SelectContent>
                        {POOL_SIZES.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label} — {p.sublabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Textarea
                      value={poolNotes}
                      onChange={e => setPoolNotes(e.target.value)}
                      placeholder="Gate code, preferences, etc."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div>
                <SectionTitle>Service Plan</SectionTitle>
                <div className="space-y-3">
                  <div>
                    <Label className="mb-1.5 block">Service Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Add-ons</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ADDONS.map(a => (
                        <label key={a.id} className="flex items-start gap-2 cursor-pointer p-2 rounded-md border border-input hover:bg-muted/50">
                          <Checkbox className="mt-0.5" checked={selectedAddons.includes(a.id)} onCheckedChange={() => toggleAddon(a.id)} />
                          <span className="text-sm leading-snug">{a.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <SectionTitle>Schedule</SectionTitle>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1.5 block">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "flex h-12 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-base md:text-sm text-left transition-colors hover:border-ring focus-visible:outline-none focus-visible:border-primary",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <span>{startDate ? format(new Date(startDate), "PPP") : "Pick a date"}</span>
                            <CalendarIcon className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate ? new Date(startDate) : undefined}
                            onSelect={(d) => setStartDate(d ? format(d, "yyyy-MM-dd") : "")}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      {nextServiceDate && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Next service: {format(nextServiceDate, "PPP")}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="mb-1.5 block">Arrival Window</Label>
                      <Select value={timeWindow} onValueChange={setTimeWindow}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIME_WINDOWS.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md border border-input">
                    <div>
                      <div className="text-sm font-medium">Auto-generate recurring schedule</div>
                      <div className="text-xs text-muted-foreground">Creates upcoming visits automatically</div>
                    </div>
                    <Switch checked={autoRecurring} onCheckedChange={setAutoRecurring} />
                  </div>
                </div>
              </div>

              <div>
                <SectionTitle>Payment Setup</SectionTitle>
                <RadioGroup value={paymentOption} onValueChange={setPaymentOption} className="space-y-2">
                  <label className="flex items-start gap-3 p-3 rounded-md border border-input cursor-pointer">
                    <RadioGroupItem value="offline" id="pay-off" className="mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Customer pays offline (default)</div>
                      <div className="text-xs text-muted-foreground">Track payments manually</div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-md border border-input cursor-pointer">
                    <RadioGroupItem value="paid" id="pay-paid" className="mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Mark as already paid</div>
                      <div className="text-xs text-muted-foreground">Last payment date: {new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">Homeowner Info</h4>
                    </div>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <div><span className="text-foreground font-medium">{fullName || "—"}</span></div>
                      <div>{phone || "—"}</div>
                      <div>{email || "—"}</div>
                      <div className="text-xs pt-1">{[street, city, state, zip].filter(Boolean).join(", ") || "—"}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Waves className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">Pool & Plan</h4>
                    </div>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <div>{poolSizeLabel}</div>
                      <div><span className="text-foreground font-medium">{frequencyLabel}</span></div>
                      <div className="text-xs">Add-ons: {addonTitles.length > 0 ? addonTitles.join(", ") : "None"}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">Schedule</h4>
                    </div>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <div>Arrival: {TIME_WINDOW_SHORT[timeWindow]}</div>
                      <div>Starts: <span className="text-foreground font-medium">{startDate || "—"}</span></div>
                      <div className="text-xs">Auto-recurring: {autoRecurring ? "On" : "Off"}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">Payment</h4>
                    </div>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <div className="text-foreground font-medium">
                        {paymentOption === "offline" ? "Pays Offline" : paymentOption === "card" ? "Card on File" : "Marked as Paid"}
                      </div>
                      <div className="text-xs">{paymentOption === "offline" ? "Track payments manually" : ""}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <label className="flex items-center justify-between p-3 rounded-md border border-input cursor-pointer">
                <div>
                  <div className="text-sm font-medium">Send invite to homeowner</div>
                  <div className="text-xs text-muted-foreground">Sends a login link after creation</div>
                </div>
                <Switch checked={sendInvite} onCheckedChange={setSendInvite} />
              </label>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
            {step > 1 ? (
              <Button variant="outline" onClick={back} className="gap-1.5">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
            )}
            {step < 4 ? (
              <Button onClick={next}>Next</Button>
            ) : (
              <Button onClick={handleCreate}>Add Homeowner</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddHomeownerModal;
