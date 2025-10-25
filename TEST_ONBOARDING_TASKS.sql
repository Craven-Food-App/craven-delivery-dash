-- TEST ONBOARDING TASKS SYSTEM
-- This script tests the new onboarding tasks functionality

-- Step 1: Apply the enhanced driver waitlist system (if not already applied)
-- You should run FINAL_ENHANCED_DRIVER_WAITLIST_SYSTEM.sql first

-- Step 2: Test creating a new driver application
DO $$
DECLARE
    test_region_id INTEGER;
    test_driver_id UUID;
    task_count INTEGER;
    total_possible_points INTEGER;
BEGIN
    -- Get a test region (Toledo)
    SELECT id INTO test_region_id FROM public.regions WHERE name = 'Toledo, OH' LIMIT 1;
    
    IF test_region_id IS NULL THEN
        RAISE EXCEPTION 'No test region found. Please run the main migration first.';
    END IF;
    
    -- Create a test driver application
    INSERT INTO public.craver_applications (
        user_id,
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        street_address,
        city,
        state,
        zip_code,
        vehicle_type,
        vehicle_make,
        vehicle_model,
        vehicle_year,
        vehicle_color,
        license_plate,
        drivers_license,
        insurance_provider,
        insurance_policy,
        background_check,
        vehicle_inspection,
        profile_photo,
        status,
        region_id,
        points,
        priority_score
    ) VALUES (
        gen_random_uuid(),
        'Test',
        'Driver',
        'test.driver.onboarding@example.com',
        '555-TEST-001',
        '1990-01-01',
        '123 Test Street',
        'Toledo',
        'OH',
        '43604',
        'car',
        'Honda',
        'Civic',
        2020,
        'Blue',
        'TEST123',
        'pending',
        'pending',
        'pending',
        false,
        false,
        'pending',
        'pending',
        test_region_id,
        0,
        0
    ) RETURNING id INTO test_driver_id;
    
    -- Check if tasks were created automatically
    SELECT COUNT(*) INTO task_count
    FROM public.onboarding_tasks
    WHERE driver_id = test_driver_id;
    
    SELECT SUM(points_reward) INTO total_possible_points
    FROM public.onboarding_tasks
    WHERE driver_id = test_driver_id;
    
    -- Verify results
    RAISE NOTICE 'Test Results:';
    RAISE NOTICE '- Driver ID: %', test_driver_id;
    RAISE NOTICE '- Tasks Created: %', task_count;
    RAISE NOTICE '- Total Possible Points: %', total_possible_points;
    RAISE NOTICE '- Expected Tasks: 9';
    RAISE NOTICE '- Expected Points: 250';
    
    IF task_count = 9 THEN
        RAISE NOTICE '✅ SUCCESS: All 9 onboarding tasks were created automatically!';
    ELSE
        RAISE NOTICE '❌ FAILED: Expected 9 tasks, got %', task_count;
    END IF;
    
    IF total_possible_points = 250 THEN
        RAISE NOTICE '✅ SUCCESS: Point values are correct (250 total)!';
    ELSE
        RAISE NOTICE '❌ FAILED: Expected 250 points, got %', total_possible_points;
    END IF;
    
    -- Display all created tasks
    RAISE NOTICE '';
    RAISE NOTICE 'Created Tasks:';
    FOR rec IN 
        SELECT task_name, points_reward, completed 
        FROM public.onboarding_tasks 
        WHERE driver_id = test_driver_id
        ORDER BY points_reward DESC
    LOOP
        RAISE NOTICE '- % (% pts) - %', rec.task_name, rec.points_reward, 
            CASE WHEN rec.completed THEN 'COMPLETED' ELSE 'PENDING' END;
    END LOOP;
    
    -- Test task completion
    RAISE NOTICE '';
    RAISE NOTICE 'Testing task completion...';
    
    -- Complete the profile setup task
    UPDATE public.onboarding_tasks 
    SET completed = true, completed_at = NOW()
    WHERE driver_id = test_driver_id AND task_key = 'complete_profile';
    
    -- Check if points were awarded
    DECLARE
        new_points INTEGER;
        new_priority_score INTEGER;
    BEGIN
        SELECT points, priority_score INTO new_points, new_priority_score
        FROM public.craver_applications 
        WHERE id = test_driver_id;
        
        RAISE NOTICE 'After completing profile setup:';
        RAISE NOTICE '- Points: %', new_points;
        RAISE NOTICE '- Priority Score: %', new_priority_score;
        
        IF new_points = 25 AND new_priority_score = 25 THEN
            RAISE NOTICE '✅ SUCCESS: Points and priority score updated correctly!';
        ELSE
            RAISE NOTICE '❌ FAILED: Expected 25 points and priority score, got % points, % priority', 
                new_points, new_priority_score;
        END IF;
    END;
    
    -- Clean up test data
    DELETE FROM public.onboarding_tasks WHERE driver_id = test_driver_id;
    DELETE FROM public.activation_queue WHERE driver_id = test_driver_id;
    DELETE FROM public.craver_applications WHERE id = test_driver_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '🧹 Test data cleaned up successfully.';
    RAISE NOTICE '';
    RAISE NOTICE '=== ONBOARDING TASKS SYSTEM TEST COMPLETE ===';
    
END;
$$;
