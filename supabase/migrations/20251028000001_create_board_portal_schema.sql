-- Executive Board Portal Schema
-- Creates tables for board members, executive communications, and analytics

-- Executive users table
CREATE TABLE IF NOT EXISTS public.exec_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ceo', 'cfo', 'coo', 'cto', 'board_member', 'advisor')),
  access_level INTEGER NOT NULL DEFAULT 1,
  department TEXT,
  title TEXT,
  approved_by UUID REFERENCES public.exec_users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  mfa_enabled BOOLEAN DEFAULT true,
  ip_whitelist JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Executive messages/communications
CREATE TABLE IF NOT EXISTS public.exec_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.exec_users(id) ON DELETE CASCADE,
  to_user_ids UUID[] NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_confidential BOOLEAN DEFAULT true,
  read_by UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Board meetings
CREATE TABLE IF NOT EXISTS public.board_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_url TEXT,
  meeting_password TEXT,
  host_id UUID REFERENCES public.exec_users(id),
  attendees UUID[] DEFAULT ARRAY[]::UUID[],
  agenda JSONB DEFAULT '[]'::jsonb,
  minutes TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  documents UUID[] DEFAULT ARRAY[]::UUID[],
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Executive metrics (cached aggregated data)
CREATE TABLE IF NOT EXISTS public.exec_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'financial', 'operations', 'growth', 'people'
  metric_name TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(metric_type, metric_name, period, period_start)
);

-- Document vault
CREATE TABLE IF NOT EXISTS public.exec_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'board_materials', 'financial', 'legal', 'strategic', 'hr'
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  access_level INTEGER DEFAULT 1,
  uploaded_by UUID REFERENCES public.exec_users(id),
  encryption_key TEXT,
  version INTEGER DEFAULT 1,
  previous_version UUID REFERENCES public.exec_documents(id),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit logs for compliance
CREATE TABLE IF NOT EXISTS public.exec_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.exec_users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Video meeting participants log
CREATE TABLE IF NOT EXISTS public.exec_meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.board_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.exec_users(id),
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  ip_address TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.exec_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exec_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exec_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exec_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exec_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exec_meeting_participants ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is executive
CREATE OR REPLACE FUNCTION public.is_executive(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.exec_users
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- RLS Policies for exec_users
CREATE POLICY "Executives can view all exec users"
ON public.exec_users FOR SELECT
TO authenticated
USING (public.is_executive(auth.uid()));

CREATE POLICY "Executives can update their own profile"
ON public.exec_users FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for exec_messages
CREATE POLICY "Executives can view their messages"
ON public.exec_messages FOR SELECT
TO authenticated
USING (
  public.is_executive(auth.uid()) AND (
    from_user_id IN (SELECT id FROM public.exec_users WHERE user_id = auth.uid()) OR
    auth.uid() = ANY(
      SELECT user_id FROM public.exec_users WHERE id = ANY(to_user_ids)
    )
  )
);

CREATE POLICY "Executives can send messages"
ON public.exec_messages FOR INSERT
TO authenticated
WITH CHECK (
  public.is_executive(auth.uid()) AND
  from_user_id IN (SELECT id FROM public.exec_users WHERE user_id = auth.uid())
);

-- RLS Policies for board_meetings
CREATE POLICY "Executives can view meetings"
ON public.board_meetings FOR SELECT
TO authenticated
USING (public.is_executive(auth.uid()));

CREATE POLICY "Executives can manage meetings"
ON public.board_meetings FOR ALL
TO authenticated
USING (public.is_executive(auth.uid()));

-- RLS Policies for exec_metrics
CREATE POLICY "Executives can view metrics"
ON public.exec_metrics FOR SELECT
TO authenticated
USING (public.is_executive(auth.uid()));

-- RLS Policies for exec_documents
CREATE POLICY "Executives can view documents"
ON public.exec_documents FOR SELECT
TO authenticated
USING (public.is_executive(auth.uid()));

CREATE POLICY "Executives can upload documents"
ON public.exec_documents FOR INSERT
TO authenticated
WITH CHECK (
  public.is_executive(auth.uid()) AND
  uploaded_by IN (SELECT id FROM public.exec_users WHERE user_id = auth.uid())
);

-- RLS Policies for exec_audit_logs
CREATE POLICY "Executives can view audit logs"
ON public.exec_audit_logs FOR SELECT
TO authenticated
USING (public.is_executive(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_exec_users_user_id ON public.exec_users(user_id);
CREATE INDEX idx_exec_users_role ON public.exec_users(role);
CREATE INDEX idx_exec_messages_from_user ON public.exec_messages(from_user_id);
CREATE INDEX idx_exec_messages_created_at ON public.exec_messages(created_at DESC);
CREATE INDEX idx_board_meetings_scheduled_at ON public.board_meetings(scheduled_at);
CREATE INDEX idx_board_meetings_status ON public.board_meetings(status);
CREATE INDEX idx_exec_metrics_type_name ON public.exec_metrics(metric_type, metric_name);
CREATE INDEX idx_exec_metrics_period ON public.exec_metrics(period, period_start);
CREATE INDEX idx_exec_documents_category ON public.exec_documents(category);
CREATE INDEX idx_exec_audit_logs_user_id ON public.exec_audit_logs(user_id);
CREATE INDEX idx_exec_audit_logs_created_at ON public.exec_audit_logs(created_at DESC);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_exec_users_updated_at
  BEFORE UPDATE ON public.exec_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_board_meetings_updated_at
  BEFORE UPDATE ON public.board_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exec_documents_updated_at
  BEFORE UPDATE ON public.exec_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

