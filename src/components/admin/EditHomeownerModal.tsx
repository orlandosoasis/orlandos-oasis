import { useEffect, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
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
import { ADDONS } from "@/components/AddonsStep";
import type { AdminHomeowner } from "@/types/admin";

interface EditHomeownerModalProps {
  open: boolean;
  onClose: () => void;
  homeowner: AdminHomeowner | null;
  onSave: (h: AdminHomeowner) => void;
}

const POOL_SIZES = [
  { value: "small", label: "Small Pool" },
  { value: "medium", label: "Medium Pool" },
  { value: "large", label: "Large Pool" },
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

const TIME_WINDOWS = [
  { value: "morning", label: "Morning (8am–12pm)" },
  { value: "afternoon", label: "Afternoon (12pm–4pm)" },
  { value: "evening", label: "Evening (4pm–6pm)" },
];

// Reverse lookup helpers - derive form values from the saved label strings.
const findFrequencyValue = (label?: string) => {
  if (!label) return "weekly";
  const match = Object.entries(FREQUENCY_SHORT).find(([, v]) => label.includes(v));
  return match?.[0] ?? "weekly";
};

const findPoolSizeValue = (size?: string) => {
  if (!size) return "";
  const match = POOL_SIZES.find(p => size.toLowerCase().includes(p.value));
  return match?.value ?? "";
};

const splitAddress = (addr: string) => {
  // best-effort split for "Street, City, State, ZIP"
  const parts = addr.split(",").map(s => s.trim());
  return {
    street: parts[0] ?? "",
    city: parts[1] ?? "",
    state: parts[2] ?? "",
    zip: parts[3] ?? "",
  };
};

const EditHomeownerModal = ({ open, onClose, homeowner, onSave }: EditHomeownerModalProps) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  const [poolSize, setPoolSize] = useState("");
  const [poolNotes, setPoolNotes] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const [timeWindow, setTimeWindow] = useState("morning");
  const [startDate, setStartDate] = useState("");
  const [autoRecurring, setAutoRecurring] = useState(true);
  const [paymentOption, setPaymentOption] = useState("offline");

  const [isGrandfathered, setIsGrandfathered] = useState(false);
  const [grandfatheredNote, setGrandfatheredNote] = useState("");
  const [isFreds, setIsFreds] = useState(false);

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Pre-fill whenever homeowner changes / modal opens
  useEffect(() => {
    if (!homeowner || !open) return;
    const addr = splitAddress(homeowner.address || "");
    setFullName(homeowner.name || "");
    setPhone(homeowner.phone || "");
    setEmail(homeowner.email || "");
    setStreet(addr.street);
    setCity(addr.city);
    setState(addr.state);
    setZip(addr.zip);
    setPoolSize(findPoolSizeValue(homeowner.pools?.[0]?.size));
    setPoolNotes(homeowner.notes || "");
    setFrequency(findFrequencyValue(homeowner.frequency));
    setSelectedAddons([]);
    setTimeWindow("morning");
    setStartDate(homeowner.startDate || "");
    setAutoRecurring(true);
    setPaymentOption(homeowner.paymentMethod === "Marked as Paid" ? "paid" : "offline");
    setIsGrandfathered(Boolean(homeowner.isGrandfathered));
    setGrandfatheredNote(homeowner.grandfatheredNote ?? "");
    setIsFreds(Boolean(homeowner.isFreds));
    setErrors({});
  }, [homeowner, open]);

  const toggleAddon = (id: string) =>
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!fullName.trim()) e.fullName = true;
    if (!phone.trim()) e.phone = true;
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) e.email = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextServiceDate = (() => {
    if (!startDate) return null;
    const base = new Date(startDate);
    if (isNaN(base.getTime())) return null;
    const daysToAdd = frequency === "twice-weekly" ? 3 : frequency === "three-weekly" ? 2 : 7;
    base.setDate(base.getDate() + daysToAdd);
    return base;
  })();

  const handleSave = () => {
    if (!homeowner || !validate()) return;
    const fullAddress = [street, city, state, zip].filter(Boolean).join(", ");
    const poolSizeLabel = POOL_SIZES.find(p => p.value === poolSize)?.label ?? homeowner.pools?.[0]?.size ?? "-";
    const frequencyLabel = FREQUENCY_SHORT[frequency];
    const planLabel = poolSize ? `${poolSizeLabel} · ${frequencyLabel}` : homeowner.plan;

    const updated: AdminHomeowner = {
      ...homeowner,
      name: fullName,
      email,
      phone,
      address: fullAddress || homeowner.address,
      plan: planLabel,
      startDate: startDate || homeowner.startDate,
      frequency: frequencyLabel,
      paymentMethod: paymentOption === "offline" ? "Pays Offline" : "Marked as Paid",
      notes: poolNotes,
      isGrandfathered,
      grandfatheredNote: isGrandfathered ? (grandfatheredNote || null) : null,
      isFreds,
      notificationsEnabled: !isFreds,
      // Update only the first pool's size; preserve past services & payment history.
      pools: homeowner.pools.map((p, i) =>
        i === 0
          ? { ...p, size: poolSizeLabel, nextService: nextServiceDate ? format(nextServiceDate, "PPP") : p.nextService }
          : p
      ),
    };
    onSave(updated);
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-foreground mb-3">{children}</h3>
  );

  const errClass = (k: string) => errors[k] ? "border-destructive focus-visible:border-destructive" : "";

  if (!homeowner) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto pt-10 bg-white">
        <div>
          <h2 className="text-lg font-semibold mb-1">Edit Homeowner</h2>
          <p className="text-sm text-muted-foreground mb-6">Update homeowner details</p>

          <div className="space-y-8">
            {/* Section 1: Homeowner Info */}
            <div>
              <SectionTitle>Homeowner Info</SectionTitle>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="e-fullName" className="mb-1.5 block">Full Name <span className="text-destructive">*</span></Label>
                  <Input id="e-fullName" value={fullName} onChange={e => setFullName(e.target.value)} className={errClass("fullName")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="e-phone" className="mb-1.5 block">Phone Number <span className="text-destructive">*</span></Label>
                    <Input id="e-phone" value={phone} onChange={e => setPhone(e.target.value)} className={errClass("phone")} />
                  </div>
                  <div>
                    <Label htmlFor="e-email" className="mb-1.5 block">Email <span className="text-destructive">*</span></Label>
                    <Input id="e-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={errClass("email")} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="e-street" className="mb-1.5 block">Street Address</Label>
                  <Input id="e-street" value={street} onChange={e => setStreet(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="e-city" className="mb-1.5 block">City</Label>
                    <Input id="e-city" value={city} onChange={e => setCity(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="e-state" className="mb-1.5 block">State</Label>
                    <Input id="e-state" value={state} onChange={e => setState(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="e-zip" className="mb-1.5 block">ZIP</Label>
                    <Input id="e-zip" value={zip} onChange={e => setZip(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Pool & Plan */}
            <div>
              <SectionTitle>Pool & Plan</SectionTitle>
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block">Pool Size</Label>
                  <Select value={poolSize} onValueChange={setPoolSize}>
                    <SelectTrigger><SelectValue placeholder="Select pool size" /></SelectTrigger>
                    <SelectContent>
                      {POOL_SIZES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
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

            {/* Section 3: Schedule */}
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

            {/* Section 4: Payment */}
            <div>
              <SectionTitle>Payment</SectionTitle>
              <RadioGroup value={paymentOption} onValueChange={setPaymentOption} className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-md border border-input cursor-pointer">
                  <RadioGroupItem value="offline" id="e-pay-off" className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Customer pays offline (default)</div>
                    <div className="text-xs text-muted-foreground">Track payments manually</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-md border border-input cursor-pointer">
                  <RadioGroupItem value="paid" id="e-pay-paid" className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Mark as already paid</div>
                    <div className="text-xs text-muted-foreground">Last payment recorded today</div>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Section 5: Account Tags */}
            <div>
              <SectionTitle>Account Tags</SectionTitle>
              <div className="space-y-3">
                <div className="flex items-start justify-between p-3 rounded-md border border-amber-200 bg-amber-50/50 gap-3">
                  <div>
                    <div className="text-sm font-medium text-amber-900">Grandfathered (legacy pricing)</div>
                    <div className="text-xs text-amber-800/70">Flags this account as a legacy-rate customer.</div>
                  </div>
                  <Switch checked={isGrandfathered} onCheckedChange={setIsGrandfathered} />
                </div>
                {isGrandfathered && (
                  <div>
                    <Label className="mb-1.5 block">Grandfathered Note <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input
                      value={grandfatheredNote}
                      onChange={(e) => setGrandfatheredNote(e.target.value)}
                      placeholder="e.g. Original 2019 rate"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between p-3 rounded-md border border-violet-200 bg-violet-50/50 gap-3">
                  <div>
                    <div className="text-sm font-medium text-violet-900">Fred's (notifications suppressed)</div>
                    <div className="text-xs text-violet-800/70">No emails or notifications will be sent. Service data is still tracked.</div>
                  </div>
                  <Switch checked={isFreds} onCheckedChange={setIsFreds} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditHomeownerModal;
