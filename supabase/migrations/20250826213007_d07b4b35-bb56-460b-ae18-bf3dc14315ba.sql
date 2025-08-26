-- Insert sample modifiers for testing
-- First, let's get some menu items to add modifiers to
DO $$
DECLARE
    item_record RECORD;
BEGIN
    -- Add modifiers for burger items (assuming there are some)
    FOR item_record IN 
        SELECT id FROM menu_items 
        WHERE LOWER(name) LIKE '%burger%' OR LOWER(name) LIKE '%sandwich%'
        LIMIT 3
    LOOP
        INSERT INTO menu_item_modifiers (menu_item_id, name, description, price_cents, modifier_type, display_order) VALUES
        (item_record.id, 'No Mayo', 'Remove mayonnaise', 0, 'removal', 1),
        (item_record.id, 'Extra Pickles', 'Add extra pickles', 0, 'addon', 2),
        (item_record.id, 'Add Bacon', 'Crispy bacon strips', 150, 'addon', 3),
        (item_record.id, 'Add Cheese', 'Melted cheddar cheese', 100, 'addon', 4),
        (item_record.id, 'No Onions', 'Remove onions', 0, 'removal', 5);
    END LOOP;
    
    -- Add modifiers for pizza items
    FOR item_record IN 
        SELECT id FROM menu_items 
        WHERE LOWER(name) LIKE '%pizza%'
        LIMIT 2
    LOOP
        INSERT INTO menu_item_modifiers (menu_item_id, name, description, price_cents, modifier_type, display_order) VALUES
        (item_record.id, 'Extra Cheese', 'Double the cheese', 200, 'addon', 1),
        (item_record.id, 'Pepperoni', 'Add pepperoni topping', 250, 'addon', 2),
        (item_record.id, 'Mushrooms', 'Fresh mushrooms', 150, 'addon', 3),
        (item_record.id, 'No Sauce', 'Remove pizza sauce', 0, 'removal', 4);
    END LOOP;
    
    -- Add modifiers for drinks
    FOR item_record IN 
        SELECT id FROM menu_items 
        WHERE LOWER(name) LIKE '%coffee%' OR LOWER(name) LIKE '%drink%' OR LOWER(name) LIKE '%soda%'
        LIMIT 2
    LOOP
        INSERT INTO menu_item_modifiers (menu_item_id, name, description, price_cents, modifier_type, display_order) VALUES
        (item_record.id, 'Extra Shot', 'Double espresso shot', 75, 'addon', 1),
        (item_record.id, 'Decaf', 'Decaffeinated version', 0, 'substitution', 2),
        (item_record.id, 'Oat Milk', 'Substitute with oat milk', 50, 'substitution', 3),
        (item_record.id, 'Extra Hot', 'Served extra hot', 0, 'addon', 4);
    END LOOP;
END $$;