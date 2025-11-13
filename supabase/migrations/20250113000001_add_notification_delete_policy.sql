-- Add RLS policy to allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.order_notifications
FOR DELETE
USING (auth.uid() = user_id);

