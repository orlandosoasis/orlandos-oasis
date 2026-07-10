import { useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useMyNotifications, type HomeownerNotificationRow } from "@/hooks/useRouteIssues";
import { useAuth } from "@/contexts/AuthContext";
import RouteIssueDetailModal from "@/components/RouteIssueDetailModal";
import { cn } from "@/lib/utils";

const ROUTE_KINDS = new Set(["route_notify", "route_delay", "route_reschedule", "route_reassign"]);

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HomeownerNotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: notifs = [] } = useMyNotifications();
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

  const unread = notifs.filter((n: any) => !n.read_at);
  const unreadCount = unread.length;

  const handleClick = (n: HomeownerNotificationRow) => {
    if (ROUTE_KINDS.has(n.kind) && n.route_issue_id) {
      setRouteModal(n);
      return;
    }
    if (!n.read_at) markRead.mutate(n.id);
    if (n.cta_route) navigate(n.cta_route);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full h-9 w-9"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between px-4 py-3">
            <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-80 overflow-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                You're all caught up.
              </div>
            ) : (
              notifs.slice(0, 5).map((n: HomeownerNotificationRow) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors",
                    !n.read_at && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      {!n.read_at && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                      {n.title}
                    </p>
                  </div>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-1 ml-4">{n.body}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-2 ml-4">
                    {fmtDateTime(n.created_at)}
                  </p>
                </button>
              ))
            )}
          </div>
          <DropdownMenuSeparator />
          <button
            onClick={() => navigate("/notifications")}
            className="w-full text-center text-xs font-medium text-primary hover:underline py-3"
          >
            View all notifications
          </button>
        </DropdownMenuContent>
      </DropdownMenu>

      <RouteIssueDetailModal
        notification={routeModal}
        open={!!routeModal}
        onClose={() => setRouteModal(null)}
      />
    </>
  );
}
