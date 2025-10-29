# 🚘 Crave'n Driver Onboarding System - Setup Guide

## Overview
Complete driver onboarding system with DocuSign integration, encrypted identity storage, background checks, and zone-based waitlist management.

## 🔧 Environment Variables Required

### Supabase Configuration
Add these to your Supabase project settings:

```bash
# Database
SUPABASE_URL=your-project-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Identity Encryption
IDENTITY_ENCRYPTION_KEY=your-super-secret-encryption-key-min-32-chars
```

### DocuSign Configuration  
Add these to your Supabase Edge Functions secrets:

```bash
# DocuSign API Credentials
DOCUSIGN_ACCOUNT_ID=your-account-id
DOCUSIGN_ACCESS_TOKEN=your-access-token
DOCUSIGN_TEMPLATE_ID=your-ica-template-id
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi

# Note: For production, use: https://www.docusign.net/restapi
```

### Client Environment (.env)
```bash
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📦 Database Setup

### 1. Run Migrations in Supabase SQL Editor

Run these migrations in order:

```bash
# 1. Main schema
supabase/migrations/20251029000000_create_driver_onboarding_system.sql

# 2. Encryption functions
supabase/migrations/20251029000001_create_identity_encryption_function.sql
```

**Or use Supabase CLI:**
```bash
supabase db push
```

### 2. Verify Tables Created
Run this in Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'driver%' OR table_name = 'zones';
```

You should see:
- drivers
- driver_consents  
- driver_identity
- driver_background_checks
- driver_waitlist
- zones

---

## 🔐 Edge Functions Setup

### 1. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy intake-identity
supabase functions deploy start-onboarding
supabase functions deploy create-docusign-envelope
supabase functions deploy docusign-webhook
```

### 2. Set Edge Function Secrets

```bash
supabase secrets set IDENTITY_ENCRYPTION_KEY=your-key-here
supabase secrets set DOCUSIGN_ACCOUNT_ID=your-account-id
supabase secrets set DOCUSIGN_ACCESS_TOKEN=your-token
supabase secrets set DOCUSIGN_TEMPLATE_ID=your-template-id
supabase secrets set DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi
```

---

## 📝 DocuSign Template Setup

### 1. Create ICA Template in DocuSign

1. Log into DocuSign
2. Go to Templates → New Template
3. Upload your Independent Contractor Agreement PDF
4. Add fields:
   - **Signature** field (required)
   - **Date Signed** field (auto-fill)
   - **Full Name** field (tab label: "FullName")
   - **Sign Date** field (tab label: "SignDate")
5. Set Recipient Role Name: "Driver"
6. Save template and copy the Template ID

### 2. Configure Webhook

In DocuSign, set up Connect webhook:
- **URL**: `https://your-project.supabase.co/functions/v1/docusign-webhook`
- **Events**: Envelope Completed
- **Include**: Envelope ID, Status

---

## 🧪 Testing the Flow

### Complete Flow Test:

1. **Navigate to**: `http://localhost:8080/driver-onboarding/signup`

2. **Fill out signup form** with test data:
   - Full Name: Test Driver
   - Email: test@example.com  
   - Phone: 4195551234
   - City: Toledo
   - ZIP: 43615
   - Password: Test1234!

3. **Accept legal consents** (all 3 checkboxes)

4. **Enter identity**:
   - DOB: 01/01/1990
   - SSN: 123-45-6789
   - DL: DL123456
   - State: OH

5. **Wait for background check** (auto-clears after 5 seconds)

6. **Click "Sign Agreement"** → DocuSign envelope sent

7. **Check email** → Sign in DocuSign

8. **Return to app** → Auto-redirected based on zone capacity

---

## 🔍 Troubleshooting

### Issue: "DocuSign not configured" error
**Fix**: Ensure all DocuSign secrets are set in Edge Functions

### Issue: "Encryption failed" error  
**Fix**: Verify `IDENTITY_ENCRYPTION_KEY` is set and at least 32 characters

### Issue: No zones available
**Fix**: Run the sample zones insert from the migration or add zones manually:
```sql
INSERT INTO public.zones (zip_code, city, state, capacity)
VALUES ('43615', 'Toledo', 'OH', 50);
```

### Issue: Driver stuck on background check
**Fix**: Manually update background check status:
```sql
UPDATE driver_background_checks 
SET status = 'clear', completed_at = now() 
WHERE driver_id = 'driver-id-here';
```

---

## 🎯 Admin Operations

### View All Drivers
```sql
SELECT id, full_name, email, status, created_at 
FROM drivers 
ORDER BY created_at DESC;
```

### View Waitlist
```sql
SELECT 
  d.full_name,
  d.email,
  z.city,
  z.state,
  w.position,
  w.added_at
FROM driver_waitlist w
JOIN drivers d ON w.driver_id = d.id
JOIN zones z ON w.zone_id = z.id
ORDER BY w.position;
```

### Activate Waitlisted Drivers
```sql
-- When you open new slots, run this to auto-activate next driver:
WITH next_driver AS (
  SELECT w.driver_id
  FROM driver_waitlist w
  JOIN zones z ON w.zone_id = z.id
  WHERE z.active_drivers < z.capacity
  ORDER BY w.position
  LIMIT 1
)
UPDATE drivers
SET status = 'active', activated_at = now()
WHERE id IN (SELECT driver_id FROM next_driver)
RETURNING *;
```

### Increase Zone Capacity
```sql
UPDATE zones 
SET capacity = capacity + 25 
WHERE zip_code = '43615';
```

---

## ✅ System Status Checklist

- [ ] Database migrations applied
- [ ] Encryption functions created
- [ ] RLS policies active
- [ ] Edge Functions deployed
- [ ] DocuSign template configured
- [ ] DocuSign webhook set up
- [ ] Environment variables configured
- [ ] Sample zones created
- [ ] Test signup successful
- [ ] Test encryption working
- [ ] Test DocuSign integration
- [ ] Test waitlist logic
- [ ] Test activation flow

---

## 📊 Monitoring

### Key Metrics to Track:
- Signup conversion rate
- Average time to activation
- Waitlist size by zone
- Background check approval rate
- DocuSign completion rate

### Useful Queries:
```sql
-- Drivers by status
SELECT status, COUNT(*) FROM drivers GROUP BY status;

-- Waitlist summary
SELECT z.city, z.state, COUNT(w.id) as waitlist_size
FROM zones z
LEFT JOIN driver_waitlist w ON z.id = w.zone_id
GROUP BY z.city, z.state;

-- Recent signups (last 7 days)
SELECT COUNT(*) FROM drivers 
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 🚀 Next Steps

After basic system is working:
1. Implement actual background check provider integration (Checkr, etc.)
2. Set up automated email notifications for waitlist updates
3. Build admin dashboard for driver management
4. Add mobile app deep linking
5. Implement earnings calculator
6. Add referral bonus tracking

