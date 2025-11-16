-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS public.order_items 
  DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

-- Add foreign key constraint with proper naming
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_order_id_fkey 
  FOREIGN KEY (order_id) 
  REFERENCES public.orders(id) 
  ON DELETE CASCADE;

-- Also ensure menu_item_id foreign key exists
ALTER TABLE IF EXISTS public.order_items 
  DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_menu_item_id_fkey 
  FOREIGN KEY (menu_item_id) 
  REFERENCES public.menu_items(id) 
  ON DELETE SET NULL;