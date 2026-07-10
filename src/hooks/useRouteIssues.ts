import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ---------- Types ----------
export type RouteIssueRow = {
  id: string;
  issue_type: "sick" | "breakdown" | "late" | "other";
  other_text: string | null;
  reported_by_role: "admin" | "technician";
  reported_by_id: string;
  technician_id: string | null;
  route_date: string;
  scope: "all" | "specific";
  action_taken: "notify" | "delay" | "reschedule" | "reassign";
  delay_minutes: number | null;
  new_service_date: string | null;
  new_time_window: string | null;
  reassigned_to_id: string | null;
  message_to_homeowners: string;
  status: "active" | "pending_approval" | "resolved" | "cancelled";
  resolved_at: string | null;
  resolved_by_id: string | null;
  created_at: string;
  updated_at: string;
};

export type RouteIssueServiceRow = {
  id: string;
  route_issue_id: string;
  service_id: string;
  homeowner_id: string;
  previous_status: string | null;
  previous_time_window: string | null;
  previous_service_date: string | null;
  previous_technician_id: string | null;
  created_at: string;
};

export type HomeownerNotificationRow = {
  id: string;
  homeowner_id: string;
  route_issue_id: string | null;
  service_id: string | null;
  kind:
    | "route_notify"
    | "route_delay"
    | "route_reschedule"
    | "route_reassign"
    | "technician_assigned"
    | "technician_unassigned"
    | "service_completed"
    | string;
  title: string;
  body: string;
  cta_route: string | null;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
};

// ---------- Submit ----------
export interface SubmitRouteIssueArgs {
  issueType: "sick" | "breakdown" | "late" | "other";
  otherText?: string;
  technicianId?: string | null;
  routeDate?: string; // YYYY-MM-DD
  scope: "all" | "specific";
  serviceIds: string[];
  action: "notify" | "delay" | "reschedule" | "reassign";
  delayMinutes?: number;
  newServiceDate?: string;
  newTimeWindow?: string;
  reassignTo?: string | null;
  message: string;
}

export function useSubmitRouteIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: SubmitRouteIssueArgs) => {
      const { data, error } = await supabase.rpc("submit_route_issue", {
        p_issue_type: args.issueType,
        p_other_text: args.otherText ?? null,
        p_technician_id: args.technicianId ?? null,
        p_route_date: args.routeDate ?? new Date().toISOString().slice(0, 10),
        p_scope: args.scope,
        p_service_ids: args.serviceIds,
        p_action: args.action,
        p_delay_minutes: args.delayMinutes ?? 0,
        p_new_service_date: args.newServiceDate ?? null,
        p_new_time_window: args.newTimeWindow ?? null,
        p_reassign_to: args.reassignTo ?? null,
        p_message: args.message,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["route-issues"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["pools"] });
      qc.invalidateQueries({ queryKey: ["my-notifications"] });
      qc.invalidateQueries({ queryKey: ["admin-route-issues"] });
    },
  });
}

