import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Admin Notes ───────────────────────────────────────────
export type AdminNoteTarget = "technician" | "homeowner" | "pool";

export interface AdminNote {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export function useAdminNotes(targetType: AdminNoteTarget, targetId: string | undefined) {
  return useQuery({
    queryKey: ["admin-notes", targetType, targetId],
    enabled: !!targetId,
    queryFn: async (): Promise<AdminNote[]> => {
      const { data, error } = await supabase
        .from("admin_notes")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const authorIds = [...new Set((data ?? []).map((n) => n.author_id))];
      const { data: authors } = authorIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", authorIds)
        : { data: [] as { id: string; full_name: string | null; email: string }[] };
      const nameOf = (id: string) => {
        const a = authors?.find((x) => x.id === id);
        return a?.full_name || a?.email || "Admin";
      };
      return (data ?? []).map((n) => ({
        id: n.id,
        body: n.body,
        authorId: n.author_id,
        authorName: nameOf(n.author_id),
        createdAt: n.created_at,
      }));
    },
  });
}

export function useAddAdminNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { targetType: AdminNoteTarget; targetId: string; body: string; authorId: string }) => {
      const { error } = await supabase.from("admin_notes").insert({
        target_type: input.targetType,
        target_id: input.targetId,
        body: input.body,
        author_id: input.authorId,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["admin-notes", vars.targetType, vars.targetId] }),
  });
}

export function useDeleteAdminNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; targetType: AdminNoteTarget; targetId: string }) => {
      const { error } = await supabase.from("admin_notes").delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["admin-notes", vars.targetType, vars.targetId] }),
  });
}

// ─── Technician's pools (admin view) ────────────────────────
export interface TechAssignedPool {
  id: string;
  address: string;
  homeownerName: string;
  homeownerId: string;
}

export function useTechnicianPools(technicianId: string | undefined) {
  return useQuery({
    queryKey: ["technician-pools", technicianId],
    enabled: !!technicianId,
    queryFn: async (): Promise<TechAssignedPool[]> => {
      const { data: pools, error } = await supabase
        .from("pools")
        .select("id, address, homeowner_id")
        .eq("assigned_technician_id", technicianId!);
      if (error) throw error;
      const ownerIds = [...new Set((pools ?? []).map((p) => p.homeowner_id))];
      const { data: owners } = ownerIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds)
        : { data: [] as { id: string; full_name: string | null; email: string }[] };
      return (pools ?? []).map((p) => {
        const o = owners?.find((x) => x.id === p.homeowner_id);
        return {
          id: p.id,
          address: p.address,
          homeownerId: p.homeowner_id,
          homeownerName: o?.full_name || o?.email || "Unknown",
        };
      });
    },
  });
}

export function useUnassignedPools() {
  return useQuery({
    queryKey: ["pools-unassigned"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pools")
        .select("id, address, homeowner_id, assigned_technician_id");
      if (error) throw error;
      const ownerIds = [...new Set((data ?? []).map((p) => p.homeowner_id))];
      const { data: owners } = ownerIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds)
        : { data: [] as { id: string; full_name: string | null; email: string }[] };
      return (data ?? []).map((p) => {
        const o = owners?.find((x) => x.id === p.homeowner_id);
        return {
          id: p.id,
          address: p.address,
          homeownerId: p.homeowner_id,
          assignedTechId: p.assigned_technician_id as string | null,
          homeownerName: o?.full_name || o?.email || "Unknown",
        };
      });
    },
  });
}

export function useAssignPoolToTech() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { poolId: string; technicianId: string | null }) => {
      const { error } = await supabase
        .from("pools")
        .update({ assigned_technician_id: input.technicianId })
        .eq("id", input.poolId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technician-pools"] });
      qc.invalidateQueries({ queryKey: ["pools-unassigned"] });
      qc.invalidateQueries({ queryKey: ["admin-homeowners"] });
    },
  });
}

/**
 * Admin helper: assign a technician to a homeowner who hasn't completed onboarding
 * yet (no pool record). Creates a minimal pool row from the homeowner's profile
 * address and assigns the technician in one step.
 */
