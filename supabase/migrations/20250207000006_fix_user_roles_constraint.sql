-- ============================================================================
-- FIX USER_ROLES CONSTRAINT TO INCLUDE EMPLOYEE AND EXECUTIVE ROLES
-- ============================================================================
-- The user_roles table constraint only allows ('admin', 'moderator', 'user')
-- but we need to add 'employee' and 'executive' for the role sync system
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Add new constraint with all required roles
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('admin', 'moderator', 'user', 'employee', 'executive', 'customer', 'driver'));

-- Verify the constraint was updated
DO $$
BEGIN
  RAISE NOTICE '✅ user_roles constraint updated to include: admin, moderator, user, employee, executive, customer, driver';
END $$;

