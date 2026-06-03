import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ─────────────────────────────────────────────────
export interface PricingPoolSize {
  id: string;
  size: string;
  displayName: string;
  basePrice: number;
  sortOrder: number;
  active: boolean;
}
export interface PricingFrequency {
  id: string;
  frequency: string;
  displayName: string;
  priceDelta: number;
  multiplier: number;
  sortOrder: number;
  active: boolean;
}
export interface PricingAddon {
  id: string;
  key: string;
  name: string;
  description: string | null;
  price: number;
  billingType: "one_time" | "monthly";
  sortOrder: number;
  active: boolean;
}
export interface PricingGrandfatheredPlan {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  active: boolean;
}
export interface HomeownerCustomCharge {
  id: string;
  homeownerId: string;
  name: string;
  amount: number;
  billingType: "one_time" | "monthly";
  notes: string | null;
  active: boolean;
  createdAt: string;
}

// ─── Realtime helper ───────────────────────────────────────
function useRealtimeInvalidate(table: string, key: unknown[]) {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`rt-${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        qc.invalidateQueries({ queryKey: key });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
}

// ─── Pool sizes ────────────────────────────────────────────
export function usePricingPoolSizes() {
  useRealtimeInvalidate("pricing_pool_sizes", ["pricing-pool-sizes"]);
  return useQuery({
    queryKey: ["pricing-pool-sizes"],
    queryFn: async (): Promise<PricingPoolSize[]> => {
      const { data, error } = await supabase
        .from("pricing_pool_sizes" as never)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as { id: string; size: string; display_name: string; base_monthly_price: number; sort_order: number; active: boolean }[] ?? []).map(r => ({
        id: r.id, size: r.size, displayName: r.display_name,
        basePrice: Number(r.base_monthly_price), sortOrder: r.sort_order, active: r.active,
      }));
    },
  });
}
export function useUpdatePoolSize() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; basePrice?: number; displayName?: string; active?: boolean }) => {
      const patch: Record<string, unknown> = {};
      if (input.basePrice !== undefined) patch.base_monthly_price = input.basePrice;
      if (input.displayName !== undefined) patch.display_name = input.displayName;
      if (input.active !== undefined) patch.active = input.active;
      const { error } = await supabase.from("pricing_pool_sizes" as never).update(patch as never).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-pool-sizes"] }),
  });
}

// ─── Frequencies ───────────────────────────────────────────
export function usePricingFrequencies() {
  useRealtimeInvalidate("pricing_frequencies", ["pricing-frequencies"]);
  return useQuery({
    queryKey: ["pricing-frequencies"],
    queryFn: async (): Promise<PricingFrequency[]> => {
      const { data, error } = await supabase
        .from("pricing_frequencies" as never)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as { id: string; frequency: string; display_name: string; price_delta: number; multiplier: number; sort_order: number; active: boolean }[] ?? []).map(r => ({
        id: r.id, frequency: r.frequency, displayName: r.display_name,
        priceDelta: Number(r.price_delta), multiplier: Number(r.multiplier),
        sortOrder: r.sort_order, active: r.active,
      }));
    },
  });
}
export function useUpdateFrequency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; priceDelta?: number; multiplier?: number; displayName?: string; active?: boolean }) => {
      const patch: Record<string, unknown> = {};
      if (input.priceDelta !== undefined) patch.price_delta = input.priceDelta;
      if (input.multiplier !== undefined) patch.multiplier = input.multiplier;
      if (input.displayName !== undefined) patch.display_name = input.displayName;
      if (input.active !== undefined) patch.active = input.active;
      const { error } = await supabase.from("pricing_frequencies" as never).update(patch as never).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-frequencies"] }),
  });
}

// ─── Add-ons ───────────────────────────────────────────────
export function usePricingAddons() {
  useRealtimeInvalidate("pricing_addons", ["pricing-addons"]);
  return useQuery({
    queryKey: ["pricing-addons"],
    queryFn: async (): Promise<PricingAddon[]> => {
      const { data, error } = await supabase
        .from("pricing_addons" as never)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as { id: string; key: string; name: string; description: string | null; price: number; billing_type: "one_time" | "monthly"; sort_order: number; active: boolean }[] ?? []).map(r => ({
        id: r.id, key: r.key, name: r.name, description: r.description,
        price: Number(r.price), billingType: r.billing_type,
        sortOrder: r.sort_order, active: r.active,
      }));
    },
  });
}
export function useCreateAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; name: string; description?: string; price: number; billingType: "one_time" | "monthly" }) => {
      const { error } = await supabase.from("pricing_addons" as never).insert({
        key: input.key, name: input.name, description: input.description ?? null,
        price: input.price, billing_type: input.billingType,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-addons"] }),
  });
}
export function useUpdateAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; description?: string | null; price?: number; billingType?: "one_time" | "monthly"; active?: boolean }) => {
      const patch: Record<string, unknown> = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.description !== undefined) patch.description = input.description;
      if (input.price !== undefined) patch.price = input.price;
      if (input.billingType !== undefined) patch.billing_type = input.billingType;
      if (input.active !== undefined) patch.active = input.active;
      const { error } = await supabase.from("pricing_addons" as never).update(patch as never).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-addons"] }),
  });
}
export function useDeleteAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pricing_addons" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-addons"] }),
  });
}

// ─── Grandfathered plans ───────────────────────────────────
export function useGrandfatheredPlans() {
  useRealtimeInvalidate("pricing_grandfathered_plans", ["pricing-grandfathered-plans"]);
  return useQuery({
    queryKey: ["pricing-grandfathered-plans"],
    queryFn: async (): Promise<PricingGrandfatheredPlan[]> => {
      const { data, error } = await supabase
        .from("pricing_grandfathered_plans" as never)
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data as { id: string; name: string; description: string | null; monthly_price: number; active: boolean }[] ?? []).map(r => ({
        id: r.id, name: r.name, description: r.description,
        monthlyPrice: Number(r.monthly_price), active: r.active,
      }));
    },
  });
}
export function useCreateGrandfatheredPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; monthlyPrice: number }) => {
      const { error } = await supabase.from("pricing_grandfathered_plans" as never).insert({
        name: input.name, description: input.description ?? null, monthly_price: input.monthlyPrice,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-grandfathered-plans"] }),
  });
}
export function useUpdateGrandfatheredPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; description?: string | null; monthlyPrice?: number; active?: boolean }) => {
      const patch: Record<string, unknown> = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.description !== undefined) patch.description = input.description;
      if (input.monthlyPrice !== undefined) patch.monthly_price = input.monthlyPrice;
      if (input.active !== undefined) patch.active = input.active;
      const { error } = await supabase.from("pricing_grandfathered_plans" as never).update(patch as never).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-grandfathered-plans"] }),
  });
}
export function useDeleteGrandfatheredPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pricing_grandfathered_plans" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-grandfathered-plans"] }),
  });
}

// ─── Custom charges per homeowner ──────────────────────────
export function useHomeownerCustomCharges(homeownerId: string | undefined) {
  useRealtimeInvalidate("homeowner_custom_charges", ["homeowner-custom-charges", homeownerId]);
  return useQuery({
    queryKey: ["homeowner-custom-charges", homeownerId],
    enabled: !!homeownerId,
    queryFn: async (): Promise<HomeownerCustomCharge[]> => {
      const { data, error } = await supabase
        .from("homeowner_custom_charges" as never)
        .select("*")
        .eq("homeowner_id", homeownerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as { id: string; homeowner_id: string; name: string; amount: number; billing_type: "one_time" | "monthly"; notes: string | null; active: boolean; created_at: string }[] ?? []).map(r => ({
        id: r.id, homeownerId: r.homeowner_id, name: r.name,
        amount: Number(r.amount), billingType: r.billing_type,
        notes: r.notes, active: r.active, createdAt: r.created_at,
      }));
    },
  });
}
export function useAddCustomCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { homeownerId: string; name: string; amount: number; billingType: "one_time" | "monthly"; notes?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("homeowner_custom_charges" as never).insert({
        homeowner_id: input.homeownerId, name: input.name,
        amount: input.amount, billing_type: input.billingType,
        notes: input.notes ?? null, created_by: u.user?.id ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["homeowner-custom-charges", vars.homeownerId] }),
  });
}
export function useDeleteCustomCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; homeownerId: string }) => {
      const { error } = await supabase.from("homeowner_custom_charges" as never).delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["homeowner-custom-charges", vars.homeownerId] }),
  });
}

// ─── Computed monthly total ────────────────────────────────
export function useComputedMonthly(homeownerId: string | undefined) {
  return useQuery({
    queryKey: ["computed-monthly", homeownerId],
    enabled: !!homeownerId,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc("compute_homeowner_monthly" as never, { p_homeowner_id: homeownerId } as never);
      if (error) throw error;
      return Number(data ?? 0);
    },
  });
}

// ─── Admin cancel ──────────────────────────────────────────
export function useAdminCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { homeownerId: string; effectiveEnd: string; preserveBalance: boolean; reason: string }) => {
      const { error } = await supabase.rpc("admin_cancel_subscription" as never, {
        p_homeowner_id: input.homeownerId,
        p_effective_end: input.effectiveEnd,
        p_preserve_balance: input.preserveBalance,
        p_reason: input.reason,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-homeowners"] });
    },
  });
}
