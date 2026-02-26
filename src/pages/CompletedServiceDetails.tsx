import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Waves, ArrowLeft, Clock, Calendar, MapPin, Star, Key, Droplets, Camera, FileText, CheckCircle2, RefreshCw, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBooking } from "@/contexts/BookingContext";
import PoolSceneHero from "@/components/dashboard/PoolSceneHero";

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TIME_LABELS: Record<string, string> = {
  morning: "8:00 AM – 12:00 PM",
  afternoon: "12:00 PM – 4:00 PM",
  evening: "4:00 PM – 6:00 PM",
};

const ACCESS_LABELS: Record<string, string> = {
  home: "Owner will be home",
  gate: "Gate code provided",
  key: "Key on property",
  other: "Custom instructions provided",
};

/* Mock service report data for the sample completed service */
const COMPLETED_CHECKLIST = [
  { task: "Surface skimming & debris removal", done: true },
  { task: "Walls & floor brushing", done: true },
  { task: "Vacuum pool floor", done: true },
  { task: "Empty skimmer & pump baskets", done: true },
  { task: "Check & adjust chemical levels", done: true },
  { task: "Backwash / rinse filter", done: true },
  { task: "Inspect equipment for issues", done: true },
  { task: "Tile line scrubbing", done: true },
];

const CHEMICAL_READINGS = [
  { label: "Free Chlorine", value: "3.0 ppm", status: "good" },
  { label: "pH Level", value: "7.4", status: "good" },
  { label: "Total Alkalinity", value: "95 ppm", status: "good" },
  { label: "Cyanuric Acid", value: "40 ppm", status: "good" },
];

