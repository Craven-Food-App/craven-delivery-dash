-- Complete Employee Management System for CEO Portal
-- Handles hiring, firing, promotions, departments, and payroll

-- Departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  budget NUMERIC(12, 2) DEFAULT 0,
  head_employee_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Employees table (complete HR system)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  
  -- Employment details
  department_id UUID REFERENCES public.departments(id),
  position TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern')),
  employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'on-leave', 'suspended', 'terminated')),
  
  -- Dates
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  termination_date DATE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Compensation
  salary NUMERIC(12, 2),
  hourly_rate NUMERIC(8, 2),
  commission_rate NUMERIC(5, 2) DEFAULT 0,
  
  -- Location
  work_location TEXT,
  remote_allowed BOOLEAN DEFAULT false,
  
  -- Manager
  manager_id UUID REFERENCES public.employees(id),
  
  -- Personal
  date_of_birth DATE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- System
  hired_by UUID REFERENCES auth.users(id),
  terminated_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Employee history (promotions, raises, role changes)
CREATE TABLE IF NOT EXISTS public.employee_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('hired', 'promoted', 'demoted', 'raise', 'transfer', 'suspended', 'terminated', 'returned')),
  
  -- Before/After for tracking changes
  previous_position TEXT,
  new_position TEXT,
  previous_salary NUMERIC(12, 2),
  new_salary NUMERIC(12, 2),
  previous_department_id UUID REFERENCES public.departments(id),
  new_department_id UUID REFERENCES public.departments(id),
  
  reason TEXT,
  notes TEXT,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payroll records
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  
  -- Earnings
  base_pay NUMERIC(12, 2) NOT NULL DEFAULT 0,
  overtime_pay NUMERIC(12, 2) DEFAULT 0,
  commission NUMERIC(12, 2) DEFAULT 0,
  bonus NUMERIC(12, 2) DEFAULT 0,
  
  -- Deductions
  taxes NUMERIC(12, 2) DEFAULT 0,
  benefits NUMERIC(12, 2) DEFAULT 0,
  other_deductions NUMERIC(12, 2) DEFAULT 0,
  
  -- Net
  gross_pay NUMERIC(12, 2) GENERATED ALWAYS AS (base_pay + overtime_pay + commission + bonus) STORED,
  total_deductions NUMERIC(12, 2) GENERATED ALWAYS AS (taxes + benefits + other_deductions) STORED,
  net_pay NUMERIC(12, 2) GENERATED ALWAYS AS (base_pay + overtime_pay + commission + bonus - taxes - benefits - other_deductions) STORED,
  
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processed', 'paid', 'failed')),
  payment_date DATE,
  payment_method TEXT,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Performance reviews
CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id),
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  review_period_start DATE,
  review_period_end DATE,
  
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  strengths TEXT,
  areas_for_improvement TEXT,
  goals TEXT,
  comments TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add foreign key for department head
ALTER TABLE public.departments 
ADD CONSTRAINT fk_department_head 
FOREIGN KEY (head_employee_id) REFERENCES public.employees(id);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies (CEO and admins can manage everything)
CREATE POLICY "CEO can manage all departments"
ON public.departments FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "CEO can manage all employees"
ON public.employees FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

CREATE POLICY "CEO can view all employee history"
ON public.employee_history FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "CEO can manage payroll"
ON public.payroll FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "CEO can manage reviews"
ON public.performance_reviews FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Indexes for performance
CREATE INDEX idx_employees_department ON public.employees(department_id);
CREATE INDEX idx_employees_manager ON public.employees(manager_id);
CREATE INDEX idx_employees_status ON public.employees(employment_status);
CREATE INDEX idx_employees_email ON public.employees(email);
CREATE INDEX idx_employee_history_employee ON public.employee_history(employee_id);
CREATE INDEX idx_payroll_employee ON public.payroll(employee_id);
CREATE INDEX idx_payroll_period ON public.payroll(pay_period_start, pay_period_end);
CREATE INDEX idx_reviews_employee ON public.performance_reviews(employee_id);

-- Function to generate employee number
CREATE OR REPLACE FUNCTION generate_employee_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.employees
  WHERE employee_number ~ '^EMP[0-9]+$';
  
  RETURN 'EMP' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate employee number
CREATE OR REPLACE FUNCTION set_employee_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_number IS NULL THEN
    NEW.employee_number := generate_employee_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_employee_number
BEFORE INSERT ON public.employees
FOR EACH ROW
EXECUTE FUNCTION set_employee_number();

-- Insert default departments
INSERT INTO public.departments (name, description, budget) VALUES
  ('Executive', 'C-Suite and Executive Leadership', 500000),
  ('Operations', 'Daily Operations and Management', 300000),
  ('Technology', 'Software Development and IT', 400000),
  ('Marketing', 'Marketing and Brand Management', 250000),
  ('Customer Support', 'Customer Service and Support', 200000),
  ('Finance', 'Accounting and Financial Management', 300000),
  ('Human Resources', 'HR and Talent Management', 150000),
  ('Logistics', 'Delivery and Fleet Management', 350000)
ON CONFLICT (name) DO NOTHING;

