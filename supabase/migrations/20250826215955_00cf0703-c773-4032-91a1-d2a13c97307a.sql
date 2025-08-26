-- Add featured and popular flags to menu items
ALTER TABLE menu_items 
ADD COLUMN is_featured boolean DEFAULT false,
ADD COLUMN order_count integer DEFAULT 0;

-- Mark some items as featured for testing
UPDATE menu_items 
SET is_featured = true 
WHERE name IN ('Walk''N Tacos', 'Spicy Honey Glazed Happen''N Slider', 'Happen''N Breakfast Burrito')
AND restaurant_id = 'b17c0e90-3410-4914-9316-ce30f2726287';

-- Set some order counts to simulate popular items
UPDATE menu_items 
SET order_count = 45 
WHERE name = 'Walk''N Tacos' AND restaurant_id = 'b17c0e90-3410-4914-9316-ce30f2726287';

UPDATE menu_items 
SET order_count = 38 
WHERE name = 'Breakfast Biscuit Grande' AND restaurant_id = 'b17c0e90-3410-4914-9316-ce30f2726287';

UPDATE menu_items 
SET order_count = 32 
WHERE name = 'Spicy Honey Glazed Happen''N Slider' AND restaurant_id = 'b17c0e90-3410-4914-9316-ce30f2726287';

UPDATE menu_items 
SET order_count = 28 
WHERE name = 'Happen''N Breakfast Burrito' AND restaurant_id = 'b17c0e90-3410-4914-9316-ce30f2726287';