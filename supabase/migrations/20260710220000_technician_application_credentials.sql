-- Add columns to store generated credentials after applicant is approved
ALTER TABLE technician_applications
  ADD COLUMN IF NOT EXISTS generated_email text,
  ADD COLUMN IF NOT EXISTS generated_password text,
  ADD COLUMN IF NOT EXISTS technician_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
