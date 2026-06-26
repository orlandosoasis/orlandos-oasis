import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useTechNotifications, useDismissTechNotification } from "@/hooks/useTechNotifications";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function TechNotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: notifs = [] } = useTechNotifications(user?.id);
  const dismiss = useDismissTechNotification();
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (notifs.length === 0) return;
    // Toast on newly arrived notifications (skip first render fill).
    if (seenIds.current.size === 0) {
      notifs.forEach(n => seenIds.current.add(n.id));
      return;
    }
    for (const n of notifs) {
      if (!seenIds.current.has(n.id)) {
        seenIds.current.add(n.id);
        toast(n.title, { description: n.body || undefined });
      }
    }
  }, [notifs]);

  const count = notifs.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
              {count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="px-4 py-3">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-auto">
          {count === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">You're all caught up.</div>
          ) : notifs.map(n => (
            <div key={n.id} className="px-4 py-3 border-b border-border last:border-0">
              <div className="flex justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                <button className="text-[11px] text-muted-foreground hover:text-foreground" onClick={() => dismiss.mutate(n.id)}>
                  Dismiss
                </button>
              </div>
              {n.body && <p className="text-xs text-muted-foreground mt-1">{n.body}</p>}
              <div className="flex justify-between items-center mt-2">
                <span className="text-[11px] text-muted-foreground">{fmtDateTime(n.created_at)}</span>
                {n.cta_route && (
                  <button className="text-[11px] font-medium text-primary hover:underline"
                    onClick={() => navigate(n.cta_route!)}>View</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
