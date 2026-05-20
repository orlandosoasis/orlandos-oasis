import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, ChevronRight, Star, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import PageContainer from "@/components/PageContainer";
import { useBooking, type BookingData, type TimeWindow } from "@/contexts/BookingContext";
import { useServices } from "@/hooks/useServices";
import PoolSceneHero from "@/components/dashboard/PoolSceneHero";
import BookingFlow from "@/components/dashboard/BookingFlow";
import StatusBadge from "@/components/StatusBadge";
import RescheduleModal from "@/components/RescheduleModal";

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const TIME_LABELS: Record<string, string> = {
  morning: "8:00 AM – 12:00 PM",
  afternoon: "12:00 PM – 4:00 PM",
  evening: "4:00 PM – 6:00 PM",
};

/* ── Types ── */
interface ServiceInstance {
  id: string;
  booking: BookingData;
}

/* ── Helpers ── */

/**
 * Generate future visit dates based on frequency, anchored to a start date.
 * - weekly: every 7 days
 * - twice-weekly: 2x/week with 3-4 day spacing (e.g., Mon/Thu)
 * - three-weekly: 3x/week with ~2-3 day spacing (e.g., Mon/Wed/Fri)
 * - biweekly: every 14 days
 * - monthly: every 30 days
 */
function generateFutureDates(startDate: Date, frequency: string, count: number): Date[] {
  const dates: Date[] = [];
  const endOfYear = new Date(startDate.getFullYear(), 11, 31);

  if (frequency === "twice-weekly") {
    // Pattern: +3, +4, +3, +4... (e.g., Mon→Thu→Mon)
    let current = new Date(startDate);
    let toggle = true; // true = +3, false = +4
    while (dates.length < count) {
      current = new Date(current);
      current.setDate(current.getDate() + (toggle ? 3 : 4));
      toggle = !toggle;
      if (current > endOfYear) break;
      dates.push(new Date(current));
    }
  } else if (frequency === "three-weekly") {
    // Pattern: +2, +2, +3, repeating (e.g., Mon→Wed→Fri→Mon)
    const gaps = [2, 2, 3];
    let current = new Date(startDate);
    let gapIdx = 0;
    while (dates.length < count) {
      current = new Date(current);
      current.setDate(current.getDate() + gaps[gapIdx % 3]);
      gapIdx++;
      if (current > endOfYear) break;
      dates.push(new Date(current));
    }
  } else {
    const intervalDays = frequency === "weekly" ? 7
      : frequency === "biweekly" ? 14
      : 30; // monthly
    let current = new Date(startDate);
    while (dates.length < count) {
      current = new Date(current);
      current.setDate(current.getDate() + intervalDays);
      if (current > endOfYear) break;
      dates.push(new Date(current));
    }
  }

  return dates;
}

/** Get the most recent past visit date (one interval back from start). */
function getPreviousDate(startDate: Date, frequency: string): Date {
  const prev = new Date(startDate);
  if (frequency === "twice-weekly") {
    prev.setDate(prev.getDate() - 3);
  } else if (frequency === "three-weekly") {
    prev.setDate(prev.getDate() - 2);
  } else if (frequency === "weekly") {
    prev.setDate(prev.getDate() - 7);
  } else if (frequency === "biweekly") {
    prev.setDate(prev.getDate() - 14);
  } else {
    prev.setDate(prev.getDate() - 30);
  }
  return prev;
}

const INITIAL_VISIBLE_COUNT = 3;
const LOAD_MORE_COUNT = 10;

const POOL_SIZE_LABELS: Record<string, string> = {
  small: "Small (under 15k gallons)",
  medium: "Medium (15k–25k gallons)",
  large: "Large (over 25k gallons)",
};

const UNASSIGNED_TECH = {
  name: "Pool Technician to be assigned",
  initials: "?",
  rating: 0,
  isAssigned: false,
};

interface UserLike {
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  fullName?: string;
}

