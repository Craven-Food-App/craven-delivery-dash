-- Create promo codes table with flexible configuration
CREATE TABLE public.promo_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  
  -- Promo type and configuration
  type text NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed_amount', 'free_delivery', 'bogo'
  discount_percentage numeric(5,2), -- For percentage discounts (0-100)
  discount_amount_cents integer, -- For fixed amount discounts
  
  -- Usage restrictions
  minimum_order_cents integer DEFAULT 0,
  maximum_discount_cents integer, -- Cap for percentage discounts
  usage_limit integer, -- Total uses allowed (null = unlimited)
  usage_count integer NOT NULL DEFAULT 0,
  per_user_limit integer DEFAULT 1, -- Uses per user
  
  -- Validity period
  valid_from timestamp with time zone NOT NULL DEFAULT now(),
  valid_until timestamp with time zone,
  
  -- Targeting
  customer_eligibility text DEFAULT 'all', -- 'all', 'new_users', 'existing_users'
  applicable_to text DEFAULT 'all', -- 'all', 'delivery_fee', 'subtotal'
  
  -- Status and metadata  
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient code lookups
CREATE UNIQUE INDEX idx_promo_codes_code_active ON public.promo_codes (code) WHERE is_active = true;
CREATE INDEX idx_promo_codes_valid_period ON public.promo_codes (valid_from, valid_until);
CREATE INDEX idx_promo_codes_usage ON public.promo_codes (usage_count, usage_limit);

-- Create promo code usage tracking table
CREATE TABLE public.promo_code_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  order_id uuid REFERENCES public.orders(id),
  
  discount_applied_cents integer NOT NULL,
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(promo_code_id, order_id) -- Prevent duplicate usage on same order
);

CREATE INDEX idx_promo_usage_user ON public.promo_code_usage (user_id, promo_code_id);
CREATE INDEX idx_promo_usage_code ON public.promo_code_usage (promo_code_id);

-- Enable RLS on promo codes tables
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
CREATE POLICY "Admins can manage all promo codes"
ON public.promo_codes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can view active promo codes"
ON public.promo_codes FOR SELECT
TO authenticated
USING (is_active = true AND valid_from <= now() AND (valid_until IS NULL OR valid_until > now()));

-- RLS Policies for promo_code_usage
CREATE POLICY "Admins can view all promo usage"
ON public.promo_code_usage FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can view their own promo usage"
ON public.promo_code_usage FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert promo usage"
ON public.promo_code_usage FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger for promo_codes
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();