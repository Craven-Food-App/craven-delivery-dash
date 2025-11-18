-- CTO Executive Workflow Portal Tables
-- Daily workflow, sprint management, code reviews, deliverables tracking

-- Daily Checklist
CREATE TABLE IF NOT EXISTS public.cto_daily_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_date DATE NOT NULL DEFAULT CURRENT_DATE,
  task_category TEXT NOT NULL, -- 'morning_review', 'development', 'strategic', 'coordination', 'stability', 'product', 'documentation'
  task_name TEXT NOT NULL,
  task_description TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(checklist_date, task_category, task_name)
);

-- Sprint Management
CREATE TABLE IF NOT EXISTS public.cto_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  goal TEXT,
  velocity_target INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sprint Tickets
CREATE TABLE IF NOT EXISTS public.cto_sprint_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID REFERENCES public.cto_sprints(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  ticket_type TEXT DEFAULT 'feature' CHECK (ticket_type IN ('feature', 'bug', 'task', 'epic', 'spike')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'testing', 'done', 'blocked')),
  assigned_to UUID REFERENCES auth.users(id),
  estimated_hours INTEGER,
  actual_hours INTEGER,
  story_points INTEGER,
  blocker_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Code Reviews
CREATE TABLE IF NOT EXISTS public.cto_code_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_number TEXT,
  pr_title TEXT NOT NULL,
  pr_url TEXT,
  repository TEXT,
  branch TEXT,
  author_id UUID REFERENCES auth.users(id),
  reviewer_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested', 'merged', 'rejected')),
  review_notes TEXT,
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  merge_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Developer Team
CREATE TABLE IF NOT EXISTS public.cto_developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  role TEXT NOT NULL, -- 'senior', 'mid', 'junior', 'contractor', 'vendor'
  specialization TEXT[], -- ['frontend', 'backend', 'mobile', 'devops', 'fullstack']
  hourly_rate NUMERIC(10,2),
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable', 'on_leave')),
  performance_rating NUMERIC(3,2) CHECK (performance_rating >= 0 AND performance_rating <= 5),
  active_tickets_count INTEGER DEFAULT 0,
  completed_tickets_count INTEGER DEFAULT 0,
  mentor_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Meeting Notes (Executive Coordination)
CREATE TABLE IF NOT EXISTS public.cto_meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('ceo_sync', 'cfo_sync', 'department_sync', 'team_standup', 'sprint_planning', 'retrospective', 'other')),
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  attendees UUID[],
  agenda TEXT[],
  discussion_points TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  decisions_made TEXT,
  next_steps TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Architecture Changes Log
CREATE TABLE IF NOT EXISTS public.cto_architecture_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_type TEXT NOT NULL CHECK (change_type IN ('database', 'api', 'infrastructure', 'frontend', 'mobile', 'integration', 'security')),
  change_title TEXT NOT NULL,
  change_description TEXT NOT NULL,
  affected_systems TEXT[],
  migration_files TEXT[],
  rollback_plan TEXT,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'rolled_back')),
  deployed_at TIMESTAMP WITH TIME ZONE,
  deployed_by UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Weekly Deliverables
CREATE TABLE IF NOT EXISTS public.cto_weekly_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  sprint_demo_completed BOOLEAN DEFAULT false,
  release_notes_completed BOOLEAN DEFAULT false,
  architecture_updates_completed BOOLEAN DEFAULT false,
  vulnerability_report_completed BOOLEAN DEFAULT false,
  infrastructure_cost_summary_completed BOOLEAN DEFAULT false,
  team_performance_summary_completed BOOLEAN DEFAULT false,
  engineering_kpi_report_completed BOOLEAN DEFAULT false,
  deliverables_json JSONB DEFAULT '{}'::jsonb,
  submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(week_start_date)
);