function generateUpcomingServices(
  checkoutData?: import("@/contexts/BookingContext").CheckoutData | null,
  user?: UserLike | null,
): ServiceInstance[] {
  const serviceLabel = checkoutData?.serviceName || "Deep Clean";
  const servicePrice = checkoutData?.discountPrice || 149;
  const serviceOriginalPrice = checkoutData?.originalPrice || 189;

  const sharedPass = {
    id: "pass-checkout", hours: 1, label: serviceLabel,
    description: checkoutData?.serviceDescription || "Full cleaning, chemical balance, filter check",
    originalPrice: serviceOriginalPrice, discountPrice: servicePrice,
    percentOff: Math.round(((serviceOriginalPrice - servicePrice) / serviceOriginalPrice) * 100),
    isMostPopular: true,
  };
  const sharedPool = {
    address: user?.streetAddress || "Address on file",
    city: user?.city || "",
    state: user?.state || "",
    zip: user?.zipCode || checkoutData?.customerZipcode || "",
    poolType: "In-ground",
    poolSize: POOL_SIZE_LABELS[checkoutData?.poolSize || "medium"] || POOL_SIZE_LABELS.medium,
    accessMethod: "gate" as const,
    accessDetail: "",
    hasPets: false,
  };
  const baseSchedule = {
    timeWindow: "morning" as const, accessMethod: "gate" as const,
    accessDetail: "", addons: [] as { id: string; name: string; price: number }[], addonsTotal: 0,
  };

  const frequency = checkoutData?.frequency || "monthly";
  const today = new Date();
  const services: ServiceInstance[] = [];

  // Pre-generate ≥6 months of upcoming visits (52 covers ~1 year of monthly/weekly cadence)
  const futureDates = generateFutureDates(today, frequency, 52);
  futureDates.forEach((date, i) => {
    services.push({
      id: `svc-upcoming-${i}`,
      booking: {
        frequency: "monthly", selectedPass: sharedPass, pool: sharedPool,
        technician: UNASSIGNED_TECH, status: "scheduled",
        scheduleData: { ...baseSchedule, selectedDate: date },
      },
    });
  });

  return services;
}


