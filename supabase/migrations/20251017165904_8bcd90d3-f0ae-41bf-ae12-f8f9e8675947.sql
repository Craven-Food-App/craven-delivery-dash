-- Create pricing plans table
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text UNIQUE NOT NULL,
  name text NOT NULL,
  delivery_commission_percent numeric NOT NULL,
  pickup_commission_percent numeric NOT NULL,
  monthly_fee_cents integer DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view active pricing plans
CREATE POLICY "Everyone can view active pricing plans"
ON public.pricing_plans
FOR SELECT
USING (is_active = true);

-- Only admins can manage pricing plans
CREATE POLICY "Admins can manage pricing plans"
ON public.pricing_plans
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Insert default pricing tiers
INSERT INTO public.pricing_plans (tier, name, delivery_commission_percent, pickup_commission_percent, monthly_fee_cents, features, display_order) VALUES
('basic', 'Basic Plan', 15, 10, 0, 
 '[
   "15% delivery commission",
   "10% pickup commission", 
   "Access to CraveMore customers",
   "Basic analytics",
   "Standard support"
 ]'::jsonb, 1),
('standard', 'Standard Plan', 12, 8, 0,
 '[
   "12% delivery commission",
   "8% pickup commission",
   "Access to CraveMore customers", 
   "Advanced analytics",
   "Priority support",
   "Featured placement"
 ]'::jsonb, 2),
('premium', 'Premium Plan', 10, 5, 0,
 '[
   "10% delivery commission",
   "5% pickup commission",
   "Access to CraveMore customers",
   "Premium analytics & insights",
   "Dedicated account manager",
   "Top placement priority",
   "Custom marketing campaigns"
 ]'::jsonb, 3),
('enterprise', 'Enterprise Plan', 8, 3, 0,
 '[
   "8% delivery commission",
   "3% pickup commission",
   "Access to CraveMore customers",
   "Full business intelligence suite",
   "White-glove support",
   "Guaranteed top placement",
   "Co-marketing opportunities",
   "Custom integrations"
 ]'::jsonb, 4)
ON CONFLICT (tier) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();