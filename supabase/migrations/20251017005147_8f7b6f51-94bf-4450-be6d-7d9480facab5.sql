-- Clean up duplicate user_profiles and add unique constraints for approval flow
-- 1) Remove duplicate user_profiles, keeping only the first one per user_id
DELETE FROM public.user_profiles a
USING public.user_profiles b
WHERE a.id > b.id
  AND a.user_id = b.user_id;

-- 2) Now add unique constraint on user_profiles.user_id
ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

-- 3) driver_profiles.user_id must be unique for ON CONFLICT (user_id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'driver_profiles_user_id_key'
  ) THEN
    ALTER TABLE public.driver_profiles
    ADD CONSTRAINT driver_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 4) driver_onboarding_progress.user_id must be unique for ON CONFLICT (user_id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'driver_onboarding_progress_user_id_key'
  ) THEN
    ALTER TABLE public.driver_onboarding_progress
    ADD CONSTRAINT driver_onboarding_progress_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 5) user_roles must have unique (user_id, role) for ON CONFLICT (user_id, role)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- 6) Add explicit FK for onboarding progress -> user_profiles for relationship-based selects
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'driver_onboarding_progress_user_id_fkey'
  ) THEN
    ALTER TABLE public.driver_onboarding_progress
    ADD CONSTRAINT driver_onboarding_progress_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;