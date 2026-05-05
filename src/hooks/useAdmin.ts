import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminTechnicianAggregate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: "Active" | "Inactive";
  rating: number;
  assignedPools: number;
  completedServices: number;
  reviews: {
    id: string;
    reviewer: string;
    rating: number;
    message: string;
    date: string;
    status: "Pending" | "Approved" | "Rejected";
    rejectionReason?: string | null;
  }[];
  pools: {
    address: string;
    homeowner: string;
    nextService: string;
    serviceType: string;
  }[];
}

export interface AdminHomeownerAggregate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string;
  plan: string;
  startDate: string;
  pools: { id: string; address: string; size: string; technicianName: string; technicianId: string | null; nextService: string }[];
  services: { id: string; date: string; type: string; technicianName: string; status: "Completed" | "Scheduled"; poolId: string }[];
}

export type IssueStatusDb = "open" | "in_progress" | "resolved";

export interface AdminIssueRow {
  id: string;
  homeownerId: string;
  homeownerName: string;
  email: string;
  phone: string | null;
  type: string;
  message: string;
  serviceDate: string | null;
  status: IssueStatusDb;
  relatedService: string | null;
  createdAt: string;
  adminNotes: string | null;
  assignedTechnicianId: string | null;
  resolvedAt: string | null;
}

export interface AdminApplicantRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  experience: string | null;
  resumeUrl: string | null;
  appliedDate: string;
  status: "pending" | "approved" | "rejected";
  certifications: { id: string; name: string; fileUrl: string | null }[];
}

const fmtDate = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const fmtServiceDate = (s: string | null) => {
  if (!s) return "";
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, day ?? 1).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

/**
 * Admin: list all technicians with aggregated pools, reviews, and counts.
 * Joins are done in JS — RLS-safe (admins can read all rows we touch here).
 */
export function useAdminTechnicians() {
  return useQuery({
    queryKey: ["admin-technicians"],
    queryFn: async (): Promise<AdminTechnicianAggregate[]> => {
      const { data: techs, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .eq("role", "technician")
        .order("full_name", { ascending: true });
      if (error) throw error;
      const techIds = (techs ?? []).map((t) => t.id);
      if (techIds.length === 0) return [];

      const [{ data: services }, { data: reviews }] = await Promise.all([
        supabase.from("services").select("*").in("technician_id", techIds),
        supabase.from("reviews").select("*").in("technician_id", techIds),
      ]);

      // Hydrate homeowner + pool address for service rows.
      const poolIds = [...new Set((services ?? []).map((s) => s.pool_id))];
      const homeownerIds = [...new Set((services ?? []).map((s) => s.homeowner_id))];
      const reviewerIds = [...new Set((reviews ?? []).map((r) => r.reviewer_id))];

      const [{ data: pools }, { data: hoProfiles }, { data: reviewerProfiles }] = await Promise.all([
        poolIds.length
          ? supabase.from("pools").select("id, address").in("id", poolIds)
          : Promise.resolve({ data: [] as { id: string; address: string }[] }),
        homeownerIds.length
          ? supabase.from("profiles").select("id, full_name, email").in("id", homeownerIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string }[] }),
        reviewerIds.length
          ? supabase.from("profiles").select("id, full_name, email").in("id", reviewerIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string }[] }),
      ]);

      const poolAddr = (id: string) => pools?.find((p) => p.id === id)?.address ?? "";
      const hoName = (id: string) => {
        const p = hoProfiles?.find((x) => x.id === id);
        return p?.full_name || p?.email || "Unknown";
      };
      const reviewerName = (id: string) => {
        const p = reviewerProfiles?.find((x) => x.id === id);
        return p?.full_name || p?.email || "Unknown";
      };

      return (techs ?? []).map((tech): AdminTechnicianAggregate => {
        const techServices = (services ?? []).filter((s) => s.technician_id === tech.id);
        const upcomingByPool = new Map<string, { date: string; type: string }>();
        let completed = 0;
        for (const s of techServices) {
          if (s.status === "completed") completed++;
          if (s.status === "scheduled" || s.status === "in_progress") {
            const cur = upcomingByPool.get(s.pool_id);
            if (!cur || s.service_date < cur.date) {
              upcomingByPool.set(s.pool_id, { date: s.service_date, type: s.service_type });
            }
          }
        }
        const techReviews = (reviews ?? []).filter((r) => r.technician_id === tech.id);
        const approved = techReviews.filter((r) => r.status === "approved");
        const avgRating =
          approved.length > 0
            ? Math.round((approved.reduce((sum, r) => sum + r.rating, 0) / approved.length) * 10) / 10
            : 0;
        const status: "Active" | "Inactive" = upcomingByPool.size > 0 ? "Active" : "Inactive";

        return {
          id: tech.id,
          name: tech.full_name || tech.email,
          email: tech.email,
          phone: tech.phone,
          status,
          rating: avgRating,
          assignedPools: upcomingByPool.size,
          completedServices: completed,
          reviews: techReviews
            .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
            .map((r) => ({
              id: r.id,
              reviewer: reviewerName(r.reviewer_id),
              rating: r.rating,
              message: r.message ?? "",
              date: fmtDate(r.created_at),
              status: (r.status.charAt(0).toUpperCase() + r.status.slice(1)) as "Pending" | "Approved" | "Rejected",
              rejectionReason: r.rejection_reason,
            })),
          pools: [...upcomingByPool.entries()].map(([poolId, info]) => {
            const svc = techServices.find((s) => s.pool_id === poolId && s.service_date === info.date)!;
            return {
              address: poolAddr(poolId),
              homeowner: hoName(svc.homeowner_id),
              nextService: fmtServiceDate(info.date),
              serviceType: info.type,
            };
          }),
        };
      });
    },
  });
}

