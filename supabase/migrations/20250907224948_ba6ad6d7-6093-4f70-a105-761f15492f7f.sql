-- Create superuser admin account
-- Note: This creates the user record and admin role
-- The actual auth user will need to be created through Supabase Auth

-- Insert admin role for the specific email
INSERT INTO public.user_roles (user_id, role)
SELECT auth.uid(), 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE role = 'admin'
);

-- Create a function to automatically assign admin role to the specific email
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the new user has the admin email
  IF NEW.email = 'crave-n@usa.com' THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
    
    -- Create user profile
    INSERT INTO public.user_profiles (user_id, full_name, role)
    VALUES (NEW.id, 'Super Admin', 'admin');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically assign admin role
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role();