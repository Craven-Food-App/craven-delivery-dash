-- ============================================================================
-- APPLY CEO MEETINGS TABLE
-- ============================================================================
-- This script creates the ceo_meetings table if it doesn't exist
-- Run this in Supabase Dashboard SQL Editor
-- ============================================================================

-- Company meetings table
CREATE TABLE IF NOT EXISTS public.ceo_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('all-hands', 'executive', 'department', 'team', 'one-on-one', 'board')),
  
  organizer_id UUID REFERENCES auth.users(id),
  organizer_name TEXT,
  
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  
  location TEXT,
  meeting_url TEXT,
  meeting_password TEXT,
  
  attendees JSONB DEFAULT '[]'::jsonb,
  agenda JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ceo_meetings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "CEO can manage meetings" ON public.ceo_meetings;
DROP POLICY IF EXISTS "Executives can view meetings" ON public.ceo_meetings;
DROP POLICY IF EXISTS "Executives can create meetings" ON public.ceo_meetings;

-- RLS Policy: Executives can view all meetings
CREATE POLICY "Executives can view meetings"
ON public.ceo_meetings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users eu
    WHERE eu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- RLS Policy: Executives can create meetings
CREATE POLICY "Executives can create meetings"
ON public.ceo_meetings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exec_users eu
    WHERE eu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- RLS Policy: Executives can update meetings
CREATE POLICY "Executives can update meetings"
ON public.ceo_meetings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users eu
    WHERE eu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exec_users eu
    WHERE eu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- RLS Policy: Executives can delete meetings
CREATE POLICY "Executives can delete meetings"
ON public.ceo_meetings FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exec_users eu
    WHERE eu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_meetings_scheduled') THEN
    CREATE INDEX idx_meetings_scheduled ON public.ceo_meetings(scheduled_at);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_meetings_status') THEN
    CREATE INDEX idx_meetings_status ON public.ceo_meetings(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_meetings_organizer') THEN
    CREATE INDEX idx_meetings_organizer ON public.ceo_meetings(organizer_id);
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE public.ceo_meetings IS 'Company meetings scheduled by CEO and executives';

-- ============================================================================
-- VERIFY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ CEO Meetings table created successfully!';
  RAISE NOTICE '   - ceo_meetings table created';
  RAISE NOTICE '   - RLS policies configured for executives';
  RAISE NOTICE '   - Indexes created';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now create meetings in the CEO Command Center!';
END $$;

