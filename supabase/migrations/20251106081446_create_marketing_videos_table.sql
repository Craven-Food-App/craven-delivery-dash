-- Marketing Videos Table
-- Stores AI-generated videos from Runway API for social media ads and commercials

CREATE TABLE IF NOT EXISTS public.marketing_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT UNIQUE NOT NULL,
  prompt TEXT NOT NULL,
  status TEXT CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
  video_url TEXT,
  duration INTEGER DEFAULT 5,
  aspect_ratio TEXT DEFAULT '16:9',
  style TEXT DEFAULT 'cinematic',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_marketing_videos_task_id ON public.marketing_videos(task_id);
CREATE INDEX IF NOT EXISTS idx_marketing_videos_created_by ON public.marketing_videos(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_videos_status ON public.marketing_videos(status);

-- Enable RLS
ALTER TABLE public.marketing_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own videos
CREATE POLICY "Users can view their own videos"
ON public.marketing_videos
FOR SELECT
USING (auth.uid() = created_by);

-- Policy: Marketing team can view all videos
CREATE POLICY "Marketing team can view all videos"
ON public.marketing_videos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'marketing')
  )
);

-- Policy: Users can insert their own videos
CREATE POLICY "Users can insert their own videos"
ON public.marketing_videos
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own videos
CREATE POLICY "Users can update their own videos"
ON public.marketing_videos
FOR UPDATE
USING (auth.uid() = created_by);

-- Policy: Marketing team can update all videos
CREATE POLICY "Marketing team can update all videos"
ON public.marketing_videos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'marketing')
  )
);

