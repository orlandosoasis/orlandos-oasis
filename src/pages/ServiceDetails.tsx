import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Waves, ArrowLeft, Clock, Calendar, MapPin, Star, Key, Droplets, Wrench, Camera, FileText, FlaskConical, RefreshCw, CreditCard, MessagesSquare, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { useBooking, type TimeWindow } from "@/contexts/BookingContext";
import PoolSceneHero from "@/components/dashboard/PoolSceneHero";
import RescheduleModal from "@/components/RescheduleModal";
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TIME_LABELS: Record<string, string> = {
  morning: "8:00 AM – 12:00 PM",
  afternoon: "12:00 PM – 4:00 PM",
  evening: "4:00 PM – 6:00 PM"
};

const ACCESS_LABELS: Record<string, string> = {
  home: "Owner will be home",
  gate: "Gate code provided",
  key: "Key on property",
  other: "Custom instructions provided"
};

const SERVICE_INCLUDES: Record<number, string[]> = {
  2: ["Skim", "Brush", "Chemical check"],
  3: ["Skim", "Vacuum", "Brush", "Chemicals & filter rinse"],
  4: ["Deep clean", "Tile scrub", "Full chemical balance"],
  6: ["Complete restoration", "Deep vacuum", "Tile scrub", "Full chemical balance", "Filter deep clean"]
};

