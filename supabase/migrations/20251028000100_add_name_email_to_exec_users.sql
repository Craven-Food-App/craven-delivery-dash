-- Add name and email fields to exec_users table for better display
ALTER TABLE public.exec_users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index on email for quick lookups
CREATE INDEX IF NOT EXISTS idx_exec_users_email ON public.exec_users(email);

