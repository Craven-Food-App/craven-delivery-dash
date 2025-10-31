-- Marketing ROI & Campaign Management System
-- Tracks spend, conversions, and return on ad spend

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  objective TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  budget NUMERIC(12,2) NOT NULL,
  spend_to_date NUMERIC(12,2) DEFAULT 0,
  target_audience TEXT,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend NUMERIC(10,2) DEFAULT 0,
  revenue_attributed NUMERIC(12,2) DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  ctr NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN (clicks::NUMERIC / impressions) * 100 ELSE 0 END
  ) STORED,
  cpa NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN conversions > 0 THEN spend / conversions ELSE 0 END
  ) STORED,
  roas NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN spend > 0 THEN revenue_attributed / spend ELSE 0 END
  ) STORED,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_acquisition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.marketing_campaigns(id),
  acquisition_channel TEXT NOT NULL,
  acquisition_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  acquisition_cost NUMERIC(10,2),
  lifetime_value NUMERIC(12,2) DEFAULT 0,
  first_order_id UUID,
  acquisition_source TEXT,
  attribution_model TEXT DEFAULT 'last_touch',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_acquisition ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Marketing and execs can manage campaigns"
  ON public.marketing_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Marketing can track metrics"
  ON public.marketing_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Marketing and execs can view metrics"
  ON public.marketing_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can track acquisition"
  ON public.customer_acquisition FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Marketing and execs can view acquisition"
  ON public.customer_acquisition FOR SELECT
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX idx_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX idx_campaigns_dates ON public.marketing_campaigns(start_date, end_date);
CREATE INDEX idx_metrics_campaign ON public.marketing_metrics(campaign_id);
CREATE INDEX idx_metrics_date ON public.marketing_metrics(metric_date);
CREATE INDEX idx_acquisition_campaign ON public.customer_acquisition(campaign_id);
CREATE INDEX idx_acquisition_channel ON public.customer_acquisition(acquisition_channel);
CREATE INDEX idx_acquisition_date ON public.customer_acquisition(acquisition_date);

-- View for campaign performance
CREATE OR REPLACE VIEW public.campaign_performance AS
SELECT 
  c.id as campaign_id,
  c.campaign_name,
  c.campaign_type,
  c.channel,
  c.budget,
  c.spend_to_date,
  COALESCE(SUM(m.impressions), 0) as total_impressions,
  COALESCE(SUM(m.clicks), 0) as total_clicks,
  COALESCE(SUM(m.conversions), 0) as total_conversions,
  COALESCE(SUM(m.revenue_attributed), 0) as total_revenue,
  COALESCE(SUM(m.new_customers), 0) as new_customers,
  COALESCE(AVG(m.ctr), 0) as avg_ctr,
  COALESCE(AVG(m.cpa), 0) as avg_cpa,
  COALESCE(AVG(m.roas), 0) as avg_roas,
  c.status
FROM public.marketing_campaigns c
LEFT JOIN public.marketing_metrics m ON m.campaign_id = c.id
GROUP BY c.id, c.campaign_name, c.campaign_type, c.channel, c.budget, c.spend_to_date, c.status;

-- Function to calculate marketing ROI
CREATE OR REPLACE FUNCTION public.calculate_marketing_roi(campaign_uuid UUID)
RETURNS TABLE(
  total_spend NUMERIC,
  total_revenue NUMERIC,
  roi_percent NUMERIC,
  new_customers INTEGER,
  cpa NUMERIC,
  roas NUMERIC
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(m.spend), 0) as total_spend,
    COALESCE(SUM(m.revenue_attributed), 0) as total_revenue,
    CASE 
      WHEN SUM(m.spend) > 0 THEN 
        ((SUM(m.revenue_attributed) - SUM(m.spend)) / SUM(m.spend)) * 100
      ELSE 0
    END as roi_percent,
    COALESCE(SUM(m.new_customers), 0) as new_customers,
    CASE 
      WHEN SUM(m.conversions) > 0 THEN SUM(m.spend) / SUM(m.conversions)
      ELSE 0
    END as cpa,
    CASE 
      WHEN SUM(m.spend) > 0 THEN SUM(m.revenue_attributed) / SUM(m.spend)
      ELSE 0
    END as roas
  FROM public.marketing_metrics m
  WHERE m.campaign_id = campaign_uuid;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.calculate_marketing_roi(UUID) TO authenticated;

