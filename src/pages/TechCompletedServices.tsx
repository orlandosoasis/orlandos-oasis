import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, CheckCircle2, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import TechLayout from "@/components/technician/TechLayout";
import {
  createTechServices,
  getHomeowner,
  getPool,
  getPoolFullAddress,
  formatDateShort,
} from "@/data/techMockData";

const TechCompletedServices = () => {
  const navigate = useNavigate();
  const completed = createTechServices()
    .filter((s) => s.status === "completed")
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <TechLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Completed Services</h1>

      {completed.length === 0 && (
        <div className="bg-card rounded-2xl p-8 text-center border border-border">
          <p className="text-muted-foreground">No completed services yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {completed.map((svc) => {
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
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{getPoolFullAddress(pool)}</span>
                </div>
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
    </TechLayout>
  );
};

export default TechCompletedServices;
