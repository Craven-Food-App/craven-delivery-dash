-- Add Meetings and Reports functionality to CEO Portal

-- Company meetings table
CREATE TABLE IF NOT EXISTS public.ceo_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('all-hands', 'executive', 'department', 'team', 'one-on-one', 'board')),
  
  organizer_id UUID REFERENCES auth.users(id),
  organizer_name TEXT,
  
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  
  location TEXT,
  meeting_url TEXT,
  meeting_password TEXT,
  
  attendees JSONB DEFAULT '[]'::jsonb,
  agenda JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Company reports/analytics
CREATE TABLE IF NOT EXISTS public.ceo_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL CHECK (report_type IN ('financial', 'operations', 'personnel', 'growth', 'customer', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  period_start DATE,
  period_end DATE,
  
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary TEXT,
  
  is_automated BOOLEAN DEFAULT false,
  schedule TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- System announcements
CREATE TABLE IF NOT EXISTS public.ceo_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  announcement_type TEXT NOT NULL CHECK (announcement_type IN ('info', 'warning', 'critical', 'celebration', 'policy')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'employees', 'feeders', 'merchants', 'customers', 'executives')),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.ceo_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "CEO can manage meetings"
ON public.ceo_meetings FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email'));

CREATE POLICY "CEO can manage reports"
ON public.ceo_reports FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email'));

CREATE POLICY "CEO can manage announcements"
ON public.ceo_announcements FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.ceo_access_credentials WHERE user_email = auth.jwt()->>'email'));

-- Indexes
CREATE INDEX idx_meetings_scheduled ON public.ceo_meetings(scheduled_at);
CREATE INDEX idx_meetings_status ON public.ceo_meetings(status);
CREATE INDEX idx_reports_type ON public.ceo_reports(report_type);
CREATE INDEX idx_reports_generated ON public.ceo_reports(generated_at DESC);
CREATE INDEX idx_announcements_published ON public.ceo_announcements(published);

-- Insert sample meetings
INSERT INTO public.ceo_meetings (title, description, meeting_type, scheduled_at, duration_minutes, location, organizer_name) VALUES
  ('Q1 All-Hands Meeting', 'Quarterly company update and strategy review', 'all-hands', CURRENT_TIMESTAMP + INTERVAL '3 days', 90, 'Main Conference Room', 'Torrance Stroman'),
  ('Executive Team Sync', 'Weekly executive leadership meeting', 'executive', CURRENT_TIMESTAMP + INTERVAL '1 day', 60, 'Executive Board Room', 'Torrance Stroman'),
  ('Department Heads Meeting', 'Monthly cross-department coordination', 'executive', CURRENT_TIMESTAMP + INTERVAL '1 week', 120, 'Zoom', 'Torrance Stroman')
ON CONFLICT DO NOTHING;

-- Insert sample reports
INSERT INTO public.ceo_reports (report_type, title, description, period_start, period_end, data, summary) VALUES
  (
    'financial',
    'Monthly Financial Summary',
    'Revenue, expenses, and profitability analysis',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    '{"revenue": 245000, "expenses": 180000, "profit": 65000, "growth": 15.2}'::jsonb,
    'Strong month with 15.2% revenue growth. Profit margin at 26.5%.'
  ),
  (
    'operations',
    'Operations Performance',
    'Order fulfillment, delivery times, customer satisfaction',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    '{"orders": 3450, "avg_delivery_time": 28, "satisfaction": 4.6}'::jsonb,
    '3,450 orders completed. Average delivery time 28 minutes. 4.6/5 satisfaction.'
  ),
  (
    'personnel',
    'HR & Personnel Report',
    'Hiring, retention, and employee metrics',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    '{"new_hires": 12, "terminations": 3, "retention_rate": 94.5}'::jsonb,
    '12 new hires, 3 departures. 94.5% retention rate.'
  )
ON CONFLICT DO NOTHING;