const CleaningNotes = ({ notes }: {notes: string;}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4">
      <p className="text-[15px] font-bold text-foreground mb-1.5">Cleaning Notes</p>
      <p
        className={`text-[13.5px] text-muted-foreground leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}>

        {notes}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-primary text-[13px] font-semibold hover:underline mt-1">

        {expanded ? "Show less" : "Read more"}
      </button>
    </div>);

};

const ServiceDetails = () => {
  const navigate = useNavigate();
  const { booking, setBooking } = useBooking();
  const [showReschedule, setShowReschedule] = useState(false);

  const handleReschedule = (newDate: Date, newTimeWindow: TimeWindow) => {
    if (booking) {
      setBooking({
        ...booking,
        scheduleData: {
          ...booking.scheduleData,
          selectedDate: newDate,
          timeWindow: newTimeWindow
        }
      });
    }
  };
  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No booking found.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>);

  }

  const { selectedPass, scheduleData, technician, frequency, pool } = booking;
  const d = scheduleData.selectedDate;
  const formattedDate = `${FULL_DAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
  const isMonthly = frequency === "monthly";
  const totalPaid = selectedPass.discountPrice + scheduleData.addonsTotal;

  const getNextServiceDate = () => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return `${FULL_DAYS[next.getDay()]}, ${SHORT_MONTHS[next.getMonth()]} ${next.getDate()}, ${next.getFullYear()}`;
  };

  const serviceIncludes = SERVICE_INCLUDES[selectedPass.hours] || SERVICE_INCLUDES[3];
  const fullAddress = pool ? [pool.address, pool.city, pool.state, pool.zip].filter(Boolean).join(", ") : "Address not provided";

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

      {/* 1. Hero */}
      <div className="relative h-[200px] overflow-hidden">
        <PoolSceneHero />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-[760px] mx-auto">
          <h1 className="text-xl font-bold text-white">{selectedPass.hours}-Hour Pool Service</h1>
          <p className="text-sm font-semibold text-white/90 mt-1">{formattedDate}</p>
          <p className="text-sm text-white/80">Expected arrival {TIME_LABELS[scheduleData.timeWindow]}</p>
          <StatusBadge status={booking.status || "scheduled"} className="mt-1" />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[760px] mx-auto px-5 py-6 pb-16 space-y-4">

        {/* 2. Appointment Details + 3. Technician — side by side on desktop */}
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
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span>Monthly service</span>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4 gap-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary" onClick={() => setShowReschedule(true)}>
              <CalendarClock className="h-4 w-4" />
              Reschedule
            </Button>
          </div>

          {/* Technician — 7 cols */}
          <div className="md:col-span-7 bg-card rounded-2xl border border-border p-6 shadow-sm flex-col flex items-start justify-start">
            {technician.isAssigned ?
            <>
                <h2 className="text-[17px] font-bold text-foreground mb-4">Your Technician</h2>
                <div className="flex gap-3.5 items-start">
                  <div className="w-[56px] h-[56px] rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-lg font-bold shrink-0">
                    {technician.initials}
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-foreground">{technician.name}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-cta-yellow text-cta-yellow" />
                      <span>{technician.rating}</span>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      Assigned pool care specialist for this visit.
                    </p>
                  </div>
                </div>
              </> :

            <>
                <h2 className="text-[17px] font-bold text-foreground mb-4">Pool Technician</h2>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-[72px] h-[72px] rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Droplets className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground mb-1">Assignment Pending</p>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      A licensed pool specialist will be assigned before your service.
                    </p>
                    <p className="text-[13px] text-muted-foreground leading-relaxed mt-1">
                      You'll be notified once confirmed.
                    </p>
                  </div>
                </div>
              </>
            }
            {/* Message CTA */}
            <Button variant="outline" className="w-full mt-4 gap-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary" onClick={() => navigate("/messages")}>
              <MessagesSquare className="h-4 w-4" />
              Message
            </Button>
          </div>
        </div>

        {/* 4. Your Pool */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-[17px] font-bold text-foreground mb-4">Your Pool</h2>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{fullAddress}</span>
            </div>
            {pool?.poolType &&
            <div className="flex items-center gap-2 text-sm text-foreground">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <span>{pool.poolType} · {pool.poolSize}</span>
              </div>
            }
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Key className="h-4 w-4 text-muted-foreground" />
              <span>{ACCESS_LABELS[pool?.accessMethod || scheduleData.accessMethod]}</span>
            </div>
            {(pool?.accessDetail || scheduleData.accessDetail) &&
            <div className="mt-3">
                <p className="font-bold text-foreground mb-1.5 text-xs">Access Notes</p>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed">{pool?.accessDetail || scheduleData.accessDetail}</p>
              </div>
            }
          </div>
          {booking.specialNotes &&
          <>
              <div className="border-t border-border my-4" />
              <CleaningNotes notes={booking.specialNotes} />
            </>
          }
        </div>

        {/* 5. Recurring Schedule (monthly only) */}
        {isMonthly &&
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
            <Button variant="outline" className="w-full mt-4 hover:bg-primary hover:text-primary-foreground hover:border-primary" onClick={() => navigate("/dashboard")}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Manage Plan
            </Button>
          </div>
        }

        {/* 6. Payment Details */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-[17px] font-bold text-foreground mb-3">Payment Details</h2>
          <div className="space-y-2 text-sm">
            {isMonthly &&
            <div className="flex justify-between">
                <span className="text-muted-foreground">Recurring amount</span>
                <span className="text-foreground font-medium">${selectedPass.discountPrice.toFixed(2)}/mo</span>
              </div>
            }
            {!isMonthly &&
            <div className="flex justify-between">
                <span className="text-muted-foreground">Base service</span>
                <span className="text-foreground font-medium">${selectedPass.discountPrice.toFixed(2)}</span>
              </div>
            }
          </div>
        </div>

        {/* 7. After-Service Transparency */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-[17px] font-bold text-foreground mb-4">After Your Service</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Camera className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Before & after photos will be uploaded</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Service notes included</span>
            </div>
          </div>
        </div>

        {/* 8. Help / Support */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-[17px] font-bold text-foreground mb-3">Need More Help?</h2>
          <p className="text-[13.5px] text-muted-foreground leading-relaxed">
            View our <Link to="/help" className="text-primary font-semibold hover:underline">help center</Link> for more information on what to expect and how Orlando's Oasis works, or <a href="#" className="text-primary font-semibold hover:underline">report an issue</a>.
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <Link to="/terms" className="text-primary hover:underline">Terms</Link>
          <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
          <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
        </footer>
      </main>

      {booking &&
      <RescheduleModal
        open={showReschedule}
        onOpenChange={setShowReschedule}
        booking={booking}
        onReschedule={handleReschedule} />

      }
    </div>);

};

export default ServiceDetails;