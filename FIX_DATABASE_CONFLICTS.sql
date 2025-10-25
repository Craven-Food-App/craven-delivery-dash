-- COMPREHENSIVE DATABASE CLEANUP FOR ENHANCED DRIVER WAITLIST SYSTEM
-- Run this FIRST to resolve all conflicts, then run FINAL_ENHANCED_DRIVER_WAITLIST_SYSTEM.sql

-- Step 1: Drop existing functions that might conflict
DO $$
BEGIN
    -- Drop functions with CASCADE to remove dependent triggers
    DROP FUNCTION IF EXISTS get_region_capacity_status(integer) CASCADE;
    DROP FUNCTION IF EXISTS get_driver_queue_position(UUID) CASCADE;
    DROP FUNCTION IF EXISTS calculate_waitlist_position(UUID) CASCADE;
    DROP FUNCTION IF EXISTS update_driver_priority_on_task_complete() CASCADE;
    DROP FUNCTION IF EXISTS handle_referral_points() CASCADE;
    DROP FUNCTION IF EXISTS set_waitlist_position() CASCADE;
    DROP FUNCTION IF EXISTS create_default_onboarding_tasks(UUID) CASCADE;
    
    RAISE NOTICE 'Step 1 Complete: Dropped existing functions';
END $$;

-- Step 2: Drop existing triggers explicitly
DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_priority_on_task_complete ON public.onboarding_tasks;
    DROP TRIGGER IF EXISTS update_priority_on_referral ON public.driver_referrals;
    DROP TRIGGER IF EXISTS set_waitlist_position_trigger ON public.craver_applications;
    
    RAISE NOTICE 'Step 2 Complete: Dropped existing triggers';
END $$;

-- Step 3: Drop existing RLS policies
DO $$
BEGIN
    -- Regions policies
    DROP POLICY IF EXISTS "Anyone can view regions" ON public.regions;
    DROP POLICY IF EXISTS "Admins can manage regions" ON public.regions;
    
    -- Activation queue policies
    DROP POLICY IF EXISTS "Drivers can view their queue position" ON public.activation_queue;
    DROP POLICY IF EXISTS "Admins can manage activation queue" ON public.activation_queue;
    
    -- Onboarding tasks policies
    DROP POLICY IF EXISTS "Drivers can view their tasks" ON public.onboarding_tasks;
    DROP POLICY IF EXISTS "Drivers can update their tasks" ON public.onboarding_tasks;
    DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.onboarding_tasks;
    
    -- Driver referrals policies
    DROP POLICY IF EXISTS "Drivers can view their referrals" ON public.driver_referrals;
    DROP POLICY IF EXISTS "Admins can manage referrals" ON public.driver_referrals;
    
    RAISE NOTICE 'Step 3 Complete: Dropped existing RLS policies';
END $$;

-- Step 4: Fix driver_referrals table structure
DO $$
BEGIN
    -- Check if table exists and add missing column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_referrals' AND table_schema = 'public') THEN
        -- Add referred_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_referrals' AND column_name = 'referred_id' AND table_schema = 'public') THEN
            ALTER TABLE public.driver_referrals 
            ADD COLUMN referred_id UUID REFERENCES public.craver_applications(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added missing referred_id column to driver_referrals';
        ELSE
            RAISE NOTICE 'referred_id column already exists in driver_referrals';
        END IF;
    ELSE
        RAISE NOTICE 'driver_referrals table does not exist yet - will be created by migration';
    END IF;
    
    RAISE NOTICE 'Step 4 Complete: Fixed driver_referrals table structure';
END $$;

-- Step 5: Temporarily disable RLS to avoid conflicts
DO $$
BEGIN
    -- Disable RLS on tables that might have it enabled
    ALTER TABLE IF EXISTS public.regions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.activation_queue DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.onboarding_tasks DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.driver_referrals DISABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Step 5 Complete: Temporarily disabled RLS on existing tables';
END $$;

-- Step 6: Show current state for verification
DO $$
DECLARE
    func_count INTEGER;
    table_count INTEGER;
BEGIN
    -- Count remaining conflicting functions
    SELECT COUNT(*) INTO func_count
    FROM pg_routines 
    WHERE schemaname = 'public' 
    AND routinename IN ('get_region_capacity_status', 'get_driver_queue_position', 'calculate_waitlist_position');
    
    -- Count relevant tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('regions', 'activation_queue', 'onboarding_tasks', 'driver_referrals');
    
    RAISE NOTICE 'Verification:';
    RAISE NOTICE '- Conflicting functions remaining: %', func_count;
    RAISE NOTICE '- Relevant tables found: %', table_count;
    
    IF func_count = 0 THEN
        RAISE NOTICE '✅ All function conflicts resolved';
    ELSE
        RAISE NOTICE '⚠️  Some functions still exist - this is normal if they have different signatures';
    END IF;
END $$;

-- Final message
SELECT '🎯 DATABASE CLEANUP COMPLETE! Now run FINAL_ENHANCED_DRIVER_WAITLIST_SYSTEM.sql' as status;
