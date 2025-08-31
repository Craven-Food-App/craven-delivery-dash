-- Enable real-time functionality for customer orders and delivery orders
ALTER TABLE public.customer_orders REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.driver_profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_profiles;

-- Add order notification tracking table
CREATE TABLE public.order_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.order_notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" 
ON public.order_notifications 
FOR INSERT 
WITH CHECK (true);

-- Add payment processing fields to customer orders
ALTER TABLE public.customer_orders 
ADD COLUMN stripe_session_id TEXT,
ADD COLUMN stripe_payment_intent_id TEXT;

-- Create index for better performance
CREATE INDEX idx_customer_orders_status ON public.customer_orders(order_status);
CREATE INDEX idx_delivery_orders_status ON public.delivery_orders(status);
CREATE INDEX idx_order_assignments_status ON public.order_assignments(status);
CREATE INDEX idx_order_notifications_user_id ON public.order_notifications(user_id);

-- Add automatic driver assignment trigger
CREATE OR REPLACE FUNCTION public.auto_assign_driver()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for delivery orders that are pending and don't have a driver assigned
  IF NEW.delivery_method = 'delivery' AND NEW.order_status = 'confirmed' AND OLD.order_status != 'confirmed' THEN
    -- Call the auto-assign-orders edge function
    PERFORM net.http_post(
      'https://mcvruzjqnkojzyvpvfkg.supabase.co/functions/v1/auto-assign-orders',
      jsonb_build_object('orderId', NEW.id),
      'application/json',
      jsonb_build_object('Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic driver assignment
CREATE TRIGGER trigger_auto_assign_driver
  AFTER UPDATE ON public.customer_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_driver();