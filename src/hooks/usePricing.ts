import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────
export interface PricingAddon {
  id: string;
  key: string;
  name: string;
  description: string | null;
  price: number;
  billing_type: "one_time" | "recurring";
  sort_order: number;
  active: boolean;
}

export interface HomeownerAddon {
  id: string;
  addon_id: string;
  homeowner_id: string;
  price_snapshot: number;
  billing_type_snapshot: "one_time" | "recurring";
  active: boolean;
  name?: string;
}

export interface PricingPoolSize {
  id: string;
  size: string;
  display_name: string;
  base_monthly_price: number;
  active: boolean;
  sort_order?: number;
}

export interface PricingFrequency {
  id: string;
  frequency: string;
  display_name: string;
  price_delta: number;
  multiplier: number;
  active: boolean;
  sort_order?: number;
}

export interface GrandfatheredSnapshot {
  snapshotted_at: string;
  pool_size: string | null;
  pool_size_price: number;
  frequency: string | null;
  frequency_delta: number;
  frequency_multiplier: number;
  addons: Array<{ addon_id: string; name: string; price: number; billing_type: string }>;
  addons_total: number;
  monthly_total: number;
}

// ─── Pricing Addons (catalog) ─────────────────────────────
export function usePricingAddons(includeInactive = false) {
  return useQuery({
    queryKey: ["pricing-addons", includeInactive],
    queryFn: async (): Promise<PricingAddon[]> => {
      let q = supabase.from("pricing_addons").select("*").order("sort_order");
      if (!includeInactive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PricingAddon[];
    },
  });
}

export function useCreatePricingAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<PricingAddon, "id" | "key" | "sort_order"> & { key?: string; sort_order?: number }) => {
      const key =
        input.key ||
        input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) ||
        `addon-${Date.now()}`;
      const { data: maxRow } = await supabase
        .from("pricing_addons")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextOrder = (maxRow?.sort_order ?? 0) + 1;
      const { error } = await supabase.from("pricing_addons").insert({
        key,
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        billing_type: input.billing_type,
        active: input.active,
        sort_order: input.sort_order ?? nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-addons"] }),
  });
}

export function useUpdatePricingAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PricingAddon> & { id: string }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("pricing_addons").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-addons"] }),
  });
}

/** Soft-delete: mark inactive */
export function useDeletePricingAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pricing_addons").update({ active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-addons"] }),
  });
}

export function useReorderPricingAddons() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, idx) =>
          supabase.from("pricing_addons").update({ sort_order: idx + 1 }).eq("id", id)
        )
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-addons"] }),
  });
}

// ─── Homeowner Addons (selections) ────────────────────────
export function useHomeownerAddons(homeownerId: string | undefined) {
  return useQuery({
    queryKey: ["homeowner-addons", homeownerId],
    enabled: !!homeownerId,
    queryFn: async (): Promise<HomeownerAddon[]> => {
      const { data, error } = await supabase
        .from("homeowner_addons")
        .select("*, pricing_addons(name)")
        .eq("homeowner_id", homeownerId!)
        .eq("active", true);
      if (error) throw error;
      type Row = {
        id: string;
        addon_id: string;
        homeowner_id: string;
        price_snapshot: number;
        billing_type_snapshot: "one_time" | "recurring";
        active: boolean;
        pricing_addons?: { name: string } | null;
      };
      return ((data as Row[]) ?? []).map((r) => ({
        id: r.id,
        addon_id: r.addon_id,
        homeowner_id: r.homeowner_id,
        price_snapshot: Number(r.price_snapshot),
        billing_type_snapshot: r.billing_type_snapshot,
        active: r.active,
        name: r.pricing_addons?.name,
      }));
    },
  });
}

export function useSetHomeownerAddons() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { homeownerId: string; addonIds: string[] }) => {
      const { error } = await supabase.rpc("set_homeowner_addons", {
        p_homeowner_id: input.homeownerId,
        p_addon_ids: input.addonIds,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["homeowner-addons", v.homeownerId] });
      qc.invalidateQueries({ queryKey: ["admin-homeowners"] });
    },
  });
}

// ─── Custom pricing + Grandfathered ───────────────────────
export interface HomeownerPricingInfo {
  use_custom_pricing: boolean;
  custom_monthly_price: number | null;
  is_grandfathered: boolean;
  grandfathered_snapshot: GrandfatheredSnapshot | null;
}

export function useHomeownerPricingInfo(homeownerId: string | undefined) {
  return useQuery({
    queryKey: ["homeowner-pricing-info", homeownerId],
    enabled: !!homeownerId,
    queryFn: async (): Promise<HomeownerPricingInfo> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("use_custom_pricing, custom_monthly_price, is_grandfathered, grandfathered_snapshot")
        .eq("id", homeownerId!)
        .maybeSingle();
      if (error) throw error;
      return {
        use_custom_pricing: !!data?.use_custom_pricing,
        custom_monthly_price:
          data?.custom_monthly_price != null ? Number(data.custom_monthly_price) : null,
        is_grandfathered: !!data?.is_grandfathered,
        grandfathered_snapshot:
          (data?.grandfathered_snapshot as GrandfatheredSnapshot | null) ?? null,
      };
    },
  });
}

export function useUpdateCustomPricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      homeownerId: string;
      useCustom: boolean;
      customPrice: number | null;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          use_custom_pricing: input.useCustom,
          custom_monthly_price: input.useCustom ? input.customPrice : null,
        })
        .eq("id", input.homeownerId);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["homeowner-pricing-info", v.homeownerId] });
      qc.invalidateQueries({ queryKey: ["admin-homeowners"] });
    },
  });
}

export function useSnapshotGrandfathered() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (homeownerId: string) => {
      const { error } = await supabase.rpc("snapshot_grandfathered_pricing", {
        p_homeowner_id: homeownerId,
      });
      if (error) throw error;
    },
    onSuccess: (_d, homeownerId) => {
      qc.invalidateQueries({ queryKey: ["homeowner-pricing-info", homeownerId] });
      qc.invalidateQueries({ queryKey: ["admin-homeowners"] });
    },
  });
}

export function useClearGrandfathered() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (homeownerId: string) => {
      const { error } = await supabase.rpc("clear_grandfathered_pricing", {
        p_homeowner_id: homeownerId,
      });
      if (error) throw error;
    },
    onSuccess: (_d, homeownerId) => {
      qc.invalidateQueries({ queryKey: ["homeowner-pricing-info", homeownerId] });
      qc.invalidateQueries({ queryKey: ["admin-homeowners"] });
    },
  });
}
