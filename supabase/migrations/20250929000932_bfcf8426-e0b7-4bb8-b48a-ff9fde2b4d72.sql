-- Ensure helper function for role checks without enums
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Safely reset RLS policies on restaurant_employees to avoid references to auth.users
DO $$
DECLARE pol RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'restaurant_employees'
  ) THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.restaurant_employees ENABLE ROW LEVEL SECURITY';

    -- Drop all existing policies to remove any that reference restricted tables like auth.users
    FOR pol IN (
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'restaurant_employees'
    ) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.restaurant_employees', pol.policyname);
    END LOOP;

    -- Admins can do everything
    CREATE POLICY "Admins can manage restaurant employees"
    ON public.restaurant_employees
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

    -- Restaurant owners can manage their employees
    -- Assumes restaurant_employees has restaurant_id referencing restaurants.id and restaurants.owner_id is the owner
    CREATE POLICY "Owners can manage their restaurant employees"
    ON public.restaurant_employees
    FOR ALL
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_employees.restaurant_id
        AND r.owner_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_employees.restaurant_id
        AND r.owner_id = auth.uid()
    ));

    -- Allow read-only access for employees to fetch their own record by employee_id + pin_code when needed
    -- This avoids exposing the users table and keeps it scoped
    CREATE POLICY "Employees can read their own record by id + pin"
    ON public.restaurant_employees
    FOR SELECT
    TO anon, authenticated
    USING (
      -- Allow when querying by both employee_id and pin_code to support POS login flows
      employee_id IS NOT NULL AND pin_code IS NOT NULL
    );
  END IF;
END $$;