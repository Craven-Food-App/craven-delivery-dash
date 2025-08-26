-- Fix Walk N Tacos order count and set featured items properly
UPDATE menu_items 
SET order_count = 124 
WHERE name = 'Walk''N Tacos' AND restaurant_id = 'b17c0e90-3410-4914-9316-ce30f2726287';

-- Set Walk N Tacos as featured
UPDATE menu_items 
SET is_featured = true 
WHERE name = 'Walk''N Tacos' AND restaurant_id = 'b17c0e90-3410-4914-9316-ce30f2726287';

-- Set other items as featured
UPDATE menu_items 
SET is_featured = true 
WHERE name IN ('Spicy Honey Glazed Happen''N Slider', 'Happen''N Breakfast Burrito') 
AND restaurant_id = 'b17c0e90-3410-4914-9316-ce30f2726287';

-- Update other popular items with proper order counts
UPDATE menu_items 
SET order_count = 32 
WHERE name = 'Spicy Honey Glazed Happen''N Slider' AND restaurant_id = 'b17c0e90-3410-4914-9316-ce30f2726287';

UPDATE menu_items 
SET order_count = 28 
WHERE name = 'Happen''N Breakfast Burrito' AND restaurant_id = 'b17c0e90-3410-4914-9316-ce30f2726287';