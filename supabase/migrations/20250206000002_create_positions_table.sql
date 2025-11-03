-- Create positions/roles management table
-- Allows CEO/HR to define and manage employee positions

CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, -- e.g., "Marketing Manager"
  code TEXT NOT NULL, -- e.g., "marketing-manager" (slug)
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  description TEXT,
  is_executive BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Compensation guidance (optional)
  salary_range_min NUMERIC(12, 2),
  salary_range_max NUMERIC(12, 2),
  
  -- Requirements/qualifications (optional)
  requirements TEXT,
  education_level TEXT, -- e.g., "Bachelor's", "Master's", "None"
  
  -- Reporting structure
  reports_to_position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  
  -- System
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_positions_department ON public.positions(department_id);
-- Enforce uniqueness of active codes (allow duplicates when inactive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_positions_code_active_unique ON public.positions(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_positions_active ON public.positions(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: CEO, HR, and Admins can manage positions
CREATE POLICY "CEO and admins can manage all positions"
ON public.positions FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'ceo')
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM public.employees e 
             JOIN public.user_profiles up ON e.user_id = up.user_id 
             WHERE e.user_id = auth.uid() 
             AND (up.role = 'admin' OR e.position ILIKE '%HR%' OR e.position ILIKE '%Human Resources%'))
);

-- Anyone authenticated can view active positions
CREATE POLICY "Anyone can view active positions"
ON public.positions FOR SELECT
TO authenticated
USING (is_active = true);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_positions_updated_at
BEFORE UPDATE ON public.positions
FOR EACH ROW
EXECUTE FUNCTION update_positions_updated_at();

-- Seed defaults idempotently (skip if an active row with same code exists)
WITH seed(title, code, is_executive) AS (
  VALUES
    ('Chief Executive Officer (CEO)', 'ceo', true),
    ('Chief Financial Officer (CFO)', 'cfo', true),
    ('Chief Operating Officer (COO)', 'coo', true),
    ('Chief Technology Officer (CTO)', 'cto', true),
    ('Chief Information Officer (CIO)', 'cio', true),
    ('Chief Experience Officer (CXO)', 'cxo', true),
    ('Chief Marketing Officer (CMO)', 'cmo', true),
    ('Chief Revenue Officer (CRO)', 'cro', true),
    ('Chief Product Officer (CPO)', 'cpo', true),
    ('Chief Data Officer (CDO)', 'cdo', true),
    ('Chief Human Resources Officer (CHRO)', 'chro', true),
    ('Chief Legal Officer (CLO)', 'clo', true),
    ('Chief Security Officer (CSO)', 'cso', true),
    ('Marketing Director', 'marketing-director', false),
    ('Marketing Manager', 'marketing-manager', false),
    ('Senior Marketing Manager', 'senior-marketing-manager', false),
    ('Marketing Specialist', 'marketing-specialist', false),
    ('Content Marketing Manager', 'content-marketing-manager', false),
    ('Digital Marketing Manager', 'digital-marketing-manager', false),
    ('Social Media Manager', 'social-media-manager', false),
    ('Email Marketing Specialist', 'email-marketing-specialist', false),
    ('Brand Manager', 'brand-manager', false),
    ('Product Marketing Manager', 'product-marketing-manager', false),
    ('Growth Marketing Manager', 'growth-marketing-manager', false),
    ('Marketing Coordinator', 'marketing-coordinator', false),
    ('Marketing Analyst', 'marketing-analyst', false),
    ('Marketing Assistant', 'marketing-assistant', false),
    ('SEO Specialist', 'seo-specialist', false),
    ('PPC Specialist', 'ppc-specialist', false),
    ('Marketing Operations Manager', 'marketing-ops-manager', false),
    ('Lead Tech', 'lead-tech', false),
    ('Procurement Manager', 'procurement', false),
    ('Maintenance Manager', 'maintenance', false),
    ('HR Manager', 'hr-manager', false)
)
INSERT INTO public.positions (title, code, is_executive, is_active)
SELECT s.title, s.code, s.is_executive, true
FROM seed s
WHERE NOT EXISTS (
  SELECT 1 FROM public.positions p
  WHERE p.code = s.code AND p.is_active = true
);

-- Add foreign key to employees table to reference positions
-- First check if position_id column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'position_id'
  ) THEN
    ALTER TABLE public.employees 
    ADD COLUMN position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL;
    
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_employees_position_id ON public.employees(position_id);
    
    -- Try to link existing employees to positions by matching position text to title
    -- This is best-effort matching
    UPDATE public.employees e
    SET position_id = p.id
    FROM public.positions p
    WHERE e.position_id IS NULL
    AND (
      LOWER(e.position) = LOWER(p.title)
      OR LOWER(e.position) = LOWER(p.code)
      OR e.position ILIKE '%' || p.title || '%'
    )
    AND p.is_active = true;
  END IF;
END $$;

COMMENT ON TABLE public.positions IS 'Centralized employee position/role definitions managed by HR and CEO';
COMMENT ON COLUMN public.positions.code IS 'Unique slug identifier (e.g., marketing-manager)';
COMMENT ON COLUMN public.positions.is_executive IS 'True for C-suite and executive positions';
COMMENT ON COLUMN public.positions.is_active IS 'False to deactivate positions without deleting them';