export function useAdminHomeowners() {
  return useQuery({
    queryKey: ["admin-homeowners"],
    queryFn: async (): Promise<AdminHomeownerAggregate[]> => {
      const { data: homeowners, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, street_address, city, state, zip_code, created_at")
        .eq("role", "homeowner")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const homeownerIds = (homeowners ?? []).map((h) => h.id);
      if (homeownerIds.length === 0) return [];

      const [{ data: pools }, { data: services }] = await Promise.all([
        supabase.from("pools").select("*").in("homeowner_id", homeownerIds),
        supabase.from("services").select("*").in("homeowner_id", homeownerIds),
      ]);

      const techIds = [...new Set((services ?? []).map((s) => s.technician_id).filter(Boolean) as string[])];
      const { data: techProfiles } = techIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", techIds)
        : { data: [] as { id: string; full_name: string | null; email: string }[] };
      const techName = (id: string | null) => {
        if (!id) return "Unassigned";
        const p = techProfiles?.find((x) => x.id === id);
        return p?.full_name || p?.email || "Unknown";
      };

      return (homeowners ?? []).map((h): AdminHomeownerAggregate => {
        const ownerPools = (pools ?? []).filter((p) => p.homeowner_id === h.id);
        const ownerServices = (services ?? []).filter((s) => s.homeowner_id === h.id);
        const addressParts = [h.street_address, h.city, h.state].filter(Boolean);

        return {
          id: h.id,
          name: h.full_name || h.email,
          email: h.email,
          phone: h.phone,
          address: addressParts.join(", ") || "—",
          plan: "Standard",
          startDate: fmtDate(h.created_at),
          pools: ownerPools.map((p) => {
            const next = ownerServices
              .filter((s) => s.pool_id === p.id && (s.status === "scheduled" || s.status === "in_progress"))
              .sort((a, b) => (a.service_date < b.service_date ? -1 : 1))[0];
            const assignedTechId = (p as { assigned_technician_id?: string | null }).assigned_technician_id ?? next?.technician_id ?? null;
            return {
              id: p.id,
              address: p.address,
              size: p.pool_size ?? "—",
              technicianId: assignedTechId,
              technicianName: techName(assignedTechId),
              nextService: next ? fmtServiceDate(next.service_date) : "—",
            };
          }),
          services: ownerServices
            .sort((a, b) => (a.service_date < b.service_date ? 1 : -1))
            .slice(0, 10)
            .map((s) => ({
              id: s.id,
              date: fmtServiceDate(s.service_date),
              type: s.service_type,
              technicianName: techName(s.technician_id),
              status: s.status === "completed" ? "Completed" : "Scheduled",
            })),
        };
      });
    },
  });
}

export function useAdminIssues() {
  return useQuery({
    queryKey: ["admin-issues"],
    queryFn: async (): Promise<AdminIssueRow[]> => {
      const { data: issues, error } = await supabase
        .from("issues")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = [...new Set((issues ?? []).map((i) => i.homeowner_id))];
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name, email, phone").in("id", ids)
        : { data: [] as { id: string; full_name: string | null; email: string; phone: string | null }[] };
      return (issues ?? []).map((i): AdminIssueRow => {
        const p = profiles?.find((x) => x.id === i.homeowner_id);
        const row = i as typeof i & { admin_notes?: string | null; assigned_technician_id?: string | null; resolved_at?: string | null };
        return {
          id: i.id,
          homeownerId: i.homeowner_id,
          homeownerName: p?.full_name || p?.email || "Unknown",
          email: p?.email || "",
          phone: p?.phone || null,
          type: i.type,
          message: i.message,
          serviceDate: i.service_date ? fmtServiceDate(i.service_date) : null,
          status: i.status as IssueStatusDb,
          relatedService: i.related_service,
          createdAt: i.created_at,
          adminNotes: row.admin_notes ?? null,
          assignedTechnicianId: row.assigned_technician_id ?? null,
          resolvedAt: row.resolved_at ?? null,
        };
      });
    },
  });
}

export interface UpdateIssuePatch {
  status?: IssueStatusDb;
  adminNotes?: string | null;
  assignedTechnicianId?: string | null;
}

export function useUpdateIssueStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, adminNotes, assignedTechnicianId }: { id: string } & UpdateIssuePatch) => {
      const patch: {
        status?: IssueStatusDb;
        admin_notes?: string | null;
        assigned_technician_id?: string | null;
        resolved_at?: string;
      } = {};
      if (status !== undefined) {
        patch.status = status;
        if (status === "resolved") patch.resolved_at = new Date().toISOString();
      }
      if (adminNotes !== undefined) patch.admin_notes = adminNotes;
      if (assignedTechnicianId !== undefined) patch.assigned_technician_id = assignedTechnicianId;
      const { error } = await supabase.from("issues").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-issues"] }),
  });
}

