import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, MapPin, Star, Key, Droplets, Wrench, Camera, FileText, RefreshCw, CreditCard, MessagesSquare, CalendarClock, CheckCircle2, UserRoundCog, Loader2 } from "lucide-react";
import oasisLogo from "@/assets/oasis-logo-circle.png";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { useBooking, type TimeWindow, type TechnicianInfo, matchTechnician } from "@/contexts/BookingContext";
import { useToast } from "@/hooks/use-toast";
import PoolSceneHero from "@/components/dashboard/PoolSceneHero";
import RescheduleModal from "@/components/RescheduleModal";
import LeaveReviewModal from "@/components/LeaveReviewModal";
import ServiceReport from "@/components/ServiceReport";
import ReportIssueModal from "@/components/ReportIssueModal";

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

const SERVICE_INCLUDES: Record<number, string[]> = {
  2: ["Skim", "Brush", "Chemical check"],
  3: ["Skim", "Vacuum", "Brush", "Chemicals & filter rinse"],
  4: ["Deep clean", "Tile scrub", "Full chemical balance"],
  6: ["Complete restoration", "Deep vacuum", "Tile scrub", "Full chemical balance", "Filter deep clean"],
};

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

const ServiceDetails = () => {
  const navigate = useNavigate();
  const { booking, setBooking } = useBooking();
  const [showReschedule, setShowReschedule] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [changingCleaner, setChangingCleaner] = useState(false);
  const [reportIssueOpen, setReportIssueOpen] = useState(false);
  const { toast } = useToast();

  const handleChangeCleaner = useCallback(async () => {
    if (!booking) return;
    setChangingCleaner(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let newTech: TechnicianInfo;
    let attempts = 0;
    do {
      newTech = matchTechnician();
      attempts++;
    } while (newTech.name === booking.technician.name && attempts < 10);

    if (newTech.name === booking.technician.name) {
      toast({ title: "No other cleaners available at the moment.", variant: "destructive" });
      setChangingCleaner(false);
      return;
    }

    setBooking({ ...booking, technician: newTech });
    setChangingCleaner(false);
    toast({ title: "Success! Cleaner updated.", variant: "success" as any });
  }, [booking, setBooking, toast]);

  const handleReschedule = (newDate: Date, newTimeWindow: TimeWindow) => {
    if (booking) {
      setBooking({
        ...booking,
        scheduleData: { ...booking.scheduleData, selectedDate: newDate, timeWindow: newTimeWindow },
        status: "reschedule_requested",
      });
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No booking found.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const { selectedPass, scheduleData, technician, frequency, pool } = booking;
  const status = booking.status || "scheduled";
  const isCompleted = status === "completed";
  const isMonthly = frequency === "monthly";

  // For completed services, display Feb 25, 2026
  const d = isCompleted ? new Date(2026, 1, 25) : scheduleData.selectedDate;
  const formattedDate = `${FULL_DAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
  const formattedDateFull = `${formattedDate}, ${d.getFullYear()}`;

  const totalPaid = selectedPass.discountPrice + scheduleData.addonsTotal;
  const fullAddress = pool ? [pool.address, pool.city, pool.state, pool.zip].filter(Boolean).join(", ") : "Address not provided";

  const getNextServiceDate = () => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return `${FULL_DAYS[next.getDay()]}, ${SHORT_MONTHS[next.getMonth()]} ${next.getDate()}, ${next.getFullYear()}`;
  };

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
            <img src={oasisLogo} alt="Orlando's Oasis" className="h-6 w-6 object-contain" />
            <span className="text-[1.25rem] font-bold text-foreground tracking-tight">Orlando's Oasis</span>
          </Link>
          <div className="w-[60px]" />
        </div>
      </header>

      {/* Hero */}
      <div className="relative h-[200px] overflow-hidden">
        <PoolSceneHero />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-[760px] mx-auto">
          <h1 className="text-xl font-bold text-white">{selectedPass.hours}-Hour Pool Service</h1>
          {isCompleted ? (
            <p className="text-sm font-semibold text-white/90 mt-1">Completed on {formattedDateFull}</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-white/90 mt-1">{formattedDate}</p>
              <p className="text-sm text-white/80">Expected arrival {TIME_LABELS[scheduleData.timeWindow]}</p>
            </>
          )}
          <StatusBadge status={status} className="mt-1" />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[760px] mx-auto px-5 py-6 pb-16 space-y-4">

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
                <span>{isCompleted ? formattedDateFull : formattedDate}</span>
              </div>
              {isCompleted && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span>Completed at 11:42 AM</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span>Monthly service</span>
              </div>
            </div>

            {!isCompleted && (
              <div className="mt-4 space-y-1.5">
                {status === "reschedule_requested" ? (
                  <>
                    <Button variant="outline" className="w-full gap-1.5 opacity-60 cursor-not-allowed" disabled>
                      <CalendarClock className="h-4 w-4" />
                      Reschedule Request Pending
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Your reschedule request is awaiting approval.</p>
                  </>
                ) : (
                  <Button variant="outline" className="w-full gap-1.5 hover:bg-primary hover:text-white hover:border-transparent" onClick={() => setShowReschedule(true)}>
                    <CalendarClock className="h-4 w-4" />
                    Reschedule
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Technician */}
          <div className="md:col-span-7 bg-card rounded-2xl border border-border p-6 shadow-sm flex-col flex items-start justify-start">
            {technician.isAssigned ? (
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
              </>
            ) : (
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
            )}

            {/* CTA Row */}
            <div className="flex gap-3 mt-4 w-full">
              <Button variant="outline" className="flex-1 gap-1.5 hover:bg-primary hover:text-white hover:border-transparent" onClick={() => navigate("/messages")}>
                <MessagesSquare className="h-4 w-4" />
                Message
              </Button>
              {isCompleted && (
                reviewSubmitted ? (
                  <Button variant="outline" className="flex-1 gap-1.5 opacity-60 cursor-default" disabled>
                    <CheckCircle2 className="h-4 w-4" />
                    Review Submitted
                  </Button>
                ) : (
                  <Button variant="outline" className="flex-1 gap-1.5 hover:bg-primary hover:text-white hover:border-transparent" onClick={(e) => { e.stopPropagation(); setReviewOpen(true); }}>
                    <Star className="h-4 w-4" />
                    Leave a Review
                  </Button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Service Report (completed only) */}
        {isCompleted && <ServiceReport />}

        {/* Your Pool (scheduled only) */}
        {!isCompleted && (
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
              {(pool?.accessDetail || scheduleData.accessDetail) && (
                <div className="mt-3">
                  <p className="font-bold text-foreground mb-1.5 text-xs">Access Notes</p>
                  <p className="text-[13.5px] text-muted-foreground leading-relaxed">{pool?.accessDetail || scheduleData.accessDetail}</p>
                </div>
              )}
            </div>
            {booking.specialNotes && (
              <>
                <div className="border-t border-border my-4" />
                <CleaningNotes notes={booking.specialNotes} />
              </>
            )}
          </div>
        )}




        {/* After Your Service (scheduled only) */}
        {!isCompleted && (
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
        )}

        {/* Help / Support */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-[17px] font-bold text-foreground mb-3">Need More Help?</h2>
          <p className="text-[13.5px] text-muted-foreground leading-relaxed">
            View our <Link to="/help" className="text-primary font-semibold hover:underline">help center</Link> for more information on what to expect and how Orlando's Oasis works, or <button onClick={() => setReportIssueOpen(true)} className="text-primary font-semibold hover:underline">report an issue</button>.
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <Link to="/terms" className="text-primary hover:underline">Terms</Link>
          <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
          <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
        </footer>
      </main>

      {/* Reschedule Modal (scheduled only) */}
      {!isCompleted && booking && (
        <RescheduleModal
          open={showReschedule}
          onOpenChange={setShowReschedule}
          booking={booking}
          onReschedule={handleReschedule}
        />
      )}

      {/* Review Modal (completed only) */}
      {isCompleted && (
        <LeaveReviewModal
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          technicianName={technician.isAssigned ? technician.name : "Carlos M."}
          onSubmit={() => {
            setReviewSubmitted(true);
            setReviewOpen(false);
          }}
        />
      )}

      {/* Report Issue Modal */}
      <ReportIssueModal open={reportIssueOpen} onOpenChange={setReportIssueOpen} />
    </div>
  );
};

export default ServiceDetails;
