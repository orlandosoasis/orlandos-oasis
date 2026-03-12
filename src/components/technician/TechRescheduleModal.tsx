import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { TIME_LABELS, formatDateFull } from "@/data/techMockData";

const TIME_SLOTS: { value: string; label: string; range: string }[] = [
  { value: "morning", label: "Morning", range: "8:00 AM – 12:00 PM" },
  { value: "afternoon", label: "Afternoon", range: "12:00 PM – 4:00 PM" },
  { value: "evening", label: "Evening", range: "4:00 PM – 6:00 PM" },
];

interface TechRescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date;
  currentTimeWindow: string;
  homeownerName: string;
  onConfirm: (newDate: Date, newTime: string, message: string) => void;
}

export default function TechRescheduleModal({
  open,
  onOpenChange,
  currentDate,
  currentTimeWindow,
  homeownerName,
  onConfirm,
}: TechRescheduleModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState("");

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setSelectedDate(undefined);
      setSelectedTime(undefined);
      setMessage("");
    }, 300);
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onConfirm(selectedDate, selectedTime, message);
      setStep(3);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto p-0">
        {step === 1 && (
          <div className="p-6 pt-10 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Reschedule Service</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Select a new date and time for {homeownerName}'s service.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.toDateString() === new Date().toDateString()}
                className="p-3 pointer-events-auto"
              />
            </div>

            {selectedDate && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Select Time</p>
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot.value}
                    onClick={() => setSelectedTime(slot.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all",
                      selectedTime === slot.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{slot.label}</p>
                      <p className="text-xs text-muted-foreground">{slot.range}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Message to Homeowner (optional)</p>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi, I need to reschedule the pool service due to scheduling conflicts."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1 hover:text-primary hover:border-primary hover:bg-transparent" onClick={handleClose}>
                Cancel
              </Button>
              <Button className="flex-1 font-semibold" disabled={!selectedDate || !selectedTime} onClick={() => setStep(2)}>
                Review
              </Button>
            </div>
          </div>
        )}

        {step === 2 && selectedDate && selectedTime && (
          <div className="p-6 pt-10 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">Confirm Reschedule</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Review the updated schedule for {homeownerName}.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-4 border border-border space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current</p>
                <p className="text-sm font-semibold text-foreground">{formatDateFull(currentDate)}</p>
                <p className="text-xs text-muted-foreground">{TIME_LABELS[currentTimeWindow]}</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/30 space-y-1.5">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">New</p>
                <p className="text-sm font-semibold text-foreground">{formatDateFull(selectedDate)}</p>
                <p className="text-xs text-muted-foreground">{TIME_LABELS[selectedTime]}</p>
              </div>
            </div>

            {message && (
              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Message to homeowner:</p>
                <p className="text-sm text-foreground">{message}</p>
              </div>
            )}

            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1 hover:text-primary hover:border-primary hover:bg-transparent" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button className="flex-1 font-semibold" onClick={handleConfirm}>
                Confirm Reschedule
              </Button>
            </div>
          </div>
        )}

        {step === 3 && selectedDate && selectedTime && (
          <div className="p-6 pt-10 space-y-5">
            <Alert className="border-green-500/30 bg-green-500/5">
              <CheckCircle2 className="h-4 w-4 !text-green-600" />
              <AlertDescription className="ml-2">
                <p className="font-semibold text-foreground text-sm">Service Rescheduled</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {homeownerName}'s service has been moved to {formatDateFull(selectedDate)} from {TIME_LABELS[selectedTime]}.
                </p>
              </AlertDescription>
            </Alert>
            <Button className="w-full font-semibold" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
