-- Link CFO budgets to CEO approvals workflow
-- This creates bi-directional financial flows between CFO and CEO

-- Add foreign key from ceo_financial_approvals to budgets
ALTER TABLE public.ceo_financial_approvals 
  ADD COLUMN IF NOT EXISTS budget_id UUID REFERENCES public.budgets(id),
  ADD COLUMN IF NOT EXISTS linked_invoice_id UUID REFERENCES public.invoices(id);

-- Create unified budget-approval view
CREATE OR REPLACE VIEW public.budget_approval_status AS
SELECT 
  b.id as budget_id,
  b.period,
  b.dept,
  b.amount as budgeted_amount,
  CASE 
    WHEN a.id IS NOT NULL THEN a.status
    ELSE 'not_submitted'
  END as approval_status,
  a.id as approval_id,
  a.reviewed_by,
  a.reviewed_at,
  a.review_notes
FROM public.budgets b
LEFT JOIN public.ceo_financial_approvals a ON a.budget_id = b.id;

-- Function to create CEO approval from CFO budget request
CREATE OR REPLACE FUNCTION public.create_budget_approval(
  budget_uuid UUID,
  request_description TEXT DEFAULT NULL
)
RETURNS UUID 
SECURITY DEFINER
AS $$
DECLARE
  approval_id UUID;
  budget_record RECORD;
BEGIN
  -- Get budget details
  SELECT period, dept, amount INTO budget_record
  FROM public.budgets WHERE id = budget_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Budget not found: %', budget_uuid;
  END IF;
  
  -- Create CEO approval request
  INSERT INTO public.ceo_financial_approvals (
    request_type,
    requester_name,
    department_id,
    amount,
    description,
    budget_id,
    requester_id,
    priority,
    status
  ) VALUES (
    'budget',
    'CFO - ' || COALESCE(request_description, 'Budget Request'),
    NULL, -- Can link to department if we have dept table
    budget_record.amount,
    COALESCE(request_description, 
      'Budget approval needed for ' || budget_record.dept || ' department for period ' || budget_record.period
    ),
    budget_uuid,
    auth.uid(),
    CASE 
      WHEN budget_record.amount > 100000 THEN 'high'
      WHEN budget_record.amount > 50000 THEN 'normal'
      ELSE 'low'
    END,
    'pending'
  ) RETURNING id INTO approval_id;
  
  RETURN approval_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_budget_approval(UUID, TEXT) TO authenticated;

-- Function to auto-approve small budgets
CREATE OR REPLACE FUNCTION public.auto_approve_small_budgets()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  total_amount NUMERIC;
BEGIN
  -- Check total pending approvals
  SELECT COALESCE(SUM(amount), 0) INTO total_amount
  FROM public.ceo_financial_approvals
  WHERE status = 'pending' AND request_type = 'budget';
  
  -- Auto-approve if under threshold
  IF NEW.amount <= 10000 AND total_amount <= 50000 THEN
    UPDATE public.ceo_financial_approvals
    SET 
      status = 'approved',
      reviewed_by = (SELECT id FROM auth.users WHERE email = 'craven@usa.com' LIMIT 1),
      reviewed_at = NOW(),
      review_notes = 'Auto-approved: Under threshold'
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-approval
DROP TRIGGER IF EXISTS trigger_auto_approve_budget ON public.ceo_financial_approvals;
CREATE TRIGGER trigger_auto_approve_budget
  AFTER INSERT ON public.ceo_financial_approvals
  FOR EACH ROW
  WHEN (NEW.request_type = 'budget')
  EXECUTE FUNCTION public.auto_approve_small_budgets();

-- Create payment flow linking payroll to invoices
ALTER TABLE public.payroll 
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id),
  ADD COLUMN IF NOT EXISTS payment_run_id UUID REFERENCES public.payment_runs(id);

-- Function to generate invoices from approved payroll
CREATE OR REPLACE FUNCTION public.generate_payroll_invoice(
  payroll_start DATE, 
  payroll_end DATE
)
RETURNS TABLE(invoice_id UUID, total_amount NUMERIC, employee_count INTEGER) 
SECURITY DEFINER
AS $$
DECLARE
  new_invoice_id UUID;
  total_pay NUMERIC;
  emp_count INTEGER;
BEGIN
  -- Calculate totals
  SELECT 
    COALESCE(SUM(net_pay), 0),
    COUNT(DISTINCT employee_id)
  INTO total_pay, emp_count
  FROM public.payroll
  WHERE pay_period_start >= payroll_start
    AND pay_period_end <= payroll_end
    AND payment_status = 'pending'
    AND invoice_id IS NULL;
  
  -- Create invoice
  INSERT INTO public.invoices (
    vendor,
    invoice_number,
    amount,
    invoice_date,
    due_date,
    status
  ) VALUES (
    'Internal Payroll',
    'PAY-' || payroll_start::text || '-' || payroll_end::text,
    total_pay,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    'approved'
  ) RETURNING id INTO new_invoice_id;
  
  -- Link payroll records
  UPDATE public.payroll
  SET invoice_id = new_invoice_id
  WHERE pay_period_start >= payroll_start
    AND pay_period_end <= payroll_end
    AND payment_status = 'pending'
    AND invoice_id IS NULL;
  
  -- Return results
  invoice_id := new_invoice_id;
  total_amount := total_pay;
  employee_count := emp_count;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.generate_payroll_invoice(DATE, DATE) TO authenticated;

-- Create view for payroll summary by department
CREATE OR REPLACE VIEW public.payroll_summary AS
SELECT 
  e.id as employee_id,
  e.first_name || ' ' || e.last_name as employee_name,
  e.department_id,
  d.name as department_name,
  SUM(p.gross_pay) as total_gross,
  SUM(p.net_pay) as total_net,
  COUNT(p.id) as pay_periods,
  MAX(p.pay_period_end) as last_payment_date
FROM public.employees e
JOIN public.departments d ON d.id = e.department_id
LEFT JOIN public.payroll p ON p.employee_id = e.id
WHERE e.employment_status = 'active'
GROUP BY e.id, e.first_name, e.last_name, e.department_id, d.name;

-- Create index for faster budget lookups
CREATE INDEX IF NOT EXISTS idx_ceo_approvals_budget ON public.ceo_financial_approvals(budget_id);
CREATE INDEX IF NOT EXISTS idx_ceo_approvals_invoice ON public.ceo_financial_approvals(linked_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payroll_invoice ON public.payroll(invoice_id);

-- Create notification function for budget approvals
CREATE OR REPLACE FUNCTION public.notify_budget_approved()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  -- When CEO approves budget, notify CFO
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- TODO: Integrate with send-notification edge function
    RAISE NOTICE 'Budget approved: $% for %', NEW.amount, NEW.description;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_budget_approved
  AFTER UPDATE ON public.ceo_financial_approvals
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status = 'pending')
  EXECUTE FUNCTION public.notify_budget_approved();

