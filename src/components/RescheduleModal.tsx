import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarClock, ArrowLeft, CheckCircle2, Clock, MapPin, Star, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { BookingData, TimeWindow } from "@/contexts/BookingContext";

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TIME_SLOTS: { value: TimeWindow; label: string; range: string }[] = [
  { value: "morning", label: "Morning", range: "8:00 AM – 12:00 PM" },
  { value: "afternoon", label: "Afternoon", range: "12:00 PM – 4:00 PM" },
  { value: "evening", label: "Evening", range: "4:00 PM – 6:00 PM" },
];

function formatDate(d: Date) {
  return `${FULL_DAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getTimeRange(tw: TimeWindow) {
  return TIME_SLOTS.find((s) => s.value === tw)?.range || "";
}

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingData;
  onReschedule: (newDate: Date, newTimeWindow: TimeWindow) => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

export default function RescheduleModal({ open, onOpenChange, booking, onReschedule }: RescheduleModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<TimeWindow | undefined>(undefined);

  const { selectedPass, scheduleData, technician, pool } = booking;
  const currentDate = scheduleData.selectedDate;
  const fullAddress = pool ? [pool.address, pool.city, pool.state, pool.zip].filter(Boolean).join(", ") : "";

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setSelectedDate(undefined);
      setSelectedTime(undefined);
    }, 300);
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onReschedule(selectedDate, selectedTime);
      setStep(5);
    }
  };

  const isDateChanged = selectedDate && selectedDate.toDateString() !== currentDate.toDateString();
  const isTimeChanged = selectedTime && selectedTime !== scheduleData.timeWindow;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto p-0">
        {/* Step 1: Confirm Reschedule */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Reschedule Your Pool Service</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Choose a new date and time for your upcoming service.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/50 rounded-xl p-4 space-y-2.5 border border-border">
              <p className="text-sm font-semibold text-foreground">{selectedPass.hours}-Hour Pool Service</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                <span>{formatDate(currentDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{getTimeRange(scheduleData.timeWindow)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{fullAddress}</span>
              </div>
              {technician.isAssigned && (
                <>
                  <div className="border-t border-border my-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned Pool Technician</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{technician.name}</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <Button className="w-full font-semibold" onClick={() => setStep(2)}>
                Continue to Select New Date
              </Button>
              <Button variant="outline" className="w-full hover:text-primary hover:border-primary hover:bg-transparent" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select New Date */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">Select a New Date</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Pick an available date for your rescheduled service.
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
              <div className="bg-muted/50 rounded-xl px-4 py-3 border border-border flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{formatDate(selectedDate)}</span>
              </div>
            )}

            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1 hover:text-primary hover:border-primary hover:bg-transparent" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button className="flex-1 font-semibold" disabled={!selectedDate} onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Select Time Window */}
        {step === 3 && (
          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">Select a Time Window</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Choose an available time slot for {selectedDate ? formatDate(selectedDate) : ""}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot.value}
                  onClick={() => setSelectedTime(slot.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-all",
                    selectedTime === slot.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{slot.label}</p>
                    <p className="text-xs text-muted-foreground">{slot.range}</p>
                  </div>
                  <Clock className={cn("h-4 w-4", selectedTime === slot.value ? "text-primary" : "text-muted-foreground")} />
                </button>
              ))}
            </div>

            {(isDateChanged || isTimeChanged) && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>You may be assigned a different pool technician based on availability.</span>
              </div>
            )}

            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1 hover:text-primary hover:border-primary hover:bg-transparent" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button className="flex-1 font-semibold" disabled={!selectedTime} onClick={() => setStep(4)}>
                Review Changes
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review Changes */}
        {step === 4 && selectedDate && selectedTime && (
          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">Review Changes</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Confirm your rescheduled service details.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3">
              {/* Current */}
              <div className="bg-muted/50 rounded-xl p-4 border border-border space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current</p>
                <p className="text-sm font-semibold text-foreground">{formatDate(currentDate)}</p>
                <p className="text-xs text-muted-foreground">{getTimeRange(scheduleData.timeWindow)}</p>
              </div>
              {/* New */}
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/30 space-y-1.5">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">New</p>
                <p className="text-sm font-semibold text-foreground">{formatDate(selectedDate)}</p>
                <p className="text-xs text-muted-foreground">{getTimeRange(selectedTime)}</p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1 hover:text-primary hover:border-primary hover:bg-transparent" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button className="flex-1 font-semibold" onClick={handleConfirm}>
                Confirm Reschedule
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && selectedDate && selectedTime && (
          <div className="p-6 space-y-5">
            <Alert className="border-green-500/30 bg-green-500/5">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="ml-2">
                <p className="font-semibold text-foreground text-sm">Service Successfully Rescheduled</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your pool service is now scheduled for {formatDate(selectedDate)} from {getTimeRange(selectedTime)}.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2.5">
              <Button className="flex-1 font-semibold" onClick={handleClose}>
                View Service Details
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { handleClose(); window.location.href = "/messages"; }}>
                Message Technician
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
