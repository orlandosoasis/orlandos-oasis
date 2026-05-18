import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/StatusBadge";
import { usePool } from "@/hooks/usePools";
import { useProfile } from "@/hooks/useProfiles";
import { useServices } from "@/hooks/useServices";
import { MapPin, Phone, Mail, Calendar, Clock } from "lucide-react";
import { formatDateShort, TIME_LABELS, getPoolFullAddress } from "@/types/tech";

export default function TechPoolDetailModal({
  poolId,
  open,
  onOpenChange,
}: {
  poolId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data: pool, isLoading: lp } = usePool(poolId ?? undefined);
  const { data: homeowner, isLoading: lh } = useProfile(pool?.homeownerId);
  const { data: services = [], isLoading: ls } = useServices({ poolId: poolId ?? undefined });
  const loading = lp || lh || ls;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pt-10 max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pool Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !pool || !homeowner ? (
          <p className="text-sm text-muted-foreground">Pool not found.</p>
        ) : (
          <div className="space-y-4">
            <section className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-bold mb-3">Homeowner</h3>
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold">{homeowner.fullName}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {getPoolFullAddress(pool)}
                </div>
                {homeowner.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary" /> {homeowner.phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 text-primary" /> {homeowner.email}
                </div>
              </div>
            </section>

            <section className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-bold mb-3">Pool Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Info label="Type" value={pool.poolType || "—"} />
                <Info label="Size" value={pool.poolSize || "—"} />
                <Info label="Water" value={pool.waterType || "—"} />
                <Info label="Access" value={pool.accessMethod || "—"} />
                <div className="col-span-2">
                  <Info label="Equipment" value={pool.equipment || "—"} />
                </div>
              </div>
            </section>

            <section className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-bold mb-3">Service Schedule ({services.length})</h3>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">No services scheduled.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {services
                    .slice()
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map((s) => (
                      <div key={s.id} className="flex items-center justify-between border-b border-border last:border-0 py-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-3.5 w-3.5 text-primary" /> {formatDateShort(s.date)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {TIME_LABELS[s.timeWindow]}
                          </div>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                    ))}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-muted rounded-md px-3 py-2">
    <p className="text-[11px] text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
);