// ---------- Homeowner notifications ----------
export function useMyNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["my-notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("homeowner_notifications")
        .select("*")
        .eq("homeowner_id", user.id)
        .is("dismissed_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as HomeownerNotificationRow[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`my-notifications-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "homeowner_notifications", filter: `homeowner_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["my-notifications", user.id] });
          qc.invalidateQueries({ queryKey: ["service-route-issue"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "route_issues" },
        () => {
          qc.invalidateQueries({ queryKey: ["my-notifications", user.id] });
          qc.invalidateQueries({ queryKey: ["service-route-issue"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  return query;
}

export function useDismissNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("dismiss_homeowner_notification", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-notifications"] }),
  });
}

// ---------- Single route issue by ID ----------
export function useRouteIssueById(id?: string | null) {
  return useQuery({
    queryKey: ["route-issue", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("route_issues")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as RouteIssueRow | null;
    },
    enabled: !!id,
  });
}

// ---------- Active route issue for a service ----------
export function useServiceRouteIssue(serviceId?: string) {
  return useQuery({
    queryKey: ["service-route-issue", serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      const { data, error } = await supabase
        .from("route_issue_services")
        .select("route_issue_id, route_issues!inner(*)")
        .eq("service_id", serviceId)
        .in("route_issues.status", ["active", "pending_approval"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return (data as any).route_issues as RouteIssueRow;
    },
    enabled: !!serviceId,
  });
}

// ---------- Admin: full route issue log ----------
export type AdminRouteIssueRow = RouteIssueRow & {
  reporter_name: string | null;
  technician_name: string | null;
  reassigned_to_name: string | null;
  affected_homeowner_count: number;
  affected_service_count: number;
  affected: Array<{
    service_id: string;
    homeowner_id: string;
    homeowner_name: string | null;
    previous_status: string | null;
    previous_service_date: string | null;
    previous_time_window: string | null;
  }>;
};

export function useAdminRouteIssues() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-route-issues"],
    queryFn: async () => {
      const { data: issues, error } = await supabase
        .from("route_issues")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (issues ?? []) as RouteIssueRow[];
      if (rows.length === 0) return [] as AdminRouteIssueRow[];

      const issueIds = rows.map((r) => r.id);
      const { data: junctions } = await supabase
        .from("route_issue_services")
        .select("*")
        .in("route_issue_id", issueIds);

      const profileIds = new Set<string>();
      rows.forEach((r) => {
        if (r.reported_by_id) profileIds.add(r.reported_by_id);
        if (r.technician_id) profileIds.add(r.technician_id);
        if (r.reassigned_to_id) profileIds.add(r.reassigned_to_id);
      });
      (junctions ?? []).forEach((j: any) => profileIds.add(j.homeowner_id));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, full_name")
        .in("id", Array.from(profileIds));
      const nameOf = (id: string | null | undefined) => {
        if (!id) return null;
        const p = (profiles ?? []).find((x: any) => x.id === id);
        if (!p) return null;
        const composed = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
        return composed || p.full_name || null;
      };

      return rows.map<AdminRouteIssueRow>((r) => {
        const linked = (junctions ?? []).filter((j: any) => j.route_issue_id === r.id);
        return {
          ...r,
          reporter_name: nameOf(r.reported_by_id),
          technician_name: nameOf(r.technician_id),
          reassigned_to_name: nameOf(r.reassigned_to_id),
          affected_homeowner_count: new Set(linked.map((j: any) => j.homeowner_id)).size,
          affected_service_count: linked.length,
          affected: linked.map((j: any) => ({
            service_id: j.service_id,
            homeowner_id: j.homeowner_id,
            homeowner_name: nameOf(j.homeowner_id),
            previous_status: j.previous_status,
            previous_service_date: j.previous_service_date,
            previous_time_window: j.previous_time_window,
          })),
        };
      });
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`admin-route-issues-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "route_issues" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-route-issues"] })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "route_issue_services" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-route-issues"] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

export function useResolveRouteIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "resolved" | "cancelled" }) => {
      const { data, error } = await supabase.rpc("resolve_route_issue", { p_id: id, p_status: status });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-route-issues"] });
      qc.invalidateQueries({ queryKey: ["service-route-issue"] });
      qc.invalidateQueries({ queryKey: ["my-notifications"] });
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

// ---------- Route issue activity log ----------
export type RouteIssueEventRow = {
  id: string;
  route_issue_id: string;
  event_type: "created" | "service_affected" | "service_updated" | "notification_sent" | "status_changed" | "reschedule_approved";
  actor_id: string | null;
  actor_role: string | null;
  service_id: string | null;
  homeowner_id: string | null;
  notification_id: string | null;
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
  actor_name?: string | null;
  homeowner_name?: string | null;
};

export function useRouteIssueEvents(issueId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["route-issue-events", issueId],
    queryFn: async () => {
      if (!issueId) return [] as RouteIssueEventRow[];
      const { data, error } = await supabase
        .from("route_issue_events")
        .select("*")
        .eq("route_issue_id", issueId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as RouteIssueEventRow[];

      const ids = new Set<string>();
      rows.forEach((r) => {
        if (r.actor_id) ids.add(r.actor_id);
        if (r.homeowner_id) ids.add(r.homeowner_id);
      });
      if (ids.size === 0) return rows;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, full_name")
        .in("id", Array.from(ids));
      const nameOf = (id: string | null) => {
        if (!id) return null;
        const p = (profiles ?? []).find((x: any) => x.id === id);
        if (!p) return null;
        const composed = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
        return composed || p.full_name || null;
      };
      return rows.map((r) => ({ ...r, actor_name: nameOf(r.actor_id), homeowner_name: nameOf(r.homeowner_id) }));
    },
    enabled: !!issueId,
  });

  useEffect(() => {
    if (!issueId) return;
    const channel = supabase
      .channel(`route-issue-events-${issueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "route_issue_events", filter: `route_issue_id=eq.${issueId}` },
        () => qc.invalidateQueries({ queryKey: ["route-issue-events", issueId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [issueId, qc]);

  return query;
}
