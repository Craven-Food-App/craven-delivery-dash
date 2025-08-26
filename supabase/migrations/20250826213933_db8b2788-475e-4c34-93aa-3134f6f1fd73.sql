-- Add sample modifiers for the actual menu items
INSERT INTO menu_item_modifiers (menu_item_id, name, description, price_cents, modifier_type, display_order) VALUES
-- Modifiers for Breakfast Biscuit Grande
('d981c298-c373-4532-ba0f-75e82e748e8d', 'Extra Cheese', 'Add melted cheddar cheese', 100, 'addon', 1),
('d981c298-c373-4532-ba0f-75e82e748e8d', 'Add Bacon', 'Crispy bacon strips', 150, 'addon', 2),
('d981c298-c373-4532-ba0f-75e82e748e8d', 'Add Sausage', 'Breakfast sausage patty', 200, 'addon', 3),
('d981c298-c373-4532-ba0f-75e82e748e8d', 'No Butter', 'Hold the butter', 0, 'removal', 4),

-- Modifiers for Walk'N Tacos  
('fab3b608-f37d-49e8-be32-4c103d037005', 'Extra Hot Sauce', 'Spicy hot sauce', 0, 'addon', 1),
('fab3b608-f37d-49e8-be32-4c103d037005', 'Add Cheese', 'Shredded Mexican cheese', 75, 'addon', 2),
('fab3b608-f37d-49e8-be32-4c103d037005', 'Extra Meat', 'Double the protein', 300, 'addon', 3),
('fab3b608-f37d-49e8-be32-4c103d037005', 'No Onions', 'Hold the onions', 0, 'removal', 4),
('fab3b608-f37d-49e8-be32-4c103d037005', 'Add Guacamole', 'Fresh guacamole', 125, 'addon', 5),

-- Modifiers for Spicy Honey Glazed Happen'N Slider
('08f72d25-ed25-4acc-bdb9-d9f7a6ad080a', 'Extra Spicy', 'Make it extra hot', 0, 'addon', 1),
('08f72d25-ed25-4acc-bdb9-d9f7a6ad080a', 'Add Pickles', 'Crispy dill pickles', 50, 'addon', 2),
('08f72d25-ed25-4acc-bdb9-d9f7a6ad080a', 'No Honey Glaze', 'Hold the honey glaze', 0, 'removal', 3),
('08f72d25-ed25-4acc-bdb9-d9f7a6ad080a', 'Add Cheese', 'American cheese slice', 100, 'addon', 4),

-- Modifiers for Happen'N Breakfast Burrito
('3055570d-6cf9-4bfd-9bd9-9156c5a236fe', 'Extra Salsa', 'More salsa verde', 0, 'addon', 1),
('3055570d-6cf9-4bfd-9bd9-9156c5a236fe', 'Add Hash Browns', 'Crispy hash browns inside', 150, 'addon', 2),
('3055570d-6cf9-4bfd-9bd9-9156c5a236fe', 'Make it Spicy', 'Add jalapeños', 0, 'addon', 3),
('3055570d-6cf9-4bfd-9bd9-9156c5a236fe', 'No Cheese', 'Hold the cheese', 0, 'removal', 4),

-- Modifiers for Grilled Cheese
('85ba2423-619e-4410-ba7a-7d09a1307e92', 'Add Bacon', 'Crispy bacon strips', 200, 'addon', 1),
('85ba2423-619e-4410-ba7a-7d09a1307e92', 'Add Tomato', 'Fresh tomato slices', 75, 'addon', 2),
('85ba2423-619e-4410-ba7a-7d09a1307e92', 'Extra Cheese', 'Double the cheese', 150, 'addon', 3),
('85ba2423-619e-4410-ba7a-7d09a1307e92', 'Add Ham', 'Sliced ham', 250, 'addon', 4);