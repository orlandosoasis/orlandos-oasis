import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, ChevronRight, Waves } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import TechLayout from "@/components/technician/TechLayout";
import { useAuth } from "@/contexts/AuthContext";
import { usePools } from "@/hooks/usePools";
import { useServices } from "@/hooks/useServices";
import { useProfilesByIds } from "@/hooks/useProfiles";
import { formatDateShort, getPoolFullAddress } from "@/types/tech";

const TechPoolList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: pools = [], isLoading: loadingPools } = usePools();
  const { data: services = [], isLoading: loadingServices } = useServices({ technicianId: user?.id });
  const { data: profiles = {} } = useProfilesByIds(pools.map((p) => p.homeownerId));

  const isLoading = loadingPools || loadingServices;

  return (
    <TechLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">My Assigned Pools</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : pools.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border">
          <EmptyState
            icon={Waves}
            title="No pools assigned yet"
            description="Your manager will add pools to your route soon. Check back here once you're assigned."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {pools.map((pool) => {
            const ho = profiles[pool.homeownerId];
            const poolServices = services.filter((s) => s.poolId === pool.id);
            const lastCompleted = poolServices
              .filter((s) => s.status === "completed")
              .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
            const nextScheduled = poolServices
              .filter((s) => s.status !== "completed")
              .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

            return (
              <div key={pool.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{ho?.fullName || "Homeowner"}</p>
                    <p className="text-sm text-muted-foreground">{pool.poolType}</p>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{getPoolFullAddress(pool)}</span>
                  </div>
                  {lastCompleted && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>Last service: {formatDateShort(lastCompleted.date)}</span>
                    </div>
                  )}
                  {nextScheduled && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Next: {formatDateShort(nextScheduled.date)}</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="hover:text-primary hover:border-primary hover:bg-transparent"
                  onClick={() => navigate(`/tech/pools/${pool.id}`)}
                >
                  View Pool Details
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </TechLayout>
  );
};

export default TechPoolList;
