-- Update Walk N Tacos order count to make it appear in Most Popular section
UPDATE menu_items 
SET order_count = 124 
WHERE name = 'Walk''N Tacos' AND restaurant_id = 'b17c0e90-3410-4914-9316-ce30f2726287';