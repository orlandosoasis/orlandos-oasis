import { useState, useCallback, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Clock, Calendar, MapPin, Star, Key, Droplets, Wrench, Camera, FileText, RefreshCw, CreditCard, MessagesSquare, CalendarClock, CheckCircle2, UserRoundCog, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { useBooking, type TimeWindow, type AccessMethod, type BookingData } from "@/contexts/BookingContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useService, useUpdateService } from "@/hooks/useServices";
import { usePool } from "@/hooks/usePools";
import { useProfile } from "@/hooks/useProfiles";
import { VOUCHER_PLANS } from "@/components/dashboard/VoucherSelectionStep";
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

const POOL_SIZE_OPTIONS: Record<string, { title: string; subtitle: string }> = {
  small: { title: "Small Pool", subtitle: "Standard residential" },
  medium: { title: "Medium Pool", subtitle: "Mid-size residential" },
  large: { title: "Large Pool", subtitle: "Large or custom" },
};

function passFromServiceType(label: string) {
  const plan = VOUCHER_PLANS.find((p) => p.label === label);
  return {
    id: plan?.id ?? "weekly",
    hours: 2,
    label,
    description: plan?.description ?? "",
    originalPrice: plan?.originalPrice ?? 120,
    discountPrice: plan?.discountPrice ?? 95,
    percentOff: 0,
    isMostPopular: !!plan?.isMostPopular,
  };
}

const ServiceDetails = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams<{ serviceId: string }>();
  const { user } = useAuth();
  const { booking: ctxBooking, setBooking, checkoutData } = useBooking();
  const [showReschedule, setShowReschedule] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reportIssueOpen, setReportIssueOpen] = useState(false);
  const { toast } = useToast();

  // DB-driven path: fetch this service + its pool + assigned technician profile.
  const isUuid = !!serviceId && /^[0-9a-f-]{36}$/i.test(serviceId);
  const { data: dbService, isLoading: serviceLoading } = useService(isUuid ? serviceId : undefined);
  const { data: dbPool } = usePool(dbService?.poolId);
  const { data: dbTech } = useProfile(dbService?.technicianId ?? undefined);
  const updateService = useUpdateService();

  // Build a BookingData view from the DB rows (when present), otherwise
  // fall back to the BookingContext set by the dashboard / booking flow.
  const booking: BookingData | null = useMemo(() => {
    if (dbService) {
      const techName = dbTech
        ? dbTech.fullName || `${dbTech.firstName ?? ""} ${dbTech.lastName ?? ""}`.trim() || "Pool Technician"
        : null;
      const initials = (techName ?? "")
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
      const technician = techName
        ? { name: techName, initials: initials || "PT", rating: 5.0, isAssigned: true }
        : { name: "Pool Technician to be assigned", initials: "?", rating: 0, isAssigned: false };

      return {
        frequency: "monthly",
        recurrence: (dbPool?.frequency as BookingData["recurrence"]) || "monthly",
        selectedPass: passFromServiceType(dbService.serviceType),
        scheduleData: {
          selectedDate: dbService.date,
          timeWindow: dbService.timeWindow as TimeWindow,
          accessMethod: (dbPool?.accessMethod || "home") as AccessMethod,
          accessDetail: dbPool?.accessDetail || "",
          addons: [],
          addonsTotal: 0,
        },
        technician,
        pool: {
          address: dbPool?.address || "",
          city: dbPool?.city || "",
          state: dbPool?.state || "",
          zip: dbPool?.zip || "",
          poolType: dbPool?.poolType || "",
          poolSize: dbPool?.poolSize || "",
          accessMethod: (dbPool?.accessMethod || "home") as AccessMethod,
          accessDetail: dbPool?.accessDetail || "",
          hasPets: false,
        },
        status: dbService.status === "completed"
          ? "completed"
          : !technician.isAssigned
          ? "technician_to_be_assigned"
          : "scheduled",
      };
    }
    return ctxBooking;
  }, [dbService, dbPool, dbTech, ctxBooking]);

  const handleReschedule = async (newDate: Date, newTimeWindow: TimeWindow) => {
    if (dbService) {
      try {
        await updateService.mutateAsync({
          id: dbService.id,
          patch: { serviceDate: newDate, timeWindow: newTimeWindow },
        });
      } catch (err) {
        toast({ title: "Reschedule failed. Please try again.", variant: "destructive" });
      }
    } else if (booking) {
      setBooking({
        ...booking,
        scheduleData: { ...booking.scheduleData, selectedDate: newDate, timeWindow: newTimeWindow },
        status: "technician_to_be_assigned",
      });
    }
  };

  if (isUuid && serviceLoading && !booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Loading service…</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No booking found.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const { selectedPass, scheduleData, technician, frequency, pool } = booking;
  const poolSizeKey = (pool?.poolSize || checkoutData?.poolSize) as keyof typeof POOL_SIZE_OPTIONS | undefined;
  const selectedPoolSize = poolSizeKey ? POOL_SIZE_OPTIONS[poolSizeKey] : null;
  const status = booking.status || "scheduled";
  const isCompleted = status === "completed";
  const isMonthly = frequency === "monthly";

  // Use real service date for both upcoming and completed services.
  const d = scheduleData.selectedDate;
  const formattedDate = `${FULL_DAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
  const formattedDateFull = `${formattedDate}, ${d.getFullYear()}`;
  const completedAtLabel = dbService?.completedAt || null;

  const totalPaid = selectedPass.discountPrice + scheduleData.addonsTotal;
  const fullAddress = pool ? [pool.address, pool.city, pool.state, pool.zip].filter(Boolean).join(", ") : "Address not provided";

  const getNextServiceDate = () => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return `${FULL_DAYS[next.getDay()]}, ${SHORT_MONTHS[next.getMonth()]} ${next.getDate()}, ${next.getFullYear()}`;
  };

  return (
    <>
      {/* Hero */}
      <div className="relative h-[200px] overflow-hidden">
        <PoolSceneHero />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-[760px] mx-auto">
          <h1 className="text-xl font-bold text-white">{selectedPass.label}</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Appointment Details */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col">
            <h2 className="text-[17px] font-bold text-foreground mb-4">Appointment Details</h2>
            <div className="space-y-2.5 pb-[20px]">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{selectedPass.hours} {selectedPass.hours === 1 ? "Hour" : "Hours"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{isCompleted ? formattedDateFull : formattedDate}</span>
              </div>
              {isCompleted && completedAtLabel && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span>Completed at {completedAtLabel}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <span>{selectedPass?.label || <span className="text-muted-foreground italic">Service unavailable</span>}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span>
                  {(() => {
                    const rec = booking.recurrence;
                    const freq = booking.frequency;
                    if (freq === "once") return "One-time service";
                    if (rec === "weekly") return "Weekly service";
                    if (rec === "biweekly") return "Bi-weekly service";
                    if (rec === "monthly" || freq === "monthly") return "Monthly service";
                    return <span className="text-muted-foreground italic">Frequency unavailable</span>;
                  })()}
                </span>
              </div>
            </div>

            {!isCompleted && (
              <div className="mt-auto space-y-1.5">
                <Button variant="outline" className="w-full gap-1.5 hover:bg-primary hover:text-white hover:border-transparent" onClick={() => setShowReschedule(true)}>
                  <CalendarClock className="h-4 w-4" />
                  Reschedule Appointment
                </Button>
              </div>
            )}
          </div>

          {/* Technician */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex-col flex items-start justify-start">
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
                <h2 className="text-[17px] font-bold text-foreground mb-4">Your Technician</h2>
                <div className="flex gap-3.5 items-start w-full">
                  <div className="w-[56px] h-[56px] rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                    <UserRoundCog className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-base font-bold text-foreground">{technician.name}</p>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      A pool technician will be assigned before your scheduled service.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* CTA Row */}
            <div className="flex gap-3 mt-auto w-full">
              {technician.isAssigned ? (
                <Button variant="outline" className="flex-1 gap-1.5 hover:bg-primary hover:text-white hover:border-transparent" onClick={() => navigate("/messages")}>
                  <MessagesSquare className="h-4 w-4" />
                  Message
                </Button>
              ) : (
                <Button variant="outline" className="flex-1 gap-1.5 opacity-60 cursor-not-allowed" disabled>
                  <MessagesSquare className="h-4 w-4" />
                  Message Unavailable
                </Button>
              )}
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
            <div className="space-y-2.5 pb-[20px] pt-0">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{fullAddress}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <span>
                  {selectedPoolSize
                    ? `${selectedPoolSize.title} — ${selectedPoolSize.subtitle}`
                    : "Pool size not selected"}
                </span>
              </div>
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
          technicianName={technician.isAssigned ? technician.name : "Your Technician"}
          onSubmit={() => {
            setReviewSubmitted(true);
            setReviewOpen(false);
          }}
        />
      )}

      {/* Report Issue Modal */}
      <ReportIssueModal open={reportIssueOpen} onOpenChange={setReportIssueOpen} />
    </>
  );
};

export default ServiceDetails;
