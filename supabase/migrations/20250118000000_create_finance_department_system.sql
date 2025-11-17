-- ============================================
-- COMPLETE FINANCE DEPARTMENT SYSTEM
-- ============================================

-- Finance Department Positions/Roles Hierarchy
CREATE TABLE IF NOT EXISTS public.finance_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_title TEXT NOT NULL UNIQUE,
  position_level INTEGER NOT NULL, -- 1=CFO, 2=VP/Director, 3=Manager, 4=Senior, 5=Junior
  department TEXT NOT NULL DEFAULT 'Finance',
  reports_to_position_id UUID REFERENCES public.finance_positions(id),
  min_salary NUMERIC(12, 2),
  max_salary NUMERIC(12, 2),
  required_experience_years INTEGER DEFAULT 0,
  required_education TEXT, -- 'bachelor', 'master', 'mba', 'cpa', 'cfa'
  key_responsibilities TEXT[],
  required_skills TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Finance Employees (links to employees table)
CREATE TABLE IF NOT EXISTS public.finance_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.finance_positions(id),
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'on-leave', 'terminated', 'suspended')),
  termination_date DATE,
  manager_id UUID REFERENCES public.finance_employees(id),
  access_level INTEGER DEFAULT 1 CHECK (access_level BETWEEN 1 AND 10), -- 10=CFO, 1=Junior
  can_approve_expenses_up_to NUMERIC(12, 2) DEFAULT 0, -- Max amount they can approve
  can_create_budgets BOOLEAN DEFAULT false,
  can_view_all_financials BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id)
);

-- Expense Categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE, -- e.g., 'TRAVEL', 'OFFICE', 'MARKETING'
  parent_category_id UUID REFERENCES public.expense_categories(id),
  description TEXT,
  requires_receipt BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  approval_threshold NUMERIC(12, 2), -- Amount requiring approval
  budget_code TEXT, -- For accounting integration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Expense Requests (Detailed)
CREATE TABLE IF NOT EXISTS public.expense_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE NOT NULL, -- Auto-generated: EXP-2025-001
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  requester_employee_id UUID REFERENCES public.employees(id),
  department_id UUID REFERENCES public.departments(id),
  
  -- Expense Details
  expense_category_id UUID NOT NULL REFERENCES public.expense_categories(id),
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT NOT NULL,
  business_purpose TEXT NOT NULL,
  justification TEXT,
  
  -- Dates
  expense_date DATE NOT NULL,
  requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE, -- When payment is needed
  
  -- Approval Workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'paid', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Approval Chain
  approver_id UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Payment Details
  payment_method TEXT CHECK (payment_method IN ('company_card', 'reimbursement', 'direct_pay', 'wire_transfer')),
  vendor_name TEXT,
  vendor_account_number TEXT,
  
  -- Attachments
  receipt_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  supporting_documents TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Accounting
  gl_account_code TEXT, -- General Ledger account
  cost_center TEXT,
  project_code TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Budgets
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_name TEXT NOT NULL,
  budget_year INTEGER NOT NULL,
  budget_quarter INTEGER CHECK (budget_quarter BETWEEN 1 AND 4),
  department_id UUID REFERENCES public.departments(id),
  category_id UUID REFERENCES public.expense_categories(id),
  
  allocated_amount NUMERIC(12, 2) NOT NULL,
  spent_amount NUMERIC(12, 2) DEFAULT 0,
  committed_amount NUMERIC(12, 2) DEFAULT 0, -- Approved but not yet paid
  remaining_amount NUMERIC(12, 2) GENERATED ALWAYS AS (allocated_amount - spent_amount - committed_amount) STORED,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(budget_year, budget_quarter, department_id, category_id)
);

-- Invoices (Accounts Payable)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  vendor_id UUID, -- Could reference vendors table
  vendor_name TEXT NOT NULL,
  vendor_email TEXT,
  vendor_address TEXT,
  
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  tax_amount NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
  currency TEXT DEFAULT 'USD',
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed', 'cancelled')),
  
  department_id UUID REFERENCES public.departments(id),
  expense_category_id UUID REFERENCES public.expense_categories(id),
  budget_id UUID REFERENCES public.budgets(id),
  
  line_items JSONB DEFAULT '[]'::jsonb, -- Array of {description, quantity, unit_price, amount}
  
  -- Approval
  approver_id UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Payment
  payment_method TEXT,
  payment_date DATE,
  payment_reference TEXT,
  paid_by UUID REFERENCES auth.users(id),
  
  -- Attachments
  invoice_file_url TEXT,
  supporting_documents TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Accounts Receivable
