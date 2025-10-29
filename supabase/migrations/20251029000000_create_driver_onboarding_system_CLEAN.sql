-- ================================================================
-- CRAVE'N DRIVER ONBOARDING SYSTEM - CLEAN INSTALL
-- ================================================================
-- This version drops existing objects before creating new ones

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_update_zone_counts ON public.drivers;
DROP TRIGGER IF EXISTS trigger_update_waitlist_counts ON public.driver_waitlist;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_zone_counts();
DROP FUNCTION IF EXISTS update_waitlist_counts();

-- Drop existing policies (in case tables exist)
DROP POLICY IF EXISTS "public_can_view_active_zones" ON public.zones;
DROP POLICY IF EXISTS "ceo_can_manage_zones" ON public.zones;
DROP POLICY IF EXISTS "drivers_own_profile_select" ON public.drivers;
DROP POLICY IF EXISTS "drivers_own_profile_update" ON public.drivers;
DROP POLICY IF EXISTS "drivers_insert_own" ON public.drivers;
DROP POLICY IF EXISTS "driver_consents_own_select" ON public.driver_consents;
DROP POLICY IF EXISTS "driver_consents_own_insert" ON public.driver_consents;
DROP POLICY IF EXISTS "driver_identity_service_role_only" ON public.driver_identity;
DROP POLICY IF EXISTS "driver_bg_own_select" ON public.driver_background_checks;
DROP POLICY IF EXISTS "driver_waitlist_own_select" ON public.driver_waitlist;

-- ================================================================
-- CREATE TABLES
-- ================================================================

-- 1. ZONES TABLE
CREATE TABLE IF NOT EXISTS public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 50,
  active_drivers INTEGER NOT NULL DEFAULT 0,
  waitlist_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. DRIVERS TABLE
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  zip TEXT NOT NULL,
  zone_id UUID REFERENCES public.zones(id),
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN (
    'started',
    'consents_ok',
    'id_submitted',
    'pending_check',
    'awaiting_contract',
    'contract_signed',
    'waitlisted_contract_signed',
    'eligible',
    'active',
    'suspended',
    'rejected'
  )),
  ssn_last4 TEXT,
  contract_signed_at TIMESTAMP WITH TIME ZONE,
  docusign_envelope_id TEXT,
  activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. DRIVER CONSENTS TABLE
CREATE TABLE IF NOT EXISTS public.driver_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  terms_of_service_accepted BOOLEAN DEFAULT false,
  terms_of_service_accepted_at TIMESTAMP WITH TIME ZONE,
  privacy_policy_accepted BOOLEAN DEFAULT false,
  privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
  fcra_authorization_accepted BOOLEAN DEFAULT false,
  fcra_authorization_accepted_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(driver_id)
);

-- 4. DRIVER IDENTITY TABLE
CREATE TABLE IF NOT EXISTS public.driver_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  date_of_birth_encrypted BYTEA NOT NULL,
  ssn_encrypted BYTEA NOT NULL,
  dl_number_encrypted BYTEA NOT NULL,
  dl_state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(driver_id)
);

-- 5. DRIVER BACKGROUND CHECKS TABLE
CREATE TABLE IF NOT EXISTS public.driver_background_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'clear', 'flagged', 'rejected')),
  provider TEXT DEFAULT 'checkr',
  external_check_id TEXT,
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  result_data JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(driver_id)
);

