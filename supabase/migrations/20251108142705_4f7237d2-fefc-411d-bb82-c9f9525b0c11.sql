-- Create table for synced Gmail messages
CREATE TABLE IF NOT EXISTS public.gmail_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id TEXT NOT NULL UNIQUE,
  gmail_thread_id TEXT,
  delegated_user TEXT NOT NULL,
  subject TEXT,
  from_address TEXT,
  to_address TEXT,
  cc_address TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMP WITH TIME ZONE,
  label_ids TEXT[],
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  folder TEXT DEFAULT 'inbox',
  raw_headers JSONB,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gmail_messages ENABLE ROW LEVEL SECURITY;

-- Create policies - allow all authenticated users for now (executives can access)
CREATE POLICY "Authenticated users can view Gmail messages"
  ON public.gmail_messages
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gmail_messages_delegated_user ON public.gmail_messages(delegated_user);
CREATE INDEX IF NOT EXISTS idx_gmail_messages_thread_id ON public.gmail_messages(gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_gmail_messages_received_at ON public.gmail_messages(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_gmail_messages_folder ON public.gmail_messages(folder);
CREATE INDEX IF NOT EXISTS idx_gmail_messages_is_read ON public.gmail_messages(is_read);

-- Create table for Gmail sync state (tracks delta tokens)
CREATE TABLE IF NOT EXISTS public.gmail_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegated_user TEXT NOT NULL UNIQUE,
  history_id TEXT,
  delta_token TEXT,
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_id TEXT,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gmail_sync_state ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Authenticated users can view sync state"
  ON public.gmail_sync_state
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_gmail_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gmail_messages_updated_at
  BEFORE UPDATE ON public.gmail_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_gmail_updated_at();

CREATE TRIGGER update_gmail_sync_state_updated_at
  BEFORE UPDATE ON public.gmail_sync_state
  FOR EACH ROW
  EXECUTE FUNCTION update_gmail_updated_at();