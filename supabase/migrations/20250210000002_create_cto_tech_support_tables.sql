-- CTO Tech Support & Code Management Portal Tables
-- IT Help Desk, Code Editing Portal, Developer Onboarding

-- IT Help Desk Tickets
CREATE TABLE IF NOT EXISTS public.it_help_desk_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  requester_id UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  category TEXT NOT NULL CHECK (category IN ('hardware', 'software', 'access', 'password_reset', 'network', 'email', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- IT Help Desk Messages (for ticket conversations)
CREATE TABLE IF NOT EXISTS public.it_help_desk_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.it_help_desk_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal notes vs user-visible messages
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Code Change Requests
CREATE TABLE IF NOT EXISTS public.code_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL UNIQUE,
  developer_id UUID REFERENCES auth.users(id) NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id),
  repository TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  old_content TEXT,
  new_content TEXT NOT NULL,
  commit_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged', 'needs_changes')),
  github_pr_url TEXT,
  github_pr_number INTEGER,
  review_notes TEXT,
  merged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Developer Permissions
CREATE TABLE IF NOT EXISTS public.developer_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES auth.users(id) NOT NULL,
  repository TEXT NOT NULL,
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT false,
  can_merge BOOLEAN DEFAULT false,
  can_deploy BOOLEAN DEFAULT false,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(developer_id, repository)
);

-- Developer Onboarding
CREATE TABLE IF NOT EXISTS public.developer_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  onboarding_status TEXT DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'in_progress', 'completed', 'blocked')),
  github_access_granted BOOLEAN DEFAULT false,
  supabase_access_granted BOOLEAN DEFAULT false,
  dev_environment_setup BOOLEAN DEFAULT false,
  documentation_reviewed BOOLEAN DEFAULT false,
  first_code_review_completed BOOLEAN DEFAULT false,
  onboarding_notes TEXT,
  assigned_mentor_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Knowledge Base Articles
CREATE TABLE IF NOT EXISTS public.tech_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('setup', 'troubleshooting', 'best_practices', 'architecture', 'api', 'deployment', 'other')),
  content TEXT NOT NULL,
  tags TEXT[],
  author_id UUID REFERENCES auth.users(id),
  views_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Code Repository Access Logs (audit trail)
CREATE TABLE IF NOT EXISTS public.code_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES auth.users(id) NOT NULL,
  repository TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('read', 'write', 'merge', 'deploy', 'access_denied')),
  file_path TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.it_help_desk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_help_desk_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - IT Help Desk
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.it_help_desk_tickets;
CREATE POLICY "Users can view their own tickets"
  ON public.it_help_desk_tickets FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto')
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can create tickets" ON public.it_help_desk_tickets;
CREATE POLICY "Users can create tickets"
  ON public.it_help_desk_tickets FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "CTO and assigned agents can update tickets" ON public.it_help_desk_tickets;
CREATE POLICY "CTO and assigned agents can update tickets"
  ON public.it_help_desk_tickets FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto')
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can view messages for their tickets" ON public.it_help_desk_messages;
CREATE POLICY "Users can view messages for their tickets"
  ON public.it_help_desk_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.it_help_desk_tickets 
      WHERE id = ticket_id 
      AND (requester_id = auth.uid() OR assigned_to = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto')
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can send messages on their tickets" ON public.it_help_desk_messages;
CREATE POLICY "Users can send messages on their tickets"
  ON public.it_help_desk_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.it_help_desk_tickets 
      WHERE id = ticket_id 
      AND (requester_id = auth.uid() OR assigned_to = auth.uid())
    )
  );

-- RLS Policies - Code Change Requests
DROP POLICY IF EXISTS "Developers can view their own change requests" ON public.code_change_requests;
CREATE POLICY "Developers can view their own change requests"
  ON public.code_change_requests FOR SELECT
  TO authenticated
  USING (
    developer_id = auth.uid()
    OR reviewer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto')
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Developers can create change requests" ON public.code_change_requests;
CREATE POLICY "Developers can create change requests"
  ON public.code_change_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    developer_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.developer_permissions WHERE developer_id = auth.uid() AND repository = code_change_requests.repository AND can_write = true AND is_active = true)
  );

