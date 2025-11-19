# Universal CEO Access Documentation

## Overview

The account `tstroman.ceo@cravenusa.com` with PIN `020304` has **universal access** to everything in the Craven platform, both now and in the future.

## Login Credentials

- **Email**: `tstroman.ceo@cravenusa.com`
- **PIN**: `020304`
- **Access Level**: Universal (highest possible)

## Database Functions

### `has_universal_access()`

Use this function in **ALL future RLS policies** to grant universal CEO access:

```sql
CREATE POLICY "Example policy"
ON public.example_table FOR ALL
TO authenticated
USING (
  public.has_universal_access()  -- Always include this for universal CEO access
  OR your_other_conditions_here
);
```

**Why**: This ensures that `tstroman.ceo@cravenusa.com` automatically has access to all new features and tables without needing to update policies manually.

### `is_universal_ceo()`

Checks if the current authenticated user is the universal CEO. Use this for CEO-specific logic:

```sql
IF public.is_universal_ceo() THEN
  -- CEO-specific logic here
END IF;
```

### `is_ceo(user_uuid UUID)`

Checks if a specific user UUID is the CEO. Updated to recognize `tstroman.ceo@cravenusa.com`.

## Frontend Access Checks

The frontend code automatically recognizes `tstroman.ceo@cravenusa.com` and grants:

- **All roles**: CRAVEN_FOUNDER, CRAVEN_CORPORATE_SECRETARY, CRAVEN_BOARD_MEMBER, CRAVEN_EXECUTIVE, CRAVEN_CEO, CRAVEN_CFO, CRAVEN_CTO, CRAVEN_COO, admin
- **All portal access**: Company portal, Board portal, CEO portal, Executive portal
- **All permissions**: Full CRUD access to all tables

## Implementation Checklist for New Features

When creating new features, ensure universal CEO access by:

1. ✅ **RLS Policies**: Always include `public.has_universal_access()` in your RLS policies
2. ✅ **Frontend Guards**: Check `user.email === 'tstroman.ceo@cravenusa.com'` in access guards
3. ✅ **Role Checks**: Use `fetchUserRoles()` which automatically includes all roles for CEO
4. ✅ **Functions**: Use `is_universal_ceo()` or `has_universal_access()` in database functions

## Example: Creating a New Table with Universal Access

```sql
-- Create table
CREATE TABLE public.new_feature_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.new_feature_table ENABLE ROW LEVEL SECURITY;

-- Create policy with universal access
CREATE POLICY "Universal CEO and users can access"
ON public.new_feature_table FOR ALL
TO authenticated
USING (
  public.has_universal_access()  -- Universal CEO access
  OR user_id = auth.uid()        -- User's own records
);
```

## Migration History

- `20250211000023_update_ceo_email_to_tstroman.sql`: Initial email update
- `20250211000024_ensure_universal_ceo_access.sql`: Universal access functions and policies
- `20251028000004_add_ceo_pin_access.sql`: PIN verification system

## Notes

- The old email `craven@usa.com` is now **only** for driver/merchant accounts
- All company/business/executive access should use `tstroman.ceo@cravenusa.com`
- Universal access is granted through multiple layers:
  1. Database RLS policies (using `has_universal_access()`)
  2. Frontend role checks (automatic in `fetchUserRoles()`)
  3. Access guards (special case in `authGuard.tsx`, `useExecAuth.ts`, etc.)

## Future-Proofing

To ensure universal access continues to work for future features:

1. **Always use `has_universal_access()`** in new RLS policies
2. **Document new features** that might need special CEO access
3. **Test with CEO account** when creating new portals or features
4. **Update this document** if new access patterns are needed