CREATE TABLE IF NOT EXISTS public.accounts_receivable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  tax_amount NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
  paid_amount NUMERIC(12, 2) DEFAULT 0,
  -- FIX: Reference base columns directly instead of total_amount
  outstanding_amount NUMERIC(12, 2) GENERATED ALWAYS AS ((amount + tax_amount) - paid_amount) STORED,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'written_off')),
  
  order_id UUID REFERENCES public.orders(id), -- Link to order if applicable
  payment_terms TEXT DEFAULT 'Net 30',
  
  -- Payment tracking
  payments JSONB DEFAULT '[]'::jsonb, -- Array of {date, amount, method, reference}
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financial Reports
CREATE TABLE IF NOT EXISTS public.financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('income_statement', 'balance_sheet', 'cash_flow', 'budget_variance', 'expense_analysis', 'custom')),
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Report Data
  report_data JSONB NOT NULL, -- Structured report data
  summary TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'archived')),
  is_public BOOLEAN DEFAULT false,
  
  -- Attachments
  pdf_url TEXT,
  excel_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Expense Approval Workflow Log
CREATE TABLE IF NOT EXISTS public.expense_approval_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_request_id UUID NOT NULL REFERENCES public.expense_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'returned', 'escalated')),
  actor_id UUID REFERENCES auth.users(id),
  actor_name TEXT,
  comments TEXT,
  previous_status TEXT,
  new_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_expense_requests_status ON public.expense_requests(status);
CREATE INDEX idx_expense_requests_requester ON public.expense_requests(requester_id);
CREATE INDEX idx_expense_requests_date ON public.expense_requests(expense_date DESC);
CREATE INDEX idx_expense_requests_category ON public.expense_requests(expense_category_id);
CREATE INDEX idx_budgets_year_quarter ON public.budgets(budget_year, budget_quarter);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_ar_status ON public.accounts_receivable(status);
CREATE INDEX idx_ar_due_date ON public.accounts_receivable(due_date);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate expense request number
CREATE OR REPLACE FUNCTION generate_expense_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.expense_requests
  WHERE request_number LIKE 'EXP-' || year_part || '-%';
  
  RETURN 'EXP-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-generate expense number
CREATE OR REPLACE FUNCTION set_expense_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    NEW.request_number := generate_expense_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_expense_number
BEFORE INSERT ON public.expense_requests
FOR EACH ROW
EXECUTE FUNCTION set_expense_number();

-- Update budget spent amount
CREATE OR REPLACE FUNCTION update_budget_spent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    UPDATE public.budgets
    SET spent_amount = spent_amount + NEW.amount
    WHERE id = NEW.budget_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_budget_spent
AFTER UPDATE ON public.expense_requests
FOR EACH ROW
EXECUTE FUNCTION update_budget_spent();

-- ============================================
-- SEED DATA
-- ============================================