const CleaningNotes = ({ notes }: { notes: string }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-4">
      <p className="text-[15px] font-bold text-foreground mb-1.5">Cleaning Notes</p>
      <p className={`text-[13.5px] text-muted-foreground leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}>{notes}</p>
      <button onClick={() => setExpanded(!expanded)} className="text-primary text-[13px] font-semibold hover:underline mt-1">
        {expanded ? "Show less" : "Read more"}
      </button>
    </div>
  );
};

const CompletedServiceDetails = () => {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const [photosExpanded, setPhotosExpanded] = useState(false);

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No completed service found.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const { selectedPass, scheduleData, technician, frequency, pool } = booking;

  // The completed service happened 5 days before the booking date
  const completedDate = new Date(scheduleData.selectedDate);
  completedDate.setDate(completedDate.getDate() - 5);
  const formattedDate = `${FULL_DAYS[completedDate.getDay()]}, ${SHORT_MONTHS[completedDate.getMonth()]} ${completedDate.getDate()}, ${completedDate.getFullYear()}`;

  const isMonthly = frequency === "monthly";
  const totalPaid = selectedPass.discountPrice + scheduleData.addonsTotal;
  const fullAddress = pool ? [pool.address, pool.city, pool.state, pool.zip].filter(Boolean).join(", ") : "Address not provided";

  const getNextServiceDate = () => {
    const next = new Date(scheduleData.selectedDate);
    return `${FULL_DAYS[next.getDay()]}, ${SHORT_MONTHS[next.getMonth()]} ${next.getDate()}, ${next.getFullYear()}`;
  };

  const paymentDate = new Date(completedDate);
  paymentDate.setDate(paymentDate.getDate() - 1);
  const formattedPaymentDate = `${SHORT_MONTHS[paymentDate.getMonth()]} ${paymentDate.getDate()}, ${paymentDate.getFullYear()}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[760px] mx-auto px-5 h-[60px] flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium text-sm">Back</span>
          </button>
          <Link to="/" className="flex items-center gap-1.5">
            <Waves className="h-5 w-5 text-primary" />
            <span className="text-[1.25rem] font-bold text-foreground tracking-tight">Orlando's Oasis</span>
          </Link>
          <div className="w-[60px]" />
        </div>
      </header>

      {/* Hero — Completed State */}
      <div className="relative h-[200px] overflow-hidden">
        <PoolSceneHero />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-[760px] mx-auto">
          <h1 className="text-xl font-bold text-white">{selectedPass.hours}-Hour Pool Service</h1>
          <p className="text-sm font-semibold text-white/90 mt-1">Completed on {formattedDate}</p>
          <Badge className="bg-green-500/90 text-white text-[10px] px-2 py-0.5 mt-1.5 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[760px] mx-auto px-5 py-6 pb-16 space-y-4">

        {/* Service Report — Main Highlight */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-[17px] font-bold text-foreground mb-4">Service Report</h2>

          {/* Before & After Photos */}
          <div>
            <button
              onClick={() => setPhotosExpanded(!photosExpanded)}
              className="flex items-center justify-between w-full text-left mb-3"
            >
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Before & After Photos</span>
              </div>
              {photosExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {photosExpanded && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl overflow-hidden border border-border">
                  <div className="bg-muted h-[140px] flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground font-medium">Before</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-border">
                  <div className="bg-primary/5 h-[140px] flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-6 w-6 text-primary mx-auto mb-1" />
                      <p className="text-xs text-primary font-medium">After</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border my-4" />

          {/* Completed Checklist */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Completed Tasks</span>
            </div>
            <div className="space-y-2">
              {COMPLETED_CHECKLIST.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm text-foreground">{item.task}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border my-4" />

          {/* Chemical Readings */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Chemical Readings</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {CHEMICAL_READINGS.map((reading, i) => (
                <div key={i} className="bg-muted/50 rounded-xl px-3.5 py-2.5">
                  <p className="text-xs text-muted-foreground">{reading.label}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-semibold text-foreground">{reading.value}</span>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Appointment Details + Technician */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Appointment Details */}
          <div className="md:col-span-5 bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col">
            <h2 className="text-[17px] font-bold text-foreground mb-4">Appointment Details</h2>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{selectedPass.hours} {selectedPass.hours === 1 ? "Hour" : "Hours"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <span>{isMonthly ? "Monthly plan" : "One-time service"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-green-600 font-medium">Completed at 11:42 AM</span>
              </div>
            </div>
          </div>

          {/* Technician */}
          <div className="md:col-span-7 bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Your Technician</p>
            <div className="flex gap-3.5 items-start">
              <div className="w-[56px] h-[56px] rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-lg font-bold shrink-0">
                {technician.isAssigned ? technician.initials : "CM"}
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">{technician.isAssigned ? technician.name : "Carlos M."}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-cta-yellow text-cta-yellow" />
                  <span>{technician.isAssigned ? technician.rating : 4.9}</span>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Completed this service visit.
                </p>
                <Button variant="outline" size="sm" className="mt-2 text-xs gap-1.5 rounded-lg">
                  <Star className="h-3 w-3" />
                  Leave a Review
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Your Pool */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-[17px] font-bold text-foreground mb-4">Your Pool</h2>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{fullAddress}</span>
            </div>
            {pool?.poolType && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <span>{pool.poolType} · {pool.poolSize}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Key className="h-4 w-4 text-muted-foreground" />
              <span>{ACCESS_LABELS[pool?.accessMethod || scheduleData.accessMethod]}</span>
            </div>
          </div>
          {booking.specialNotes && (
            <>
              <div className="border-t border-border my-4" />
              <CleaningNotes notes={booking.specialNotes} />
            </>
          )}
        </div>

        {/* Recurring Schedule (monthly only) */}
        {isMonthly && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-[17px] font-bold text-foreground mb-4">Recurring Schedule</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frequency</span>
                <span className="font-medium text-foreground">Monthly</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next service date</span>
                <span className="font-medium text-foreground">{getNextServiceDate()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auto-renew</span>
                <span className="font-medium text-foreground">Yes</span>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/dashboard")}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Manage Plan
            </Button>
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-[17px] font-bold text-foreground mb-3">Payment Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base service</span>
              <span className="text-foreground font-medium">${selectedPass.discountPrice.toFixed(2)}</span>
            </div>
            {scheduleData.addons.map((addon) => (
              <div key={addon.id} className="flex justify-between">
                <span className="text-muted-foreground">{addon.name}</span>
                <span className="text-foreground font-medium">${addon.price.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-bold text-foreground">Total Paid</span>
              <span className="font-bold text-foreground">${totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Payment date</span>
              <span className="text-muted-foreground">{formattedPaymentDate}</span>
            </div>
            {isMonthly && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Next billing date</span>
                <span className="text-muted-foreground">{getNextServiceDate()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <a href="#" className="text-primary hover:underline">Terms</a>
          <a href="#" className="text-primary hover:underline">Privacy</a>
          <a href="#" className="text-primary hover:underline">Do Not Sell My Personal Information</a>
          <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
        </footer>
      </main>
    </div>
  );
};

export default CompletedServiceDetails;
