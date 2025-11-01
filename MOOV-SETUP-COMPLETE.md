# Moov.io Setup Complete ✅

## Secrets Configured

Your Moov.io API keys have been successfully added to Supabase Edge Functions:

- **MOOV_API_KEY**: ✅ Set
- **MOOV_PUBLIC_KEY**: ✅ Set

## Next Steps

### 1. Get Your Application ID (Optional)

You may need a Moov Application ID if you're creating a marketplace with multiple merchants. 

**To find it:**
1. Log in to https://dashboard.moov.io
2. Navigate to Settings → Applications
3. Copy your Application ID
4. Run: `supabase secrets set MOOV_APPLICATION_ID=your_app_id`

**For single-merchant setup:** You can skip this for now.

### 2. Deploy Database Migration

Run this in Supabase SQL Editor:

```sql
-- File: supabase/migrations/20250202000001_add_moov_payment_fields.sql
```

Copy the contents from `supabase/migrations/20250202000001_add_moov_payment_fields.sql` and execute it.

### 3. Deploy Edge Functions

```bash
supabase functions deploy create-payment
supabase functions deploy verify-payment
```

### 4. Test Integration

1. Create a test order on your local dev server
2. Complete checkout flow
3. Verify payment goes through Moov.io
4. Check `customer_orders` table for `moov_payment_id` and `moov_transfer_id`

### 5. Production Deployment

Once testing is complete, deploy to production:

```bash
git push origin main
# This triggers your deployment pipeline
```

## What's Different from Stripe?

Moov.io uses **Transfers** instead of Checkout Sessions:

- **Stripe**: Creates checkout session → customer pays → webhook confirms
- **Moov**: Creates transfer → uses Moov Drops for card entry → verifies status

## Current Configuration

- **Default Provider**: Moov (`paymentProvider = 'moov'`)
- **Fallback**: Stripe (change `paymentProvider = 'stripe'` to use)

## Troubleshooting

### Payment Not Processing?

1. Check edge function logs: `supabase functions logs create-payment`
2. Verify Moov API keys in dashboard
3. Ensure database migration ran successfully
4. Check `customer_orders` table has Moov columns

### Edge Function Errors?

Check Supabase Dashboard → Edge Functions → Logs for:
- `create-payment` errors
- `verify-payment` errors

### Need Help?

- Moov Docs: https://docs.moov.io
- Moov Support: support@moov.io
- Your integration guide: `MOOV-IO-INTEGRATION.md`

## Testing in Sandbox

Moov provides test credentials for development:

**Test Card Numbers:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Insufficient Funds: `4000 0000 0000 9995`

**Test Details:**
- Use any future expiration date
- Use any 3-digit CVC
- Use any ZIP code

## Monitoring

Watch for successful transfers in:
1. Moov Dashboard → Transfers
2. Supabase Database → `customer_orders` table
3. Edge Function Logs

---

✅ **Your Moov.io integration is configured and ready to deploy!**

