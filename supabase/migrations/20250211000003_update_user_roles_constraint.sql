-- Update user_roles constraint to allow CRAVEN_* governance roles
-- This extends the existing constraint to include all company governance roles

-- Drop the existing constraint
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Add new constraint with all allowed roles
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN (
  -- Original roles
  'admin', 
  'moderator', 
  'user', 
  'employee', 
  'executive', 
  'customer', 
  'driver',
  -- C-level executive roles
  'ceo',
  'cfo',
  'coo',
  'cto',
  'cxo',
  'cmo',
  'cro',
  'cpo',
  'cdo',
  'chro',
  'clo',
  'cso',
  'board_member',
  'advisor',
  -- CRAVEN governance roles
  'CRAVEN_FOUNDER',
  'CRAVEN_CORPORATE_SECRETARY',
  'CRAVEN_BOARD_MEMBER',
  'CRAVEN_EXECUTIVE',
  'CRAVEN_CEO',
  'CRAVEN_CFO',
  'CRAVEN_CTO',
  'CRAVEN_CXO',
  'CRAVEN_COO',
  'CRAVEN_CMO',
  'CRAVEN_CCO',
  -- Operational roles
  'CRAVEN_STAFF',
  'CRAVEN_SUPPORT',
  'CRAVEN_DISPATCH',
  -- Marketplace roles
  'CRAVEN_DRIVER',
  'CRAVEN_RESTAURANT',
  'CRAVEN_CUSTOMER'
));

