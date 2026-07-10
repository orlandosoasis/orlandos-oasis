-- Add image support to messages table so photo uploads appear in chat
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_type text; -- 'before' | 'after'