export function useAssignTechToHomeowner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { homeownerId: string; technicianId: string | null }) => {
      // Look for an existing pool first
      const { data: existing, error: poolErr } = await supabase
        .from("pools")
        .select("id")
        .eq("homeowner_id", input.homeownerId)
        .limit(1)
        .maybeSingle();
      if (poolErr) throw poolErr;

      let poolId = existing?.id as string | undefined;

      if (!poolId) {
        // Pull homeowner address to seed the pool
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("street_address, city, state, zip_code")
          .eq("id", input.homeownerId)
          .single();
        if (profErr) throw profErr;

        const { data: created, error: insErr } = await supabase
          .from("pools")
          .insert({
            homeowner_id: input.homeownerId,
            address: profile?.street_address || "Address pending",
            city: profile?.city ?? null,
            state: profile?.state ?? null,
            zip: profile?.zip_code ?? null,
            assigned_technician_id: input.technicianId,
          })
          .select("id")
          .single();
        if (insErr) throw insErr;
        poolId = created.id;
      } else {
        const { error: updErr } = await supabase
          .from("pools")
          .update({ assigned_technician_id: input.technicianId })
          .eq("id", poolId);
        if (updErr) throw updErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technician-pools"] });
      qc.invalidateQueries({ queryKey: ["pools-unassigned"] });
      qc.invalidateQueries({ queryKey: ["admin-homeowners"] });
    },
  });
}

// ─── Tech → Homeowner messages grouped per pool ─────────────
export interface TechUpdateThread {
  poolId: string | null;
  poolAddress: string;
  homeownerName: string;
  messages: { id: string; body: string; createdAt: string; fromTech: boolean }[];
}

