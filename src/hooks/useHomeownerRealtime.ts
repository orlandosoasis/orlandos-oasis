import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to realtime changes on services and pools for the given homeowner
 * and invalidates relevant React Query caches so the UI (including technician
 * assignment) reflects admin updates immediately.
 */
export function useHomeownerRealtime(homeownerId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!homeownerId) return;

    const channel = supabase
      .channel(`homeowner-realtime-${homeownerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "services",
          filter: `homeowner_id=eq.${homeownerId}`,
        },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["services"] });
          const id =
            (payload.new as { id?: string } | null)?.id ??
            (payload.old as { id?: string } | null)?.id;
          if (id) qc.invalidateQueries({ queryKey: ["service", id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pools",
          filter: `homeowner_id=eq.${homeownerId}`,
        },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["pools"] });
          const id =
            (payload.new as { id?: string } | null)?.id ??
            (payload.old as { id?: string } | null)?.id;
          if (id) qc.invalidateQueries({ queryKey: ["pool", id] });
          // Assigned technician profile may now be visible/different
          qc.invalidateQueries({ queryKey: ["profiles"] });
          qc.invalidateQueries({ queryKey: ["technician"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [homeownerId, qc]);
}
