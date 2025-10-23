-- Multi-Store System for Restaurants
-- Allows restaurants to manage multiple store locations

-- Create store_locations table for additional restaurant locations
CREATE TABLE IF NOT EXISTS public.store_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Store name (e.g., "Downtown Location", "Mall Location")
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    manager_name TEXT,
    manager_phone TEXT,
    manager_email TEXT,
    operating_hours JSONB, -- Store operating hours
    delivery_radius_miles INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false, -- Only one primary location per restaurant
    coordinates POINT, -- For location-based features
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create store_employees table to manage employees per location
CREATE TABLE IF NOT EXISTS public.store_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_location_id UUID NOT NULL REFERENCES public.store_locations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'employee', -- employee, manager, assistant_manager
    is_active BOOLEAN DEFAULT true,
    hired_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(store_location_id, user_id)
);

-- Create store_inventory table for location-specific inventory
CREATE TABLE IF NOT EXISTS public.store_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_location_id UUID NOT NULL REFERENCES public.store_locations(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    quantity_available INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    is_available BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(store_location_id, menu_item_id)
);

-- Create store_orders table to track orders by location
CREATE TABLE IF NOT EXISTS public.store_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    store_location_id UUID NOT NULL REFERENCES public.store_locations(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(order_id, store_location_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.store_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_locations
CREATE POLICY "Restaurant owners can view their store locations" ON public.store_locations
    FOR SELECT USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Restaurant owners can insert store locations" ON public.store_locations
    FOR INSERT WITH CHECK (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Restaurant owners can update their store locations" ON public.store_locations
    FOR UPDATE USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Restaurant owners can delete their store locations" ON public.store_locations
    FOR DELETE USING (
        restaurant_id IN (
            SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
        )
    );

-- RLS Policies for store_employees
CREATE POLICY "Store employees can view their store's employees" ON public.store_employees
    FOR SELECT USING (
        store_location_id IN (
            SELECT id FROM public.store_locations 
            WHERE restaurant_id IN (
                SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
            )
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Restaurant owners can manage store employees" ON public.store_employees
    FOR ALL USING (
        store_location_id IN (
            SELECT id FROM public.store_locations 
            WHERE restaurant_id IN (
                SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
            )
        )
    );

-- RLS Policies for store_inventory
CREATE POLICY "Store employees can view their store's inventory" ON public.store_inventory
    FOR SELECT USING (
        store_location_id IN (
            SELECT id FROM public.store_locations 
            WHERE restaurant_id IN (
                SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Store employees can manage their store's inventory" ON public.store_inventory
    FOR ALL USING (
        store_location_id IN (
            SELECT id FROM public.store_locations 
            WHERE restaurant_id IN (
                SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
            )
        )
    );

-- RLS Policies for store_orders
CREATE POLICY "Store employees can view their store's orders" ON public.store_orders
    FOR SELECT USING (
        store_location_id IN (
            SELECT id FROM public.store_locations 
            WHERE restaurant_id IN (
                SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Store employees can manage their store's orders" ON public.store_orders
    FOR ALL USING (
        store_location_id IN (
            SELECT id FROM public.store_locations 
            WHERE restaurant_id IN (
                SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
            )
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_store_locations_restaurant_id ON public.store_locations(restaurant_id);
CREATE INDEX idx_store_locations_is_active ON public.store_locations(is_active);
CREATE INDEX idx_store_locations_is_primary ON public.store_locations(is_primary);
CREATE INDEX idx_store_employees_store_location_id ON public.store_employees(store_location_id);
CREATE INDEX idx_store_employees_user_id ON public.store_employees(user_id);
CREATE INDEX idx_store_inventory_store_location_id ON public.store_inventory(store_location_id);
CREATE INDEX idx_store_inventory_menu_item_id ON public.store_inventory(menu_item_id);
CREATE INDEX idx_store_orders_store_location_id ON public.store_orders(store_location_id);
CREATE INDEX idx_store_orders_order_id ON public.store_orders(order_id);

-- Create function to ensure only one primary location per restaurant
CREATE OR REPLACE FUNCTION ensure_single_primary_location()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a location as primary, unset all other primary locations for this restaurant
    IF NEW.is_primary = true THEN
        UPDATE public.store_locations 
        SET is_primary = false 
        WHERE restaurant_id = NEW.restaurant_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single primary location
CREATE TRIGGER trigger_ensure_single_primary_location
    BEFORE INSERT OR UPDATE ON public.store_locations
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_location();

-- Create function to auto-assign orders to primary location
CREATE OR REPLACE FUNCTION assign_order_to_primary_location()
RETURNS TRIGGER AS $$
DECLARE
    primary_location_id UUID;
BEGIN
    -- Get the primary location for the restaurant
    SELECT id INTO primary_location_id
    FROM public.store_locations
    WHERE restaurant_id = NEW.restaurant_id
    AND is_primary = true
    AND is_active = true
    LIMIT 1;
    
    -- If no primary location found, get any active location
    IF primary_location_id IS NULL THEN
        SELECT id INTO primary_location_id
        FROM public.store_locations
        WHERE restaurant_id = NEW.restaurant_id
        AND is_active = true
        LIMIT 1;
    END IF;
    
    -- Assign order to the location
    IF primary_location_id IS NOT NULL THEN
        INSERT INTO public.store_orders (order_id, store_location_id)
        VALUES (NEW.id, primary_location_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign orders to primary location
CREATE TRIGGER trigger_assign_order_to_primary_location
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION assign_order_to_primary_location();

-- Create function to initialize inventory for new store locations
CREATE OR REPLACE FUNCTION initialize_store_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- Copy all menu items from the restaurant to the new store location
    INSERT INTO public.store_inventory (store_location_id, menu_item_id, quantity_available, is_available)
    SELECT 
        NEW.id,
        mi.id,
        CASE 
            WHEN mi.is_available = true THEN 100 -- Default quantity for available items
            ELSE 0
        END,
        mi.is_available
    FROM public.menu_items mi
    WHERE mi.restaurant_id = NEW.restaurant_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize inventory for new store locations
CREATE TRIGGER trigger_initialize_store_inventory
    AFTER INSERT ON public.store_locations
    FOR EACH ROW
    EXECUTE FUNCTION initialize_store_inventory();
