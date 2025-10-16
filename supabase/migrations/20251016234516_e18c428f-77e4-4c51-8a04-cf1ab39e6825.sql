-- Fix incorrect foreign key on craver_applications.user_id to reference auth.users
-- This resolves foreign key violations when inserting applications with Supabase Auth user IDs

-- 1) Drop existing constraint (currently references public.users)
ALTER TABLE public.craver_applications
DROP CONSTRAINT IF EXISTS craver_applications_user_id_fkey;

-- 2) Recreate constraint referencing auth.users(id)
ALTER TABLE public.craver_applications
ADD CONSTRAINT craver_applications_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;