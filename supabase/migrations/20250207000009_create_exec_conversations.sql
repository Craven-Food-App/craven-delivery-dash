-- ============================================================================
-- CREATE EXECUTIVE CONVERSATIONS TABLE FOR ISOLATED CHAT
-- ============================================================================
-- This table stores 1-on-1 conversations between executives with portal isolation
-- Each portal/device has its own conversation context
-- ============================================================================

-- Executive conversations table (1-on-1 chats with portal isolation)
CREATE TABLE IF NOT EXISTS public.exec_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_exec_id UUID NOT NULL REFERENCES public.exec_users(id) ON DELETE CASCADE,
  participant2_exec_id UUID NOT NULL REFERENCES public.exec_users(id) ON DELETE CASCADE,
  portal_context TEXT NOT NULL, -- 'ceo', 'cfo', 'coo', 'cto', 'board' - identifies which portal this conversation belongs to
  device_id TEXT, -- Optional: specific device/component ID for further isolation
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Ensure unique conversation per portal context
  UNIQUE(participant1_exec_id, participant2_exec_id, portal_context, device_id)
);

-- Executive conversation messages
CREATE TABLE IF NOT EXISTS public.exec_conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.exec_conversations(id) ON DELETE CASCADE,
  from_exec_id UUID NOT NULL REFERENCES public.exec_users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  attachment_type TEXT, -- 'image', 'file', null
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Index for efficient querying
  INDEX idx_conv_messages_conversation (conversation_id, created_at DESC)
);

-- Enable RLS
ALTER TABLE public.exec_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exec_conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Executives can view conversations they're part of
CREATE POLICY "Executives can view their conversations"
ON public.exec_conversations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users eu
    WHERE eu.user_id = auth.uid()
    AND (
      eu.id = participant1_exec_id OR eu.id = participant2_exec_id
    )
  )
);

-- RLS Policy: Executives can create conversations
CREATE POLICY "Executives can create conversations"
ON public.exec_conversations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exec_users eu
    WHERE eu.user_id = auth.uid()
    AND eu.id = participant1_exec_id
  )
);

-- RLS Policy: Executives can view messages in their conversations
CREATE POLICY "Executives can view conversation messages"
ON public.exec_conversation_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_conversations ec
    JOIN public.exec_users eu ON eu.user_id = auth.uid()
    WHERE ec.id = conversation_id
    AND (ec.participant1_exec_id = eu.id OR ec.participant2_exec_id = eu.id)
  )
);

-- RLS Policy: Executives can send messages in their conversations
CREATE POLICY "Executives can send conversation messages"
ON public.exec_conversation_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exec_conversations ec
    JOIN public.exec_users eu ON eu.user_id = auth.uid()
    WHERE ec.id = conversation_id
    AND (ec.participant1_exec_id = eu.id OR ec.participant2_exec_id = eu.id)
    AND eu.id = from_exec_id
  )
);

-- Function to get or create conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_participant1_exec_id UUID,
  p_participant2_exec_id UUID,
  p_portal_context TEXT,
  p_device_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_participant1 UUID;
  v_participant2 UUID;
BEGIN
  -- Ensure participant1 < participant2 for consistency
  IF p_participant1_exec_id < p_participant2_exec_id THEN
    v_participant1 := p_participant1_exec_id;
    v_participant2 := p_participant2_exec_id;
  ELSE
    v_participant1 := p_participant2_exec_id;
    v_participant2 := p_participant1_exec_id;
  END IF;

  -- Try to get existing conversation
  SELECT id INTO v_conversation_id
  FROM public.exec_conversations
  WHERE participant1_exec_id = v_participant1
    AND participant2_exec_id = v_participant2
    AND portal_context = p_portal_context
    AND (device_id = p_device_id OR (device_id IS NULL AND p_device_id IS NULL));

  -- If not found, create it
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.exec_conversations (
      participant1_exec_id,
      participant2_exec_id,
      portal_context,
      device_id
    )
    VALUES (
      v_participant1,
      v_participant2,
      p_portal_context,
      p_device_id
    )
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation TO authenticated;

-- Create indexes for performance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exec_conv_participants') THEN
    CREATE INDEX idx_exec_conv_participants ON public.exec_conversations(participant1_exec_id, participant2_exec_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exec_conv_portal') THEN
    CREATE INDEX idx_exec_conv_portal ON public.exec_conversations(portal_context);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exec_conv_device') THEN
    CREATE INDEX idx_exec_conv_device ON public.exec_conversations(device_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exec_conv_messages_conv') THEN
    CREATE INDEX idx_exec_conv_messages_conv ON public.exec_conversation_messages(conversation_id, created_at DESC);
  END IF;
END $$;

-- Add comments
COMMENT ON TABLE public.exec_conversations IS '1-on-1 executive conversations isolated by portal context';
COMMENT ON TABLE public.exec_conversation_messages IS 'Messages within executive conversations';
COMMENT ON FUNCTION public.get_or_create_conversation IS 'Gets or creates a conversation between two executives in a specific portal context';

