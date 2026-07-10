import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Custom services (per-homeowner, admin-created) ─────────────────────────

export interface HomeownerCustomService {
  id: string;
  homeownerId: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
  createdAt: string;
}

function rowToCustomService(r: Record<string, unknown>): HomeownerCustomService {
  return {
    id: r.id as string,
    homeownerId: r.homeowner_id as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    price: Number(r.price),
    active: r.active as boolean,
    createdAt: r.created_at as string,
  };
}

export function useHomeownerCustomServices(homeownerId: string | undefined) {
  return useQuery({
    queryKey: ["homeowner-custom-services", homeownerId],
    enabled: !!homeownerId,
    queryFn: async (): Promise<HomeownerCustomService[]> => {
      const { data, error } = await (supabase.from("homeowner_custom_services" as never) as any)
        .select("*")
        .eq("homeowner_id", homeownerId!)
        .order("created_at");
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(rowToCustomService);
    },
  });
}

export function useCreateHomeownerCustomService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      homeownerId: string;
      name: string;
      description?: string;
      price: number;
      active?: boolean;
    }) => {
      const { error } = await (supabase.from("homeowner_custom_services" as never) as any).insert({
        homeowner_id: input.homeownerId,
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        active: input.active ?? true,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["homeowner-custom-services", v.homeownerId] });
    },
  });
}

export function useUpdateHomeownerCustomService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      homeownerId: string;
      name?: string;
      description?: string | null;
      price?: number;
      active?: boolean;
    }) => {
      const { id, homeownerId: _ho, ...patch } = input;
      const { error } = await (supabase.from("homeowner_custom_services" as never) as any)
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["homeowner-custom-services", v.homeownerId] });
    },
  });
}

export function useDeleteHomeownerCustomService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, homeownerId }: { id: string; homeownerId: string }) => {
      const { error } = await (supabase.from("homeowner_custom_services" as never) as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["homeowner-custom-services", v.homeownerId] });
    },
  });
}

// ─── Per-homeowner add-on management ────────────────────────────────────────

export function useAddHomeownerAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      homeownerId: string;
      addonId: string;
      price: number;
      billingType: "one_time" | "recurring";
    }) => {
      // Try update first (re-activate if previously deactivated)
      const { data: existing } = await supabase
        .from("homeowner_addons")
        .select("id")
        .eq("homeowner_id", input.homeownerId)
        .eq("addon_id", input.addonId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("homeowner_addons")
          .update({
            active: true,
            price_snapshot: input.price,
            billing_type_snapshot: input.billingType,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("homeowner_addons").insert({
          homeowner_id: input.homeownerId,
          addon_id: input.addonId,
          price_snapshot: input.price,
          billing_type_snapshot: input.billingType,
          active: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["homeowner-addons", v.homeownerId] });
      qc.invalidateQueries({ queryKey: ["admin-homeowners"] });
    },
  });
}

export function useRemoveHomeownerAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ homeownerId, addonId }: { homeownerId: string; addonId: string }) => {
      const { error } = await supabase
        .from("homeowner_addons")
        .update({ active: false })
        .eq("homeowner_id", homeownerId)
        .eq("addon_id", addonId);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["homeowner-addons", v.homeownerId] });
      qc.invalidateQueries({ queryKey: ["admin-homeowners"] });
    },
  });
}

export function useUpdateHomeownerAddonPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      homeownerId,
      addonId,
      price,
    }: {
      homeownerId: string;
      addonId: string;
      price: number;
    }) => {
      const { error } = await supabase
        .from("homeowner_addons")
        .update({ price_snapshot: price })
        .eq("homeowner_id", homeownerId)
        .eq("addon_id", addonId)
        .eq("active", true);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["homeowner-addons", v.homeownerId] });
    },
  });
}

// ─── Admin book one-time catalog service with custom price ───────────────────

export function useAdminBookCatalogService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      homeownerId: string;
      poolId: string;
      serviceName: string;
      serviceDate: string;
      timeWindow: "morning" | "afternoon" | "evening";
      price: number;
      durationHours: number;
    }) => {
      const { error } = await supabase.from("services").insert({
        homeowner_id: input.homeownerId,
        pool_id: input.poolId,
        service_type: input.serviceName,
        service_date: input.serviceDate,
        time_window: input.timeWindow,
        base_price: input.price,
        computed_price: input.price,
        hours: input.durationHours,
        status: "scheduled",
        addon_ids: [],
        custom_charges: {},
        delay_minutes: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}
