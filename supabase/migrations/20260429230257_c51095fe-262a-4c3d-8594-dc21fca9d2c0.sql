
-- Replace overly-broad INSERT policies on resumes/certifications with path-scoped ones.
-- The buckets are private so SELECT remains admin-only. INSERT for anon applicants
-- is constrained to an `applications/` path prefix to avoid arbitrary writes.
DROP POLICY IF EXISTS "Anyone uploads resume" ON storage.objects;
DROP POLICY IF EXISTS "Anyone uploads certification" ON storage.objects;

CREATE POLICY "Applicants upload resume to applications path"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = 'applications'
);

CREATE POLICY "Applicants upload certification to applications path"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certifications'
  AND (storage.foldername(name))[1] = 'applications'
);

-- Avatars: replace broad public SELECT with path-scoped read so listing the
-- bucket root returns nothing while direct file reads still work.
DROP POLICY IF EXISTS "Avatars publicly readable" ON storage.objects;

CREATE POLICY "Avatars publicly readable by path"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] IS NOT NULL
);