-- Monthly Deliverables
CREATE TABLE IF NOT EXISTS public.cto_monthly_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_start_date DATE NOT NULL,
  month_end_date DATE NOT NULL,
  technical_health_score INTEGER CHECK (technical_health_score >= 0 AND technical_health_score <= 100),
  roadmap_revisions_completed BOOLEAN DEFAULT false,
  infrastructure_scaling_plan_completed BOOLEAN DEFAULT false,
  security_audit_completed BOOLEAN DEFAULT false,
  cost_reduction_plan_completed BOOLEAN DEFAULT false,
  tech_improvements_list_completed BOOLEAN DEFAULT false,
  hiring_needs_completed BOOLEAN DEFAULT false,
  executive_recommendations_completed BOOLEAN DEFAULT false,
  deliverables_json JSONB DEFAULT '{}'::jsonb,
  submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(month_start_date)
);

-- Daily CTO Reports
CREATE TABLE IF NOT EXISTS public.cto_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_tasks TEXT[],
  sprint_status TEXT,
  blockers TEXT[],
  engineering_risks TEXT[],
  uptime_log TEXT,
  security_findings TEXT[],
  deployment_notes TEXT[],
  meeting_summaries TEXT[],
  next_day_priorities TEXT[],
  submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(report_date, created_by)
);

-- Enable RLS
ALTER TABLE public.cto_daily_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cto_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cto_sprint_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cto_code_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cto_developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cto_meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cto_architecture_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cto_weekly_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cto_monthly_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cto_daily_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies - CTO and admins can manage all
CREATE POLICY "CTO can manage daily checklist"
  ON public.cto_daily_checklist FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "CTO can manage sprints"
  ON public.cto_sprints FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "CTO can manage sprint tickets"
  ON public.cto_sprint_tickets FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "CTO can manage code reviews"
  ON public.cto_code_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR author_id = auth.uid()
    OR reviewer_id = auth.uid()
  );

CREATE POLICY "CTO can manage developers"
  ON public.cto_developers FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR user_id = auth.uid()
  );

CREATE POLICY "CTO can manage meeting notes"
  ON public.cto_meeting_notes FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR created_by = auth.uid()
  );

CREATE POLICY "CTO can manage architecture changes"
  ON public.cto_architecture_changes FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "CTO can manage weekly deliverables"
  ON public.cto_weekly_deliverables FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "CTO can manage monthly deliverables"
  ON public.cto_monthly_deliverables FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "CTO can manage daily reports"
  ON public.cto_daily_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR created_by = auth.uid()
  );

-- Indexes
CREATE INDEX idx_cto_daily_checklist_date ON public.cto_daily_checklist(checklist_date);
CREATE INDEX idx_cto_sprints_status ON public.cto_sprints(status);
CREATE INDEX idx_cto_sprint_tickets_sprint ON public.cto_sprint_tickets(sprint_id);
CREATE INDEX idx_cto_sprint_tickets_status ON public.cto_sprint_tickets(status);
CREATE INDEX idx_cto_sprint_tickets_assigned ON public.cto_sprint_tickets(assigned_to);
CREATE INDEX idx_cto_code_reviews_status ON public.cto_code_reviews(status);
CREATE INDEX idx_cto_developers_user ON public.cto_developers(user_id);
CREATE INDEX idx_cto_meeting_notes_date ON public.cto_meeting_notes(meeting_date);
CREATE INDEX idx_cto_architecture_changes_status ON public.cto_architecture_changes(status);
CREATE INDEX idx_cto_daily_reports_date ON public.cto_daily_reports(report_date);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cto_daily_checklist_updated_at BEFORE UPDATE ON public.cto_daily_checklist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cto_sprints_updated_at BEFORE UPDATE ON public.cto_sprints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cto_sprint_tickets_updated_at BEFORE UPDATE ON public.cto_sprint_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cto_code_reviews_updated_at BEFORE UPDATE ON public.cto_code_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cto_developers_updated_at BEFORE UPDATE ON public.cto_developers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cto_meeting_notes_updated_at BEFORE UPDATE ON public.cto_meeting_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cto_architecture_changes_updated_at BEFORE UPDATE ON public.cto_architecture_changes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cto_weekly_deliverables_updated_at BEFORE UPDATE ON public.cto_weekly_deliverables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cto_monthly_deliverables_updated_at BEFORE UPDATE ON public.cto_monthly_deliverables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cto_daily_reports_updated_at BEFORE UPDATE ON public.cto_daily_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



