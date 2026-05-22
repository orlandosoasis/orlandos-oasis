import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionStatus = "active" | "pending_cancellation" | "cancelled";

export interface Subscription {
  status: SubscriptionStatus;
  cancelledAt: string | null;
  effectiveEndDate: string | null;
  cancellationReason: string | null;
}

const KEY = (userId: string | undefined) => ["subscription", userId];

export function useSubscription() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Realtime: react to profile changes (status flip)
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`subscription-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: KEY(user.id) }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  const query = useQuery({
    queryKey: KEY(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<Subscription> => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "subscription_status, subscription_cancelled_at, subscription_effective_end_date, subscription_cancellation_reason",
        )
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return {
        status: (data?.subscription_status as SubscriptionStatus) ?? "active",
        cancelledAt: (data?.subscription_cancelled_at as string | null) ?? null,
        effectiveEndDate: (data?.subscription_effective_end_date as string | null) ?? null,
        cancellationReason: (data?.subscription_cancellation_reason as string | null) ?? null,
      };
    },
  });

  return query;
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { reason: string; effectiveEndDate: string }) => {
      const { error } = await supabase.rpc("cancel_subscription", {
        p_reason: input.reason,
        p_effective_end: input.effectiveEndDate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(user?.id) });
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["admin-homeowners"] });
    },
  });
}

export function useReactivateSubscription() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("reactivate_subscription");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(user?.id) });
      qc.invalidateQueries({ queryKey: ["admin-homeowners"] });
    },
  });
}

export function formatEndDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
