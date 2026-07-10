-- Remove mailnesia.con homeowner accounts and their related data
-- These are test/dummy accounts not real clients

-- Delete homeowner_notifications for these users
DELETE FROM homeowner_notifications
WHERE homeowner_id IN (
  SELECT id FROM profiles WHERE email ILIKE '%@mailnesia.con'
);

-- Delete tech_notifications referencing services owned by these users
DELETE FROM tech_notifications
WHERE cta_route ILIKE ANY(
  SELECT CONCAT('/tech/jobs/', s.id)
  FROM services s
  JOIN profiles p ON p.id = s.homeowner_id
  WHERE p.email ILIKE '%@mailnesia.con'
);

-- Delete service_photos for their services
DELETE FROM service_photos
WHERE service_id IN (
  SELECT s.id FROM services s
  JOIN profiles p ON p.id = s.homeowner_id
  WHERE p.email ILIKE '%@mailnesia.con'
);

-- Delete messages involving these users
DELETE FROM messages
WHERE sender_id IN (SELECT id FROM profiles WHERE email ILIKE '%@mailnesia.con')
   OR recipient_id IN (SELECT id FROM profiles WHERE email ILIKE '%@mailnesia.con');

-- Delete subscription_events for these users
DELETE FROM subscription_events
WHERE homeowner_id IN (SELECT id FROM profiles WHERE email ILIKE '%@mailnesia.con');

-- Delete services for these users
DELETE FROM services
WHERE homeowner_id IN (SELECT id FROM profiles WHERE email ILIKE '%@mailnesia.con');

-- Delete pools for these users
DELETE FROM pools
WHERE homeowner_id IN (SELECT id FROM profiles WHERE email ILIKE '%@mailnesia.con');

-- Delete the profiles themselves
DELETE FROM profiles
WHERE email ILIKE '%@mailnesia.con';

-- Also clear all is_placeholder = true records (dummy data used for demos)
-- First clean up their related data
DELETE FROM homeowner_notifications
WHERE homeowner_id IN (SELECT id FROM profiles WHERE is_placeholder = true);

DELETE FROM subscription_events
WHERE homeowner_id IN (SELECT id FROM profiles WHERE is_placeholder = true);

DELETE FROM service_photos
WHERE service_id IN (
  SELECT s.id FROM services s
  JOIN profiles p ON p.id = s.homeowner_id
  WHERE p.is_placeholder = true
);

DELETE FROM messages
WHERE sender_id IN (SELECT id FROM profiles WHERE is_placeholder = true)
   OR recipient_id IN (SELECT id FROM profiles WHERE is_placeholder = true);

DELETE FROM services
WHERE homeowner_id IN (SELECT id FROM profiles WHERE is_placeholder = true);

DELETE FROM pools
WHERE homeowner_id IN (SELECT id FROM profiles WHERE is_placeholder = true);

DELETE FROM profiles
WHERE is_placeholder = true;