export function useTechnicianApplications() {
  return useQuery({
    queryKey: ["technician-applications"],
    queryFn: async (): Promise<AdminApplicantRow[]> => {
      const { data: apps, error } = await supabase
        .from("technician_applications")
        .select("*")
        .order("applied_date", { ascending: false });
      if (error) throw error;
      const ids = (apps ?? []).map((a) => a.id);
      const { data: certs } = ids.length
        ? await supabase
            .from("applicant_certifications")
            .select("id, application_id, name, file_url")
            .in("application_id", ids)
        : { data: [] as { id: string; application_id: string; name: string; file_url: string | null }[] };

      return (apps ?? []).map((a): AdminApplicantRow => ({
        id: a.id,
        firstName: a.first_name,
        lastName: a.last_name,
        email: a.email,
        phone: a.phone,
        city: a.city,
        state: a.state,
        zip: a.zip,
        experience: a.experience,
        resumeUrl: a.resume_url,
        appliedDate: fmtServiceDate(a.applied_date),
        status: a.status as "pending" | "approved" | "rejected",
        certifications: (certs ?? [])
          .filter((c) => c.application_id === a.id)
          .map((c) => ({ id: c.id, name: c.name, fileUrl: c.file_url })),
      }));
    },
  });
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("technician_applications")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["technician-applications"] }),
  });
}
