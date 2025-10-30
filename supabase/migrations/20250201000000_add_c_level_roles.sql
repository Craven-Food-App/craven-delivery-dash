-- Add additional C-level roles to exec_users table
-- This expands the role CHECK constraint to include all C-level positions

-- Drop the old constraint
ALTER TABLE public.exec_users DROP CONSTRAINT IF EXISTS exec_users_role_check;

-- Add the new constraint with all C-level roles
ALTER TABLE public.exec_users ADD CONSTRAINT exec_users_role_check 
CHECK (role IN ('ceo', 'cfo', 'coo', 'cto', 'cxo', 'cmo', 'cro', 'cpo', 'cdo', 'chro', 'clo', 'cso', 'board_member', 'advisor'));

