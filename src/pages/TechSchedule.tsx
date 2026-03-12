import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TechLayout from "@/components/technician/TechLayout";
import {
  createTechServices,
  getHomeowner,
  getPool,
  getPoolFullAddress,
  formatDateFull,
  TIME_LABELS,
  FULL_DAYS,
  SHORT_MONTHS,
} from "@/data/techMockData";

const TechSchedule = () => {
  const navigate = useNavigate();
  const services = createTechServices()
    .filter((s) => s.status !== "completed")
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group by date
  const grouped: { dateStr: string; date: Date; items: typeof services }[] = [];
  services.forEach((svc) => {
    const dateStr = svc.date.toDateString();
    const existing = grouped.find((g) => g.dateStr === dateStr);
    if (existing) {
      existing.items.push(svc);
    } else {
      grouped.push({ dateStr, date: svc.date, items: [svc] });
    }
  });

  return (
    <TechLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">My Schedule</h1>

      {grouped.length === 0 && (
        <div className="bg-card rounded-2xl p-8 text-center border border-border">
          <p className="text-muted-foreground">No scheduled services.</p>
        </div>
      )}

      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.dateStr}>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-primary/10 rounded-lg px-3 py-1.5">
                <p className="text-sm font-bold text-primary">
                  {FULL_DAYS[group.date.getDay()]}, {SHORT_MONTHS[group.date.getMonth()]} {group.date.getDate()}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {group.items.map((svc) => {
                const ho = getHomeowner(svc.homeownerId);
                const pool = getPool(svc.poolId);
                if (!ho || !pool) return null;
                return (
                  <div key={svc.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center justify-between">
                    <div className="space-y-1.5">
                      <p className="font-semibold text-foreground">{ho.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{getPoolFullAddress(pool)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{TIME_LABELS[svc.timeWindow]}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => navigate(`/tech/service/${svc.id}`)}
                    >
                      View Service
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </TechLayout>
  );
};

export default TechSchedule;
