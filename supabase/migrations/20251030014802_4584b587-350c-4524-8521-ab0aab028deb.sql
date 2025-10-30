-- Create employee_equity table
CREATE TABLE IF NOT EXISTS public.employee_equity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shares_percentage NUMERIC(5,2) NOT NULL CHECK (shares_percentage >= 0 AND shares_percentage <= 100),
  equity_type TEXT NOT NULL DEFAULT 'common_stock',
  vesting_schedule JSONB DEFAULT '{"type": "4_year_1_cliff", "duration_months": 48, "cliff_months": 12}'::jsonb,
  strike_price NUMERIC(10,2),
  grant_date DATE DEFAULT CURRENT_DATE,
  vesting_start_date DATE DEFAULT CURRENT_DATE,
  authorized_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one equity record per employee
  UNIQUE(employee_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employee_equity_employee_id ON public.employee_equity(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_equity_equity_type ON public.employee_equity(equity_type);

-- Enable RLS
ALTER TABLE public.employee_equity ENABLE ROW LEVEL SECURITY;

-- CEO can manage all equity
CREATE POLICY "ceo_all_employee_equity" ON public.employee_equity
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ceo_access_credentials
      WHERE user_email = (auth.jwt() ->> 'email')
    )
  );

-- Board members can view all equity
CREATE POLICY "board_view_employee_equity" ON public.employee_equity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid() AND role IN ('board', 'ceo')
    )
  );

-- Employees can view their own equity
CREATE POLICY "employees_view_own_equity" ON public.employee_equity
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_employee_equity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_equity_updated_at
  BEFORE UPDATE ON public.employee_equity
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_equity_updated_at();