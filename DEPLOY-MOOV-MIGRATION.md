# Deploy Moov.io Migration

## ✅ Edge Functions Deployed

Both edge functions have been successfully deployed:
- ✅ `create-payment` (v1 with Moov support)
- ✅ `verify-payment` (v1 with Moov support)

## 🔧 Database Migration Required

Run this SQL in your Supabase SQL Editor:

### Step 1: Go to Supabase Dashboard
1. Navigate to: https://supabase.com/dashboard/project/xaxbucnjlrfkccsfiddq
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Paste This SQL

```sql
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
```

### Step 3: Run the Query

1. Click **RUN** (or press Ctrl+Enter)
2. You should see: "Success. No rows returned"

## ✅ Verification

After running the migration, verify it worked:

```sql
-- Check that the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'customer_orders'
AND column_name IN ('moov_payment_id', 'moov_transfer_id', 'payment_provider')
ORDER BY column_name;
```

You should see:
- `moov_payment_id` (TEXT)
- `moov_transfer_id` (TEXT)
- `payment_provider` (TEXT, default 'stripe')

## 🎉 Done!

Once the migration is complete, your Moov.io integration is ready!

### Test It

1. Start your dev server: `npm run dev`
2. Navigate to: http://localhost:8080
3. Create a test order
4. Complete checkout
5. Payment will go through Moov.io (default provider)

### Need Help?

- Check edge function logs: https://supabase.com/dashboard/project/xaxbucnjlrfkccsfiddq/functions
- Full guide: `MOOV-IO-INTEGRATION.md`
- Setup guide: `MOOV-SETUP-COMPLETE.md`

