-- Fix delivery_addresses foreign key constraint to reference auth.users
-- This fixes the issue where delivery addresses cannot be added due to foreign key constraint

-- Drop the existing foreign key constraint if it exists
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'delivery_addresses'
      AND kcu.column_name = 'user_id';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.delivery_addresses DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found on delivery_addresses.user_id';
    END IF;
END $$;

-- Add the correct foreign key constraint pointing to auth.users
ALTER TABLE public.delivery_addresses 
ADD CONSTRAINT delivery_addresses_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update the comment to clarify the reference
COMMENT ON COLUMN public.delivery_addresses.user_id IS 'References auth.users.id (Supabase Auth user)';
