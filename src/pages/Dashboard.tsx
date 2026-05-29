import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, ChevronRight, Star, CalendarClock, CalendarPlus, CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import PageContainer from "@/components/PageContainer";
import { useBooking, type BookingData, type TimeWindow, type AccessMethod } from "@/contexts/BookingContext";
import { useServices, useUpdateService } from "@/hooks/useServices";
import { usePools } from "@/hooks/usePools";
import { useProfilesByIds } from "@/hooks/useProfiles";
import { useEnsureHomeownerData } from "@/hooks/useEnsureHomeownerData";
import { VOUCHER_PLANS } from "@/components/dashboard/VoucherSelectionStep";
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

const INITIAL_VISIBLE_COUNT = 3;
const LOAD_MORE_COUNT = 10;

const UNASSIGNED_TECH = {
  name: "Pool Technician to be assigned",
  initials: "?",
  rating: 0,
  isAssigned: false,
};

function passFromServiceType(label: string) {
  const plan = VOUCHER_PLANS.find((p) => p.label === label || `Most Popular – ${p.label}` === label);
  const originalPrice = plan?.originalPrice ?? 120;
  const discountPrice = plan?.discountPrice ?? 95;
  return {
    id: plan?.id ?? "weekly",
    hours: 2,
    label,
    description: plan?.description ?? "",
    originalPrice,
    discountPrice,
    percentOff: Math.round(((originalPrice - discountPrice) / originalPrice) * 100),
    isMostPopular: !!plan?.isMostPopular,
  };
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
  const queryClient = useQueryClient();
  const { booking, checkoutData } = useBooking();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showBooking, setShowBooking] = useState(false);
  const [fromCheckout, setFromCheckout] = useState(false);

  // State for selected service info from checkout
  const [selectedServiceInfo, setSelectedServiceInfo] = useState<{ title: string; description: string } | null>(null);

  // Migrate any client-only onboarding data into Supabase exactly once.
  useEnsureHomeownerData();

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
  const openBooking = useCallback(() => setShowBooking(true), []);
  useEffect(() => {
    window.addEventListener("open-booking", openBooking);
    return () => window.removeEventListener("open-booking", openBooking);
  }, [openBooking]);

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [rescheduleService, setRescheduleService] = useState<ServiceInstance | null>(null);
  const [rescheduleConfirmed, setRescheduleConfirmed] = useState(false);
  const isPostCheckout = fromCheckout || showBooking || searchParams.get("openBooking") === "true";

  // Live data sources
  const { data: realServices = [], isLoading: servicesLoading } = useServices({ homeownerId: user?.id });
  const { data: pools = [] } = usePools(user?.id);
  const pool = pools[0] || null;

  // Collect every technician id we may need to display:
  //  - explicit per-service assignment (services.technician_id)
  //  - pool-level assignment from admin (pools.assigned_technician_id) — used as
  //    a fallback for services that haven't had a tech assigned individually yet.
  const assignedTechIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of realServices) if (s.technicianId) ids.add(s.technicianId);
    for (const p of pools) if (p.assignedTechnicianId) ids.add(p.assignedTechnicianId);
    return Array.from(ids);
  }, [realServices, pools]);
  const { data: techProfiles = {} } = useProfilesByIds(assignedTechIds);

  const updateService = useUpdateService();

  // Realtime: when admin reassigns a technician (pools row) or a service is
  // updated, refresh the homeowner's dashboard immediately so the pending
  // state flips to the real technician everywhere.
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`homeowner-sync-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pools", filter: `homeowner_id=eq.${user.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ["pools"] }); queryClient.invalidateQueries({ queryKey: ["pool"] }); })
      .on("postgres_changes", { event: "*", schema: "public", table: "services", filter: `homeowner_id=eq.${user.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ["services"] }); queryClient.invalidateQueries({ queryKey: ["service"] }); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPostCheckout) navigate("/login", { replace: true });
  }, [isLoading, isAuthenticated, isPostCheckout, navigate, searchParams]);

  // Build display services from DB rows.
  const services = useMemo<ServiceInstance[]>(() => {
    if (!user?.id) return [];
    return realServices.map((s) => {
      // Prefer service-level tech assignment; fall back to the pool-level
      // assignment so admin reassignments propagate to scheduled visits that
      // were created before a technician existed.
      const effectiveTechId =
        s.technicianId ||
        pools.find((p) => p.id === s.poolId)?.assignedTechnicianId ||
        pool?.assignedTechnicianId ||
        null;
      const techProfile = effectiveTechId ? techProfiles[effectiveTechId] : null;
      const techName = techProfile
        ? techProfile.fullName ||
          `${techProfile.firstName ?? ""} ${techProfile.lastName ?? ""}`.trim() ||
          "Pool Technician"
        : null;
      const firstName = techProfile?.firstName || techName?.split(" ")[0] || "";
      const initials = (techName ?? "")
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
      const technician = techName
        ? {
            name: techName,
            initials: initials || "PT",
            rating: 5.0,
            isAssigned: true,
            firstName,
            avatarUrl: techProfile?.avatarUrl ?? null,
          }
        : UNASSIGNED_TECH;

      const frequency = (pool?.frequency || "monthly") as BookingData["frequency"];
      const recurrence =
        pool?.frequency === "weekly" || pool?.frequency === "biweekly" || pool?.frequency === "monthly"
          ? (pool!.frequency as BookingData["recurrence"])
          : undefined;

      return {
        id: s.id,
        booking: {
          frequency: (frequency === "once" ? "once" : "monthly") as BookingData["frequency"],
          recurrence,
          selectedPass: passFromServiceType(s.serviceType),
          scheduleData: {
            selectedDate: s.date,
            timeWindow: s.timeWindow as TimeWindow,
            accessMethod: (pool?.accessMethod || "home") as AccessMethod,
            accessDetail: pool?.accessDetail || "",
            addons: [],
            addonsTotal: 0,
          },
          technician,
          pool: pool
            ? {
                address: pool.address,
                city: pool.city,
                state: pool.state,
                zip: pool.zip,
                poolType: pool.poolType,
                poolSize: pool.poolSize,
                accessMethod: (pool.accessMethod || "home") as AccessMethod,
                accessDetail: pool.accessDetail || "",
                hasPets: false,
              }
            : {
                address: user.streetAddress || "",
                city: user.city || "",
                state: user.state || "",
                zip: user.zipCode || "",
                poolType: "",
                poolSize: "",
                accessMethod: "home" as AccessMethod,
                accessDetail: "",
                hasPets: false,
              },
          status: s.status === "completed"
            ? "completed"
            : !technician.isAssigned
            ? "technician_to_be_assigned"
            : "scheduled",
        },
      };
    });
  }, [realServices, techProfiles, pool, user]);

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  const upcomingServices = useMemo(
    () => services.filter((s) => s.booking.status === "scheduled" || s.booking.status === "reschedule_requested" || s.booking.status === "technician_to_be_assigned"),
    [services],
  );
  const pastServices = useMemo(() => services.filter((s) => s.booking.status === "completed"), [services]);

  const nextService = upcomingServices[0] || null;
  const remainingUpcoming = upcomingServices.slice(1);
  const visibleUpcoming = remainingUpcoming.slice(0, visibleCount);
  const hasMoreUpcoming = visibleCount < remainingUpcoming.length;

  const handleViewDetails = (svc: ServiceInstance) => {
    navigate(`/service/${svc.id}`);
  };

  const handleReschedule = async (newDate: Date, newTimeWindow: TimeWindow) => {
    if (!rescheduleService) return;
    try {
      await updateService.mutateAsync({
        id: rescheduleService.id,
        patch: { serviceDate: newDate, timeWindow: newTimeWindow },
      });
    } catch (err) {
      console.warn("Reschedule failed", err);
    }
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
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Upcoming Visits</h2>
          {remainingUpcoming.length > 0 ? (
            <>
              <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
                {visibleUpcoming.map((svc) => (
                  <UpcomingRow key={svc.id} service={svc} canReschedule={true} onReschedule={() => setRescheduleService(svc)} />
                ))}
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
            </>
          ) : !servicesLoading && !nextService ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm">
              <EmptyState
                icon={CalendarPlus}
                title="No upcoming visits"
                description="You're all caught up. Book your next service to keep your pool sparkling."
                actionLabel="Book a Visit"
                onAction={() => setShowBooking(true)}
              />
            </div>
          ) : null}
        </section>

        {/* Past Services */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Completed Services</h2>
          {pastServices.length > 0 ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
              {pastServices.map(svc => (
                <PastRow key={svc.id} service={svc} onViewDetails={() => handleViewDetails(svc)} />
              ))}
            </div>
          ) : !servicesLoading ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm">
              <EmptyState
                icon={CheckCircle2}
                title="No completed services yet"
                description="Your service history will appear here after your first visit."
              />
            </div>
          ) : null}
        </section>

        {/* Loading state */}
        {services.length === 0 && servicesLoading && (
          <div className="bg-card rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">Loading your services…</p>
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
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <StatusBadge status="scheduled" />
          {!technician.isAssigned && <StatusBadge status="technician_to_be_assigned" />}
        </div>
        {technician.isAssigned && (
          <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-md border border-border">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-oasis-aqua flex items-center justify-center text-primary-foreground text-sm font-bold">
              {technician.initials}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[0.8rem] font-semibold text-foreground">{technician.name}</span>
              <span className="text-[0.72rem] text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3 fill-cta-yellow text-cta-yellow" />
                {technician.rating}
              </span>
            </div>
          </div>
        )}


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
  const isTechnicianPending = !booking.technician.isAssigned;

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="w-12 text-center shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase">{month}</p>
        <p className="text-xl font-bold text-foreground">{day}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{booking.selectedPass.label}</p>
        <p className="text-xs text-muted-foreground truncate">
          {isTechnicianPending ? "Pool Technician to be assigned" : booking.technician.name} · {TIME_LABELS[booking.scheduleData.timeWindow]}
        </p>
      </div>

      {isTechnicianPending ? (
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
