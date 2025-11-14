-- Create CTO Daily Checklist table
CREATE TABLE IF NOT EXISTS public.cto_daily_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_category TEXT NOT NULL,
  task_name TEXT NOT NULL,
  task_description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_completed BOOLEAN DEFAULT false,
  checklist_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create CTO Developers table
CREATE TABLE IF NOT EXISTS public.cto_developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  team TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create CTO Sprints table
CREATE TABLE IF NOT EXISTS public.cto_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_name TEXT NOT NULL,
  sprint_number INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  goal TEXT,
  team TEXT,
  velocity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create CTO Sprint Tickets table
CREATE TABLE IF NOT EXISTS public.cto_sprint_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID REFERENCES public.cto_sprints(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'feature' CHECK (type IN ('feature', 'bug', 'improvement', 'task')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  assigned_to UUID REFERENCES public.cto_developers(id),
  story_points INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create CTO Code Reviews table
CREATE TABLE IF NOT EXISTS public.cto_code_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_number TEXT NOT NULL,
  pr_title TEXT NOT NULL,
  pr_url TEXT,
  repository TEXT NOT NULL,
  author_id UUID REFERENCES public.cto_developers(id),
  reviewer_id UUID REFERENCES public.cto_developers(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested', 'merged')),
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  review_notes TEXT,
  lines_changed INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all CTO tables
ALTER TABLE public.cto_daily_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cto_developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cto_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cto_sprint_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cto_code_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for CTO access
CREATE POLICY "CTO can manage daily checklist"
  ON public.cto_daily_checklist
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exec_users
      WHERE exec_users.user_id = auth.uid() AND exec_users.role = 'cto'
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "CTO can manage developers"
  ON public.cto_developers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exec_users
      WHERE exec_users.user_id = auth.uid() AND exec_users.role = 'cto'
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "CTO can manage sprints"
  ON public.cto_sprints
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exec_users
      WHERE exec_users.user_id = auth.uid() AND exec_users.role = 'cto'
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "CTO can manage sprint tickets"
  ON public.cto_sprint_tickets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exec_users
      WHERE exec_users.user_id = auth.uid() AND exec_users.role = 'cto'
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "CTO can manage code reviews"
  ON public.cto_code_reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exec_users
      WHERE exec_users.user_id = auth.uid() AND exec_users.role = 'cto'
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_cto_checklist_date ON public.cto_daily_checklist(checklist_date);
CREATE INDEX idx_cto_checklist_completed ON public.cto_daily_checklist(is_completed);
CREATE INDEX idx_cto_developers_email ON public.cto_developers(email);
CREATE INDEX idx_cto_sprints_status ON public.cto_sprints(status);
CREATE INDEX idx_cto_sprint_tickets_sprint ON public.cto_sprint_tickets(sprint_id);
CREATE INDEX idx_cto_code_reviews_status ON public.cto_code_reviews(status);