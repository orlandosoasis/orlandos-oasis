import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReviewRow {
  id: string;
  reviewerId: string;
  reviewerName: string;
  technicianId: string;
  technicianName: string;
  serviceId: string | null;
  rating: number;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  createdAt: string;
}

interface RawReview {
  id: string;
  reviewer_id: string;
  technician_id: string;
  service_id: string | null;
  rating: number;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
}

async function hydrateNames(rows: RawReview[]): Promise<ReviewRow[]> {
  const ids = new Set<string>();
  rows.forEach((r) => {
    ids.add(r.reviewer_id);
    ids.add(r.technician_id);
  });
  if (ids.size === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", [...ids]);
  const nameOf = (id: string) => {
    const p = profiles?.find((x) => x.id === id);
    return p?.full_name || p?.email || "Unknown";
  };
  return rows.map((r) => ({
    id: r.id,
    reviewerId: r.reviewer_id,
    reviewerName: nameOf(r.reviewer_id),
    technicianId: r.technician_id,
    technicianName: nameOf(r.technician_id),
    serviceId: r.service_id,
    rating: r.rating,
    message: r.message,
    status: r.status,
    rejectionReason: r.rejection_reason,
    createdAt: r.created_at,
  }));
}

/**
 * List reviews. Without a technicianId, returns whatever the caller can see
 * via RLS (admins: all; technicians: their own; homeowners: ones they wrote).
 */
export function useReviews(technicianId?: string) {
  return useQuery({
    queryKey: ["reviews", technicianId ?? "all"],
    queryFn: async (): Promise<ReviewRow[]> => {
      let q = supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (technicianId) q = q.eq("technician_id", technicianId);
      const { data, error } = await q;
      if (error) throw error;
      return hydrateNames((data ?? []) as RawReview[]);
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      reviewerId: string;
      technicianId: string;
      serviceId: string;
      rating: number;
      message?: string;
    }) => {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          reviewer_id: input.reviewerId,
          technician_id: input.technicianId,
          service_id: input.serviceId,
          rating: input.rating,
          message: input.message ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useUpdateReviewStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status: "approved" | "rejected" | "pending";
      rejectionReason?: string | null;
    }) => {
      const { error } = await supabase
        .from("reviews")
        .update({
          status: input.status,
          rejection_reason: input.rejectionReason ?? null,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
}
