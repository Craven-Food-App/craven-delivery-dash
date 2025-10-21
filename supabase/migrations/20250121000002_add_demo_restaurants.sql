-- ============================================================================
-- DEMO RESTAURANTS GENERATOR
-- Creates 234 realistic demo restaurants across multiple US states
-- Easily removable by filtering is_demo = true
-- ============================================================================

-- Add is_demo column to restaurants
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Clean up any existing demo data first
DELETE FROM public.menu_items WHERE is_demo = true;

-- Delete related onboarding progress records for demo restaurants
DELETE FROM public.restaurant_onboarding_progress 
WHERE restaurant_id IN (SELECT id FROM public.restaurants WHERE is_demo = true);

-- Delete demo restaurants
DELETE FROM public.restaurants WHERE is_demo = true;

-- Delete demo user
DELETE FROM public.user_profiles WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Create demo owner user
DO $$
DECLARE
  demo_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  -- Insert into auth.users first (required for foreign key)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    demo_user_id,
    'authenticated',
    'authenticated',
    'demo-restaurants@crave-n.shop',
    crypt('DemoPass123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    '',
    '',
    '',
    ''
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Insert into user_profiles
  INSERT INTO public.user_profiles (user_id, full_name, role, created_at)
  VALUES (demo_user_id, 'Demo Restaurant Owner', 'admin', NOW())
  ON CONFLICT (user_id) DO NOTHING;
END $$;

-- ============================================================================
-- FUNCTION TO GENERATE DEMO RESTAURANTS
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_demo_restaurants()
RETURNS void AS $$
DECLARE
  demo_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  restaurant_id uuid;
  counter INT := 1;
  
  -- Arrays for realistic data
  restaurant_names TEXT[] := ARRAY[
    'The Golden Spoon', 'Marios Italian Kitchen', 'Sakura Sushi', 'Taco Fiesta', 'Bangkok Kitchen',
    'The Burger Joint', 'Dragon Palace', 'Pita Paradise', 'Crepes Cafe', 'Smokey BBQ',
    'Veggie Delight', 'Breakfast Club', 'Seafood Shack', 'Spice Route', 'Pizza Oven',
    'Urban Grille', 'Pasta Bella', 'Wasabi Fusion', 'El Mariachi', 'Noodle House',
    'Steakhouse Prime', 'Green Leaf', 'Wings Things', 'Seoul Kitchen', 'Med Grill',
    'Donut Kingdom', 'Curry House', 'Ramen Station', 'BBQ Bros', 'Fresh Bowl',
    'Taste of India', 'Sushi Paradise', 'Tex-Mex Cantina', 'Pho House', 'Grill Masters'
  ];
  
  cuisines TEXT[] := ARRAY[
    'American', 'Italian', 'Japanese', 'Mexican', 'Thai', 'Chinese', 'Mediterranean',
    'French', 'BBQ', 'Vegan', 'Breakfast', 'Seafood', 'Indian', 'Pizza', 'Healthy',
    'Korean', 'Greek', 'Vietnamese', 'Steakhouse', 'Bakery'
  ];
  
  cities TEXT[] := ARRAY[
    'Toledo:OH:43604', 'Columbus:OH:43215', 'Cleveland:OH:44114', 'Cincinnati:OH:45202',
    'Detroit:MI:48226', 'Ann Arbor:MI:48104', 'Grand Rapids:MI:49503',
    'Chicago:IL:60601', 'Springfield:IL:62701', 'Peoria:IL:61602',
    'Indianapolis:IN:46204', 'Fort Wayne:IN:46802', 'South Bend:IN:46601',
    'Milwaukee:WI:53202', 'Madison:WI:53703', 'Green Bay:WI:54301',
    'Minneapolis:MN:55401', 'St Paul:MN:55101', 'Duluth:MN:55802',
    'Pittsburgh:PA:15222', 'Philadelphia:PA:19102', 'Harrisburg:PA:17101',
    'Buffalo:NY:14202', 'Rochester:NY:14604', 'Syracuse:NY:13202',
    'Louisville:KY:40202', 'Lexington:KY:40507', 'Bowling Green:KY:42101'
  ];
  
  menu_items_burgers TEXT[] := ARRAY['Classic Burger', 'Cheeseburger', 'Bacon Burger', 'Veggie Burger', 'Double Burger'];
  menu_items_pizza TEXT[] := ARRAY['Margherita', 'Pepperoni', 'Supreme', 'Hawaiian', 'Meat Lovers', 'Veggie', 'BBQ Chicken'];
  menu_items_sushi TEXT[] := ARRAY['California Roll', 'Spicy Tuna Roll', 'Dragon Roll', 'Rainbow Roll', 'Salmon Nigiri'];
  menu_items_mexican TEXT[] := ARRAY['Tacos', 'Burritos', 'Quesadilla', 'Enchiladas', 'Nachos', 'Fajitas'];
  menu_items_chinese TEXT[] := ARRAY['General Tso Chicken', 'Kung Pao Chicken', 'Lo Mein', 'Fried Rice', 'Spring Rolls'];
  
  city_data TEXT[];
  city_name TEXT;
  state_code TEXT;
  zip_code TEXT;
  cuisine TEXT;
  rating DECIMAL;
  review_count INT;
  
BEGIN
  -- Generate 234 restaurants
  WHILE counter <= 234 LOOP
    -- Select random city
    city_data := string_to_array(cities[(counter % array_length(cities, 1)) + 1], ':');
    city_name := city_data[1];
    state_code := city_data[2];
    zip_code := city_data[3];
    
    -- Select cuisine (cycle through)
    cuisine := cuisines[(counter % array_length(cuisines, 1)) + 1];
    
    -- Random rating between 3.8 and 5.0
    rating := 3.8 + (random() * 1.2);
    rating := ROUND(rating::numeric, 1);
    
    -- Random review count between 50 and 1000
    review_count := 50 + floor(random() * 950)::INT;
    
    -- Insert restaurant
    restaurant_id := gen_random_uuid();
    
    INSERT INTO public.restaurants (
      id, owner_id, name, description, address, city, state, zip_code,
      phone, email, cuisine_type, is_active, rating, total_reviews,
      is_demo, created_at, updated_at
    ) VALUES (
      restaurant_id,
      demo_user_id,
      restaurant_names[(counter % array_length(restaurant_names, 1)) + 1] || ' #' || counter,
      'Delicious ' || cuisine || ' food with great service',
      counter || ' Main Street',
      city_name,
      state_code,
      zip_code,
      '555-01' || LPAD(counter::TEXT, 2, '0'),
      'demo' || counter || '@demo.com',
      cuisine,
      true,
      rating,
      review_count,
      true,
      NOW(),
      NOW()
    );
    
    -- Add 8-12 menu items per restaurant
    FOR i IN 1..floor(8 + random() * 5)::INT LOOP
      INSERT INTO public.menu_items (
        id, restaurant_id, name, description, price_cents, category,
        is_available, is_demo, created_at
      ) VALUES (
        gen_random_uuid(),
        restaurant_id,
        CASE 
          WHEN cuisine = 'American' THEN menu_items_burgers[(i % array_length(menu_items_burgers, 1)) + 1]
          WHEN cuisine = 'Pizza' THEN menu_items_pizza[(i % array_length(menu_items_pizza, 1)) + 1]
          WHEN cuisine = 'Japanese' THEN menu_items_sushi[(i % array_length(menu_items_sushi, 1)) + 1]
          WHEN cuisine = 'Mexican' THEN menu_items_mexican[(i % array_length(menu_items_mexican, 1)) + 1]
          WHEN cuisine = 'Chinese' THEN menu_items_chinese[(i % array_length(menu_items_chinese, 1)) + 1]
          ELSE 'Special Item ' || i
        END,
        'Delicious and freshly prepared',
        floor(699 + random() * 1500)::INT, -- $6.99 to $21.99
        CASE 
          WHEN i <= 3 THEN 'Appetizers'
          WHEN i <= 7 THEN 'Entrees'
          ELSE 'Desserts'
        END,
        true,
        true,
        NOW()
      );
    END LOOP;
    
    counter := counter + 1;
  END LOOP;
  
  RAISE NOTICE '✅ Created 234 demo restaurants with menus';
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT generate_demo_restaurants();

-- Drop the function after use
DROP FUNCTION generate_demo_restaurants();

-- ============================================================================
-- Add placeholder images (you'll need to upload actual images to storage)
-- ============================================================================
COMMENT ON COLUMN restaurants.is_demo IS 'Demo restaurants for testing - can be bulk deleted where is_demo = true';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ 234 Demo Restaurants Created!';
  RAISE NOTICE '📍 Across 28 cities in 8 states';
  RAISE NOTICE '🍔 Each with 8-12 menu items';
  RAISE NOTICE '⭐ Random ratings 3.8-5.0';
  RAISE NOTICE '💬 Random review counts';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'To remove: DELETE FROM restaurants WHERE is_demo = true;';
  RAISE NOTICE '====================================';
END $$;

-- To remove all demo restaurants later, run:
-- DELETE FROM menu_items WHERE is_demo = true;
-- DELETE FROM restaurants WHERE is_demo = true;
