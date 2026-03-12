import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronRight,
  CheckCircle2,
  Wrench,
  Droplets,
  Star,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import PoolSceneHero from "@/components/dashboard/PoolSceneHero";

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TIME_LABELS: Record<string, string> = {
  morning: "8:00 AM – 12:00 PM",
  afternoon: "12:00 PM – 4:00 PM",
  evening: "4:00 PM – 6:00 PM",
};

/* ── Mock job data (mirrors homeowner demo bookings) ── */
interface TechJob {
  id: string;
  homeowner: { name: string; phone: string };
  pool: {
    address: string;
    city: string;
    state: string;
    zip: string;
    poolType: string;
    poolSize: string;
    accessMethod: string;
    accessDetail: string;
  };
  service: { label: string; hours: number; description: string };
  date: Date;
  timeWindow: string;
  addons: { name: string; price: number }[];
  status: "scheduled" | "in_progress" | "completed";
  notes?: string;
}

function createTechJobs(): TechJob[] {
  return [
    {
      id: "job-1",
      homeowner: { name: "John Smith", phone: "(407) 555-1234" },
      pool: {
        address: "123 Main Street",
        city: "Miami",
        state: "FL",
        zip: "33101",
        poolType: "In-ground",
        poolSize: "Medium (15k–25k gallons)",
        accessMethod: "gate",
        accessDetail: "Code: 4521",
      },
      service: { label: "Deep Clean Pass", hours: 3, description: "Full cleaning, chemical balance, filter check" },
      date: new Date(2026, 2, 18),
      timeWindow: "morning",
      addons: [{ name: "Filter Deep Clean", price: 29 }],
      status: "scheduled",
    },
    {
      id: "job-2",
      homeowner: { name: "Lisa Martinez", phone: "(407) 555-8821" },
      pool: {
        address: "456 Palm Avenue",
        city: "Orlando",
        state: "FL",
        zip: "32801",
        poolType: "In-ground",
        poolSize: "Large (25k+ gallons)",
        accessMethod: "home",
        accessDetail: "",
      },
      service: { label: "Quick Refresh Pass", hours: 1, description: "Surface skim, chemical check, quick vacuum" },
      date: new Date(2026, 2, 19),
      timeWindow: "afternoon",
      addons: [],
      status: "scheduled",
    },
    {
      id: "job-3",
      homeowner: { name: "John Smith", phone: "(407) 555-1234" },
      pool: {
        address: "123 Main Street",
        city: "Miami",
        state: "FL",
        zip: "33101",
        poolType: "In-ground",
        poolSize: "Medium (15k–25k gallons)",
        accessMethod: "gate",
        accessDetail: "Code: 4521",
      },
      service: { label: "Deep Clean Pass", hours: 3, description: "Full cleaning, chemical balance, filter check" },
      date: new Date(2026, 0, 16),
      timeWindow: "morning",
      addons: [],
      status: "completed",
      notes: "All chemicals balanced. Filter cleaned and replaced. Pool in great condition.",
    },
  ];
}

const ACCESS_LABELS: Record<string, string> = {
  home: "Owner will be home",
  gate: "Gate code provided",
  key: "Key on property",
  other: "Custom instructions",
};

