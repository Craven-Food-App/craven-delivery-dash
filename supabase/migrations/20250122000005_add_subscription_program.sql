-- Create subscription program (DashPass competitor)

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL, -- in cents
  price_annual INTEGER, -- in cents (optional annual pricing)
  benefits JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
  status TEXT CHECK (status IN ('active', 'paused', 'cancelled', 'expired')) DEFAULT 'active',
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual')) DEFAULT 'monthly',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  auto_renew BOOLEAN DEFAULT true,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription usage tracking
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) NOT NULL,
  benefit_type TEXT NOT NULL, -- e.g., 'free_delivery', 'reduced_service_fee'
  discount_amount INTEGER NOT NULL, -- in cents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plan (CravePass)
INSERT INTO subscription_plans (name, price_monthly, price_annual, benefits, is_active)
VALUES (
  'CravePass',
  999, -- $9.99/month
  9600, -- $96/year (20% discount)
  '{
    "free_delivery": true,
    "reduced_service_fee": 50,
    "priority_support": true,
    "exclusive_deals": true,
    "min_order_amount": 1200,
    "description": "Unlimited free delivery on orders $12+, 50% off service fees, and exclusive deals"
  }'::jsonb,
  true
)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for subscription_usage
CREATE POLICY "Users can view their own subscription usage"
  ON subscription_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE user_subscriptions.id = subscription_usage.subscription_id
      AND user_subscriptions.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert subscription usage"
  ON subscription_usage FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_next_billing_date ON user_subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_order_id ON subscription_usage(order_id);

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND (end_date IS NULL OR end_date > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply subscription benefits to order
CREATE OR REPLACE FUNCTION apply_subscription_benefits(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_subscription RECORD;
  v_plan RECORD;
  v_delivery_discount INTEGER := 0;
  v_service_fee_discount INTEGER := 0;
  v_total_discount INTEGER := 0;
  v_benefits JSONB;
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN '{"applied": false, "reason": "Order not found"}'::jsonb;
  END IF;
  
  -- Check if customer has active subscription
  SELECT us.*, sp.benefits INTO v_subscription, v_plan
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = v_order.customer_id
    AND us.status = 'active'
    AND (us.end_date IS NULL OR us.end_date > NOW())
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN '{"applied": false, "reason": "No active subscription"}'::jsonb;
  END IF;
  
  v_benefits := v_plan;
  
  -- Check minimum order amount
  IF (v_benefits->>'min_order_amount')::int IS NOT NULL THEN
    IF v_order.total_amount < (v_benefits->>'min_order_amount')::int THEN
      RETURN jsonb_build_object(
        'applied', false, 
        'reason', 'Order below minimum amount',
        'min_amount', (v_benefits->>'min_order_amount')::int
      );
    END IF;
  END IF;
  
  -- Apply free delivery
  IF (v_benefits->>'free_delivery')::boolean = true THEN
    v_delivery_discount := COALESCE(v_order.delivery_fee, 0);
  END IF;
  
  -- Apply reduced service fee
  IF (v_benefits->>'reduced_service_fee')::int IS NOT NULL THEN
    v_service_fee_discount := COALESCE(v_order.service_fee, 0) * (v_benefits->>'reduced_service_fee')::int / 100;
  END IF;
  
  v_total_discount := v_delivery_discount + v_service_fee_discount;
  
  -- Record usage
  IF v_delivery_discount > 0 THEN
    INSERT INTO subscription_usage (subscription_id, order_id, benefit_type, discount_amount)
    VALUES (v_subscription.id, p_order_id, 'free_delivery', v_delivery_discount);
  END IF;
  
  IF v_service_fee_discount > 0 THEN
    INSERT INTO subscription_usage (subscription_id, order_id, benefit_type, discount_amount)
    VALUES (v_subscription.id, p_order_id, 'reduced_service_fee', v_service_fee_discount);
  END IF;
  
  -- Return discount information
  RETURN jsonb_build_object(
    'applied', true,
    'delivery_discount', v_delivery_discount,
    'service_fee_discount', v_service_fee_discount,
    'total_discount', v_total_discount,
    'benefits', v_benefits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_plans_updated_at_trigger
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE TRIGGER user_subscriptions_updated_at_trigger
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION has_active_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION apply_subscription_benefits TO authenticated;

COMMENT ON TABLE subscription_plans IS 'Subscription plan definitions (CravePass)';
COMMENT ON TABLE user_subscriptions IS 'User subscription memberships';
COMMENT ON TABLE subscription_usage IS 'Tracks subscription benefit usage per order';

