import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Calendar, Clock, MapPin, CheckCircle2, Droplets, CalendarClock, FileText, MessagesSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import TechLayout from "@/components/technician/TechLayout";
import TechRescheduleModal from "@/components/technician/TechRescheduleModal";
import ReportRouteIssueModal, { type RouteService } from "@/components/ReportRouteIssueModal";
import {
  createTechServices,
  getHomeowner,
  getPool,
  getPoolFullAddress,
  formatDateShort,
  TIME_LABELS,
  POOLS,
  type TechService,
} from "@/data/techMockData";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState(createTechServices);
  const [rescheduleService, setRescheduleService] = useState<TechService | null>(null);
  const [reportIssueOpen, setReportIssueOpen] = useState(false);

  const upcoming = services.filter((s) => s.status !== "completed");
  const completed = services.filter((s) => s.status === "completed");

  const handleReschedule = (newDate: Date, newTime: string) => {
    if (!rescheduleService) return;
    setServices((prev) =>
      prev.map((s) =>
        s.id === rescheduleService.id
          ? { ...s, date: newDate, timeWindow: newTime as TechService["timeWindow"] }
          : s
      )
    );
  };

  // Group upcoming services by month
  const groupedByMonth: { key: string; label: string; services: TechService[] }[] = [];
  upcoming
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .forEach((svc) => {
      const key = `${svc.date.getFullYear()}-${svc.date.getMonth()}`;
      const label = `${MONTH_NAMES[svc.date.getMonth()]} ${svc.date.getFullYear()}`;
      const existing = groupedByMonth.find((g) => g.key === key);
      if (existing) {
        existing.services.push(svc);
      } else {
        groupedByMonth.push({ key, label, services: [svc] });
      }
    });

  return (
    <TechLayout>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Hey, {user?.fullName?.split(" ")[0] || "Technician"} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Here's your work overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <button onClick={() => navigate("/tech-dashboard")} className="text-left">
          <StatCard icon={<Calendar className="h-5 w-5 text-primary" />} value={upcoming.length} label="Upcoming Services" />
        </button>
        <button onClick={() => navigate("/tech/completed")} className="text-left">
          <StatCard icon={<CheckCircle2 className="h-5 w-5 text-accent" />} value={completed.length} label="Completed Services" />
        </button>
        <button onClick={() => navigate("/tech/pools")} className="text-left">
          <StatCard icon={<Droplets className="h-5 w-5 text-oasis" />} value={POOLS.length} label="Assigned Pools" />
        </button>
      </div>

      {/* Upcoming Services */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Upcoming Services</h2>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs hover:text-primary hover:border-primary hover:bg-transparent"
            onClick={() => setReportIssueOpen(true)}
          >
            <AlertCircle className="h-3.5 w-3.5" /> Report Issue
          </Button>
        </div>
        {groupedByMonth.length === 0 && (
          <div className="bg-card rounded-2xl p-8 text-center border border-border">
            <p className="text-muted-foreground">No upcoming services.</p>
          </div>
        )}
        {groupedByMonth.map((group) => (
          <div key={group.key} className="mb-6">
            <p className="text-sm font-semibold text-muted-foreground mb-3">{group.label}</p>
            <div className="space-y-3">
              {group.services.map((svc) => {
                const ho = getHomeowner(svc.homeownerId);
                const pool = getPool(svc.poolId);
                if (!ho || !pool) return null;
                return (
                  <div key={svc.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:text-primary hover:border-primary hover:bg-transparent"
                        onClick={() => navigate(`/tech/service/${svc.id}`)}
                      >
                        View Details
                        <FileText className="h-3.5 w-3.5 ml-1" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:text-primary hover:border-primary hover:bg-transparent"
                        onClick={() => navigate(`/tech/messages`)}
                      >
                        <MessagesSquare className="h-3.5 w-3.5 mr-1" />
                        Message
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:text-primary hover:border-primary hover:bg-transparent"
                        onClick={() => setRescheduleService(svc)}
                      >
                        <CalendarClock className="h-3.5 w-3.5 mr-1" />
                        Reschedule
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Reschedule Modal */}
      {rescheduleService && (
        <TechRescheduleModal
          open={!!rescheduleService}
          onOpenChange={(open) => !open && setRescheduleService(null)}
          currentDate={rescheduleService.date}
          currentTimeWindow={rescheduleService.timeWindow}
          homeownerName={getHomeowner(rescheduleService.homeownerId)?.name || ""}
          onConfirm={handleReschedule}
        />
      )}

      {/* Report Route Issue Modal */}
      <ReportRouteIssueModal
        open={reportIssueOpen}
        onOpenChange={setReportIssueOpen}
        role="technician"
        services={
          upcoming.slice(0, 6).map((s) => ({
            id: s.id,
            homeowner: getHomeowner(s.homeownerId)?.name || "Homeowner",
            type: s.serviceType,
            time: TIME_LABELS[s.timeWindow],
          })) as RouteService[]
        }
      />
    </TechLayout>
  );
};

const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) => (
  <div className="bg-card rounded-2xl p-4 text-center shadow-sm border border-border hover:border-primary/30 transition-colors">
    <div className="flex justify-center mb-2">{icon}</div>
    <p className="text-xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default TechnicianDashboard;
