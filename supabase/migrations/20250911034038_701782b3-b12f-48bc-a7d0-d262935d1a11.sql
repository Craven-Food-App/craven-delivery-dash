-- Create customer favorites table
CREATE TABLE IF NOT EXISTS public.customer_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(customer_id, restaurant_id)
);

-- Enable RLS on customer_favorites
ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for customer_favorites
CREATE POLICY "Users can manage their own favorites" 
ON public.customer_favorites 
FOR ALL 
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- Create a function to automatically create user profiles for existing users
CREATE OR REPLACE FUNCTION public.ensure_user_profile() 
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Create profiles for existing auth users who don't have profiles
  FOR user_record IN 
    SELECT au.id, au.email 
    FROM auth.users au 
    LEFT JOIN public.user_profiles up ON au.id = up.user_id 
    WHERE up.user_id IS NULL
  LOOP
    INSERT INTO public.user_profiles (user_id, full_name, role)
    VALUES (user_record.id, user_record.email, 'customer')
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to create missing profiles
SELECT public.ensure_user_profile();