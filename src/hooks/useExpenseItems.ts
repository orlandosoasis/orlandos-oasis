import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ExpenseCategory = "chemical" | "equipment";

export interface ExpenseItem {
  id: string;
  name: string;
  category: ExpenseCategory;
  perPoolCost: number;
  sortOrder: number;
}

export function useExpenseItems() {
  return useQuery({
    queryKey: ["expense-items"],
    queryFn: async (): Promise<ExpenseItem[]> => {
      const { data, error } = await supabase
        .from("expense_items")
        .select("id, name, category, per_pool_cost, sort_order")
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category as ExpenseCategory,
        perPoolCost: Number(r.per_pool_cost),
        sortOrder: r.sort_order,
      }));
    },
  });
}

export function useCreateExpenseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { name: string; category: ExpenseCategory; perPoolCost: number }) => {
      const { error } = await supabase.from("expense_items").insert({
        name: item.name,
        category: item.category,
        per_pool_cost: item.perPoolCost,
        sort_order: 999,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expense-items"] }),
  });
}

export function useUpdateExpenseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, perPoolCost }: { id: string; name?: string; perPoolCost?: number }) => {
      const patch: { name?: string; per_pool_cost?: number } = {};
      if (name !== undefined) patch.name = name;
      if (perPoolCost !== undefined) patch.per_pool_cost = perPoolCost;
      const { error } = await supabase.from("expense_items").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expense-items"] }),
  });
}

export function useDeleteExpenseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expense_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expense-items"] }),
  });
}
