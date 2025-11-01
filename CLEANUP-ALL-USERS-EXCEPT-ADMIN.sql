-- WARNING: This will delete ALL users except craven@usa.com
-- Only run this in development/testing environments
-- Review carefully before executing

BEGIN;

-- Delete all driver applications except for craven@usa.com
DELETE FROM public.craver_applications
WHERE email != 'craven@usa.com';

-- Delete all user profiles except for craven@usa.com
DELETE FROM public.user_profiles
WHERE user_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'craven@usa.com'
);

-- Delete all driver profiles except for craven@usa.com
DELETE FROM public.driver_profiles
WHERE user_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'craven@usa.com'
);

-- Delete all drivers table records except for craven@usa.com
DELETE FROM public.drivers
WHERE email != 'craven@usa.com'
AND auth_user_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'craven@usa.com'
);

-- Delete all orders except those associated with craven@usa.com or restaurants
DELETE FROM public.orders
WHERE customer_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'craven@usa.com'
)
AND driver_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'craven@usa.com'
);

-- Delete all customer orders except those associated with craven@usa.com or restaurants
DELETE FROM public.customer_orders
WHERE customer_email != 'craven@usa.com'
AND customer_email IS NOT NULL;

-- Delete all waitlist entries except for craven@usa.com
DELETE FROM public.driver_waitlist
WHERE driver_id NOT IN (
  SELECT id FROM public.craver_applications WHERE email = 'craven@usa.com'
);

-- Delete all activation queue entries except for craven@usa.com
DELETE FROM public.activation_queue
WHERE driver_id NOT IN (
  SELECT id FROM public.craver_applications WHERE email = 'craven@usa.com'
);

-- Delete all onboarding tasks except for craven@usa.com
DELETE FROM public.onboarding_tasks
WHERE driver_id NOT IN (
  SELECT id FROM public.craver_applications WHERE email = 'craven@usa.com'
);

-- Delete all driver signatures except for craven@usa.com
DELETE FROM public.driver_signatures
WHERE driver_id NOT IN (
  SELECT id FROM public.craver_applications WHERE email = 'craven@usa.com'
);

-- Null out created_by references in delivery_zones
UPDATE public.delivery_zones
SET created_by = NULL
WHERE created_by NOT IN (
  SELECT id FROM auth.users WHERE email = 'craven@usa.com'
);

-- Delete auth users except craven@usa.com
DELETE FROM auth.users
WHERE email != 'craven@usa.com';

COMMIT;

-- Verification query - check remaining users
SELECT 
  u.id, 
  u.email, 
  u.created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.craver_applications WHERE user_id = u.id) THEN 'Driver'
    WHEN EXISTS (SELECT 1 FROM public.restaurants WHERE owner_id = u.id) THEN 'Restaurant'
    WHEN u.email = 'craven@usa.com' THEN 'Admin'
    ELSE 'Customer'
  END as user_type
FROM auth.users u
ORDER BY u.created_at DESC;

