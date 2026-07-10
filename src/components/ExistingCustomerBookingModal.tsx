import { useState } from "react";
import { MapPin, Layers, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePool } from "@/hooks/usePools";
import { cn } from "@/lib/utils";

type Step = "choose" | "pool-address" | "pool-details" | "pool-confirm" | "pool-success";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookService: () => void; // opens BookCatalogServiceModal
}

const POOL_TYPES = ["In-Ground", "Above-Ground", "Semi In-Ground"];
const POOL_SIZES = [
  { value: "small", label: "Small", sub: "Up to 10,000 gal" },
  { value: "medium", label: "Medium", sub: "10,000 – 20,000 gal" },
  { value: "large", label: "Large", sub: "20,000+ gal" },
];
const WATER_TYPES = ["Chlorine", "Salt Water", "Mineral"];

export default function ExistingCustomerBookingModal({ open, onOpenChange, onBookService }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createPool = useCreatePool();

  const [step, setStep] = useState<Step>("choose");

  // Pool address fields
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  // Pool detail fields
  const [poolType, setPoolType] = useState("In-Ground");
  const [poolSize, setPoolSize] = useState("medium");
  const [waterType, setWaterType] = useState("Chlorine");

  const reset = () => {
    setStep("choose");
    setAddress(""); setCity(""); setState(""); setZip("");
    setPoolType("In-Ground"); setPoolSize("medium"); setWaterType("Chlorine");
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleChooseService = () => {
    handleClose(false);
    onBookService();
  };

  const addressValid = address.trim() && city.trim() && state.trim() && zip.trim();

  const handleConfirm = async () => {
    if (!user) return;
    try {
      await createPool.mutateAsync({
        homeownerId: user.id,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        poolType,
        poolSize,
        waterType,
        equipment: "",
        accessMethod: "gate-code",
        accessDetail: "",
      });
      setStep("pool-success");
    } catch (e) {
      toast({
        title: "Could not add pool",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const title = {
    choose: "Book a Service",
    "pool-address": "New Pool — Location",
    "pool-details": "New Pool — Details",
    "pool-confirm": "Confirm New Pool",
    "pool-success": "Pool Added!",
  }[step];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* ── Step 0: Choose ── */}
        {step === "choose" && (
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">What would you like to do?</p>

            <button
              onClick={() => setStep("pool-address")}
              className="w-full text-left rounded-xl border border-border p-4 hover:border-primary hover:bg-primary/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Subscribe another pool</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Add a pool at a different location to your account</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              </div>
            </button>

            <button
              onClick={handleChooseService}
              className="w-full text-left rounded-xl border border-border p-4 hover:border-primary hover:bg-primary/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Add a different service</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Book a one-time service for your existing pool</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              </div>
            </button>
          </div>
        )}

        {/* ── Step 1: Pool address ── */}
        {step === "pool-address" && (
          <div className="space-y-4 py-1">
            <p className="text-sm text-muted-foreground">Enter the address of the new pool.</p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Orlando"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="FL"
                    maxLength={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">ZIP Code</label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="32801"
                  maxLength={10}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setStep("choose")}>Back</Button>
              <Button className="flex-1" disabled={!addressValid} onClick={() => setStep("pool-details")}>Continue</Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Pool details ── */}
        {step === "pool-details" && (
          <div className="space-y-5 py-1">
            <div className="space-y-2">
              <p className="text-sm font-medium">Pool Type</p>
              <div className="grid grid-cols-3 gap-2">
                {POOL_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setPoolType(t)}
                    className={cn(
                      "rounded-lg border p-2.5 text-xs font-medium transition-colors",
                      poolType === t
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Pool Size</p>
              <div className="grid grid-cols-3 gap-2">
                {POOL_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setPoolSize(s.value)}
                    className={cn(
                      "rounded-lg border p-2.5 text-left transition-colors",
                      poolSize === s.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <p className="text-xs font-semibold">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Water Type</p>
              <div className="grid grid-cols-3 gap-2">
                {WATER_TYPES.map((w) => (
                  <button
                    key={w}
                    onClick={() => setWaterType(w)}
                    className={cn(
                      "rounded-lg border p-2.5 text-xs font-medium transition-colors",
                      waterType === w
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-foreground"
                    )}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setStep("pool-address")}>Back</Button>
              <Button className="flex-1" onClick={() => setStep("pool-confirm")}>Review</Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === "pool-confirm" && (
          <div className="space-y-4 py-1">
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold">New Pool Summary</p>
              </div>
              <div className="divide-y divide-border text-sm">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium text-right max-w-[200px]">{address}, {city}, {state} {zip}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{poolType}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium">{POOL_SIZES.find((s) => s.value === poolSize)?.label}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Water</span>
                  <span className="font-medium">{waterType}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Our team will reach out to confirm scheduling for this pool.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("pool-details")} disabled={createPool.isPending}>Back</Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={createPool.isPending}>
                {createPool.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding…</> : "Add Pool"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Success ── */}
        {step === "pool-success" && (
          <div className="flex flex-col items-center text-center py-4 space-y-3">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-base font-semibold">Pool added successfully!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {address}, {city}, {state} {zip}
                <br />Our team will be in touch to schedule your first visit.
              </p>
            </div>
            <Button className="w-full mt-2" onClick={() => handleClose(false)}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