export function useTechClientMessages(technicianId: string | undefined) {
  return useQuery({
    queryKey: ["tech-client-messages", technicianId],
    enabled: !!technicianId,
    queryFn: async (): Promise<TechUpdateThread[]> => {
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${technicianId},recipient_id.eq.${technicianId}`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const otherIds = [
        ...new Set(
          (messages ?? []).map((m) => (m.sender_id === technicianId ? m.recipient_id : m.sender_id))
        ),
      ];
      const poolIds = [
        ...new Set((messages ?? []).map((m) => (m as { pool_id?: string | null }).pool_id).filter(Boolean) as string[]),
      ];
      const [{ data: profiles }, { data: pools }] = await Promise.all([
        otherIds.length
          ? supabase.from("profiles").select("id, full_name, email, role").in("id", otherIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string; role: string }[] }),
        poolIds.length
          ? supabase.from("pools").select("id, address").in("id", poolIds)
          : Promise.resolve({ data: [] as { id: string; address: string }[] }),
      ]);
      // Only homeowner conversations
      const homeownerIds = new Set((profiles ?? []).filter((p) => p.role === "homeowner").map((p) => p.id));
      const groups = new Map<string, TechUpdateThread>();
      for (const m of messages ?? []) {
        const otherId = m.sender_id === technicianId ? m.recipient_id : m.sender_id;
        if (!homeownerIds.has(otherId)) continue;
        const poolId = (m as { pool_id?: string | null }).pool_id ?? null;
        const key = `${otherId}:${poolId ?? "general"}`;
        if (!groups.has(key)) {
          const owner = profiles?.find((p) => p.id === otherId);
          const pool = poolId ? pools?.find((p) => p.id === poolId) : null;
          groups.set(key, {
            poolId,
            poolAddress: pool?.address ?? "General messages",
            homeownerName: owner?.full_name || owner?.email || "Homeowner",
            messages: [],
          });
        }
        groups.get(key)!.messages.push({
          id: m.id,
          body: m.body,
          createdAt: m.created_at,
          fromTech: m.sender_id === technicianId,
        });
      }
      return [...groups.values()];
    },
  });
}

// ─── Service requests (per homeowner) ───────────────────────
export interface ServiceRequest {
  id: string;
  homeownerId: string;
  poolId: string | null;
  requestType: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "cancelled";
  createdAt: string;
  resolvedAt: string | null;
  adminNotes: string | null;
}

export function useHomeownerServiceRequests(homeownerId: string | undefined) {
  return useQuery({
    queryKey: ["service-requests", homeownerId],
    enabled: !!homeownerId,
    queryFn: async (): Promise<ServiceRequest[]> => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("homeowner_id", homeownerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        homeownerId: r.homeowner_id,
        poolId: r.pool_id,
        requestType: r.request_type,
        description: r.description,
        status: r.status as ServiceRequest["status"],
        createdAt: r.created_at,
        resolvedAt: r.resolved_at,
        adminNotes: r.admin_notes,
      }));
    },
  });
}

export function useUpdateServiceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status?: ServiceRequest["status"];
      adminNotes?: string | null;
    }) => {
      const patch: { status?: ServiceRequest["status"]; admin_notes?: string | null; resolved_at?: string } = {};
      if (input.status !== undefined) {
        patch.status = input.status;
        if (input.status === "resolved") patch.resolved_at = new Date().toISOString();
      }
      if (input.adminNotes !== undefined) patch.admin_notes = input.adminNotes;
      const { error } = await supabase.from("service_requests").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-requests"] }),
  });
}

// ─── Past service detail (messages + photos) ────────────────
export interface PastServiceDetail {
  service: {
    id: string;
    serviceType: string;
    serviceDate: string;
    completedAt: string | null;
    techNotes: string | null;
    homeownerId: string;
    technicianId: string | null;
    poolId: string;
  };
  messages: { id: string; body: string; createdAt: string; senderName: string; senderRole: string }[];
  photos: { id: string; url: string; type: string }[];
}

export function usePastServiceDetail(serviceId: string | undefined) {
  return useQuery({
    queryKey: ["past-service-detail", serviceId],
    enabled: !!serviceId,
    queryFn: async (): Promise<PastServiceDetail | null> => {
      const { data: svc, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId!)
        .maybeSingle();
      if (error) throw error;
      if (!svc) return null;

      const participantIds = [svc.homeowner_id, svc.technician_id].filter(Boolean) as string[];

      const [{ data: msgs }, { data: photos }, { data: profiles }] = await Promise.all([
        participantIds.length === 2
          ? supabase
              .from("messages")
              .select("*")
              .or(
                `and(sender_id.eq.${participantIds[0]},recipient_id.eq.${participantIds[1]}),and(sender_id.eq.${participantIds[1]},recipient_id.eq.${participantIds[0]})`
              )
              .order("created_at", { ascending: true })
          : Promise.resolve({ data: [] as { id: string; sender_id: string; body: string; created_at: string }[] }),
        supabase.from("service_photos").select("*").eq("service_id", serviceId!),
        participantIds.length
          ? supabase.from("profiles").select("id, full_name, email, role").in("id", participantIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string; role: string }[] }),
      ]);

      const senderInfo = (id: string) => {
        const p = profiles?.find((x) => x.id === id);
        return { name: p?.full_name || p?.email || "Unknown", role: p?.role || "" };
      };

      const photoEntries = await Promise.all(
        (photos ?? []).map(async (p) => {
          const { data } = await supabase.storage
            .from("service-photos")
            .createSignedUrl(p.storage_path, 3600);
          return { id: p.id, url: data?.signedUrl ?? "", type: p.photo_type };
        })
      );

      return {
        service: {
          id: svc.id,
          serviceType: svc.service_type,
          serviceDate: svc.service_date,
          completedAt: svc.completed_at,
          techNotes: svc.tech_notes,
          homeownerId: svc.homeowner_id,
          technicianId: svc.technician_id,
          poolId: svc.pool_id,
        },
        messages: (msgs ?? []).map((m) => {
          const info = senderInfo(m.sender_id);
          return {
            id: m.id,
            body: m.body,
            createdAt: m.created_at,
            senderName: info.name,
            senderRole: info.role,
          };
        }),
        photos: photoEntries,
      };
    },
  });
}

// ─── Homeowner billing/contract update ──────────────────────
export function useUpdateHomeownerBilling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      homeownerId: string;
      monthlyAmount?: number | null;
      contractStartDate?: string | null;
      contractLocked?: boolean;
    }) => {
      const patch: { monthly_amount?: number | null; contract_start_date?: string | null; contract_locked?: boolean } = {};
      if (input.monthlyAmount !== undefined) patch.monthly_amount = input.monthlyAmount;
      if (input.contractStartDate !== undefined) patch.contract_start_date = input.contractStartDate;
      if (input.contractLocked !== undefined) patch.contract_locked = input.contractLocked;
      const { error } = await supabase.from("profiles").update(patch).eq("id", input.homeownerId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-homeowners"] });
      qc.invalidateQueries({ queryKey: ["homeowner-billing"] });
    },
  });
}

export function useHomeownerBilling(homeownerId: string | undefined) {
  return useQuery({
    queryKey: ["homeowner-billing", homeownerId],
    enabled: !!homeownerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("monthly_amount, contract_start_date, contract_locked")
        .eq("id", homeownerId!)
        .maybeSingle();
      if (error) throw error;
      return {
        monthlyAmount: (data?.monthly_amount as number | null) ?? null,
        contractStartDate: (data?.contract_start_date as string | null) ?? null,
        contractLocked: !!data?.contract_locked,
      };
    },
  });
}
