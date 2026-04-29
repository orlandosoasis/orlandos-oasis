import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicProfile {
  id: string;
  email: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: "homeowner" | "technician" | "admin";
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
}

function rowToProfile(r: {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: PublicProfile["role"];
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}): PublicProfile {
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name ?? "",
    firstName: r.first_name,
    lastName: r.last_name,
    phone: r.phone,
    avatarUrl: r.avatar_url,
    role: r.role,
    streetAddress: r.street_address,
    city: r.city,
    state: r.state,
    zipCode: r.zip_code,
  };
}

/** Fetch a single profile (RLS: own profile or admin). */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async (): Promise<PublicProfile | null> => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data ? rowToProfile(data) : null;
    },
  });
}

/** Fetch a list of profiles by id (best-effort under RLS). */
export function useProfilesByIds(ids: string[]) {
  const sortedIds = [...new Set(ids)].sort();
  return useQuery({
    queryKey: ["profiles-by-ids", sortedIds],
    enabled: sortedIds.length > 0,
    queryFn: async (): Promise<Record<string, PublicProfile>> => {
      const { data, error } = await supabase.from("profiles").select("*").in("id", sortedIds);
      if (error) throw error;
      const map: Record<string, PublicProfile> = {};
      (data ?? []).forEach((row) => {
        const p = rowToProfile(row);
        map[p.id] = p;
      });
      return map;
    },
  });
}
