import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Play, CheckCircle2, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import TechLayout from "@/components/technician/TechLayout";
import {
  getHomeowner,
  getPool,
  getPoolFullAddress,
  formatDateShort,
  TIME_LABELS,
  type TechService,
} from "@/data/techMockData";
import { getJobs, subscribe, setJobStatus } from "@/data/techJobsStore";

type CompletedBanner = { homeownerName: string; completedAt: string };

const TechJobs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setTick] = useState(0);
  const [banner, setBanner] = useState<CompletedBanner | null>(null);

  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);

  // Pick up post-completion banner from navigation state, then clear it
  useEffect(() => {
    const state = location.state as { completedBanner?: CompletedBanner } | null;
    if (state?.completedBanner) {
      setBanner(state.completedBanner);
      window.history.replaceState({}, "");
      const t = setTimeout(() => setBanner(null), 6000);
      return () => clearTimeout(t);
    }
  }, [location.state]);

  const jobs = getJobs();
  const active = jobs.filter((j) => j.status !== "completed").sort((a, b) => a.date.getTime() - b.date.getTime());
  const completed = jobs.filter((j) => j.status === "completed").sort((a, b) => b.date.getTime() - a.date.getTime());

  const handleStart = (svc: TechService) => {
    const now = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setJobStatus(svc.id, "in_progress", { startedAt: now });
    navigate(`/tech/jobs/${svc.id}`);
  };

  return (
    <TechLayout>
      {banner && (
        <div
          role="status"
          className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 shadow-sm animate-fade-in"
        >
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-900">Service completed successfully</p>
            <p className="text-xs text-green-800/80 mt-0.5">
              {banner.homeownerName}'s job was marked complete at {banner.completedAt}. The homeowner has been notified.
            </p>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="text-green-700/70 hover:text-green-900 transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
        <p className="text-muted-foreground text-sm mt-1">Start, track, and complete your service jobs</p>
      </div>

      {/* Active */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-3">Active</h2>
        {active.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border">
            <p className="text-muted-foreground">No active jobs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((svc) => (
              <JobCard
                key={svc.id}
                svc={svc}
                primary={
                  svc.status === "in_progress" ? (
                    <Button className="flex-1 gap-1.5" onClick={() => navigate(`/tech/jobs/${svc.id}`)}>
                      Resume <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button className="flex-1 gap-1.5" onClick={() => handleStart(svc)}>
                      <Play className="h-4 w-4" /> Start Service
                    </Button>
                  )
                }
                onView={() => navigate(`/tech/jobs/${svc.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Completed */}
      <section>
        <h2 className="text-lg font-bold text-foreground mb-3">Completed</h2>
        {completed.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border">
            <p className="text-muted-foreground">No completed jobs yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completed.map((svc) => (
              <JobCard
                key={svc.id}
                svc={svc}
                primary={
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5 hover:text-primary hover:border-primary hover:bg-transparent"
                    onClick={() => navigate(`/tech/service/${svc.id}`)}
                  >
                    <CheckCircle2 className="h-4 w-4" /> View Report
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </section>
    </TechLayout>
  );
};

const JobCard = ({
  svc,
  primary,
  onView,
}: {
  svc: TechService;
  primary: React.ReactNode;
  onView?: () => void;
}) => {
  const ho = getHomeowner(svc.homeownerId);
  const pool = getPool(svc.poolId);
  if (!ho || !pool) return null;
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-foreground">{ho.name}</p>
          <p className="text-sm text-muted-foreground">{svc.serviceType}</p>
        </div>
        <StatusBadge status={svc.status} />
      </div>
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{getPoolFullAddress(pool)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{formatDateShort(svc.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{TIME_LABELS[svc.timeWindow]}</span>
        </div>
      </div>
      <div className="flex gap-2.5">
        {primary}
        {onView && (
          <Button
            variant="outline"
            className="flex-1 gap-1.5 hover:text-primary hover:border-primary hover:bg-transparent"
            onClick={onView}
          >
            Details
          </Button>
        )}
      </div>
    </div>
  );
};

export default TechJobs;
