-- Create restaurant_users table for team management
CREATE TABLE IF NOT EXISTS public.restaurant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'staff')),
  first_name TEXT,
  last_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(restaurant_id, email)
);

-- Create restaurant_integrations table
CREATE TABLE IF NOT EXISTS public.restaurant_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('pos', 'delivery', 'payment', 'marketing', 'accounting')),
  provider_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  config JSONB DEFAULT '{}'::jsonb,
  credentials_encrypted JSONB,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(restaurant_id, provider_name)
);

-- Create restaurant_special_hours table for closures and special hours
CREATE TABLE IF NOT EXISTS public.restaurant_special_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  open_time TIME,
  close_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_special_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurant_users
CREATE POLICY "Restaurant owners can view their team"
  ON public.restaurant_users FOR SELECT
  USING (restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Restaurant owners can manage their team"
  ON public.restaurant_users FOR ALL
  USING (restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Admins can view all restaurant users"
  ON public.restaurant_users FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for restaurant_integrations
CREATE POLICY "Restaurant owners can view their integrations"
  ON public.restaurant_integrations FOR SELECT
  USING (restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Restaurant owners can manage their integrations"
  ON public.restaurant_integrations FOR ALL
  USING (restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Admins can view all integrations"
  ON public.restaurant_integrations FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for restaurant_special_hours
CREATE POLICY "Restaurant owners can view their special hours"
  ON public.restaurant_special_hours FOR SELECT
  USING (restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Restaurant owners can manage their special hours"
  ON public.restaurant_special_hours FOR ALL
  USING (restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Everyone can view special hours for active restaurants"
  ON public.restaurant_special_hours FOR SELECT
  USING (restaurant_id IN (
    SELECT id FROM public.restaurants WHERE is_active = true
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_restaurant_users_restaurant_id ON public.restaurant_users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_user_id ON public.restaurant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_integrations_restaurant_id ON public.restaurant_integrations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_special_hours_restaurant_id ON public.restaurant_special_hours(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_special_hours_dates ON public.restaurant_special_hours(start_date, end_date);

-- Update trigger for updated_at columns
CREATE TRIGGER update_restaurant_users_updated_at
  BEFORE UPDATE ON public.restaurant_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurant_integrations_updated_at
  BEFORE UPDATE ON public.restaurant_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurant_special_hours_updated_at
  BEFORE UPDATE ON public.restaurant_special_hours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();