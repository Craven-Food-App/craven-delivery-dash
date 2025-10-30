-- Employee Equity System
-- Adds equity tracking for C-suite and key executives

-- Equity/Shareholder table for C-suite and key executives
CREATE TABLE IF NOT EXISTS public.employee_equity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shares_percentage NUMERIC(5, 2) NOT NULL CHECK (shares_percentage > 0 AND shares_percentage <= 100),
  shares_total INTEGER, -- Total number of shares
  equity_type TEXT NOT NULL CHECK (equity_type IN ('stock', 'options', 'phantom')),
  vesting_schedule JSONB DEFAULT '{"type": "none", "duration_months": 0}'::jsonb,
  grant_date DATE NOT NULL DEFAULT CURRENT_DATE,
  strike_price NUMERIC(10, 2), -- For options
  authorized_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id)
);

-- Enable RLS
ALTER TABLE public.employee_equity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "CEO can manage equity"
ON public.employee_equity FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can view equity"
ON public.employee_equity FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email')
);

-- Create index for performance
CREATE INDEX idx_equity_employee ON public.employee_equity(employee_id);
CREATE INDEX idx_equity_percentage ON public.employee_equity(shares_percentage);

-- Add comment for documentation
COMMENT ON TABLE public.employee_equity IS 'Tracks equity ownership for C-suite executives and key personnel';
COMMENT ON COLUMN public.employee_equity.shares_percentage IS 'Ownership percentage (e.g., 10.50 for 10.5%)';

