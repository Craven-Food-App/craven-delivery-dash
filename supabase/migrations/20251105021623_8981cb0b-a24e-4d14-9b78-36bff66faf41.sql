-- Create equity_grants table for board-governed equity issuance
CREATE TABLE IF NOT EXISTS public.equity_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executive_id UUID REFERENCES public.exec_users(id),
  employee_id UUID REFERENCES public.employees(id),
  granted_by UUID REFERENCES public.exec_users(id),
  grant_date DATE NOT NULL,
  shares_total BIGINT NOT NULL,
  shares_percentage DECIMAL(5,2) NOT NULL,
  share_class VARCHAR(50) DEFAULT 'Common Stock',
  strike_price DECIMAL(10,4) NOT NULL,
  vesting_schedule JSONB NOT NULL,
  consideration_type VARCHAR(100),
  consideration_value DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'draft',
  board_resolution_id UUID,
  stock_issuance_doc_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  notes TEXT
);

-- Create equity_grant_history table for audit trail
CREATE TABLE IF NOT EXISTS public.equity_grant_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID REFERENCES public.equity_grants(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES public.exec_users(id),
  change_type VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.equity_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equity_grant_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for equity_grants
CREATE POLICY "Board and CEO can view all grants"
  ON public.equity_grants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid()
      AND (role IN ('board_member', 'ceo', 'cfo'))
    )
  );

CREATE POLICY "Board and CEO can create grants"
  ON public.equity_grants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid()
      AND (role IN ('board_member', 'ceo'))
    )
  );

CREATE POLICY "Board and CEO can update grants"
  ON public.equity_grants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid()
      AND (role IN ('board_member', 'ceo'))
    )
  );

CREATE POLICY "Board and CEO can delete grants"
  ON public.equity_grants
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid()
      AND (role IN ('board_member', 'ceo'))
    )
  );

-- RLS Policies for equity_grant_history
CREATE POLICY "Execs can view grant history"
  ON public.equity_grant_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exec_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert grant history"
  ON public.equity_grant_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_equity_grants_executive ON public.equity_grants(executive_id);
CREATE INDEX idx_equity_grants_status ON public.equity_grants(status);
CREATE INDEX idx_equity_grant_history_grant ON public.equity_grant_history(grant_id);