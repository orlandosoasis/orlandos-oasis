import { Clock, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ServiceStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "reschedule_requested" | "technician_to_be_assigned";

const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; icon: typeof Clock; bgClass: string; textClass: string; borderClass?: string }
> = {
  scheduled: {
    label: "Scheduled",
    icon: Clock,
    bgClass: "bg-[#DBECFF]",
    textClass: "text-[#05204a]",
    borderClass: "border border-[#C5DFFA]",
  },
  in_progress: {
    label: "Ongoing",
    icon: Loader2,
    bgClass: "bg-[#FFF4DB]",
    textClass: "text-[#4a3505]",
    borderClass: "border border-[#FAE5C5]",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    bgClass: "bg-[#DBFBE5]",
    textClass: "text-[#054a20]",
    borderClass: "border border-[#C5FAD5]",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    bgClass: "bg-[#FFE0E0]",
    textClass: "text-[#4a0505]",
    borderClass: "border border-[#FAC5C5]",
  },
  reschedule_requested: {
    label: "Reschedule Requested",
    icon: Clock,
    bgClass: "bg-[#FFF4DB]",
    textClass: "text-[#4a3505]",
    borderClass: "border border-[#FAE5C5]",
  },
  technician_to_be_assigned: {
    label: "Technician Pending",
    icon: Clock,
    bgClass: "bg-[#F1F5F9]",
    textClass: "text-[#475569]",
    borderClass: "border border-[#E2E8F0]",
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
        "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm",
        config.bgClass,
        config.textClass,
        config.borderClass,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

export default StatusBadge;
