-- ============================================================================
-- CREATE GROUP CONVERSATIONS SYSTEM
-- ============================================================================
-- This extends the executive conversation system to support group chats
-- ============================================================================

-- Group conversations table
CREATE TABLE IF NOT EXISTS public.exec_group_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Group name/title
  created_by_exec_id UUID NOT NULL REFERENCES public.exec_users(id) ON DELETE CASCADE,
  portal_context TEXT NOT NULL, -- 'ceo', 'cfo', 'coo', 'cto', 'board'
  device_id TEXT, -- Optional: specific device/component ID for isolation
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Group conversation participants (junction table)
CREATE TABLE IF NOT EXISTS public.exec_group_conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_conversation_id UUID NOT NULL REFERENCES public.exec_group_conversations(id) ON DELETE CASCADE,
  exec_user_id UUID NOT NULL REFERENCES public.exec_users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_conversation_id, exec_user_id)
);

-- Group conversation messages (reuses structure but references group conversations)
CREATE TABLE IF NOT EXISTS public.exec_group_conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_conversation_id UUID NOT NULL REFERENCES public.exec_group_conversations(id) ON DELETE CASCADE,
  from_exec_id UUID NOT NULL REFERENCES public.exec_users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  attachment_type TEXT, -- 'image', 'file', null
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exec_group_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exec_group_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exec_group_conversation_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- RLS Policy: Executives can view group conversations they're part of
DROP POLICY IF EXISTS "Executives can view their group conversations" ON public.exec_group_conversations;
CREATE POLICY "Executives can view their group conversations"
ON public.exec_group_conversations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_group_conversation_participants gcp
    JOIN public.exec_users eu ON eu.id = gcp.exec_user_id
    WHERE gcp.group_conversation_id = exec_group_conversations.id
    AND eu.user_id = auth.uid()
  )
);

-- RLS Policy: Executives can create group conversations
DROP POLICY IF EXISTS "Executives can create group conversations" ON public.exec_group_conversations;
CREATE POLICY "Executives can create group conversations"
ON public.exec_group_conversations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exec_users eu
    WHERE eu.user_id = auth.uid()
    AND eu.id = created_by_exec_id
  )
);

-- RLS Policy: Executives can view participants in their group conversations
DROP POLICY IF EXISTS "Executives can view group participants" ON public.exec_group_conversation_participants;
CREATE POLICY "Executives can view group participants"
ON public.exec_group_conversation_participants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_group_conversation_participants gcp
    JOIN public.exec_users eu ON eu.id = gcp.exec_user_id
    WHERE gcp.group_conversation_id = exec_group_conversation_participants.group_conversation_id
    AND eu.user_id = auth.uid()
  )
);

-- RLS Policy: Executives can add participants to groups they created
DROP POLICY IF EXISTS "Executives can add group participants" ON public.exec_group_conversation_participants;
CREATE POLICY "Executives can add group participants"
ON public.exec_group_conversation_participants FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exec_group_conversations gc
    JOIN public.exec_users eu ON eu.id = gc.created_by_exec_id
    WHERE gc.id = group_conversation_id
    AND eu.user_id = auth.uid()
  )
);

-- RLS Policy: Executives can view messages in their group conversations
DROP POLICY IF EXISTS "Executives can view group conversation messages" ON public.exec_group_conversation_messages;
CREATE POLICY "Executives can view group conversation messages"
ON public.exec_group_conversation_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_group_conversation_participants gcp
    JOIN public.exec_users eu ON eu.id = gcp.exec_user_id
    WHERE gcp.group_conversation_id = group_conversation_id
    AND eu.user_id = auth.uid()
  )
);

-- RLS Policy: Executives can send messages in their group conversations
DROP POLICY IF EXISTS "Executives can send group conversation messages" ON public.exec_group_conversation_messages;
CREATE POLICY "Executives can send group conversation messages"
ON public.exec_group_conversation_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exec_group_conversation_participants gcp
    JOIN public.exec_users eu ON eu.id = gcp.exec_user_id
    WHERE gcp.group_conversation_id = group_conversation_id
    AND eu.user_id = auth.uid()
    AND eu.id = from_exec_id
  )
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to create a group conversation with participants
CREATE OR REPLACE FUNCTION public.create_group_conversation(
  p_name TEXT,
  p_created_by_exec_id UUID,
  p_portal_context TEXT,
  p_participant_exec_ids UUID[],
  p_device_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_group_conversation_id UUID;
  v_participant_id UUID;
BEGIN
  -- Create the group conversation
  INSERT INTO public.exec_group_conversations (
    name,
    created_by_exec_id,
    portal_context,
    device_id
  )
  VALUES (
    p_name,
    p_created_by_exec_id,
    p_portal_context,
    p_device_id
  )
  RETURNING id INTO v_group_conversation_id;

  -- Add all participants (including creator)
  INSERT INTO public.exec_group_conversation_participants (
    group_conversation_id,
    exec_user_id
  )
  SELECT v_group_conversation_id, unnest(p_participant_exec_ids)
  ON CONFLICT (group_conversation_id, exec_user_id) DO NOTHING;

  -- Ensure creator is added (even if not in array)
  INSERT INTO public.exec_group_conversation_participants (
    group_conversation_id,
    exec_user_id
  )
  VALUES (v_group_conversation_id, p_created_by_exec_id)
  ON CONFLICT (group_conversation_id, exec_user_id) DO NOTHING;

  RETURN v_group_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_group_conversation TO authenticated;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_conv_created_by') THEN
    CREATE INDEX idx_group_conv_created_by ON public.exec_group_conversations(created_by_exec_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_conv_portal') THEN
    CREATE INDEX idx_group_conv_portal ON public.exec_group_conversations(portal_context);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_conv_participants_group') THEN
    CREATE INDEX idx_group_conv_participants_group ON public.exec_group_conversation_participants(group_conversation_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_conv_participants_exec') THEN
    CREATE INDEX idx_group_conv_participants_exec ON public.exec_group_conversation_participants(exec_user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_conv_messages_group') THEN
    CREATE INDEX idx_group_conv_messages_group ON public.exec_group_conversation_messages(group_conversation_id, created_at DESC);
  END IF;
END $$;

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE public.exec_group_conversations IS 'Group conversations between multiple executives';
COMMENT ON TABLE public.exec_group_conversation_participants IS 'Junction table linking executives to group conversations';
COMMENT ON TABLE public.exec_group_conversation_messages IS 'Messages within group conversations';
COMMENT ON FUNCTION public.create_group_conversation IS 'Creates a group conversation with multiple participants';

-- ============================================================================
-- VERIFY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Group Conversations system created successfully!';
  RAISE NOTICE '   - exec_group_conversations table created';
  RAISE NOTICE '   - exec_group_conversation_participants table created';
  RAISE NOTICE '   - exec_group_conversation_messages table created';
  RAISE NOTICE '   - RLS policies configured';
  RAISE NOTICE '   - create_group_conversation function created';
  RAISE NOTICE '   - Indexes created';
END $$;

