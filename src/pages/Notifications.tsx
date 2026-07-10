import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, UserCheck, UserX, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMyNotifications, useDismissNotification, type HomeownerNotificationRow } from "@/hooks/useRouteIssues";
import { useAuth } from "@/contexts/AuthContext";
import RouteIssueDetailModal from "@/components/RouteIssueDetailModal";
import { cn } from "@/lib/utils";

const ROUTE_KINDS = new Set(["route_notify", "route_delay", "route_reschedule", "route_reassign"]);

function fmtTime(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function NotifIcon({ kind }: { kind: string }) {
  const base = "h-5 w-5 shrink-0 mt-0.5";
  if (kind === "technician_assigned") return <UserCheck className={cn(base, "text-sky-500")} />;
  if (kind === "technician_unassigned") return <UserX className={cn(base, "text-amber-500")} />;
  if (kind === "service_completed") return <CheckCircle2 className={cn(base, "text-emerald-500")} />;
  if (ROUTE_KINDS.has(kind)) return <AlertTriangle className={cn(base, "text-amber-500")} />;
  return <Bell className={cn(base, "text-muted-foreground")} />;
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: notifs = [], isLoading } = useMyNotifications();
  const dismiss = useDismissNotification();
  const [routeModal, setRouteModal] = useState<HomeownerNotificationRow | null>(null);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("mark_notification_read" as never, { p_id: id } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-notifications", user?.id] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("mark_all_notifications_read" as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-notifications", user?.id] }),
  });

  const unread = notifs.filter((n) => !n.read_at);

  const handleClick = (n: HomeownerNotificationRow) => {
    if (ROUTE_KINDS.has(n.kind) && n.route_issue_id) {
      // Open detail modal — marking read is handled inside the modal
      setRouteModal(n);
      return;
    }
    if (!n.read_at) markRead.mutate(n.id);
    if (n.cta_route) navigate(n.cta_route);
  };

  return (
    <>
      <div className="container max-w-[760px] mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            {unread.length > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">{unread.length} unread</p>
            )}
          </div>
          {unread.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-foreground">You're all caught up</p>
            <p className="text-sm text-muted-foreground mt-1">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border border-border p-4 transition-colors cursor-pointer hover:bg-muted/50",
                  !n.read_at ? "bg-sky-50/60 border-sky-100" : "bg-card"
                )}
              >
                <NotifIcon kind={n.kind} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm leading-snug", !n.read_at ? "font-semibold" : "font-medium")}>
                      {n.title}
                    </p>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                      {fmtTime(n.created_at)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                  )}
                  {ROUTE_KINDS.has(n.kind) && n.route_issue_id && (
                    <p className="text-xs text-primary font-medium mt-1">Tap to view details →</p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss.mutate(n.id); }}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <RouteIssueDetailModal
        notification={routeModal}
        open={!!routeModal}
        onClose={() => setRouteModal(null)}
      />
    </>
  );
}
