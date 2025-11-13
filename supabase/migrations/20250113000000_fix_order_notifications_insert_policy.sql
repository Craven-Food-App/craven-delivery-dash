-- Fix RLS policy to allow users to insert their own notifications
-- This is needed for driver alert system to create notifications

-- Drop existing INSERT policy if it exists (from older migration)
DROP POLICY IF EXISTS "System can create notifications" ON public.order_notifications;

-- Create new policy allowing users to insert their own notifications
CREATE POLICY "Users can insert their own notifications"
ON public.order_notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

