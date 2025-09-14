-- Create chat system tables
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('customer_driver', 'customer_support', 'driver_support')),
  customer_id UUID REFERENCES auth.users(id),
  driver_id UUID REFERENCES auth.users(id),
  admin_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  subject TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'driver', 'admin', 'ai')),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations
CREATE POLICY "Users can view conversations they are part of" 
ON public.chat_conversations 
FOR SELECT 
USING (
  auth.uid() = customer_id OR 
  auth.uid() = driver_id OR 
  auth.uid() = admin_id OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Customers can create conversations" 
ON public.chat_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Drivers can create conversations" 
ON public.chat_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Users can update their conversations" 
ON public.chat_conversations 
FOR UPDATE 
USING (
  auth.uid() = customer_id OR 
  auth.uid() = driver_id OR 
  auth.uid() = admin_id OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their conversations" 
ON public.chat_messages 
FOR SELECT 
USING (
  conversation_id IN (
    SELECT id FROM chat_conversations 
    WHERE auth.uid() = customer_id OR 
          auth.uid() = driver_id OR 
          auth.uid() = admin_id OR
          EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
          )
  )
);

CREATE POLICY "Users can create messages in their conversations" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  conversation_id IN (
    SELECT id FROM chat_conversations 
    WHERE auth.uid() = customer_id OR 
          auth.uid() = driver_id OR 
          auth.uid() = admin_id OR
          EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
          )
  ) AND auth.uid() = sender_id
);

CREATE POLICY "Users can update messages they sent" 
ON public.chat_messages 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- Indexes for performance
CREATE INDEX idx_chat_conversations_customer_id ON public.chat_conversations(customer_id);
CREATE INDEX idx_chat_conversations_driver_id ON public.chat_conversations(driver_id);
CREATE INDEX idx_chat_conversations_order_id ON public.chat_conversations(order_id);
CREATE INDEX idx_chat_conversations_status ON public.chat_conversations(status);
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Trigger to update updated_at
CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add to realtime
ALTER TABLE chat_conversations REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;