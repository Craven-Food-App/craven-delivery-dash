-- ============================================
-- QUICK FIX: Chat System Only
-- Copy this ENTIRE file and paste in Supabase SQL Editor
-- ============================================

-- Driver Support Chats
CREATE TABLE IF NOT EXISTS driver_support_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text CHECK (category IN ('order','earnings','app','navigation','ratings','general')) DEFAULT 'general',
  subject text,
  status text CHECK (status IN ('open','in_progress','resolved','escalated')) DEFAULT 'open',
  priority text CHECK (priority IN ('low','normal','high','urgent')) DEFAULT 'normal',
  first_response_time_seconds int,
  resolution_time_seconds int,
  agent_response_count int DEFAULT 0,
  driver_response_count int DEFAULT 0,
  satisfaction_rating int CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback text,
  last_message_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Driver Support Messages
CREATE TABLE IF NOT EXISTS driver_support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES driver_support_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type text CHECK (sender_type IN ('driver','agent','system')) NOT NULL,
  message_text text,
  message_type text CHECK (message_type IN ('text','image','voice','location','order_card','quick_action')) DEFAULT 'text',
  attachment_url text,
  attachment_type text,
  metadata jsonb,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Quick Responses
CREATE TABLE IF NOT EXISTS chat_quick_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  button_icon text,
  button_text text NOT NULL,
  auto_message text NOT NULL,
  follow_up_options jsonb,
  priority int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Support Agents
CREATE TABLE IF NOT EXISTS support_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name text NOT NULL,
  avatar_url text,
  total_chats_handled int DEFAULT 0,
  avg_satisfaction_rating decimal(3,2) DEFAULT 5.0,
  avg_response_time_seconds int DEFAULT 120,
  total_chats_resolved int DEFAULT 0,
  is_online boolean DEFAULT false,
  current_active_chats int DEFAULT 0,
  max_concurrent_chats int DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE driver_support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_quick_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_agents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Drivers view own chats" ON driver_support_chats;
DROP POLICY IF EXISTS "Drivers create chats" ON driver_support_chats;
DROP POLICY IF EXISTS "Drivers view own messages" ON driver_support_messages;
DROP POLICY IF EXISTS "Drivers send messages" ON driver_support_messages;
DROP POLICY IF EXISTS "Everyone view quick responses" ON chat_quick_responses;

-- RLS policies
CREATE POLICY "Drivers view own chats"
  ON driver_support_chats FOR SELECT TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers create chats"
  ON driver_support_chats FOR INSERT TO authenticated
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Drivers view own messages"
  ON driver_support_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM driver_support_chats c
    WHERE c.id = chat_id AND c.driver_id = auth.uid()
  ));

CREATE POLICY "Drivers send messages"
  ON driver_support_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM driver_support_chats c
      WHERE c.id = chat_id AND c.driver_id = auth.uid()
    )
  );

CREATE POLICY "Everyone view quick responses"
  ON chat_quick_responses FOR SELECT TO authenticated
  USING (is_active = true);

-- Seed quick responses
INSERT INTO chat_quick_responses (category, button_icon, button_text, auto_message, follow_up_options, priority)
VALUES
  ('order', '📦', 'Order Issue', 'I need help with an order', '["Current delivery","Recent order","Specific order number"]'::jsonb, 1),
  ('earnings', '💰', 'Earnings', 'I have a question about my earnings', '["Missing payment","Tip amount wrong","Weekly summary incorrect","Instant Pay issue"]'::jsonb, 2),
  ('app', '🚗', 'App Issue', 'I''m having an app problem', '["App crashing","Map not loading","Can''t go online","GPS issue","Notifications not working"]'::jsonb, 3),
  ('navigation', '🗺️', 'Navigation', 'I need navigation help', '["Wrong directions","Can''t find building","Address doesn''t exist","Need gate code","GPS wrong location"]'::jsonb, 4),
  ('ratings', '⭐', 'Ratings', 'I have a rating question', '["Unfair rating","Contest review","Rating dropped","How to improve"]'::jsonb, 5),
  ('general', '📞', 'Call Support', 'I need to speak with someone', '["Emergency","Urgent issue","General support"]'::jsonb, 6)
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Chat system installed successfully!';
  RAISE NOTICE '💬 Refresh your app and try the Help button';
END $$;

