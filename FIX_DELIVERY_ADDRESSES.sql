-- Fix delivery_addresses foreign key constraint issue
-- Run this in the Supabase SQL Editor to fix the delivery address adding problem

-- Step 1: Check if the table exists and what constraints it has
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'delivery_addresses'
  AND tc.table_schema = 'public';

-- Step 2: Drop any existing foreign key constraints on user_id
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'delivery_addresses'
      AND tc.table_schema = 'public'
      AND kcu.column_name = 'user_id';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.delivery_addresses DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found on delivery_addresses.user_id';
    END IF;
END $$;

-- Step 3: Add the correct foreign key constraint pointing to auth.users
ALTER TABLE public.delivery_addresses 
ADD CONSTRAINT delivery_addresses_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 4: Verify the constraint was added correctly
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'delivery_addresses'
  AND tc.table_schema = 'public'
  AND kcu.column_name = 'user_id';

-- Step 5: Test inserting a delivery address (optional - remove this after testing)
-- This will help verify that the fix works
/*
INSERT INTO public.delivery_addresses (
    user_id,
    label,
    street_address,
    city,
    state,
    zip_code,
    is_default
) VALUES (
    auth.uid(), -- This will use the current user's ID
    'Test Address',
    '123 Test St',
    'Test City',
    'TS',
    '12345',
    true
);
*/
