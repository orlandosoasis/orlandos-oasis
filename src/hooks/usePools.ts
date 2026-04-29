import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TechPool } from "@/types/tech";

type PoolRow = {
  id: string;
  homeowner_id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  pool_type: string | null;
  pool_size: string | null;
  water_type: string | null;
  equipment: string | null;
  access_method: string | null;
  access_detail: string | null;
};

function rowToPool(r: PoolRow): TechPool {
  return {
    id: r.id,
    homeownerId: r.homeowner_id,
    address: r.address,
    city: r.city ?? "",
    state: r.state ?? "",
    zip: r.zip ?? "",
    poolType: r.pool_type ?? "",
    poolSize: r.pool_size ?? "",
    waterType: r.water_type ?? "",
    equipment: r.equipment ?? "",
    accessMethod: r.access_method ?? "",
    accessDetail: r.access_detail ?? "",
  };
}

/**
 * Fetch pools. If homeownerId is omitted, returns rows the caller can see via RLS:
 * - homeowners: their own pools
 * - technicians: pools attached to services they're assigned to
 * - admins: all pools
 */
export function usePools(homeownerId?: string) {
  return useQuery({
    queryKey: ["pools", homeownerId ?? "all"],
    queryFn: async (): Promise<TechPool[]> => {
      let q = supabase.from("pools").select("*").order("created_at", { ascending: false });
      if (homeownerId) q = q.eq("homeowner_id", homeownerId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(rowToPool);
    },
  });
}

export function usePool(poolId: string | undefined) {
  return useQuery({
    queryKey: ["pool", poolId],
    enabled: !!poolId,
    queryFn: async (): Promise<TechPool | null> => {
      const { data, error } = await supabase.from("pools").select("*").eq("id", poolId!).maybeSingle();
      if (error) throw error;
      return data ? rowToPool(data) : null;
    },
  });
}

export function useCreatePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pool: Omit<TechPool, "id">) => {
      const { data, error } = await supabase
        .from("pools")
        .insert({
          homeowner_id: pool.homeownerId,
          address: pool.address,
          city: pool.city,
          state: pool.state,
          zip: pool.zip,
          pool_type: pool.poolType,
          pool_size: pool.poolSize,
          water_type: pool.waterType,
          equipment: pool.equipment,
          access_method: pool.accessMethod,
          access_detail: pool.accessDetail,
        })
        .select()
        .single();
      if (error) throw error;
      return rowToPool(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pools"] }),
  });
}
