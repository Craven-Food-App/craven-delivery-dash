-- Add support for non-employee shareholders and insert Invero Business Trust
-- This allows trusts, entities, and other non-employee shareholders to be tracked

-- Make employee_id nullable to support non-employee shareholders
ALTER TABLE public.employee_equity 
  ALTER COLUMN employee_id DROP NOT NULL;

-- Add columns for non-employee shareholders
ALTER TABLE public.employee_equity 
  ADD COLUMN IF NOT EXISTS shareholder_name TEXT,
  ADD COLUMN IF NOT EXISTS shareholder_type TEXT CHECK (shareholder_type IN ('employee', 'trust', 'entity', 'partnership', 'other')),
  ADD COLUMN IF NOT EXISTS is_majority_shareholder BOOLEAN DEFAULT false;

-- Update constraint: either employee_id OR shareholder_name must be set
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_shareholder_identity'
  ) THEN
    ALTER TABLE public.employee_equity
      ADD CONSTRAINT check_shareholder_identity 
      CHECK (
        (employee_id IS NOT NULL AND shareholder_name IS NULL) OR
        (employee_id IS NULL AND shareholder_name IS NOT NULL)
      );
  END IF;
END $$;

-- Create index for non-employee shareholders
CREATE INDEX IF NOT EXISTS idx_employee_equity_shareholder_name 
  ON public.employee_equity(shareholder_name) 
  WHERE shareholder_name IS NOT NULL;

-- Insert Invero Business Trust as majority shareholder (6,000,000 shares, 60% equity)
INSERT INTO public.employee_equity (
  employee_id,
  shareholder_name,
  shareholder_type,
  shares_percentage,
  shares_total,
  equity_type,
  vesting_schedule,
  is_majority_shareholder,
  grant_date
) VALUES (
  NULL,
  'Invero Business Trust',
  'trust',
  60.00,
  6000000,
  'stock',
  '{"type": "immediate"}'::jsonb,
  true,
  CURRENT_DATE
) ON CONFLICT DO NOTHING;

-- Update comments
COMMENT ON COLUMN public.employee_equity.shareholder_name IS 'Name of non-employee shareholder (trust, entity, etc.)';
COMMENT ON COLUMN public.employee_equity.shareholder_type IS 'Type of shareholder: employee, trust, entity, partnership, other';
COMMENT ON COLUMN public.employee_equity.is_majority_shareholder IS 'True if this shareholder owns >50% of equity';

