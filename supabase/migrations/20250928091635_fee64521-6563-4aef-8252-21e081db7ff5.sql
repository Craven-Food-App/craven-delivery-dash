-- Create driver payment methods table
CREATE TABLE public.driver_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('cashapp', 'paypal', 'venmo', 'zelle')),
  account_identifier TEXT NOT NULL, -- $cashtag, email, phone, etc.
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(driver_id, payment_type, account_identifier)
);

-- Enable RLS
ALTER TABLE public.driver_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Drivers can view their own payment methods" 
ON public.driver_payment_methods 
FOR SELECT 
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can insert their own payment methods" 
ON public.driver_payment_methods 
FOR INSERT 
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own payment methods" 
ON public.driver_payment_methods 
FOR UPDATE 
USING (auth.uid() = driver_id);

CREATE POLICY "Admins can view all payment methods" 
ON public.driver_payment_methods 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create daily payout batches table
CREATE TABLE public.daily_payout_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_drivers INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(payout_date)
);

-- Enable RLS
ALTER TABLE public.daily_payout_batches ENABLE ROW LEVEL SECURITY;

-- RLS policies for payout batches
CREATE POLICY "Admins can manage payout batches" 
ON public.daily_payout_batches 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create individual driver payouts table
CREATE TABLE public.driver_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.daily_payout_batches(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES public.driver_payment_methods(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'failed')),
  external_transaction_id TEXT,
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_payouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for driver payouts
CREATE POLICY "Drivers can view their own payouts" 
ON public.driver_payouts 
FOR SELECT 
USING (auth.uid() = driver_id);

CREATE POLICY "Admins can manage all payouts" 
ON public.driver_payouts 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create function to calculate daily earnings
CREATE OR REPLACE FUNCTION public.calculate_driver_daily_earnings(
  target_driver_id UUID,
  target_date DATE
) RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_earnings DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_earnings
  FROM public.driver_earnings
  WHERE driver_id = target_driver_id
    AND DATE(created_at) = target_date;
    
  RETURN total_earnings;
END;
$$;

-- Create trigger for updating timestamps
CREATE TRIGGER update_driver_payment_methods_updated_at
  BEFORE UPDATE ON public.driver_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_payouts_updated_at
  BEFORE UPDATE ON public.driver_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();