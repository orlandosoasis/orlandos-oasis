import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BellRing,
  Clock,
  CalendarClock,
  UserRoundCog,
  AlertTriangle,
  CalendarDays,
  MessageSquare,
  Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRouteIssueById, type HomeownerNotificationRow } from "@/hooks/useRouteIssues";
import { useAuth } from "@/contexts/AuthContext";

const ISSUE_LABELS: Record<string, string> = {
  sick: "Technician Sick",
  breakdown: "Vehicle Breakdown",
  late: "Running Late",
  other: "Other Issue",
};

const ACTION_LABELS: Record<string, string> = {
  notify: "Notification Only",
  delay: "Service Delayed",
  reschedule: "Service Rescheduled",
  reassign: "Technician Reassigned",
};

const ACTION_ICON: Record<string, React.ElementType> = {
  notify: BellRing,
  delay: Clock,
  reschedule: CalendarClock,
  reassign: UserRoundCog,
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const TIME_LABELS: Record<string, string> = {
  morning: "Morning (8 AM – 12 PM)",
  afternoon: "Afternoon (12 PM – 4 PM)",
  evening: "Evening (4 PM – 7 PM)",
};

interface Props {
  notification: HomeownerNotificationRow | null;
  open: boolean;
  onClose: () => void;
}

export default function RouteIssueDetailModal({ notification, open, onClose }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: issue, isLoading } = useRouteIssueById(
    open ? notification?.route_issue_id : null
  );

  // Mark as read when modal opens
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("mark_notification_read" as never, { p_id: id } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-notifications", user?.id] }),
  });

  const handleOpen = (isOpen: boolean) => {
    if (!isOpen) { onClose(); return; }
    if (notification && !notification.read_at) markRead.mutate(notification.id);
  };

  const ActionIcon = issue ? (ACTION_ICON[issue.action_taken] ?? AlertTriangle) : AlertTriangle;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            Route Issue Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !issue ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Issue details are no longer available.
          </p>
        ) : (
          <div className="space-y-4 py-1">
            {/* Status + type */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                {ISSUE_LABELS[issue.issue_type] ?? issue.issue_type}
              </Badge>
              <Badge variant="outline" className="text-sky-700 border-sky-300 bg-sky-50 flex items-center gap-1">
                <ActionIcon className="h-3 w-3" />
                {ACTION_LABELS[issue.action_taken] ?? issue.action_taken}
              </Badge>
            </div>

            {/* Reported on */}
            <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reported</p>
                <p className="text-sm font-medium mt-0.5">{fmtDateTime(issue.created_at)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Affected route date: <span className="font-medium text-foreground">{fmtDate(issue.route_date)}</span>
                </p>
              </div>
            </div>

            {/* Action details */}
            {issue.action_taken === "delay" && issue.delay_minutes != null && (
              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Delay</p>
                  <p className="text-sm font-medium mt-0.5">
                    {issue.delay_minutes >= 60
                      ? `${Math.floor(issue.delay_minutes / 60)}h ${issue.delay_minutes % 60 > 0 ? `${issue.delay_minutes % 60}m` : ""}`.trim()
                      : `${issue.delay_minutes} minutes`}
                  </p>
                </div>
              </div>
            )}

            {issue.action_taken === "reschedule" && issue.new_service_date && (
              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rescheduled to</p>
                  <p className="text-sm font-medium mt-0.5">{fmtDate(issue.new_service_date)}</p>
                  {issue.new_time_window && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {TIME_LABELS[issue.new_time_window] ?? issue.new_time_window}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Other text */}
            {issue.other_text && (
              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                <Wrench className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Details</p>
                  <p className="text-sm mt-0.5">{issue.other_text}</p>
                </div>
              </div>
            )}

            {/* Message to homeowners */}
            {issue.message_to_homeowners && (
              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message from us</p>
                  <p className="text-sm mt-0.5 leading-relaxed">{issue.message_to_homeowners}</p>
                </div>
              </div>
            )}

            {/* Status footer */}
            <p className="text-xs text-muted-foreground text-center pt-1">
              Status: <span className="font-semibold capitalize">{issue.status.replace("_", " ")}</span>
              {issue.resolved_at && ` · Resolved ${fmtDateTime(issue.resolved_at)}`}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
