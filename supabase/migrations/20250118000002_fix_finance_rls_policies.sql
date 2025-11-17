-- Fix RLS policies for Finance Department System
-- Make policies more permissive for CFO portal access

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Authenticated users can view all expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can view own expense requests" ON public.expense_requests;
DROP POLICY IF EXISTS "Users can view expense requests" ON public.expense_requests;
DROP POLICY IF EXISTS "Finance team can manage budgets" ON public.budgets;
DROP POLICY IF EXISTS "Department heads can view own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Finance team can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Finance team can manage receivables" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Finance team can manage reports" ON public.financial_reports;

-- Expense categories: Allow all authenticated users to view
CREATE POLICY "Authenticated users can view expense categories"
ON public.expense_categories FOR SELECT
TO authenticated
USING (true);

-- Expense requests: Allow all authenticated users to view (for CFO portal)
CREATE POLICY "Authenticated users can view expense requests"
ON public.expense_requests FOR SELECT
TO authenticated
USING (true);

-- Budgets: Allow all authenticated users to view (for CFO portal)
CREATE POLICY "Authenticated users can view budgets"
ON public.budgets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage budgets"
ON public.budgets FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Invoices: Allow all authenticated users to view (for CFO portal)
CREATE POLICY "Authenticated users can manage invoices"
ON public.invoices FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Accounts Receivable: Allow all authenticated users to view (for CFO portal)
CREATE POLICY "Authenticated users can manage receivables"
ON public.accounts_receivable FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Financial Reports: Allow all authenticated users to view (for CFO portal)
CREATE POLICY "Authenticated users can manage reports"
ON public.financial_reports FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure expense categories have seed data if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.expense_categories LIMIT 1) THEN
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
  END IF;
END $$;

