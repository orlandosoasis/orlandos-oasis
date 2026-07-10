import { useState } from "react";
import { Calendar, Clock, ChevronRight, CheckCircle2, DollarSign, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePools } from "@/hooks/usePools";
import {
  useServiceCatalog,
  useBookServiceCatalogItem,
  type ServiceCatalogItem,
} from "@/hooks/useServiceCatalog";
import { cn } from "@/lib/utils";

const TIME_WINDOWS = [
  { value: "morning" as const, label: "Morning", sub: "8:00 AM – 12:00 PM" },
  { value: "afternoon" as const, label: "Afternoon", sub: "12:00 PM – 4:00 PM" },
  { value: "evening" as const, label: "Evening", sub: "4:00 PM – 6:00 PM" },
];

function fmtDuration(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours === 1) return "1 hr";
  return `${hours} hrs`;
}

function toDateInputMin() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function fmtDisplayDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });
}

type Step = "pick-service" | "pick-date" | "confirm" | "success";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BookCatalogServiceModal({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: catalogItems = [], isLoading } = useServiceCatalog(false);
  const { data: pools = [] } = usePools(user?.id);
  const bookService = useBookServiceCatalogItem();

  const [step, setStep] = useState<Step>("pick-service");
  const [selected, setSelected] = useState<ServiceCatalogItem | null>(null);
  const [date, setDate] = useState(toDateInputMin());
  const [timeWindow, setTimeWindow] = useState<"morning" | "afternoon" | "evening">("morning");

  const pool = pools[0]; // primary pool

  const reset = () => {
    setStep("pick-service");
    setSelected(null);
    setDate(toDateInputMin());
    setTimeWindow("morning");
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleConfirm = async () => {
    if (!user || !pool || !selected) return;
    try {
      await bookService.mutateAsync({
        homeownerId: user.id,
        poolId: pool.id,
        catalogItem: selected,
        serviceDate: date,
        timeWindow,
      });
      setStep("success");
    } catch (e) {
      toast({
        title: "Booking failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const twLabel = TIME_WINDOWS.find((t) => t.value === timeWindow);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "pick-service" && "Book a Service"}
            {step === "pick-date" && "Choose Date & Time"}
            {step === "confirm" && "Confirm Booking"}
            {step === "success" && "Booking Confirmed!"}
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: Pick service ── */}
        {step === "pick-service" && (
          <div className="space-y-2 py-1">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : catalogItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No services available right now.</p>
            ) : catalogItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setSelected(item); setStep("pick-date"); }}
                className="w-full text-left rounded-xl border border-border p-4 hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold">{item.name}</p>
                      {item.category && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{item.category}</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${item.price.toFixed(2)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtDuration(item.durationHours)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 mt-1 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 2: Pick date & time ── */}
        {step === "pick-date" && selected && (
          <div className="space-y-5 py-1">
            <div className="rounded-xl bg-muted/50 border border-border p-3">
              <p className="text-xs font-semibold text-muted-foreground">Selected service</p>
              <p className="text-sm font-semibold mt-0.5">{selected.name}</p>
              <p className="text-xs text-muted-foreground">${selected.price.toFixed(2)} · {fmtDuration(selected.durationHours)}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" /> Date
              </label>
              <input
                type="date"
                value={date}
                min={toDateInputMin()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" /> Time Window
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TIME_WINDOWS.map((tw) => (
                  <button
                    key={tw.value}
                    onClick={() => setTimeWindow(tw.value)}
                    className={cn(
                      "rounded-lg border p-2.5 text-left transition-colors",
                      timeWindow === tw.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <p className="text-xs font-semibold">{tw.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{tw.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setStep("pick-service")}>Back</Button>
              <Button className="flex-1" disabled={!date} onClick={() => setStep("confirm")}>Continue</Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === "confirm" && selected && (
          <div className="space-y-4 py-1">
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold">{selected.name}</p>
                {selected.description && <p className="text-xs text-muted-foreground mt-0.5">{selected.description}</p>}
              </div>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{fmtDisplayDate(date)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{twLabel?.label} · {twLabel?.sub}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{fmtDuration(selected.durationHours)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold">
                  <span>Total</span>
                  <span>${selected.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
            {pool && (
              <p className="text-xs text-muted-foreground text-center">
                Service will be performed at your registered pool address.
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("pick-date")} disabled={bookService.isPending}>Back</Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={bookService.isPending}>
                {bookService.isPending ? "Booking…" : "Confirm Booking"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Success ── */}
        {step === "success" && selected && (
          <div className="flex flex-col items-center text-center py-4 space-y-3">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-base font-semibold">{selected.name} booked!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Scheduled for {fmtDisplayDate(date)}, {twLabel?.label}.
                <br />We'll confirm your appointment shortly.
              </p>
            </div>
            <Button className="w-full mt-2" onClick={() => handleClose(false)}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
