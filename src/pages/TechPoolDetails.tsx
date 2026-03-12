import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Mail, Droplets, Wrench, Calendar, Clock, ChevronRight, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import TechLayout from "@/components/technician/TechLayout";
import {
  getPool,
  getHomeowner,
  getPoolFullAddress,
  createTechServices,
  formatDateShort,
  TIME_LABELS,
} from "@/data/techMockData";

const TechPoolDetails = () => {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const pool = getPool(poolId || "");
  const homeowner = pool ? getHomeowner(pool.homeownerId) : null;
  const services = createTechServices().filter((s) => s.poolId === poolId);

  if (!pool || !homeowner) {
    return (
      <TechLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Pool not found.</p>
          <Button onClick={() => navigate("/tech/pools")} className="mt-4">Back to Pools</Button>
        </div>
      </TechLayout>
    );
  }

  return (
    <TechLayout>
      <button
        onClick={() => navigate("/tech/pools")}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back to Pools</span>
      </button>

      {/* Homeowner Info */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-4">
        <h2 className="text-[17px] font-bold text-foreground mb-4">Homeowner Information</h2>
        <div className="space-y-2.5">
          <p className="text-sm font-semibold text-foreground">{homeowner.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span>{getPoolFullAddress(pool)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 text-primary shrink-0" />
            <span>{homeowner.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 text-primary shrink-0" />
            <span>{homeowner.email}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5 hover:text-primary hover:border-primary hover:bg-transparent"
          onClick={() => navigate("/tech/messages")}
        >
          <MessagesSquare className="h-4 w-4" />
          Message Homeowner
        </Button>
      </div>

      {/* Pool Info */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-4">
        <h2 className="text-[17px] font-bold text-foreground mb-4">Pool Information</h2>
        <div className="grid grid-cols-2 gap-3">
          <InfoChip label="Pool Type" value={pool.poolType} />
          <InfoChip label="Pool Size" value={pool.poolSize} />
          <InfoChip label="Water Type" value={pool.waterType} />
          <div className="col-span-2">
            <InfoChip label="Equipment" value={pool.equipment} />
          </div>
        </div>
      </div>

      {/* Service Schedule */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-[17px] font-bold text-foreground mb-4">Service Schedule</h2>
        <div className="space-y-3">
          {services.length === 0 && (
            <p className="text-sm text-muted-foreground">No services scheduled.</p>
          )}
          {services.sort((a, b) => a.date.getTime() - b.date.getTime()).map((svc) => (
            <div key={svc.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-medium">{formatDateShort(svc.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>{TIME_LABELS[svc.timeWindow]}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={svc.status} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary hover:bg-primary/10"
                  onClick={() => navigate(`/tech/service/${svc.id}`)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TechLayout>
  );
};

const InfoChip = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-muted rounded-lg px-3 py-2">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium text-foreground">{value}</p>
  </div>
);

export default TechPoolDetails;
