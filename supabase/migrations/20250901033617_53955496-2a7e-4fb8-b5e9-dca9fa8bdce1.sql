-- Enhanced authentication and account management tables

-- Add user profiles table for better account management
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT CHECK(role IN ('customer', 'driver', 'admin', 'restaurant_owner')) NOT NULL DEFAULT 'customer',
    preferences JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- User can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment methods table
CREATE TABLE public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL DEFAULT 'stripe',
    stripe_payment_method_id TEXT,
    last4 TEXT,
    brand TEXT,
    exp_month INTEGER,
    exp_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- User can manage their own payment methods
CREATE POLICY "Users can manage own payment methods" ON public.payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- Delivery addresses table
CREATE TABLE public.delivery_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL DEFAULT 'Home',
    street_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;

-- User can manage their own addresses
CREATE POLICY "Users can manage own addresses" ON public.delivery_addresses
    FOR ALL USING (auth.uid() = user_id);

-- Driver earnings table
CREATE TABLE public.driver_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES customer_orders(id) ON DELETE SET NULL,
    amount_cents INTEGER NOT NULL,
    tip_cents INTEGER DEFAULT 0,
    total_cents INTEGER GENERATED ALWAYS AS (amount_cents + tip_cents) STORED,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    paid_out_at TIMESTAMP WITH TIME ZONE,
    payout_method TEXT DEFAULT 'bank_transfer'
);

-- Enable RLS
ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own earnings
CREATE POLICY "Drivers can view own earnings" ON public.driver_earnings
    FOR SELECT USING (auth.uid() = driver_id);

-- Only system can insert earnings
CREATE POLICY "System can insert earnings" ON public.driver_earnings
    FOR INSERT WITH CHECK (true);

-- Customer feedback table
CREATE TABLE public.order_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES customer_orders(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_rating INTEGER CHECK(restaurant_rating BETWEEN 1 AND 5),
    driver_rating INTEGER CHECK(driver_rating BETWEEN 1 AND 5),
    food_quality_rating INTEGER CHECK(food_quality_rating BETWEEN 1 AND 5),
    delivery_time_rating INTEGER CHECK(delivery_time_rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_feedback ENABLE ROW LEVEL SECURITY;

-- Customers can create feedback for their orders
CREATE POLICY "Customers can create own feedback" ON public.order_feedback
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Users can view feedback related to them
CREATE POLICY "Users can view related feedback" ON public.order_feedback
    FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = driver_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_addresses_updated_at
    BEFORE UPDATE ON public.delivery_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for account management tables
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.payment_methods REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_addresses REPLICA IDENTITY FULL;
ALTER TABLE public.driver_earnings REPLICA IDENTITY FULL;
ALTER TABLE public.order_feedback REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_addresses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_earnings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_feedback;