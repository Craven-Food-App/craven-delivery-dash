-- Add saved signatures table for executives
CREATE TABLE IF NOT EXISTS public.executive_saved_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  executive_id UUID REFERENCES public.exec_users(id) ON DELETE CASCADE,
  signature_name TEXT NOT NULL DEFAULT 'My Signature',
  signature_data_url TEXT NOT NULL, -- Base64 PNG data URL
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, signature_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_executive_saved_signatures_user_id ON public.executive_saved_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_executive_saved_signatures_executive_id ON public.executive_saved_signatures(executive_id);

-- Enable RLS
ALTER TABLE public.executive_saved_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'executive_saved_signatures' 
    AND policyname = 'Executives can view their own saved signatures'
  ) THEN
    CREATE POLICY "Executives can view their own saved signatures"
    ON public.executive_saved_signatures FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'executive_saved_signatures' 
    AND policyname = 'Executives can manage their own saved signatures'
  ) THEN
    CREATE POLICY "Executives can manage their own saved signatures"
    ON public.executive_saved_signatures FOR ALL
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Add updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_executive_saved_signatures_updated_at'
  ) THEN
    CREATE TRIGGER update_executive_saved_signatures_updated_at
      BEFORE UPDATE ON public.executive_saved_signatures
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

COMMENT ON TABLE public.executive_saved_signatures IS 'Saved signatures for executives to reuse across documents';

