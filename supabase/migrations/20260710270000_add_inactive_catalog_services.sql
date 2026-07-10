-- Add new service catalog items as inactive with $0 default price.
-- Admin must enable them before they appear on the website or onboarding flow.

INSERT INTO public.service_catalog (name, description, price, duration_hours, category, active, sort_order)
VALUES
  ('Robot Pool Cleaner Drop-off', 'Robotic pool cleaner delivered and set up at your property for automated pool cleaning.', 0, 1, 'Equipment', false, 100),
  ('Hose Bags',                   'Protective hose bags to keep your pool hoses organised and free from damage.',             0, 1, 'Equipment', false, 101),
  ('Plumbing Services',           'Professional pool plumbing repairs and installations.',                                    0, 2, 'Repairs',   false, 102),
  ('Leak Detection & Repair',     'Thorough leak detection using specialised equipment followed by professional repair.',     0, 2, 'Repairs',   false, 103)
ON CONFLICT DO NOTHING;