-- Finance Positions Hierarchy
INSERT INTO public.finance_positions (position_title, position_level, reports_to_position_id, min_salary, max_salary, required_experience_years, required_education, key_responsibilities, required_skills) VALUES
  ('Chief Financial Officer (CFO)', 1, NULL, 200000, 400000, 15, 'mba', 
   ARRAY['Strategic financial planning', 'Investor relations', 'Capital allocation', 'Risk management', 'Board reporting'],
   ARRAY['Financial strategy', 'M&A', 'Capital markets', 'Leadership']),
  
  ('VP of Finance', 2, (SELECT id FROM public.finance_positions WHERE position_title = 'Chief Financial Officer (CFO)' LIMIT 1), 150000, 250000, 10, 'mba',
   ARRAY['Financial operations oversight', 'Team management', 'Process improvement', 'Compliance'],
   ARRAY['Financial analysis', 'Team leadership', 'Process optimization']),
  
  ('Director of Accounting', 2, (SELECT id FROM public.finance_positions WHERE position_title = 'Chief Financial Officer (CFO)' LIMIT 1), 120000, 180000, 8, 'cpa',
   ARRAY['Accounting operations', 'Financial reporting', 'Audit coordination', 'Team management'],
   ARRAY['GAAP', 'Financial reporting', 'Audit', 'Team management']),
  
  ('Director of FP&A', 2, (SELECT id FROM public.finance_positions WHERE position_title = 'Chief Financial Officer (CFO)' LIMIT 1), 120000, 180000, 8, 'mba',
   ARRAY['Financial planning', 'Budgeting', 'Forecasting', 'Business analysis'],
   ARRAY['Financial modeling', 'Budgeting', 'Forecasting', 'Data analysis']),
  
  ('Accounting Manager', 3, (SELECT id FROM public.finance_positions WHERE position_title = 'Director of Accounting' LIMIT 1), 80000, 120000, 5, 'bachelor',
   ARRAY['Month-end close', 'Team supervision', 'Process improvement', 'Compliance'],
   ARRAY['Accounting', 'Supervision', 'Process improvement']),
  
  ('Accounts Payable Manager', 3, (SELECT id FROM public.finance_positions WHERE position_title = 'Director of Accounting' LIMIT 1), 70000, 100000, 5, 'bachelor',
   ARRAY['Vendor management', 'Invoice processing', 'Payment processing', 'Team management'],
   ARRAY['AP processes', 'Vendor relations', 'Team management']),
  
  ('Accounts Receivable Manager', 3, (SELECT id FROM public.finance_positions WHERE position_title = 'Director of Accounting' LIMIT 1), 70000, 100000, 5, 'bachelor',
   ARRAY['Customer billing', 'Collections', 'Cash flow management', 'Team management'],
   ARRAY['AR processes', 'Collections', 'Cash management']),
  
  ('Senior Accountant', 4, (SELECT id FROM public.finance_positions WHERE position_title = 'Accounting Manager' LIMIT 1), 65000, 90000, 3, 'bachelor',
   ARRAY['Journal entries', 'Account reconciliation', 'Financial analysis', 'Mentoring'],
   ARRAY['Accounting', 'Excel', 'Analysis']),
  
  ('Staff Accountant', 5, (SELECT id FROM public.finance_positions WHERE position_title = 'Accounting Manager' LIMIT 1), 50000, 70000, 1, 'bachelor',
   ARRAY['Data entry', 'Account reconciliation', 'Support month-end close'],
   ARRAY['Accounting basics', 'Excel', 'Attention to detail']),
  
  ('Accounts Payable Specialist', 5, (SELECT id FROM public.finance_positions WHERE position_title = 'Accounts Payable Manager' LIMIT 1), 45000, 65000, 1, 'bachelor',
   ARRAY['Invoice processing', 'Vendor communication', 'Payment processing'],
   ARRAY['Data entry', 'Communication', 'Organization']),
  
  ('Accounts Receivable Specialist', 5, (SELECT id FROM public.finance_positions WHERE position_title = 'Accounts Receivable Manager' LIMIT 1), 45000, 65000, 1, 'bachelor',
   ARRAY['Customer billing', 'Payment processing', 'Collections follow-up'],
   ARRAY['Data entry', 'Communication', 'Collections'])
ON CONFLICT (position_title) DO NOTHING;

-- Expense Categories
INSERT INTO public.expense_categories (name, code, description, requires_receipt, requires_approval, approval_threshold, budget_code) VALUES
  ('Travel', 'TRAVEL', 'Business travel expenses', true, true, 100, '6001'),
  ('Meals & Entertainment', 'MEALS', 'Business meals and client entertainment', true, true, 50, '6002'),
  ('Office Supplies', 'OFFICE', 'Office supplies and equipment', true, true, 200, '6003'),
  ('Software & Subscriptions', 'SOFTWARE', 'Software licenses and subscriptions', true, true, 500, '6004'),
  ('Marketing & Advertising', 'MARKETING', 'Marketing and advertising expenses', true, true, 1000, '6005'),
  ('Professional Services', 'PROF_SERVICES', 'Legal, consulting, and professional services', true, true, 500, '6006'),
  ('Utilities', 'UTILITIES', 'Office utilities and services', true, true, 1000, '6007'),
  ('Rent & Facilities', 'RENT', 'Office rent and facility costs', true, true, 5000, '6008'),
  ('Equipment', 'EQUIPMENT', 'Capital equipment purchases', true, true, 2000, '6009'),
  ('Training & Development', 'TRAINING', 'Employee training and development', true, true, 500, '6010'),
  ('Insurance', 'INSURANCE', 'Business insurance premiums', true, true, 5000, '6011'),
  ('Other', 'OTHER', 'Other business expenses', true, true, 100, '6099')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.finance_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_approval_log ENABLE ROW LEVEL SECURITY;

