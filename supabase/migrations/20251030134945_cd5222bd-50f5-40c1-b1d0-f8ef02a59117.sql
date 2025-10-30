-- Add shares_total column to employee_equity for tracking total granted shares
ALTER TABLE public.employee_equity
ADD COLUMN IF NOT EXISTS shares_total INTEGER;