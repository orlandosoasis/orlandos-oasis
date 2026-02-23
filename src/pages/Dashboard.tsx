import { useState } from "react";
import { Link } from "react-router-dom";
import { Waves, Calendar, ChevronRight, User, Clock, MapPin, LogOut, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/contexts/BookingContext";
import PoolSceneHero from "@/components/dashboard/PoolSceneHero";

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

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { booking } = useBooking();
  const [showCancelled, setShowCancelled] = useState(false);

  const formatShortDate = (date: Date) => {
    return `${FULL_DAYS[date.getDay()]}, ${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;
  };

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
            <Button size="sm" className="font-semibold text-sm rounded-lg px-5 py-2">
              <Calendar className="h-4 w-4 mr-1.5" />
              Book Service
            </Button>
            {user &&
            <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            }
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[760px] mx-auto px-5 py-8 pb-16">
        {/* Upcoming Section */}
        <section className="mb-10">
          <h2 className="text-[1.35rem] font-semibold text-foreground mb-1">Upcoming services</h2>

          {booking ?
          <UpcomingCard booking={booking} /> :

          <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <p className="text-muted-foreground">No upcoming services yet.</p>
              <Link to="/passes">
                <Button className="mt-4">Book Your First Service</Button>
              </Link>
            </div>
          }
        </section>

        {/* Past Section */}
        <section>
          <h2 className="text-[1.35rem] font-semibold text-foreground mb-1">Past services</h2>
          <div className="w-11 h-[3px] bg-primary rounded-sm mb-5" />

          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">No past services to show.</p>
          </div>

          <div className="flex flex-col gap-3 mt-5">
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 font-semibold"
              onClick={() => setShowCancelled(!showCancelled)}>

              {showCancelled ? "Hide cancelled appointments" : "Show cancelled appointments"}
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <a href="#" className="text-primary hover:underline">Terms</a>
          <a href="#" className="text-primary hover:underline">Privacy</a>
          <a href="#" className="text-primary hover:underline">Do Not Sell My Personal Information</a>
          <p className="mt-3">© Orlando's Oasis 2026</p>
        </footer>
      </main>
    </div>);

};

/* ── Upcoming Service Card ── */
interface UpcomingCardProps {
  booking: NonNullable<ReturnType<typeof useBooking>["booking"]>;
}

const UpcomingCard = ({ booking }: UpcomingCardProps) => {
  const { selectedPass, scheduleData, technician } = booking;
  const d = scheduleData.selectedDate;
  const shortDate = `${FULL_DAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
      {/* Hero illustration */}
      <div className="relative h-[190px] overflow-hidden">
        <PoolSceneHero />

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
              {technician.isAssigned ?
              <>
                  <Star className="h-3 w-3 fill-cta-yellow text-cta-yellow" />
                  {technician.rating}
                </> :

              "Assigning soon"
              }
            </span>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="px-[18px] py-4 flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold text-foreground text-base mb-1">
            {selectedPass.label} for {selectedPass.hours} {selectedPass.hours === 1 ? "hour" : "hours"}
          </p>
          <p className="font-semibold text-foreground text-[0.875rem] mb-0.5">{shortDate}</p>
          <p className="text-[0.825rem] text-muted-foreground leading-relaxed">
            Expected arrival {TIME_LABELS[scheduleData.timeWindow]}
            <br />
            Pool Access: {ACCESS_LABELS[scheduleData.accessMethod]}
            {scheduleData.accessDetail && ` · ${scheduleData.accessDetail}`}
          </p>
          {scheduleData.addons.length > 0 &&
          <div className="flex flex-wrap gap-1.5 mt-2">
              {scheduleData.addons.map((addon) =>
            <span
              key={addon.id}
              className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">

                  {addon.name}
                </span>
            )}
            </div>
          }
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground mt-1 shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>);

};

export default Dashboard;