-- Finance positions: Viewable by all authenticated users
CREATE POLICY "Anyone can view finance positions"
ON public.finance_positions FOR SELECT
TO authenticated
USING (true);

-- Finance employees: View own, managers view team, CFO views all
CREATE POLICY "Finance employees can view own record"
ON public.finance_employees FOR SELECT
TO authenticated
USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  OR manager_id IN (
    SELECT fe.id FROM public.finance_employees fe
    JOIN public.employees e ON fe.employee_id = e.id
    WHERE e.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cfo')
);

-- Expense categories: Viewable by all
CREATE POLICY "Anyone can view expense categories"
ON public.expense_categories FOR SELECT
TO authenticated
USING (is_active = true);

-- Expense requests: Users can view their own, approvers can view pending, CFO views all
CREATE POLICY "Users can view own expense requests"
ON public.expense_requests FOR SELECT
TO authenticated
USING (
  requester_id = auth.uid()
  OR approver_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cfo')
  OR EXISTS (SELECT 1 FROM public.finance_employees fe
    JOIN public.employees e ON fe.employee_id = e.id
    WHERE e.user_id = auth.uid() AND fe.can_view_all_financials = true)
);

CREATE POLICY "Users can create expense requests"
ON public.expense_requests FOR INSERT
TO authenticated
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update own draft requests"
ON public.expense_requests FOR UPDATE
TO authenticated
USING (
  (requester_id = auth.uid() AND status = 'draft')
  OR approver_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cfo')
);

-- Budgets: Finance team can view all, department heads can view their own
CREATE POLICY "Finance team can manage budgets"
ON public.budgets FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cfo')
  OR EXISTS (SELECT 1 FROM public.finance_employees fe
    JOIN public.employees e ON fe.employee_id = e.id
    WHERE e.user_id = auth.uid() AND fe.can_create_budgets = true)
);

CREATE POLICY "Department heads can view own budgets"
ON public.budgets FOR SELECT
TO authenticated
USING (
  department_id IN (
    SELECT id FROM public.departments WHERE head_employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  )
);

-- Invoices: Finance team manages all, requesters can view their own
CREATE POLICY "Finance team can manage invoices"
ON public.invoices FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cfo')
  OR EXISTS (SELECT 1 FROM public.finance_employees fe
    JOIN public.employees e ON fe.employee_id = e.id
    WHERE e.user_id = auth.uid() AND fe.can_view_all_financials = true)
);

-- Accounts Receivable: Finance team manages all
CREATE POLICY "Finance team can manage receivables"
ON public.accounts_receivable FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cfo')
  OR EXISTS (SELECT 1 FROM public.finance_employees fe
    JOIN public.employees e ON fe.employee_id = e.id
    WHERE e.user_id = auth.uid() AND fe.can_view_all_financials = true)
);

CREATE POLICY "Customers can view own receivables"
ON public.accounts_receivable FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Financial Reports: Finance team can manage, others can view public reports
CREATE POLICY "Finance team can manage reports"
ON public.financial_reports FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cfo')
  OR EXISTS (SELECT 1 FROM public.finance_employees fe
    JOIN public.employees e ON fe.employee_id = e.id
    WHERE e.user_id = auth.uid() AND fe.can_view_all_financials = true)
);

CREATE POLICY "Anyone can view public reports"
ON public.financial_reports FOR SELECT
TO authenticated
USING (is_public = true OR generated_by = auth.uid());

-- Expense approval log: Viewable by requesters and approvers
CREATE POLICY "Users can view own approval logs"
ON public.expense_approval_log FOR SELECT
TO authenticated
USING (
  expense_request_id IN (
    SELECT id FROM public.expense_requests WHERE requester_id = auth.uid() OR approver_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cfo')
);

