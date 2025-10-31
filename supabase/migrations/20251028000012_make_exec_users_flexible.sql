-- Make exec_users more flexible for demo executives
-- Allows placeholder executives without real auth accounts

-- Drop the NOT NULL constraint on user_id
ALTER TABLE public.exec_users 
ALTER COLUMN user_id DROP NOT NULL;

-- Note: No sample executives are inserted here in production
-- Only real executives with actual auth.users accounts should be added
-- Sample data should only exist in development environments