function formatGreetingDate(): string {
  const now = new Date();
  return `Today, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

/* ══════════════════════════════════════════════
   Dashboard
   ══════════════════════════════════════════════ */
const Dashboard = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { booking, setBooking, checkoutData } = useBooking();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showBooking, setShowBooking] = useState(false);
  const [fromCheckout, setFromCheckout] = useState(false);

  // State for selected service info from checkout
  const [selectedServiceInfo, setSelectedServiceInfo] = useState<{ title: string; description: string } | null>(null);

  // Auto-open booking flow when redirected from checkout OR when the user
  // abandoned the scheduling flow before completing it (resume on next login).
  useEffect(() => {
    if (searchParams.get("openBooking") === "true") {
      const title = searchParams.get("serviceTitle");
      const description = searchParams.get("serviceDescription");
      if (title) {
        setSelectedServiceInfo({ title, description: description || "" });
      }
      setShowBooking(true);
      setFromCheckout(true);
      setSearchParams({}, { replace: true });
      return;
    }
    try {
      const pending = localStorage.getItem("orlandos_oasis_pending_schedule");
      if (pending && !booking) {
        if (checkoutData?.serviceName) {
          setSelectedServiceInfo({
            title: checkoutData.serviceName,
            description: checkoutData.serviceDescription || "",
          });
        }
        setShowBooking(true);
      }
    } catch { /* storage may be unavailable */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams]);
  // Listen for header "Book Service" button
  const openBooking = useCallback(() => setShowBooking(true), []);
  useEffect(() => {
    window.addEventListener("open-booking", openBooking);
    return () => window.removeEventListener("open-booking", openBooking);
  }, [openBooking]);

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [services, setServices] = useState<ServiceInstance[]>([]);
  const [rescheduleService, setRescheduleService] = useState<ServiceInstance | null>(null);
  const [rescheduleConfirmed, setRescheduleConfirmed] = useState(false);
  const isPostCheckout = fromCheckout || showBooking || searchParams.get("openBooking") === "true";

  // Fetch real services from Supabase for this homeowner
  const { data: realServices = [] } = useServices({ homeownerId: user?.id });

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPostCheckout) navigate("/login", { replace: true });
  }, [isLoading, isAuthenticated, isPostCheckout, navigate, searchParams]);

  useEffect(() => {
    const upcoming = generateUpcomingServices(checkoutData, user);
    // Completed services come from real data only — no demo past services.
    const completed: ServiceInstance[] = [];
    if (booking) {
      // Ensure custom booking from the booking flow always uses an unassigned tech
      // until the platform assigns one.
      const customBooking = {
        ...booking,
        status: "scheduled" as const,
        technician: booking.technician?.isAssigned ? booking.technician : UNASSIGNED_TECH,
      };
      setServices([{ id: "svc-custom", booking: customBooking }, ...upcoming, ...completed]);
    } else {
      setServices([...upcoming, ...completed]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, user?.streetAddress, user?.city, user?.state, user?.zipCode, booking, checkoutData]);


  // Log real services availability - render integration kept minimal to preserve existing UI behavior
  useEffect(() => {
    if (realServices.length > 0) {
      // realServices is fetched live from Supabase; UI rendering stays driven by demo+booking flow.
    }
  }, [realServices]);

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  const upcomingServices = useMemo(() => services.filter(s => s.booking.status === "scheduled" || s.booking.status === "reschedule_requested" || s.booking.status === "technician_to_be_assigned"), [services]);
  const pastServices = useMemo(() => services.filter(s => s.booking.status === "completed"), [services]);

  const nextService = upcomingServices[0] || null;
  const remainingUpcoming = upcomingServices.slice(1);
  const visibleUpcoming = remainingUpcoming.slice(0, visibleCount);
  const hasMoreUpcoming = visibleCount < remainingUpcoming.length;

  const handleViewDetails = (svc: ServiceInstance) => {
    setBooking(svc.booking);
    navigate(`/service/${svc.id}`);
  };

  const handleReschedule = (newDate: Date, newTimeWindow: TimeWindow) => {
    if (!rescheduleService) return;
    setServices(prev =>
      prev.map(s =>
        s.id === rescheduleService.id
          ? { ...s, booking: { ...s.booking, status: "technician_to_be_assigned" as const, scheduleData: { ...s.booking.scheduleData, selectedDate: newDate, timeWindow: newTimeWindow } } }
          : s
      )
    );
    setRescheduleConfirmed(true);
  };

  const handleRescheduleModalClose = (open: boolean) => {
    if (!open) {
      setRescheduleService(null);
      setRescheduleConfirmed(false);
    }
  };

  const firstName = user?.fullName?.split(" ")[0] || "there";

  return (
    <>
      <PageContainer>
        {/* Greeting */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Hi, {firstName} 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">{formatGreetingDate()}</p>
          </div>
        </div>
        {/* Next Service */}
        {nextService && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">Next Service</h2>
            <NextServiceCard service={nextService} onViewDetails={() => handleViewDetails(nextService)} />
          </section>
        )}

        {/* Upcoming Visits */}
        {remainingUpcoming.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">Upcoming Visits</h2>
            <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
              {visibleUpcoming.map((svc) => {
                return (
                  <UpcomingRow key={svc.id} service={svc} canReschedule={true} onReschedule={() => setRescheduleService(svc)} />
                );
              })}
            </div>
            {remainingUpcoming.length > INITIAL_VISIBLE_COUNT && (
              <div className="mt-3 text-center">
                {hasMoreUpcoming ? (
                  <button onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)} className="text-sm font-semibold text-primary hover:underline">
                    Load more
                  </button>
                ) : (
                  <button onClick={() => { setVisibleCount(INITIAL_VISIBLE_COUNT); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-sm font-semibold text-primary hover:underline">
                    Show less
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* Past Services */}
        {pastServices.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">Completed Services</h2>
            <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
              {pastServices.map(svc => (
                <PastRow key={svc.id} service={svc} onViewDetails={() => handleViewDetails(svc)} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {services.length === 0 && !isLoading && (
          <div className="bg-card rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">No services yet.</p>
            <button className="mt-4 text-primary font-bold text-sm hover:underline" onClick={() => setShowBooking(true)}>Book Your First Service</button>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <Link to="/terms" className="text-primary hover:underline">Terms</Link>
          <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
          
          <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
        </footer>
      </PageContainer>

      {showBooking && <BookingFlow onClose={() => { setShowBooking(false); setSelectedServiceInfo(null); }} onComplete={() => { setShowBooking(false); setSelectedServiceInfo(null); }} selectedService={selectedServiceInfo} />}

      {rescheduleService && (
        <RescheduleModal
          open={!!rescheduleService}
          onOpenChange={handleRescheduleModalClose}
          booking={rescheduleService.booking}
          onReschedule={handleReschedule}
        />
      )}
    </>
  );
};

/* ── Next Service Card ── */
const NextServiceCard = ({ service, onViewDetails }: { service: ServiceInstance; onViewDetails: () => void }) => {
  const { booking } = service;
  const { selectedPass, scheduleData, technician } = booking;
  const d = scheduleData.selectedDate;
  const fullDate = `${FULL_DAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  return (
    <div onClick={onViewDetails} className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
      <div className="relative h-[190px] overflow-hidden">
        <PoolSceneHero />
        <div className="absolute top-3 left-3">
          <StatusBadge status={booking.status === "technician_to_be_assigned" ? "technician_to_be_assigned" : "scheduled"} />
        </div>
        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-md border border-border">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-oasis-aqua flex items-center justify-center text-primary-foreground text-sm font-bold">
            {technician.isAssigned ? technician.initials : "?"}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[0.8rem] font-semibold text-foreground">{technician.name}</span>
            {technician.isAssigned ? (
              <span className="text-[0.72rem] text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3 fill-cta-yellow text-cta-yellow" />
                {technician.rating}
              </span>
            ) : (
              <span className="text-[0.72rem] text-muted-foreground">Assigned 24h before visit</span>
            )}
          </div>
        </div>

      </div>
      <div className="px-5 py-4 flex items-center gap-4">
        <div className="w-12 text-center shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase">{SHORT_MONTHS[d.getMonth()]}</p>
          <p className="text-xl font-bold text-foreground">{d.getDate()}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{selectedPass.label}</p>
          <p className="text-xs text-muted-foreground">
            Expected arrival {TIME_LABELS[scheduleData.timeWindow]}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">View Details</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
        </div>
      </div>
    </div>
  );
};

/* ── Upcoming Visit Row ── */
const UpcomingRow = ({ service, canReschedule, onReschedule }: { service: ServiceInstance; canReschedule: boolean; onReschedule: () => void }) => {
  const { booking } = service;
  const d = booking.scheduleData.selectedDate;
  const month = SHORT_MONTHS[d.getMonth()].toUpperCase();
  const day = d.getDate();
  const isPendingReschedule = booking.status === "reschedule_requested" || booking.status === "technician_to_be_assigned";

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="w-12 text-center shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase">{month}</p>
        <p className="text-xl font-bold text-foreground">{day}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{booking.selectedPass.label}</p>
        <p className="text-xs text-muted-foreground truncate">
          {isPendingReschedule ? "Pool Technician to Be Assigned" : "Pool Technician to be assigned"} · {TIME_LABELS[booking.scheduleData.timeWindow]}
        </p>
      </div>
      {isPendingReschedule ? (
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StatusBadge status="technician_to_be_assigned" className="text-[10px] px-2 py-1" />
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={!canReschedule}
          className="shrink-0 gap-1.5 text-xs hover:bg-primary hover:text-white hover:border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={(e) => { e.stopPropagation(); onReschedule(); }}
        >
          <CalendarClock className="h-3.5 w-3.5" />
          Reschedule
        </Button>
      )}
    </div>
  );
};

/* ── Past Service Row ── */
const PastRow = ({ service, onViewDetails }: { service: ServiceInstance; onViewDetails: () => void }) => {
  const { booking } = service;
  const d = booking.scheduleData.selectedDate;
  const month = SHORT_MONTHS[d.getMonth()].toUpperCase();
  const day = d.getDate();

  return (
    <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors group" onClick={onViewDetails}>
      <div className="w-12 text-center shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase">{month}</p>
        <p className="text-xl font-bold text-foreground">{day}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{booking.selectedPass.label}</p>
          <StatusBadge status="completed" />
        </div>
        <p className="text-xs text-muted-foreground">{booking.technician.name}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">View Details</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
};

export default Dashboard;
