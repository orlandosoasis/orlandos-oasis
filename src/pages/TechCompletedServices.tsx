import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import TechLayout from "@/components/technician/TechLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useServices } from "@/hooks/useServices";
import { usePools } from "@/hooks/usePools";
import { useProfilesByIds } from "@/hooks/useProfiles";
import { formatDateShort, getPoolFullAddress } from "@/types/tech";
import { EmptyState } from "@/components/EmptyState";

const TechCompletedServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: services = [], isLoading: loadingServices } = useServices({
    technicianId: user?.id,
    status: "completed",
  });
  const { data: pools = [], isLoading: loadingPools } = usePools();
  const { data: profiles = {} } = useProfilesByIds(services.map((s) => s.homeownerId));

  const isLoading = loadingServices || loadingPools;
  const completed = [...services].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <TechLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Completed Services</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : completed.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center border border-border">
          <p className="text-muted-foreground">No completed services yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {completed.map((svc) => {
            const ho = profiles[svc.homeownerId];
            const pool = pools.find((p) => p.id === svc.poolId);
            return (
              <div key={svc.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{ho?.fullName || "Homeowner"}</p>
                    <p className="text-sm text-muted-foreground">{svc.serviceType}</p>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  {pool && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{getPoolFullAddress(pool)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{formatDateShort(svc.date)}</span>
                  </div>
                  {svc.completedTasks && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-card-foreground shrink-0" />
                      <span>{svc.completedTasks.length} tasks completed</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 hover:text-primary hover:border-primary hover:bg-transparent"
                  onClick={() => navigate(`/tech/service/${svc.id}`)}
                >
                  <FileText className="h-3.5 w-3.5" />
                  View Report
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </TechLayout>
  );
};

export default TechCompletedServices;
