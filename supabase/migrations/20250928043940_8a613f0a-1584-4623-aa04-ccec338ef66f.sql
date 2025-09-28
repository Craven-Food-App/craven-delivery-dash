-- Create commission and fee settings table
CREATE TABLE public.commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_commission_percent NUMERIC NOT NULL DEFAULT 10,
  customer_service_fee_percent NUMERIC NOT NULL DEFAULT 10,
  delivery_fee_base_cents INTEGER NOT NULL DEFAULT 200,
  delivery_fee_per_mile_cents INTEGER NOT NULL DEFAULT 50,
  peak_hour_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Insert default settings
INSERT INTO public.commission_settings (
  restaurant_commission_percent,
  customer_service_fee_percent,
  delivery_fee_base_cents,
  delivery_fee_per_mile_cents,
  peak_hour_multiplier
) VALUES (10, 10, 200, 50, 1.5);

-- Create driver schedules table
CREATE TABLE public.driver_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart persistence table
CREATE TABLE public.customer_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  restaurant_id UUID NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  delivery_address JSONB,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create driver session persistence table
CREATE TABLE public.driver_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL UNIQUE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for commission_settings
CREATE POLICY "Everyone can view commission settings" 
ON public.commission_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage commission settings" 
ON public.commission_settings FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create RLS policies for driver_schedules
CREATE POLICY "Drivers can manage their schedules" 
ON public.driver_schedules FOR ALL 
USING (auth.uid() = driver_id);

CREATE POLICY "Admins can view all schedules" 
ON public.driver_schedules FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create RLS policies for customer_carts
CREATE POLICY "Customers can manage their carts" 
ON public.customer_carts FOR ALL 
USING (auth.uid() = customer_id);

-- Create RLS policies for driver_sessions
CREATE POLICY "Drivers can manage their sessions" 
ON public.driver_sessions FOR ALL 
USING (auth.uid() = driver_id);

-- Add trigger for updated_at
CREATE TRIGGER update_commission_settings_updated_at
  BEFORE UPDATE ON public.commission_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_schedules_updated_at
  BEFORE UPDATE ON public.driver_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_carts_updated_at
  BEFORE UPDATE ON public.customer_carts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_sessions_updated_at
  BEFORE UPDATE ON public.driver_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();