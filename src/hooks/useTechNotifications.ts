import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TechNotification {
  id: string;
  technician_id: string;
  kind: string;
  title: string;
  body: string | null;
  cta_route: string | null;
  request_id: string | null;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
}

export function useTechNotifications(technicianId: string | undefined) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["tech-notifications", technicianId],
    enabled: !!technicianId,
    queryFn: async (): Promise<TechNotification[]> => {
      const { data, error } = await supabase
        .from("tech_notifications")
        .select("*")
        .eq("technician_id", technicianId!)
        .is("dismissed_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TechNotification[];
    },
  });

  useEffect(() => {
    if (!technicianId) return;
    const ch = supabase
      .channel(`tech-notif-${technicianId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "tech_notifications", filter: `technician_id=eq.${technicianId}` },
        () => qc.invalidateQueries({ queryKey: ["tech-notifications", technicianId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [technicianId, qc]);

  return q;
}

export function useDismissTechNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tech_notifications").update({ dismissed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tech-notifications"] }),
  });
}