-- 6. DRIVER WAITLIST TABLE
CREATE TABLE IF NOT EXISTS public.driver_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  position INTEGER,
  contract_signed BOOLEAN DEFAULT false,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(driver_id)
);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_drivers_auth_user ON public.drivers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_email ON public.drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_zone ON public.drivers(zone_id);
CREATE INDEX IF NOT EXISTS idx_driver_consents_driver ON public.driver_consents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_identity_driver ON public.driver_identity(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_background_driver ON public.driver_background_checks(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_waitlist_zone ON public.driver_waitlist(zone_id);
CREATE INDEX IF NOT EXISTS idx_driver_waitlist_position ON public.driver_waitlist(position);
CREATE INDEX IF NOT EXISTS idx_zones_zip ON public.zones(zip_code);

-- ================================================================
-- ENABLE RLS
-- ================================================================
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_background_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_waitlist ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- RLS POLICIES
-- ================================================================

-- ZONES
CREATE POLICY "public_can_view_active_zones"
ON public.zones FOR SELECT
USING (is_active = true);

CREATE POLICY "ceo_can_manage_zones"
ON public.zones FOR ALL
TO authenticated
USING (auth.jwt()->>'email' = 'craven@usa.com')
WITH CHECK (auth.jwt()->>'email' = 'craven@usa.com');

-- DRIVERS
CREATE POLICY "drivers_own_profile_select"
ON public.drivers FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid() OR auth.jwt()->>'email' = 'craven@usa.com');

CREATE POLICY "drivers_own_profile_update"
ON public.drivers FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "drivers_insert_own"
ON public.drivers FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

-- DRIVER_CONSENTS
CREATE POLICY "driver_consents_own_select"
ON public.driver_consents FOR SELECT
TO authenticated
USING (
  driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid())
  OR auth.jwt()->>'email' = 'craven@usa.com'
);

CREATE POLICY "driver_consents_own_insert"
ON public.driver_consents FOR INSERT
TO authenticated
WITH CHECK (driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid()));

-- DRIVER_IDENTITY: Service role only
CREATE POLICY "driver_identity_service_role_only"
ON public.driver_identity FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- DRIVER_BACKGROUND_CHECKS
CREATE POLICY "driver_bg_own_select"
ON public.driver_background_checks FOR SELECT
TO authenticated
USING (
  driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid())
  OR auth.jwt()->>'email' = 'craven@usa.com'
);

-- DRIVER_WAITLIST
CREATE POLICY "driver_waitlist_own_select"
ON public.driver_waitlist FOR SELECT
TO authenticated
USING (
  driver_id IN (SELECT id FROM public.drivers WHERE auth_user_id = auth.uid())
  OR auth.jwt()->>'email' = 'craven@usa.com'
);

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

CREATE OR REPLACE FUNCTION update_zone_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status != 'active' AND OLD.zone_id IS NOT NULL THEN
      UPDATE public.zones 
      SET active_drivers = GREATEST(active_drivers - 1, 0)
      WHERE id = OLD.zone_id;
    END IF;
    
    IF OLD.status != 'active' AND NEW.status = 'active' AND NEW.zone_id IS NOT NULL THEN
      UPDATE public.zones 
      SET active_drivers = active_drivers + 1
      WHERE id = NEW.zone_id;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.status = 'active' AND NEW.zone_id IS NOT NULL THEN
      UPDATE public.zones 
      SET active_drivers = active_drivers + 1
      WHERE id = NEW.zone_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_zone_counts
  AFTER INSERT OR UPDATE OF status, zone_id ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_zone_counts();

CREATE OR REPLACE FUNCTION update_waitlist_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.zones 
    SET waitlist_count = waitlist_count + 1
    WHERE id = NEW.zone_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.zones 
    SET waitlist_count = GREATEST(waitlist_count - 1, 0)
    WHERE id = OLD.zone_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_waitlist_counts
  AFTER INSERT OR DELETE ON public.driver_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_counts();

-- ================================================================
-- SAMPLE ZONES
-- ================================================================
INSERT INTO public.zones (zip_code, city, state, capacity, active_drivers, is_active)
VALUES 
  ('43615', 'Toledo', 'OH', 50, 0, true),
  ('48226', 'Detroit', 'MI', 100, 0, true),
  ('48127', 'Dearborn', 'MI', 75, 0, true),
  ('48009', 'Birmingham', 'MI', 60, 0, true),
  ('90210', 'Los Angeles', 'CA', 200, 0, true)
ON CONFLICT (zip_code) DO NOTHING;

