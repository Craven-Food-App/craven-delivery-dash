-- Fix approval failure due to FK on driver_profiles.user_id pointing to legacy public.users
-- 1) Drop the wrong FK
ALTER TABLE public.driver_profiles
DROP CONSTRAINT IF EXISTS driver_profiles_user_id_fkey;

-- 2) Ensure user_profiles.user_id is unique so it can be referenced by FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'user_profiles_user_id_unique'
  ) THEN
    CREATE UNIQUE INDEX user_profiles_user_id_unique ON public.user_profiles (user_id);
  END IF;
END $$;

-- 3) Add the correct FK from driver_profiles.user_id -> user_profiles.user_id
ALTER TABLE public.driver_profiles
ADD CONSTRAINT driver_profiles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.user_profiles (user_id)
ON DELETE CASCADE
NOT VALID; -- avoid failing if historical rows exist without matching profile

-- (Optional) You can validate later when data consistency is ensured:
-- ALTER TABLE public.driver_profiles VALIDATE CONSTRAINT driver_profiles_user_id_fkey;