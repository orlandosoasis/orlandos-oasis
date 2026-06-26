import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DayOffStatus = "pending" | "approved" | "denied" | "cancelled";
export type DayOffAction = "reassign" | "unassigned" | "reschedule" | "notify_only";

export interface DayOffRequest {
  id: string;
  technician_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: DayOffStatus;
  resolution_action: DayOffAction | null;
  decided_by_id: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
  updated_at: string;
  technician_name?: string;
  technician_email?: string;
}

export interface DayOffEvent {
  id: string;
  request_id: string;
  event_type: string;
  actor_id: string | null;
  actor_role: string | null;
  summary: string;
  details: Record<string, unknown> | null;
  created_at: string;
  actor_name?: string;
}

export interface DayOffImpact {
  affected_services: Array<{
    service_id: string;
    service_date: string;
    service_type: string;
    status: string;
    homeowner_id: string;
    homeowner_name: string;
    address: string | null;
  }>;
  affected_homeowner_count: number;
  days: number;
}

// ---------- Lists ----------
export function useMyDayOffRequests(technicianId: string | undefined) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["day-off-requests", "mine", technicianId],
    enabled: !!technicianId,
    queryFn: async (): Promise<DayOffRequest[]> => {
      const { data, error } = await supabase
        .from("day_off_requests")
        .select("*")
        .eq("technician_id", technicianId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DayOffRequest[];
    },
  });

  useEffect(() => {
    if (!technicianId) return;
    const ch = supabase
      .channel(`day-off-mine-${technicianId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "day_off_requests", filter: `technician_id=eq.${technicianId}` },
        () => qc.invalidateQueries({ queryKey: ["day-off-requests", "mine", technicianId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [technicianId, qc]);

  return q;
}

export function useAllDayOffRequests() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["day-off-requests", "all"],
    queryFn: async (): Promise<DayOffRequest[]> => {
      const { data, error } = await supabase
        .from("day_off_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const techIds = [...new Set((data ?? []).map(r => r.technician_id))];
      const { data: techs } = techIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", techIds)
        : { data: [] as { id: string; full_name: string | null; email: string }[] };
      return (data ?? []).map(r => {
        const t = techs?.find(x => x.id === r.technician_id);
        return { ...r, technician_name: t?.full_name || t?.email || "Technician", technician_email: t?.email } as DayOffRequest;
      });
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("day-off-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "day_off_requests" },
        () => qc.invalidateQueries({ queryKey: ["day-off-requests", "all"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return q;
}

export function useDayOffRequest(id: string | undefined) {
  return useQuery({
    queryKey: ["day-off-request", id],
    enabled: !!id,
    queryFn: async (): Promise<DayOffRequest | null> => {
      const { data, error } = await supabase
        .from("day_off_requests").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: tech } = await supabase.from("profiles").select("full_name, email").eq("id", data.technician_id).maybeSingle();
      return { ...data, technician_name: tech?.full_name || tech?.email || "Technician", technician_email: tech?.email } as DayOffRequest;
    },
  });
}

export function useDayOffEvents(requestId: string | undefined) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["day-off-events", requestId],
    enabled: !!requestId,
    queryFn: async (): Promise<DayOffEvent[]> => {
      const { data, error } = await supabase
        .from("day_off_request_events")
        .select("*")
        .eq("request_id", requestId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const actorIds = [...new Set((data ?? []).map(e => e.actor_id).filter(Boolean) as string[])];
      const { data: actors } = actorIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", actorIds)
        : { data: [] as { id: string; full_name: string | null; email: string }[] };
      return (data ?? []).map(e => {
        const a = actors?.find(x => x.id === e.actor_id);
        return { ...e, actor_name: a?.full_name || a?.email || (e.actor_role ?? "System") } as DayOffEvent;
      });
    },
  });

  useEffect(() => {
    if (!requestId) return;
    const ch = supabase
      .channel(`day-off-events-${requestId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "day_off_request_events", filter: `request_id=eq.${requestId}` },
        () => qc.invalidateQueries({ queryKey: ["day-off-events", requestId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [requestId, qc]);

  return q;
}

export function useDayOffImpact(requestId: string | undefined) {
  return useQuery({
    queryKey: ["day-off-impact", requestId],
    enabled: !!requestId,
    queryFn: async (): Promise<DayOffImpact> => {
      const { data, error } = await supabase.rpc("preview_day_off_impact", { p_id: requestId! });
      if (error) throw error;
      return data as unknown as DayOffImpact;
    },
  });
}

// ---------- Mutations ----------
export function useSubmitDayOffRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { startDate: string; endDate: string; reason: string }) => {
      const { data, error } = await supabase.rpc("submit_day_off_request", {
        p_start: args.startDate, p_end: args.endDate, p_reason: args.reason,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["day-off-requests"] }),
  });
}

export function useCancelDayOffRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("cancel_day_off_request", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["day-off-requests"] }),
  });
}

export function useApproveDayOffRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string; action: DayOffAction;
      reassignTo?: string | null; rescheduleTo?: string | null; message?: string;
    }) => {
      const { error } = await supabase.rpc("approve_day_off_request", {
        p_id: args.id,
        p_action: args.action,
        p_reassign_to: args.reassignTo ?? null,
        p_reschedule_to: args.rescheduleTo ?? null,
        p_message: args.message ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["day-off-requests"] });
      qc.invalidateQueries({ queryKey: ["day-off-request", vars.id] });
      qc.invalidateQueries({ queryKey: ["day-off-events", vars.id] });
      qc.invalidateQueries({ queryKey: ["day-off-impact", vars.id] });
    },
  });
}

export function useDenyDayOffRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; reason?: string }) => {
      const { error } = await supabase.rpc("deny_day_off_request", { p_id: args.id, p_reason: args.reason ?? null });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["day-off-requests"] });
      qc.invalidateQueries({ queryKey: ["day-off-request", vars.id] });
      qc.invalidateQueries({ queryKey: ["day-off-events", vars.id] });
    },
  });
}

// ---------- Unavailability helpers ----------
export function useUnavailableTechIds(date: string | undefined) {
  return useQuery({
    queryKey: ["tech-unavailable", date],
    enabled: !!date,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("technician_unavailability").select("technician_id").eq("date", date!);
      if (error) throw error;
      return new Set((data ?? []).map(r => r.technician_id));
    },
  });
}
