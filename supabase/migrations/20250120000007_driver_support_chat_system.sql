-- Driver Support Chat System
-- Premium iMessage-style support chat

-- 1. Driver Support Chats (Conversation threads)
CREATE TABLE IF NOT EXISTS driver_support_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Categorization
  category TEXT CHECK (category IN ('order', 'earnings', 'app', 'navigation', 'ratings', 'general')) DEFAULT 'general',
  subject TEXT,
  
  -- Status
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  
  -- Metrics
  first_response_time_seconds INT,
  resolution_time_seconds INT,
  agent_response_count INT DEFAULT 0,
  driver_response_count INT DEFAULT 0,
  
  -- Satisfaction
  satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback TEXT,
  
  -- Timestamps
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Driver Support Messages
CREATE TABLE IF NOT EXISTS driver_support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES driver_support_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('driver', 'agent', 'system')) NOT NULL,
  
  -- Message content
  message_text TEXT,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'voice', 'location', 'order_card', 'quick_action')) DEFAULT 'text',
  
  -- Attachments
  attachment_url TEXT,
  attachment_type TEXT, -- 'image', 'audio', 'document'
  
  -- Metadata (auto-attached context)
  metadata JSONB, -- Order details, device info, location, etc.
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chat Quick Responses (Pre-defined conversation starters)
CREATE TABLE IF NOT EXISTS chat_quick_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'order', 'earnings', 'app', 'navigation', 'ratings'
  button_icon TEXT, -- Emoji
  button_text TEXT NOT NULL,
  auto_message TEXT NOT NULL, -- Message sent when tapped
  follow_up_options JSONB, -- Array of follow-up button options
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Support Agents (Track agent performance)
CREATE TABLE IF NOT EXISTS support_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  
  -- Performance metrics
  total_chats_handled INT DEFAULT 0,
  avg_satisfaction_rating DECIMAL(3,2) DEFAULT 5.0,
  avg_response_time_seconds INT DEFAULT 120,
  total_chats_resolved INT DEFAULT 0,
  
  -- Status
  is_online BOOLEAN DEFAULT false,
  current_active_chats INT DEFAULT 0,
  max_concurrent_chats INT DEFAULT 5,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_chats_driver ON driver_support_chats(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_support_chats_agent ON driver_support_chats(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_support_chats_status ON driver_support_chats(status, priority);
CREATE INDEX IF NOT EXISTS idx_support_messages_chat ON driver_support_messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_unread ON driver_support_messages(sender_type, is_read);
CREATE INDEX IF NOT EXISTS idx_quick_responses_category ON chat_quick_responses(category, is_active);
CREATE INDEX IF NOT EXISTS idx_support_agents_online ON support_agents(is_online, current_active_chats);

-- Enable RLS
ALTER TABLE driver_support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_quick_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Drivers can view their own chats"
  ON driver_support_chats FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can create chats"
  ON driver_support_chats FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Agents can view assigned chats"
  ON driver_support_chats FOR ALL
  TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Drivers can view their chat messages"
  ON driver_support_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM driver_support_chats
      WHERE driver_support_chats.id = chat_id
      AND driver_support_chats.driver_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can send messages in their chats"
  ON driver_support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM driver_support_chats
      WHERE driver_support_chats.id = chat_id
      AND driver_support_chats.driver_id = auth.uid()
    )
  );

CREATE POLICY "Agents can manage chat messages"
  ON driver_support_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM driver_support_chats
      WHERE driver_support_chats.id = chat_id
      AND driver_support_chats.agent_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Everyone can view quick responses"
  ON chat_quick_responses FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Drivers can view online agents"
  ON support_agents FOR SELECT
  TO authenticated
  USING (is_online = true);

-- Triggers
CREATE TRIGGER support_chats_updated_at
  BEFORE UPDATE ON driver_support_chats
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_updated_at();

CREATE TRIGGER support_agents_updated_at
  BEFORE UPDATE ON support_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_updated_at();

-- Function to update last_message_at on chat
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE driver_support_chats
  SET last_message_at = NOW()
  WHERE id = NEW.chat_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_message_on_new_message
  AFTER INSERT ON driver_support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_last_message();

-- Insert quick response templates
INSERT INTO chat_quick_responses (category, button_icon, button_text, auto_message, follow_up_options, priority)
VALUES
  ('order', '📦', 'Order Issue', 'I need help with an order', 
   '["Current delivery", "Recent order", "Specific order number"]'::jsonb, 1),
  ('earnings', '💰', 'Earnings', 'I have a question about my earnings', 
   '["Missing payment", "Tip amount wrong", "Weekly summary incorrect", "Instant Pay issue"]'::jsonb, 2),
  ('app', '🚗', 'App Issue', 'I''m having an app problem', 
   '["App crashing", "Map not loading", "Can''t go online", "GPS issue", "Notifications not working"]'::jsonb, 3),
  ('navigation', '🗺️', 'Navigation', 'I need navigation help', 
   '["Wrong directions", "Can''t find building", "Address doesn''t exist", "Need gate code", "GPS wrong location"]'::jsonb, 4),
  ('ratings', '⭐', 'Ratings', 'I have a rating question', 
   '["Unfair rating", "Contest review", "Rating dropped", "How to improve"]'::jsonb, 5),
  ('general', '📞', 'Call Support', 'I need to speak with someone', 
   '["Emergency", "Urgent issue", "General support"]'::jsonb, 6)
ON CONFLICT DO NOTHING;

