import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceCatalogItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationHours: number;
  category: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

function rowToItem(r: Record<string, unknown>): ServiceCatalogItem {
  return {
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    price: r.price as number,
    durationHours: r.duration_hours as number,
    category: (r.category as string | null) ?? null,
    active: r.active as boolean,
    sortOrder: r.sort_order as number,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function useServiceCatalog(includeInactive = false) {
  return useQuery({
    queryKey: ["service-catalog", includeInactive],
    queryFn: async (): Promise<ServiceCatalogItem[]> => {
      let q = supabase.from("service_catalog" as never).select("*").order("sort_order");
      if (!includeInactive) q = (q as any).eq("active", true);
      const { data, error } = await (q as any);
      if (error) throw error;
      return (data ?? []).map(rowToItem);
    },
  });
}

export function useCreateServiceCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      price: number;
      durationHours: number;
      category?: string;
      active?: boolean;
      sortOrder?: number;
    }) => {
      const { data, error } = await (supabase.from("service_catalog" as never) as any).insert({
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        duration_hours: input.durationHours,
        category: input.category ?? null,
        active: input.active ?? true,
        sort_order: input.sortOrder ?? 0,
      }).select().single();
      if (error) throw error;
      return rowToItem(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-catalog"] }),
  });
}

export function useUpdateServiceCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<{
      name: string;
      description: string | null;
      price: number;
      durationHours: number;
      category: string | null;
      active: boolean;
      sortOrder: number;
    }> & { id: string }) => {
      const patch: Record<string, unknown> = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.description !== undefined) patch.description = input.description;
      if (input.price !== undefined) patch.price = input.price;
      if (input.durationHours !== undefined) patch.duration_hours = input.durationHours;
      if (input.category !== undefined) patch.category = input.category;
      if (input.active !== undefined) patch.active = input.active;
      if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
      const { data, error } = await (supabase.from("service_catalog" as never) as any)
        .update(patch).eq("id", id).select().single();
      if (error) throw error;
      return rowToItem(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-catalog"] }),
  });
}

export function useDeleteServiceCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("service_catalog" as never) as any)
        .update({ active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-catalog"] }),
  });
}

export function useBookServiceCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      homeownerId: string;
      poolId: string;
      catalogItem: ServiceCatalogItem;
      serviceDate: string; // YYYY-MM-DD
      timeWindow: "morning" | "afternoon" | "evening";
    }) => {
      const { data, error } = await supabase.from("services").insert({
        homeowner_id: input.homeownerId,
        pool_id: input.poolId,
        service_type: input.catalogItem.name,
        service_date: input.serviceDate,
        time_window: input.timeWindow,
        base_price: input.catalogItem.price,
        computed_price: input.catalogItem.price,
        hours: input.catalogItem.durationHours,
        status: "scheduled",
        addon_ids: [],
        custom_charges: {},
        delay_minutes: 0,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });
}
