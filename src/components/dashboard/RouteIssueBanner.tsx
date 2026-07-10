import { useState } from "react";
import { AlertTriangle, X, Clock, CalendarClock, UserRoundCog, BellRing } from "lucide-react";
import { useMyNotifications, useDismissNotification, type HomeownerNotificationRow } from "@/hooks/useRouteIssues";
import RouteIssueDetailModal from "@/components/RouteIssueDetailModal";

const ROUTE_KINDS = new Set(["route_notify", "route_delay", "route_reschedule", "route_reassign"]);

const ICON: Record<string, any> = {
  route_notify: BellRing,
  route_delay: Clock,
  route_reschedule: CalendarClock,
  route_reassign: UserRoundCog,
};

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today at ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} • ${time}`;
};

const RouteIssueBanner = () => {
  const { data: notifications = [] } = useMyNotifications();
  const dismiss = useDismissNotification();
  const [selected, setSelected] = useState<HomeownerNotificationRow | null>(null);

  const routeNotifs = notifications.filter((n) => ROUTE_KINDS.has(n.kind));
  if (!routeNotifs.length) return null;

  return (
    <>
      <div className="space-y-2 mb-6">
        {routeNotifs.map((n) => {
          const Icon = ICON[n.kind] ?? AlertTriangle;
          return (
            <div
              key={n.id}
              className="relative flex gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4"
            >
              <Icon className="h-6 w-6 shrink-0 text-primary" />
              <div className="flex-1 min-w-0 pr-6">
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                {n.body && (
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">Reported {formatWhen(n.created_at)}</span>
                  {n.route_issue_id && (
                    <button
                      onClick={() => setSelected(n)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => dismiss.mutate(n.id)}
                className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <RouteIssueDetailModal
        notification={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
};

export default RouteIssueBanner;
