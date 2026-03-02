import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Waves, Calendar, ChevronRight, LogOut, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking, BookingData, matchTechnician } from "@/contexts/BookingContext";
import PoolSceneHero from "@/components/dashboard/PoolSceneHero";
import BookingFlow from "@/components/dashboard/BookingFlow";
import StatusBadge from "@/components/StatusBadge";

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

/* ── Demo seed data for demo@example.com ── */
function createDemoBookings(): { upcoming: BookingData; past: BookingData } {
  const upcomingDate = new Date(2026, 2, 18); // March 18, 2026
  const pastDate = new Date(2026, 1, 21); // February 21, 2026

  const sharedPass = {
    id: "pass-2",
    hours: 3,
    label: "Deep Clean Pass",
    description: "Full cleaning, chemical balance, filter check",
    originalPrice: 189,
    discountPrice: 149,
    percentOff: 21,
    isMostPopular: true,
  };

  const sharedPool = {
    address: "123 Main Street",
    city: "Miami",
    state: "FL",
    zip: "33101",
    poolType: "In-ground",
    poolSize: "Medium (15k–25k gallons)",
    accessMethod: "gate" as const,
    accessDetail: "Code: 4521",
  };

  const tech = { name: "Carlos M.", initials: "CM", rating: 4.9, isAssigned: true };

  return {
    upcoming: {
      frequency: "once",
      selectedPass: sharedPass,
      scheduleData: {
        selectedDate: upcomingDate,
        timeWindow: "morning",
        accessMethod: "gate",
        accessDetail: "Code: 4521",
        addons: [{ id: "addon-1", name: "Filter Deep Clean", price: 29 }],
        addonsTotal: 29,
      },
      technician: tech,
      pool: sharedPool,
      status: "scheduled",
    },
    past: {
      frequency: "once",
      selectedPass: sharedPass,
      scheduleData: {
        selectedDate: pastDate,
        timeWindow: "morning",
        accessMethod: "gate",
        accessDetail: "Code: 4521",
        addons: [],
        addonsTotal: 0,
      },
      technician: tech,
      pool: sharedPool,
      status: "completed",
    },
  };
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { booking } = useBooking();
  const [showCancelled, setShowCancelled] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  // For demo user, show seed data; otherwise use booking context
  const isDemoUser = user?.email === "demo@example.com";
  const demoBookings = isDemoUser ? createDemoBookings() : null;

  const upcomingBooking = booking ? { ...booking, status: "scheduled" as const } : demoBookings?.upcoming || null;
  const pastBooking = booking ? { ...booking, status: "completed" as const } : demoBookings?.past || null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container max-w-[760px] mx-auto px-5 h-[60px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5">
            <Waves className="h-5 w-5 text-primary" />
            <span className="text-[1.25rem] font-bold text-navy tracking-tight">Orlando's Oasis</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button size="sm" className="font-semibold text-sm rounded-lg px-5 py-2" onClick={() => setShowBooking(true)}>
              <Calendar className="h-4 w-4 mr-1" />
              Book Service
            </Button>
            {user && (
              <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[760px] mx-auto px-5 py-8 pb-16">
        {/* Upcoming Section */}
        <section className="mb-10">
          <h2 className="text-[1.35rem] font-semibold text-foreground mb-4">Upcoming services</h2>

          {upcomingBooking ? (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {SHORT_MONTHS[upcomingBooking.scheduleData.selectedDate.getMonth()]} {upcomingBooking.scheduleData.selectedDate.getFullYear()}
              </p>
              <ServiceCard booking={upcomingBooking} navigateTo="/service-details" />
            </>
          ) : (
            <div className="bg-card rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">No upcoming services yet.</p>
              <button className="mt-4 text-primary font-bold text-sm hover:underline" onClick={() => setShowBooking(true)}>Book Your First Service</button>
            </div>
          )}
        </section>

        {/* Past Section */}
        <section>
          <h2 className="text-[1.35rem] font-semibold text-foreground mb-1">Past services</h2>

          {pastBooking ? (
            <div className="mt-3">
              <ServiceCard booking={pastBooking} navigateTo="/service-details/completed" />
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-8 text-center">
              <p className="text-muted-foreground text-sm">No past services to show.</p>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-5">
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary"
              onClick={() => setShowCancelled(!showCancelled)}
            >
              {showCancelled ? "Hide cancelled appointments" : "Show cancelled appointments"}
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <a href="#" className="text-primary hover:underline">Terms</a>
          <a href="#" className="text-primary hover:underline">Privacy</a>
          <a href="#" className="text-primary hover:underline">Do Not Sell My Personal Information</a>
          <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
        </footer>
      </main>

      {showBooking && (
        <BookingFlow
          onClose={() => setShowBooking(false)}
          onComplete={() => setShowBooking(false)}
        />
      )}
    </div>
  );
};

/* ── Unified Service Card ── */
interface ServiceCardProps {
  booking: BookingData;
  navigateTo: string;
}

const ServiceCard = ({ booking, navigateTo }: ServiceCardProps) => {
  const navigate = useNavigate();
  const { setBooking } = useBooking();
  const { selectedPass, scheduleData, technician } = booking;
  const serviceStatus = booking.status || "scheduled";
  const d = scheduleData.selectedDate;
  const shortDate = `${FULL_DAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;

  return (
    <div onClick={() => { setBooking(booking); navigate(navigateTo); }} className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
      {/* Hero illustration */}
      <div className="relative h-[190px] overflow-hidden">
        <PoolSceneHero />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <StatusBadge status={serviceStatus} />
        </div>

        {/* Technician badge */}
        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-md border border-border">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-oasis-aqua flex items-center justify-center text-primary-foreground text-sm font-bold">
            {technician.isAssigned ? technician.initials : "?"}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[0.8rem] font-semibold text-foreground">
              {technician.isAssigned ? technician.name : "TBD"}
            </span>
            <span className="text-[0.72rem] text-muted-foreground flex items-center gap-1">
              {technician.isAssigned ? (
                <>
                  <Star className="h-3 w-3 fill-cta-yellow text-cta-yellow" />
                  {technician.rating}
                </>
              ) : (
                "Assigning soon"
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="px-[18px] py-4 flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold text-foreground text-base mb-1">
            {selectedPass.label}
          </p>
          <p className="font-semibold text-foreground text-[0.875rem] mb-0.5">{shortDate}</p>
          <p className="text-[0.825rem] text-muted-foreground leading-relaxed">
            Expected arrival {TIME_LABELS[scheduleData.timeWindow]}
            <br />
            {booking.pool.address}, {booking.pool.city}, {booking.pool.state} {booking.pool.zip}
            <br />
            Pool Access: {ACCESS_LABELS[scheduleData.accessMethod]}
            {scheduleData.accessDetail && ` · ${scheduleData.accessDetail}`}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground mt-1 shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
};

export default Dashboard;
