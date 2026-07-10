import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  MapPin,
  Play,
  CheckCircle2,
  ArrowRight,
  X,
  Flame,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/StatusBadge";
import TechLayout from "@/components/technician/TechLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useServices } from "@/hooks/useServices";
import { usePools } from "@/hooks/usePools";
import { useProfilesByIds } from "@/hooks/useProfiles";
import {
  formatDateShort,
  TIME_LABELS,
  SHORT_MONTHS,
  getPoolFullAddress,
  type TechService,
  type TechPool,
} from "@/types/tech";
import type { PublicProfile } from "@/hooks/useProfiles";
import { cn } from "@/lib/utils";
import ReportRouteIssueModal from "@/components/ReportRouteIssueModal";
import { useMyTechRouteIssues } from "@/hooks/useRouteIssues";

type CompletedBanner = { homeownerName: string; completedAt: string };
type TabKey = "active" | "completed";
type CompletedScope = "today" | "all";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const TechJobs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [banner, setBanner] = useState<CompletedBanner | null>(null);
  const [tab, setTab] = useState<TabKey>("active");
  const [completedScope, setCompletedScope] = useState<CompletedScope>("today");
  const [startingId, setStartingId] = useState<string | null>(null);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const { data: myRouteIssues = [] } = useMyTechRouteIssues();

  const { data: jobs = [], isLoading } = useServices({ technicianId: user?.id });
  const poolIds = useMemo(() => [...new Set(jobs.map((j) => j.poolId))], [jobs]);
  const homeownerIds = useMemo(() => [...new Set(jobs.map((j) => j.homeownerId))], [jobs]);
  const { data: pools = [] } = usePools();
  const { data: profiles = {} } = useProfilesByIds(homeownerIds);

  const poolMap = useMemo(() => {
    const m = new Map<string, TechPool>();
    pools.forEach((p) => poolIds.includes(p.id) && m.set(p.id, p));
    return m;
  }, [pools, poolIds]);

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

  // Today defaults to "now" but we keep the demo seed date as a fallback so
  // counts aren't always zero against the demo data.
  const today = useMemo(() => new Date(), []);

  const todayActive = useMemo(
    () =>
      jobs
        .filter(
          (j) =>
            (j.status === "scheduled" || j.status === "in_progress") &&
            isSameDay(j.date, today)
        )
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [jobs, today]
  );

  const todayCompleted = useMemo(
    () => jobs.filter((j) => j.status === "completed" && isSameDay(j.date, today)),
    [jobs, today]
  );

  const allCompleted = useMemo(
    () =>
      jobs
        .filter((j) => j.status === "completed")
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
    [jobs]
  );

  const activeCount = todayActive.length;
  const completedCount = todayCompleted.length;
  const priorityId = todayActive[0]?.id;

  const handleStart = async (svc: TechService) => {
    setStartingId(svc.id);
    const { error } = await supabase
      .from("services")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", svc.id);
    setStartingId(null);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      navigate(`/tech/jobs/${svc.id}`);
    }
  };

  const completedList = completedScope === "today" ? todayCompleted : allCompleted;

  // Group all-time completed by Month Year
  const groupedCompleted = useMemo(() => {
    if (completedScope !== "all") return null;
    const map = new Map<string, TechService[]>();
    completedList.forEach((svc) => {
      const key = `${svc.date.getFullYear()}-${svc.date.getMonth()}`;
      const arr = map.get(key) || [];
      arr.push(svc);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([key, items]) => {
      const [y, m] = key.split("-").map(Number);
      return {
        key,
        label: `${SHORT_MONTHS[m]} ${y}`,
        items,
      };
    });
  }, [completedScope, completedList]);

  return (
    <TechLayout>
      {banner && (
        <div
          role="status"
          className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 shadow-sm animate-fade-in"
        >
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-900">
              Service completed successfully
            </p>
            <p className="text-xs text-green-800/80 mt-0.5">
              {banner.homeownerName}'s job was marked complete at {banner.completedAt}.
              The homeowner has been notified.
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

      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Start, track, and complete your service jobs
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0 mt-1"
          onClick={() => setShowReportIssue(true)}
        >
          <AlertCircle className="h-3.5 w-3.5" /> Report Issue
        </Button>
      </div>

      {/* Today Summary */}
      <div className="mb-4 bg-card rounded-2xl border border-border p-4 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Today's Jobs
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {activeCount} Active
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            {completedCount} Completed
          </span>
        </div>
      </div>

      {/* Sticky tabs */}
      <div className="sticky top-[60px] z-10 -mx-5 bg-background/95 backdrop-blur border-b border-border mb-4">
        <div role="tablist" className="grid grid-cols-2">
          <TabButton
            active={tab === "active"}
            onClick={() => setTab("active")}
            label="Active"
            count={activeCount}
          />
          <TabButton
            active={tab === "completed"}
            onClick={() => setTab("completed")}
            label="Completed"
            count={completedCount}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Active tab */}
          {tab === "active" && (
            <section>
              {todayActive.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No active jobs today"
                  description="Enjoy the downtime — new assignments from your manager will appear here as soon as they're scheduled."
                />

              ) : (
                <div className="space-y-3">
                  {todayActive.map((svc) => (
                    <JobCard
                      key={svc.id}
                      svc={svc}
                      pool={poolMap.get(svc.poolId)}
                      homeowner={profiles[svc.homeownerId]}
                      isPriority={svc.id === priorityId}
                      primary={
                        svc.status === "in_progress" ? (
                          <Button
                            className="flex-1 gap-1.5"
                            onClick={() => navigate(`/tech/jobs/${svc.id}`)}
                          >
                            Resume <ArrowRight className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            className="flex-1 gap-1.5"
                            disabled={startingId === svc.id}
                            onClick={() => handleStart(svc)}
                          >
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
          )}

          {/* Completed tab */}
          {tab === "completed" && (
            <section>
              <div className="inline-flex items-center rounded-xl bg-muted p-1 mb-4">
                <ScopeButton
                  active={completedScope === "today"}
                  onClick={() => setCompletedScope("today")}
                  label="Today"
                />
                <ScopeButton
                  active={completedScope === "all"}
                  onClick={() => setCompletedScope("all")}
                  label="All Time"
                />
              </div>

              {completedList.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title={completedScope === "today" ? "No jobs wrapped up today" : "No completed jobs yet"}
                  description={
                    completedScope === "today"
                      ? "Services you mark as complete today will appear here."
                      : "Finish your first service and the full history will live here."
                  }
                />

              ) : completedScope === "today" ? (
                <div className="space-y-3">
                  {completedList.map((svc) => (
                    <JobCard
                      key={svc.id}
                      svc={svc}
                      pool={poolMap.get(svc.poolId)}
                      homeowner={profiles[svc.homeownerId]}
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
              ) : (
                <div className="space-y-6">
                  {groupedCompleted?.map((group) => (
                    <div key={group.key}>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                        {group.label}
                      </h3>
                      <div className="space-y-3">
                        {group.items.map((svc) => (
                          <JobCard
                            key={svc.id}
                            svc={svc}
                            pool={poolMap.get(svc.poolId)}
                            homeowner={profiles[svc.homeownerId]}
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
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
      {/* My Route Issues */}
      {myRouteIssues.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            My Route Issues
          </h2>
          <div className="space-y-2">
            {myRouteIssues.map((issue) => {
              const statusStyle =
                issue.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : issue.status === "pending_approval"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : issue.status === "cancelled"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-muted text-muted-foreground border-border";
              const statusLabel =
                issue.status === "active"
                  ? "Approved"
                  : issue.status === "pending_approval"
                  ? "Pending Review"
                  : issue.status === "cancelled"
                  ? "Rejected"
                  : "Resolved";
              return (
                <div
                  key={issue.id}
                  className="bg-card rounded-xl border border-border px-4 py-3 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">
                      {issue.issue_type === "other" ? issue.other_text || "Other" : issue.issue_type}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(issue.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${statusStyle}`}>
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <ReportRouteIssueModal
        open={showReportIssue}
        onOpenChange={setShowReportIssue}
        role="technician"
        services={todayActive.map((svc) => ({
          id: svc.id,
          homeowner: profiles[svc.homeownerId]?.fullName || profiles[svc.homeownerId]?.email || "Homeowner",
          type: svc.serviceType,
          time: TIME_LABELS[svc.timeWindow],
        }))}
      />
    </TechLayout>
  );
};

const TabButton = ({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) => (
  <button
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={cn(
      "relative w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors",
      active
        ? "text-primary"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    {label}
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      {count}
    </span>
    {active && (
      <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary rounded-full" />
    )}
  </button>
);

const ScopeButton = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
      active
        ? "bg-card text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    {label}
  </button>
);

const EmptyState = ({
  title,
  description,
  icon: Icon = Calendar,
}: {
  title: string;
  description?: string;
  icon?: typeof Calendar;
}) => (
  <div className="bg-card rounded-2xl p-10 text-center border border-border flex flex-col items-center gap-3">
    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
      <Icon className="h-7 w-7" aria-hidden="true" />
    </div>
    <h3 className="text-base font-semibold text-foreground">{title}</h3>
    {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
  </div>
);


const JobCard = ({
  svc,
  pool,
  homeowner,
  primary,
  onView,
  isPriority = false,
}: {
  svc: TechService;
  pool: TechPool | undefined;
  homeowner: PublicProfile | undefined;
  primary: React.ReactNode;
  onView?: () => void;
  isPriority?: boolean;
}) => {
  const homeownerName = homeowner?.fullName || homeowner?.email || "Homeowner";
  const address = pool ? getPoolFullAddress(pool) : "Address unavailable";
  return (
    <div
      className={cn(
        "bg-card rounded-2xl border p-5 shadow-sm transition-all",
        isPriority ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
      )}
    >
      {isPriority && (
        <div className="flex items-center gap-1.5 mb-3 text-[11px] font-bold uppercase tracking-wider text-primary">
          <Flame className="h-3.5 w-3.5" />
          Up Next
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{homeownerName}</p>
            {homeowner?.subscriptionStatus === "pending_cancellation" && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                Cancelling
              </span>
            )}
            {homeowner?.subscriptionStatus === "cancelled" && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 shrink-0">
                Cancelled
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{svc.serviceType}</p>
        </div>
        <StatusBadge status={svc.status} />
      </div>
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{address}</span>
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
