-- Add missing owner_id and department_id columns to ceo_objectives table
-- This aligns the table schema with the updated definition in 20251028000007_create_ceo_portal_tables.sql

-- Add owner_id column if it doesn't exist
ALTER TABLE public.ceo_objectives 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Add owner_name column if it doesn't exist
ALTER TABLE public.ceo_objectives 
ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- Add department_id column if it doesn't exist
ALTER TABLE public.ceo_objectives 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);

-- Add completed_date column if it doesn't exist (from new schema)
ALTER TABLE public.ceo_objectives 
ADD COLUMN IF NOT EXISTS completed_date DATE;

-- Add milestones column if it doesn't exist (from new schema)
ALTER TABLE public.ceo_objectives 
ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.ceo_objectives 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

