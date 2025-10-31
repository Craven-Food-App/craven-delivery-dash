-- COO Portal Tables
CREATE TABLE IF NOT EXISTS public.operations_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'fleet', 'delivery', 'compliance', 'partner'
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES auth.users(id),
  vehicle_type TEXT NOT NULL,
  license_plate TEXT UNIQUE,
  registration_expiry DATE,
  insurance_expiry DATE,
  inspection_due DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type TEXT NOT NULL, -- 'license', 'insurance', 'permit', 'certification'
  entity_type TEXT NOT NULL, -- 'driver', 'restaurant', 'vehicle', 'company'
  entity_id UUID NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'valid',
  issued_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL,
  vendor_type TEXT NOT NULL, -- 'logistics', 'supplies', 'services', 'technology'
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  relationship_start DATE,
  status TEXT DEFAULT 'active',
  performance_rating NUMERIC(3,2),
  contract_value NUMERIC(12,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CTO Portal Tables
CREATE TABLE IF NOT EXISTS public.it_infrastructure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE, -- 'api', 'database', 'storage', 'cdn'
  service_provider TEXT,
  status TEXT DEFAULT 'operational', -- 'operational', 'degraded', 'down', 'maintenance'
  uptime_percent NUMERIC(5,2),
  response_time_ms INTEGER,
  last_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.it_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL, -- 'bug', 'outage', 'security', 'performance'
  severity TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_services TEXT[],
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.it_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL, -- 'hardware', 'software', 'license', 'domain'
  asset_name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_cost NUMERIC(10,2),
  warranty_expiry DATE,
  assigned_to UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active', -- 'active', 'maintenance', 'retired'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type TEXT NOT NULL, -- 'penetration', 'compliance', 'code_review'
  severity TEXT DEFAULT 'low',
  finding TEXT NOT NULL,
  recommendation TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'open',
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operations_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_infrastructure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for COO tables
CREATE POLICY "COO and admins can manage operations"
  ON public.operations_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'coo') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "COO and admins can manage fleet"
  ON public.fleet_vehicles FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'coo') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "COO and admins can manage compliance"
  ON public.compliance_records FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'coo') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "COO and admins can manage partners"
  ON public.partner_vendors FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'coo') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS Policies for CTO tables
CREATE POLICY "CTO and admins can manage infrastructure"
  ON public.it_infrastructure FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "CTO and admins can manage incidents"
  ON public.it_incidents FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "CTO and admins can manage assets"
  ON public.it_assets FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "CTO and admins can manage security"
  ON public.security_audits FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exec_users WHERE user_id = auth.uid() AND role = 'cto') 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Indexes
CREATE INDEX idx_operations_metrics_type ON public.operations_metrics(metric_type);
CREATE INDEX idx_fleet_vehicles_status ON public.fleet_vehicles(status);
CREATE INDEX idx_compliance_expiry ON public.compliance_records(expiry_date) WHERE status = 'valid';
CREATE INDEX idx_it_incidents_status ON public.it_incidents(status);
CREATE INDEX idx_it_incidents_severity ON public.it_incidents(severity);
CREATE INDEX idx_it_assets_status ON public.it_assets(status);

-- Insert sample IT infrastructure services
INSERT INTO public.it_infrastructure (service_name, service_provider, status, uptime_percent, response_time_ms) VALUES
  ('API Gateway', 'Supabase', 'operational', 99.9, 45),
  ('Database', 'Supabase Postgres', 'operational', 99.9, 25),
  ('Storage', 'Supabase Storage', 'operational', 99.8, 60),
  ('CDN', 'Cloudflare', 'operational', 100, 15),
  ('Email Service', 'Resend', 'operational', 99.7, 80)
ON CONFLICT (service_name) DO NOTHING;

