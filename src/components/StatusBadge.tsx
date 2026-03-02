import { Clock, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ServiceStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; icon: typeof Clock; bgClass: string; textClass: string }
> = {
  scheduled: {
    label: "Scheduled",
    icon: Clock,
    bgClass: "bg-primary/90",
    textClass: "text-primary-foreground",
  },
  in_progress: {
    label: "In Progress",
    icon: Loader2,
    bgClass: "bg-amber-500/90",
    textClass: "text-white",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    bgClass: "bg-green-500/90",
    textClass: "text-white",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
  },
};

interface StatusBadgeProps {
  status: ServiceStatus;
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg shadow-sm",
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {config.label}
    </span>
  );
};

export default StatusBadge;
