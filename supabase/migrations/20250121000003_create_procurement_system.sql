-- Procurement System for COO/CFO collaboration
-- Handles vendor management, purchase orders, and contract lifecycle

-- Procurement categories
CREATE TABLE IF NOT EXISTS public.procurement_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  budget_allocated NUMERIC(12,2),
  responsible_department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Purchase orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL,
  vendor_id UUID REFERENCES public.partner_vendors(id),
  category_id UUID REFERENCES public.procurement_categories(id),
  total_amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  requested_by UUID REFERENCES auth.users(id),
  approval_workflow TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  expected_delivery DATE,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Vendor contracts
CREATE TABLE IF NOT EXISTS public.vendor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.partner_vendors(id),
  contract_type TEXT NOT NULL,
  contract_value NUMERIC(12,2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_terms TEXT,
  auto_renew BOOLEAN DEFAULT false,
  terms_document_url TEXT,
  status TEXT DEFAULT 'active',
  signed_by UUID REFERENCES auth.users(id),
  signed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Procurement requisitions
CREATE TABLE IF NOT EXISTS public.procurement_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_number TEXT UNIQUE NOT NULL,
  requested_by UUID REFERENCES auth.users(id),
  department_id UUID REFERENCES public.departments(id),
  category_id UUID REFERENCES public.procurement_categories(id),
  description TEXT NOT NULL,
  estimated_cost NUMERIC(12,2),
  justification TEXT,
  priority TEXT DEFAULT 'normal',
  approval_chain UUID[] DEFAULT ARRAY[]::UUID[],
  current_approver_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'submitted',
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.procurement_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_requisitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Finance and COO can manage procurement"
  ON public.procurement_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('cfo', 'coo'))
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create requisitions"
  ON public.procurement_requisitions FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Users can view their requisitions"
  ON public.procurement_requisitions FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Executives can view all requisitions"
  ON public.procurement_requisitions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "COO and CFO can manage POs"
  ON public.purchase_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('coo', 'cfo'))
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "COO and CFO can manage contracts"
  ON public.vendor_contracts FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role IN ('coo', 'cfo'))
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX idx_pos_vendor ON public.purchase_orders(vendor_id);
CREATE INDEX idx_pos_status ON public.purchase_orders(status);
CREATE INDEX idx_contracts_vendor ON public.vendor_contracts(vendor_id);
CREATE INDEX idx_contracts_expiry ON public.vendor_contracts(end_date) WHERE status = 'active';
CREATE INDEX idx_requisitions_status ON public.procurement_requisitions(status);
CREATE INDEX idx_requisitions_approver ON public.procurement_requisitions(current_approver_id);

-- Sample categories
INSERT INTO public.procurement_categories (category_name, description, budget_allocated) VALUES
  ('IT Hardware', 'Computers, servers, networking equipment', 50000),
  ('Software & Licenses', 'SaaS subscriptions, software licenses', 25000),
  ('Marketing', 'Advertising, campaigns, promotional materials', 35000),
  ('Logistics', 'Shipping, warehouse, delivery supplies', 40000),
  ('Office Supplies', 'Stationery, furniture, office equipment', 15000)
ON CONFLICT (category_name) DO NOTHING;

