
-- 1. Profiles: prevent self role escalation
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- 2. Reviews: one per reviewer per service
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_reviewer_service_unique UNIQUE (reviewer_id, service_id);

-- 3. Length checks
ALTER TABLE public.messages
  ADD CONSTRAINT messages_body_length_check CHECK (length(body) <= 5000);

ALTER TABLE public.issues
  ADD CONSTRAINT issues_message_length_check CHECK (length(message) <= 5000);

-- 4. Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/gif']),
  ('resumes', 'resumes', false, 5242880, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('certifications', 'certifications', false, 5242880, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. Storage policies: avatars
CREATE POLICY "Avatars publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Storage policies: resumes
CREATE POLICY "Anyone uploads resume"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Admins read resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes' AND public.is_admin());

CREATE POLICY "Admins manage resumes"
ON storage.objects FOR UPDATE
USING (bucket_id = 'resumes' AND public.is_admin());

CREATE POLICY "Admins delete resumes"
ON storage.objects FOR DELETE
USING (bucket_id = 'resumes' AND public.is_admin());

-- 7. Storage policies: certifications
CREATE POLICY "Anyone uploads certification"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certifications');

CREATE POLICY "Admins read certifications"
ON storage.objects FOR SELECT
USING (bucket_id = 'certifications' AND public.is_admin());

CREATE POLICY "Admins manage certifications"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certifications' AND public.is_admin());

CREATE POLICY "Admins delete certifications"
ON storage.objects FOR DELETE
USING (bucket_id = 'certifications' AND public.is_admin());
