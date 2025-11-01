-- Add Moov.io payment fields to customer_orders table
-- This migration adds support for Moov.io payment processing alongside Stripe

ALTER TABLE public.customer_orders
ADD COLUMN IF NOT EXISTS moov_payment_id TEXT,
ADD COLUMN IF NOT EXISTS moov_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe' CHECK (payment_provider IN ('stripe', 'moov'));

-- Create index for Moov payments
CREATE INDEX IF NOT EXISTS idx_customer_orders_moov_payment_id ON public.customer_orders(moov_payment_id);

-- Update existing orders to have provider
UPDATE public.customer_orders SET payment_provider = 'stripe' WHERE payment_provider IS NULL;

-- Add Moov fields to payment_methods table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
    ALTER TABLE public.payment_methods
    ADD COLUMN IF NOT EXISTS moov_card_id TEXT;
    
    CREATE INDEX IF NOT EXISTS idx_payment_methods_moov_card_id ON public.payment_methods(moov_card_id);
  END IF;
END $$;