DROP POLICY IF EXISTS "CTO and reviewers can update change requests" ON public.code_change_requests;
CREATE POLICY "CTO and reviewers can update change requests"
  ON public.code_change_requests FOR UPDATE
  TO authenticated
  USING (
    reviewer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto')
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies - Developer Permissions
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.developer_permissions;
CREATE POLICY "Users can view their own permissions"
  ON public.developer_permissions FOR SELECT
  TO authenticated
  USING (
    developer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto')
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "CTO can manage developer permissions" ON public.developer_permissions;
CREATE POLICY "CTO can manage developer permissions"
  ON public.developer_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto')
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies - Developer Onboarding
DROP POLICY IF EXISTS "Users can view their own onboarding" ON public.developer_onboarding;
CREATE POLICY "Users can view their own onboarding"
  ON public.developer_onboarding FOR SELECT
  TO authenticated
  USING (
    developer_id = auth.uid()
    OR assigned_mentor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto')
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "CTO can manage developer onboarding" ON public.developer_onboarding;
CREATE POLICY "CTO can manage developer onboarding"
  ON public.developer_onboarding FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto')
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies - Knowledge Base
DROP POLICY IF EXISTS "Authenticated users can view published articles" ON public.tech_knowledge_base;
CREATE POLICY "Authenticated users can view published articles"
  ON public.tech_knowledge_base FOR SELECT
  TO authenticated
  USING (is_published = true OR author_id = auth.uid());

DROP POLICY IF EXISTS "CTO and admins can manage knowledge base" ON public.tech_knowledge_base;
CREATE POLICY "CTO and admins can manage knowledge base"
  ON public.tech_knowledge_base FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto')
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies - Code Access Logs
DROP POLICY IF EXISTS "CTO can view all access logs" ON public.code_access_logs;
CREATE POLICY "CTO can view all access logs"
  ON public.code_access_logs FOR SELECT
  TO authenticated
  USING (
    developer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto')
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "System can create access logs" ON public.code_access_logs;
CREATE POLICY "System can create access logs"
  ON public.code_access_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes
DROP INDEX IF EXISTS idx_it_help_desk_tickets_requester;
CREATE INDEX idx_it_help_desk_tickets_requester ON public.it_help_desk_tickets(requester_id);
DROP INDEX IF EXISTS idx_it_help_desk_tickets_assigned;
CREATE INDEX idx_it_help_desk_tickets_assigned ON public.it_help_desk_tickets(assigned_to);
DROP INDEX IF EXISTS idx_it_help_desk_tickets_status;
CREATE INDEX idx_it_help_desk_tickets_status ON public.it_help_desk_tickets(status);
DROP INDEX IF EXISTS idx_it_help_desk_messages_ticket;
CREATE INDEX idx_it_help_desk_messages_ticket ON public.it_help_desk_messages(ticket_id);
DROP INDEX IF EXISTS idx_code_change_requests_developer;
CREATE INDEX idx_code_change_requests_developer ON public.code_change_requests(developer_id);
DROP INDEX IF EXISTS idx_code_change_requests_status;
CREATE INDEX idx_code_change_requests_status ON public.code_change_requests(status);
DROP INDEX IF EXISTS idx_code_change_requests_repository;
CREATE INDEX idx_code_change_requests_repository ON public.code_change_requests(repository);
DROP INDEX IF EXISTS idx_developer_permissions_developer;
CREATE INDEX idx_developer_permissions_developer ON public.developer_permissions(developer_id);
DROP INDEX IF EXISTS idx_developer_permissions_repository;
CREATE INDEX idx_developer_permissions_repository ON public.developer_permissions(repository);
DROP INDEX IF EXISTS idx_developer_onboarding_status;
CREATE INDEX idx_developer_onboarding_status ON public.developer_onboarding(onboarding_status);
DROP INDEX IF EXISTS idx_tech_knowledge_base_category;
CREATE INDEX idx_tech_knowledge_base_category ON public.tech_knowledge_base(category);
DROP INDEX IF EXISTS idx_code_access_logs_developer;
CREATE INDEX idx_code_access_logs_developer ON public.code_access_logs(developer_id);
DROP INDEX IF EXISTS idx_code_access_logs_created;
CREATE INDEX idx_code_access_logs_created ON public.code_access_logs(created_at);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_it_help_desk_tickets_updated_at ON public.it_help_desk_tickets;
CREATE TRIGGER update_it_help_desk_tickets_updated_at BEFORE UPDATE ON public.it_help_desk_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_code_change_requests_updated_at ON public.code_change_requests;
CREATE TRIGGER update_code_change_requests_updated_at BEFORE UPDATE ON public.code_change_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_developer_onboarding_updated_at ON public.developer_onboarding;
CREATE TRIGGER update_developer_onboarding_updated_at BEFORE UPDATE ON public.developer_onboarding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_tech_knowledge_base_updated_at ON public.tech_knowledge_base;
CREATE TRIGGER update_tech_knowledge_base_updated_at BEFORE UPDATE ON public.tech_knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  SELECT 'IT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(COALESCE(MAX(SUBSTRING(ticket_number FROM '[0-9]+$')::INTEGER), 0) + 1::TEXT, 4, '0')
  INTO new_number
  FROM public.it_help_desk_tickets
  WHERE ticket_number LIKE 'IT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate code change request numbers
CREATE OR REPLACE FUNCTION generate_code_request_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  SELECT 'CCR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(COALESCE(MAX(SUBSTRING(request_number FROM '[0-9]+$')::INTEGER), 0) + 1::TEXT, 4, '0')
  INTO new_number
  FROM public.code_change_requests
  WHERE request_number LIKE 'CCR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

