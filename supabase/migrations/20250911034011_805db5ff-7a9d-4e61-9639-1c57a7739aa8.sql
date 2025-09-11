-- Fix the foreign key constraint issue by ensuring user_profiles references auth.users correctly
-- and create a trigger to automatically create profiles for new users

-- Drop the existing foreign key constraint if it exists
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

-- Add the correct foreign key constraint to auth.users
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a function to automatically create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    'customer'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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