const TechnicianDashboard = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<"upcoming" | "completed">("upcoming");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const jobs = createTechJobs();
  const upcomingJobs = jobs.filter((j) => j.status !== "completed");
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const todayJobs = upcomingJobs.filter(
    (j) => j.date.toDateString() === new Date().toDateString()
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container max-w-[760px] mx-auto px-5 h-[60px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5">
            <Waves className="h-5 w-5 text-primary" />
            <span className="text-[1.25rem] font-bold text-foreground tracking-tight">
              Orlando's Oasis
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-1.5">
              <Wrench className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Technician</span>
            </div>
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Sign out"
                className="hover:bg-primary hover:text-primary-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-8 pb-16">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Hey, {user?.fullName?.split(" ")[0] || "Technician"} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {todayJobs.length > 0
              ? `You have ${todayJobs.length} job${todayJobs.length > 1 ? "s" : ""} today`
              : "No jobs scheduled for today"}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard icon={<Calendar className="h-5 w-5 text-primary" />} value={upcomingJobs.length} label="Upcoming" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5 text-accent" />} value={completedJobs.length} label="Completed" />
          <StatCard icon={<Star className="h-5 w-5 text-cta-yellow" />} value="4.9" label="Rating" />
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6">
          <button
            onClick={() => setSelectedTab("upcoming")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              selectedTab === "upcoming"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Upcoming ({upcomingJobs.length})
          </button>
          <button
            onClick={() => setSelectedTab("completed")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              selectedTab === "completed"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Completed ({completedJobs.length})
          </button>
        </div>

        {/* Job list */}
        <div className="space-y-4">
          {(selectedTab === "upcoming" ? upcomingJobs : completedJobs).map((job) => (
            <JobCard key={job.id} job={job} />
          ))}

          {(selectedTab === "upcoming" ? upcomingJobs : completedJobs).length === 0 && (
            <div className="bg-card rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">
                {selectedTab === "upcoming" ? "No upcoming jobs." : "No completed jobs yet."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <a href="/terms" className="text-primary hover:underline">Terms</a>
          <a href="/privacy" className="text-primary hover:underline">Privacy</a>
          <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
        </footer>
      </main>
    </div>
  );
};

/* ── Stat Card ── */
const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) => (
  <div className="bg-card rounded-2xl p-4 text-center shadow-sm border border-border">
    <div className="flex justify-center mb-2">{icon}</div>
    <p className="text-xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

/* ── Job Card ── */
const JobCard = ({ job }: { job: TechJob }) => {
  const [expanded, setExpanded] = useState(false);
  const d = job.date;
  const fullDate = `${FULL_DAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const isCompleted = job.status === "completed";

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
      {/* Card hero */}
      <div className="relative h-[140px] overflow-hidden">
        <PoolSceneHero />
        <div className="absolute top-3 left-3">
          <StatusBadge status={job.status} />
        </div>
        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 shadow-md border border-border">
          <span className="text-xs font-semibold text-foreground">{job.service.hours}-Hour Service</span>
        </div>
      </div>

      {/* Card body */}
      <div className="px-[18px] py-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="font-semibold text-foreground text-base">{job.service.label}</p>
            <p className="text-sm text-muted-foreground">{job.service.description}</p>
          </div>
        </div>

        {/* Date & time */}
        <div className="flex items-center gap-2 text-sm text-foreground mb-2">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium">{fullDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <span>{isCompleted ? "Completed at 11:42 AM" : TIME_LABELS[job.timeWindow]}</span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>{job.pool.address}, {job.pool.city}, {job.pool.state} {job.pool.zip}</span>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline mb-1"
        >
          {expanded ? "Hide details" : "View details"}
          <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-4 animate-fade-in">
            {/* Homeowner info */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Homeowner</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {job.homeowner.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{job.homeowner.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {job.homeowner.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Pool details */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pool Details</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium text-foreground">{job.pool.poolType}</p>
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">Size</p>
                  <p className="font-medium text-foreground">{job.pool.poolSize}</p>
                </div>
              </div>
            </div>

            {/* Access info */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Access Info</p>
              <div className="bg-muted rounded-lg px-3 py-2">
                <p className="text-sm text-foreground font-medium">
                  {ACCESS_LABELS[job.pool.accessMethod] || job.pool.accessMethod}
                </p>
                {job.pool.accessDetail && (
                  <p className="text-xs text-muted-foreground mt-0.5">{job.pool.accessDetail}</p>
                )}
              </div>
            </div>

            {/* Add-ons */}
            {job.addons.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Add-ons</p>
                <div className="space-y-1">
                  {job.addons.map((addon, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-foreground">{addon.name}</span>
                      <span className="text-muted-foreground">${addon.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion notes */}
            {isCompleted && job.notes && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Service Notes</p>
                <div className="bg-accent/10 rounded-lg px-3 py-2 border border-accent/20">
                  <p className="text-sm text-foreground">{job.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianDashboard;
