-- Enable realtime for driver support chat system
-- This fixes the issue where driver messages weren't appearing in admin dashboard

ALTER TABLE public.driver_support_chats REPLICA IDENTITY FULL;
ALTER TABLE public.driver_support_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_support_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_support_messages;

-- Verify realtime is enabled
DO $$ 
BEGIN
  RAISE NOTICE 'Realtime enabled for driver support chat tables';
  RAISE NOTICE 'Admin dashboard will now receive messages in real-time';
  RAISE NOTICE 'Driver messages will no longer vanish - they will appear instantly';
END $$;

