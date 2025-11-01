# Moov.io Payment Integration Guide

## Overview

This document outlines the migration from Stripe to Moov.io payment processing for Crave'N Delivery.

## What Changed

### Database Schema
- Added `moov_payment_id` and `moov_transfer_id` columns to `customer_orders` table
- Added `payment_provider` field to track which provider processed the payment
- Updated `payment_methods` table to support Moov card tokens

### Edge Functions
- **create-payment** → Creates Moov checkout session
- **verify-payment** → Verifies Moov payment status and confirms orders

## Setup Instructions

### 1. Get Moov.io API Credentials

1. Sign up at https://moov.io
2. Go to Settings → API Keys
3. Copy your **Public Key** and **Secret Key**

### 2. Set Environment Variables in Supabase

Go to Supabase Dashboard → Edge Functions → Secrets and add:

```
MOOV_API_KEY=your_secret_key_here
MOOV_PUBLIC_KEY=your_public_key_here
MOOV_APPLICATION_ID=your_application_id_here
```

### 3. Deploy Database Migration

Run the migration file in Supabase SQL Editor:

```bash
# In Supabase Dashboard → SQL Editor
# Run: supabase/migrations/20250202000001_add_moov_payment_fields.sql
```

### 4. Deploy Edge Functions

```bash
# Deploy updated edge functions
supabase functions deploy create-payment
supabase functions deploy verify-payment
```

### 5. Update Supabase Config

Add Moov.io secrets configuration to `supabase/config.toml`:

```toml
[functions.create-payment]
verify_jwt = false

[functions.verify-payment]
verify_jwt = false

[functions.moov-webhook]
verify_jwt = false

# Add secrets
[functions.create-payment.secrets]
MOOV_API_KEY = "your_secret_key"
MOOV_PUBLIC_KEY = "your_public_key"

[functions.verify-payment.secrets]
MOOV_API_KEY = "your_secret_key"
```

### 6. Configure Webhooks

In Moov Dashboard → Webhooks, add:

- **URL**: `https://yourproject.supabase.co/functions/v1/moov-webhook`
- **Events**: 
  - `transfer.completed`
  - `transfer.failed`
  - `payment.completed`

### 7. Test Integration

#### Test Mode
Moov provides a sandbox environment for testing:

```javascript
// Set MOOV_MODE=test in edge function secrets
// Test card numbers:
// Success: 4242 4242 4242 4242
// Decline: 4000 0000 0000 0002
```

#### Manual Testing
1. Create a test order on localhost:8080
2. Complete checkout flow
3. Verify payment status updates in `customer_orders`
4. Check order confirmation email sent

## Architecture

### Payment Flow

```
Customer → CartSidebar → create-payment → Moov Checkout
                                         ↓
Customer Completes Payment → Moov Webhook → verify-payment
                                         ↓
Order Confirmed → Notification → Restaurant
```

### Key Differences from Stripe

| Feature | Stripe | Moov.io |
|---------|--------|---------|
| Checkout | Hosted Checkout Session | Transfer API + Drops |
| Verification | Webhook + Session Retrieve | Transfer Status Check |
| Card Storage | Payment Methods | Moov Cards |
| PCI Compliance | Stripe handles | Moov handles |

## API Reference

### Create Payment

**Endpoint**: `/functions/v1/create-payment`

**Request**:
```json
{
  "orderTotal": 2500,
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "orderId": "uuid-here"
}
```

**Response**:
```json
{
  "url": "https://pay.moov.io/checkout/xxx",
  "payment_id": "moov_payment_xxx"
}
```

### Verify Payment

**Endpoint**: `/functions/v1/verify-payment`

**Request**:
```json
{
  "paymentId": "moov_payment_xxx",
  "orderId": "uuid-here"
}
```

**Response**:
```json
{
  "success": true,
  "payment_status": "completed",
  "order_status": "confirmed"
}
```

## Troubleshooting

### Payment Not Processing

1. Check Moov API keys in Supabase secrets
2. Verify webhook URL is accessible
3. Check edge function logs: `supabase functions logs create-payment`
4. Ensure `customer_orders` table has Moov columns

### Orders Stuck in "Pending"

1. Check `verify-payment` logs
2. Manually trigger verification via API
3. Verify Moov transfer status in dashboard

### Card Declined in Test

- Use test card: `4242 4242 4242 4242`
- Set `MOOV_MODE=test` in secrets
- Check cardholder info matches test data

## Migration Checklist

- [ ] Create Moov.io account
- [ ] Set up API keys
- [ ] Deploy database migration
- [ ] Update edge functions
- [ ] Configure webhooks
- [ ] Test in sandbox
- [ ] Switch to production
- [ ] Monitor first 10 real orders
- [ ] Update Stripe data retention policy

## Support

- Moov Docs: https://docs.moov.io
- Moov Support: support@moov.io
- Edge Function Logs: Supabase Dashboard → Edge Functions → Logs

