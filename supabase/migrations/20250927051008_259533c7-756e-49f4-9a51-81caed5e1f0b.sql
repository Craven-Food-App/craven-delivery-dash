-- Create driver_payout_settings table for configurable driver earnings percentage
CREATE TABLE IF NOT EXISTS public.driver_payout_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  percentage NUMERIC NOT NULL DEFAULT 70, -- percentage of order subtotal
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL
);

-- Enable RLS
ALTER TABLE public.driver_payout_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage payout settings"
ON public.driver_payout_settings
FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

CREATE POLICY "Everyone can view payout settings"
ON public.driver_payout_settings
FOR SELECT
USING (true);

-- Unique active setting constraint via partial unique index (only one active row)
CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_payout_settings_one_active
ON public.driver_payout_settings (is_active)
WHERE is_active = true;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_driver_payout_settings_updated_at ON public.driver_payout_settings;
CREATE TRIGGER trg_driver_payout_settings_updated_at
BEFORE UPDATE ON public.driver_payout_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default active setting if none exists
INSERT INTO public.driver_payout_settings (percentage, is_active)
SELECT 70, true
WHERE NOT EXISTS (SELECT 1 FROM public.driver_payout_settings WHERE is_active = true);
