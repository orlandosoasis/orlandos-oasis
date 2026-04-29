import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TechService, TechServiceStatus } from "@/types/tech";

type DbServiceStatus = TechServiceStatus | "cancelled";

type ServiceRow = {
  id: string;
  pool_id: string;
  homeowner_id: string;
  technician_id: string | null;
  service_type: string;
  hours: number;
  service_date: string; // ISO date
  time_window: "morning" | "afternoon" | "evening";
  status: DbServiceStatus;
  completed_tasks: string[] | null;
  tech_notes: string | null;
  started_at: string | null;
  completed_at: string | null;
};

function rowToService(r: ServiceRow): TechService & { technicianId: string | null } {
  return {
    id: r.id,
    poolId: r.pool_id,
    homeownerId: r.homeowner_id,
    serviceType: r.service_type,
    hours: r.hours,
    // service_date is YYYY-MM-DD; build a local Date so day-of-month doesn't shift
    date: parseDateOnly(r.service_date),
    timeWindow: r.time_window,
    status: (r.status === "cancelled" ? "scheduled" : r.status) as TechServiceStatus,
    completedTasks: r.completed_tasks ?? undefined,
    techNotes: r.tech_notes ?? undefined,
    startedAt: r.started_at
      ? new Date(r.started_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      : undefined,
    completedAt: r.completed_at
      ? new Date(r.completed_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      : undefined,
    technicianId: r.technician_id,
  };
}

function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export interface ServiceFilters {
  status?: TechServiceStatus | TechServiceStatus[];
  homeownerId?: string;
  technicianId?: string;
  poolId?: string;
}

export function useServices(filters: ServiceFilters = {}) {
  return useQuery({
    queryKey: ["services", filters],
    queryFn: async () => {
      let q = supabase.from("services").select("*").order("service_date", { ascending: true });
      if (filters.homeownerId) q = q.eq("homeowner_id", filters.homeownerId);
      if (filters.technicianId) q = q.eq("technician_id", filters.technicianId);
      if (filters.poolId) q = q.eq("pool_id", filters.poolId);
      if (filters.status) {
        q = Array.isArray(filters.status) ? q.in("status", filters.status) : q.eq("status", filters.status);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(rowToService);
    },
  });
}

export function useService(serviceId: string | undefined) {
  return useQuery({
    queryKey: ["service", serviceId],
    enabled: !!serviceId,
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("id", serviceId!).maybeSingle();
      if (error) throw error;
      return data ? rowToService(data) : null;
    },
  });
}

export interface UpdateServicePatch {
  status?: TechServiceStatus;
  completedTasks?: string[];
  techNotes?: string;
  startedAt?: Date;
  completedAt?: Date;
  serviceDate?: Date;
  timeWindow?: "morning" | "afternoon" | "evening";
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: UpdateServicePatch }) => {
      const dbPatch: {
        status?: DbServiceStatus;
        completed_tasks?: string[];
        tech_notes?: string;
        started_at?: string;
        completed_at?: string;
        service_date?: string;
        time_window?: "morning" | "afternoon" | "evening";
      } = {};
      if (patch.status !== undefined) dbPatch.status = patch.status;
      if (patch.completedTasks !== undefined) dbPatch.completed_tasks = patch.completedTasks;
      if (patch.techNotes !== undefined) dbPatch.tech_notes = patch.techNotes;
      if (patch.startedAt !== undefined) dbPatch.started_at = patch.startedAt.toISOString();
      if (patch.completedAt !== undefined) dbPatch.completed_at = patch.completedAt.toISOString();
      if (patch.serviceDate !== undefined) {
        const d = patch.serviceDate;
        dbPatch.service_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }
      if (patch.timeWindow !== undefined) dbPatch.time_window = patch.timeWindow;

      const { data, error } = await supabase.from("services").update(dbPatch).eq("id", id).select().single();
      if (error) throw error;
      return rowToService(data);
    },
    onSuccess: (svc) => {
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["service", svc.id] });
    },
  });
}
