-- Create service-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-photos', 'service-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view service photos (public bucket)
CREATE POLICY "Service photos are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'service-photos');

-- Technicians can upload photos to folders matching service ids they own
-- Path convention: {service_id}/{before|after}/{filename}
CREATE POLICY "Technicians upload service photos for assigned services"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-photos'
  AND EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.technician_id = auth.uid()
  )
);

-- Technicians can update/delete their own service photos
CREATE POLICY "Technicians manage service photos for assigned services"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-photos'
  AND EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.technician_id = auth.uid()
  )
);

CREATE POLICY "Technicians delete service photos for assigned services"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-photos'
  AND EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.technician_id = auth.uid()
  )
);

-- Admins manage all service photos
CREATE POLICY "Admins manage all service photos"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'service-photos' AND public.is_admin())
WITH CHECK (bucket_id = 'service-photos' AND public.is_admin());

-- Add a service_photos table to track photo metadata (before/after grouping)
CREATE TABLE public.service_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after')),
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service photos viewable by participants"
ON public.service_photos
FOR SELECT
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id = service_photos.service_id
      AND (s.homeowner_id = auth.uid() OR s.technician_id = auth.uid())
  )
);

CREATE POLICY "Technicians insert service photos"
ON public.service_photos
FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id = service_photos.service_id
      AND s.technician_id = auth.uid()
  )
);

CREATE POLICY "Admins manage service photo records"
ON public.service_photos
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE INDEX idx_service_photos_service_id ON public.service_photos(service_id);