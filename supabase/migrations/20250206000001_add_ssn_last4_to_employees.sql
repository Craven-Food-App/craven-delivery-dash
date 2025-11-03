-- Add SSN last 4 digits to employees table for time clock verification

ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS ssn_last4 TEXT;

-- Add comment
COMMENT ON COLUMN public.employees.ssn_last4 IS 'Last 4 digits of Social Security Number for time clock verification';

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_employees_ssn_last4 ON public.employees(ssn_last4) WHERE ssn_last4 IS NOT NULL;

