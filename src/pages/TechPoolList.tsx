import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TechLayout from "@/components/technician/TechLayout";
import {
  POOLS,
  createTechServices,
  getHomeowner,
  getPoolFullAddress,
  formatDateShort,
} from "@/data/techMockData";

const TechPoolList = () => {
  const navigate = useNavigate();
  const services = createTechServices();

  return (
    <TechLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">My Assigned Pools</h1>

      <div className="space-y-4">
        {POOLS.map((pool) => {
          const ho = getHomeowner(pool.homeownerId);
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
                  <p className="font-semibold text-foreground">{ho?.name}</p>
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
    </TechLayout>
  );
};

export default TechPoolList;
