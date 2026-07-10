import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServicePhoto {
  id: string;
  type: "before" | "after";
  url: string;
  storagePath: string;
}

export function useServicePhotos(serviceId: string | undefined) {
  return useQuery({
    queryKey: ["service-photos", serviceId],
    enabled: !!serviceId,
    queryFn: async (): Promise<ServicePhoto[]> => {
      const { data, error } = await supabase
        .from("service_photos")
        .select("id, photo_type, storage_path")
        .eq("service_id", serviceId!);
      if (error) throw error;
      return (data ?? []).map((p) => {
        const { data: urlData } = supabase.storage
          .from("service-photos")
          .getPublicUrl(p.storage_path);
        return {
          id: p.id,
          type: p.photo_type as "before" | "after",
          url: urlData.publicUrl,
          storagePath: p.storage_path,
        };
      });
    },
  });
}

/** Upload a service photo and record metadata. Returns the public URL. */
export function useUploadServicePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { serviceId: string; uploadedBy: string; file: File; type: "before" | "after" }) => {
      const ext = input.file.name.split(".").pop() || "jpg";
      const path = `${input.serviceId}/${input.type}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("service-photos")
        .upload(path, input.file, { upsert: false, contentType: input.file.type });
      if (uploadErr) throw uploadErr;

      const { error: insertErr } = await supabase.from("service_photos").insert({
        service_id: input.serviceId,
        storage_path: path,
        photo_type: input.type,
        uploaded_by: input.uploadedBy,
      });
      if (insertErr) throw insertErr;

      const { data } = supabase.storage.from("service-photos").getPublicUrl(path);
      return { path, publicUrl: data.publicUrl };
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["service-photos", vars.serviceId] });
    },
  });
}
