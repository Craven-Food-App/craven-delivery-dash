-- Enable pgcrypto for password hashing if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert or update CEO access credentials for tstroman.ceo@cravenusa.com with PIN 020304
INSERT INTO public.ceo_access_credentials (
  user_email,
  pin_hash,
  created_at,
  updated_at
)
VALUES (
  'tstroman.ceo@cravenusa.com',
  crypt('020304', gen_salt('bf')),
  now(),
  now()
)
ON CONFLICT (user_email)
DO UPDATE SET
  pin_hash = crypt('020304', gen_salt('bf')),
  updated_at = now();

-- Grant necessary permissions
GRANT SELECT ON public.ceo_access_credentials TO authenticated;