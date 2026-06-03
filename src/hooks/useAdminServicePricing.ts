import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceCustomCharge {
  name: string;
  amount: number;
}

export interface AdminServicePricing {
  id: string;
  poolId: string;
  poolSize: string | null;
  addonIds: string[];
  customCharges: ServiceCustomCharge[];
  basePrice: number | null;
  computedPrice: number | null;
}

interface ServicePricingRow {
  id: string;
  pool_id: string;
  addon_ids: string[] | null;
  custom_charges: unknown;
  base_price: number | null;
  computed_price: number | null;
}

interface PoolSizeRow { pool_size: string | null }

function parseCharges(raw: unknown): ServiceCustomCharge[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Array<{ name?: unknown; amount?: unknown }>)
    .map(c => ({
      name: typeof c?.name === "string" ? c.name : "",
      amount: typeof c?.amount === "number" ? c.amount : Number(c?.amount) || 0,
    }))
    .filter(c => c.name.length > 0);
}

export function useAdminServicePricing(serviceId: string | undefined) {
  return useQuery({
    queryKey: ["admin-service-pricing", serviceId],
    enabled: !!serviceId,
    queryFn: async (): Promise<AdminServicePricing | null> => {
      const { data: svc, error } = await supabase
        .from("services")
        .select("id, pool_id, addon_ids, custom_charges, base_price, computed_price")
        .eq("id", serviceId!)
        .maybeSingle();
      if (error) throw error;
      if (!svc) return null;
      const row = svc as ServicePricingRow;
      let poolSize: string | null = null;
      if (row.pool_id) {
        const { data: pool } = await supabase
          .from("pools").select("pool_size").eq("id", row.pool_id).maybeSingle();
        poolSize = (pool as PoolSizeRow | null)?.pool_size ?? null;
      }
      return {
        id: row.id,
        poolId: row.pool_id,
        poolSize,
        addonIds: row.addon_ids ?? [],
        customCharges: parseCharges(row.custom_charges),
        basePrice: row.base_price !== null ? Number(row.base_price) : null,
        computedPrice: row.computed_price !== null ? Number(row.computed_price) : null,
      };
    },
  });
}

export function useUpdateAdminServicePricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      serviceId: string;
      addonIds: string[];
      customCharges: ServiceCustomCharge[];
      basePrice: number;
      computedPrice: number;
    }) => {
      const { error } = await supabase
        .from("services")
        .update({
          addon_ids: input.addonIds,
          custom_charges: input.customCharges as unknown as never,
          base_price: input.basePrice,
          computed_price: input.computedPrice,
        })
        .eq("id", input.serviceId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-service-pricing", vars.serviceId] });
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["service", vars.serviceId] });
    },
  });
}
