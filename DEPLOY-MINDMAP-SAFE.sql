-- Deploy Mind Map Feature (Safe Version - Drops Existing Policies First)
-- Run this in Supabase SQL Editor

-- Strategic Mind Maps for CEO Portal
CREATE TABLE IF NOT EXISTS public.ceo_mindmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_name TEXT NOT NULL UNIQUE,
  map_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.ceo_mindmaps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "CEO can manage mind maps" ON public.ceo_mindmaps;
DROP POLICY IF EXISTS "Others can view mind maps" ON public.ceo_mindmaps;

-- Create policies
CREATE POLICY "CEO can manage mind maps"
  ON public.ceo_mindmaps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exec_users 
      WHERE user_id = auth.uid() AND role = 'ceo'
    )
  );

CREATE POLICY "Others can view mind maps"
  ON public.ceo_mindmaps FOR SELECT
  TO authenticated
  USING (true);

-- Insert default strategic overview (only if it doesn't exist)
INSERT INTO public.ceo_mindmaps (map_name, map_data) VALUES
  ('Strategic Overview', '[
    {"id":"1","text":"Craven Delivery","x":400,"y":300,"children":[
      {"id":"2","text":"Revenue Growth","x":250,"y":200,"children":[
        {"id":"3","text":"Expand Markets","x":150,"y":150,"children":[]},
        {"id":"4","text":"Increase Orders","x":150,"y":250,"children":[]}
      ],"parentId":"1","color":"#3b82f6"},
      {"id":"5","text":"Operations","x":550,"y":200,"children":[
        {"id":"6","text":"Fleet Management","x":500,"y":150,"children":[]},
        {"id":"7","text":"Driver Retention","x":600,"y":150,"children":[]}
      ],"parentId":"1","color":"#8b5cf6"},
      {"id":"8","text":"Technology","x":400,"y":450,"children":[
        {"id":"9","text":"Platform Stability","x":300,"y":500,"children":[]},
        {"id":"10","text":"Mobile Apps","x":400,"y":500,"children":[]},
        {"id":"11","text":"AI Features","x":500,"y":500,"children":[]}
      ],"parentId":"1","color":"#ec4899"},
      {"id":"12","text":"Team","x":250,"y":400,"children":[
        {"id":"13","text":"Hiring","x":200,"y":450,"children":[]},
        {"id":"14","text":"Culture","x":250,"y":450,"children":[]},
        {"id":"15","text":"Retention","x":300,"y":450,"children":[]}
      ],"parentId":"1","color":"#10b981"}
    ]}
  ]'::jsonb)
ON CONFLICT (map_name) DO NOTHING;

-- Verify
SELECT 'Mind Map table created/updated successfully!' as status;

