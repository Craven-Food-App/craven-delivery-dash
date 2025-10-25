-- Create missing tables for restaurant onboarding and tablet shipping

-- Restaurant Onboarding table
CREATE TABLE IF NOT EXISTS public.restaurant_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE UNIQUE,
  menu_preparation_status TEXT NOT NULL DEFAULT 'not_started' CHECK (menu_preparation_status IN ('not_started', 'in_progress', 'ready')),
  business_info_verified BOOLEAN NOT NULL DEFAULT false,
  go_live_ready BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,
  business_verified_at TIMESTAMPTZ,
  menu_ready_at TIMESTAMPTZ,
  tablet_shipped BOOLEAN DEFAULT false,
  tablet_shipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Restaurant Onboarding Activity Log
CREATE TABLE IF NOT EXISTS public.restaurant_onboarding_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tablet Inventory table
CREATE TABLE IF NOT EXISTS public.tablet_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'shipped', 'damaged', 'retired')),
  purchase_date DATE,
  warranty_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tablet Shipments table
CREATE TABLE IF NOT EXISTS public.tablet_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  tablet_id UUID REFERENCES public.tablet_inventory(id),
  tracking_number TEXT,
  carrier TEXT,
  shipping_address JSONB NOT NULL,
  shipped_date TIMESTAMPTZ,
  delivered_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'in_transit', 'delivered', 'returned')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_onboarding_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tablet_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tablet_shipments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurant_onboarding
CREATE POLICY "Admins can manage restaurant onboarding" ON public.restaurant_onboarding
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Restaurant owners can view their onboarding" ON public.restaurant_onboarding
  FOR SELECT USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
  );

-- RLS Policies for restaurant_onboarding_activity_log
CREATE POLICY "Admins can manage onboarding activity log" ON public.restaurant_onboarding_activity_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for tablet_inventory
CREATE POLICY "Admins can manage tablet inventory" ON public.tablet_inventory
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for tablet_shipments
CREATE POLICY "Admins can manage tablet shipments" ON public.tablet_shipments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Restaurant owners can view their tablet shipments" ON public.tablet_shipments
  FOR SELECT USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
  );