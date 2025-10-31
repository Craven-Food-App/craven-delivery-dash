-- Add unique constraint on name to allow proper upserts in appoint-executive function

-- First, clean up any duplicate names (keep the oldest record)
DELETE FROM public.exec_users a USING public.exec_users b
WHERE a.name IS NOT NULL
  AND b.name IS NOT NULL
  AND a.name = b.name
  AND a.created_at > b.created_at;

-- Now add the unique constraint
ALTER TABLE public.exec_users 
ADD CONSTRAINT exec_users_name_unique UNIQUE (name);

