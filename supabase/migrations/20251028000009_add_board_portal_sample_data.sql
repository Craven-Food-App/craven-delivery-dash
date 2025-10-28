-- Add sample data for Board/Executive Portal

-- First, ensure RLS policies allow reading for all executives (not just CEO)
DROP POLICY IF EXISTS "Executives can view all exec users" ON public.exec_users;

CREATE POLICY "Executives can view all exec users"
ON public.exec_users FOR SELECT
TO authenticated
USING (
  -- Users can view their own record
  user_id = auth.uid()
  OR
  -- Or if they are already an executive, they can see all
  EXISTS (
    SELECT 1 FROM public.exec_users WHERE user_id = auth.uid()
  )
);

-- Add sample executives (CFO, COO, CTO, Board Members)
-- Note: You'll need to create auth accounts for these emails first in Supabase Auth
-- For now, these are placeholder entries

DO $$
BEGIN
  -- Only insert if we have actual users, otherwise skip
  -- This prevents errors if auth users don't exist yet
  
  -- Insert sample messages
  INSERT INTO public.exec_messages (from_user_id, to_user_ids, subject, message, priority, is_confidential)
  SELECT 
    (SELECT id FROM public.exec_users WHERE role = 'ceo' LIMIT 1),
    ARRAY[(SELECT id FROM public.exec_users WHERE role = 'ceo' LIMIT 1)],
    'Q1 Strategic Planning Session',
    'Team, let''s schedule our Q1 strategy session for next week. Please review the attached materials and come prepared with your department updates.',
    'high',
    true
  WHERE EXISTS (SELECT 1 FROM public.exec_users WHERE role = 'ceo');

  INSERT INTO public.exec_messages (from_user_id, to_user_ids, subject, message, priority, is_confidential)
  SELECT 
    (SELECT id FROM public.exec_users WHERE role = 'ceo' LIMIT 1),
    ARRAY[(SELECT id FROM public.exec_users WHERE role = 'ceo' LIMIT 1)],
    'Board Meeting Reminder',
    'Reminder: Board meeting this Friday at 2 PM. Video link will be sent separately.',
    'normal',
    true
  WHERE EXISTS (SELECT 1 FROM public.exec_users WHERE role = 'ceo');

END $$;

-- Insert sample board meetings
INSERT INTO public.board_meetings (title, description, scheduled_at, duration_minutes, meeting_url, status)
VALUES
  (
    'Q1 Board Review',
    'Quarterly financial review and strategic planning session',
    CURRENT_TIMESTAMP + INTERVAL '5 days',
    120,
    'https://zoom.us/j/board-q1-review',
    'scheduled'
  ),
  (
    'Executive Team Weekly Sync',
    'Weekly check-in with C-suite executives',
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    60,
    'https://meet.google.com/exec-weekly',
    'scheduled'
  ),
  (
    'Budget Approval Meeting',
    'Review and approve department budgets for next quarter',
    CURRENT_TIMESTAMP + INTERVAL '1 week',
    90,
    'https://zoom.us/j/budget-approval',
    'scheduled'
  )
ON CONFLICT DO NOTHING;

-- Insert sample documents
DO $$
DECLARE
  exec_user_id UUID;
BEGIN
  -- Get first exec user if exists
  SELECT id INTO exec_user_id FROM public.exec_users LIMIT 1;
  
  IF exec_user_id IS NOT NULL THEN
    INSERT INTO public.exec_documents (title, description, category, file_url, access_level, uploaded_by)
    VALUES
      (
        'Q4 2024 Financial Report',
        'Complete financial statements and analysis for Q4',
        'financial',
        'https://docs.craven.com/financial/q4-2024',
        2,
        exec_user_id
      ),
      (
        'Board Meeting Minutes - October',
        'Official minutes from October board meeting',
        'board_materials',
        'https://docs.craven.com/board/minutes-oct-2024',
        1,
        exec_user_id
      ),
      (
        'Strategic Plan 2025-2027',
        'Three-year strategic roadmap and initiatives',
        'strategic',
        'https://docs.craven.com/strategy/plan-2025-2027',
        1,
        exec_user_id
      ),
      (
        'Employment Contracts Template',
        'Standard employment contract template',
        'hr',
        'https://docs.craven.com/hr/contract-template',
        2,
        exec_user_id
      ),
      (
        'Legal Compliance Overview',
        'Regulatory compliance status and requirements',
        'legal',
        'https://docs.craven.com/legal/compliance-2024',
        1,
        exec_user_id
      )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert sample executive metrics
INSERT INTO public.exec_metrics (metric_type, metric_name, metric_value, period, period_start, period_end)
VALUES
  (
    'financial',
    'monthly_revenue',
    '{"value": 245680, "growth": 15.2, "target": 250000}'::jsonb,
    'monthly',
    DATE_TRUNC('month', CURRENT_DATE),
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  ),
  (
    'operations',
    'order_fulfillment',
    '{"orders": 3450, "fulfilled": 3398, "rate": 98.5}'::jsonb,
    'monthly',
    DATE_TRUNC('month', CURRENT_DATE),
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  ),
  (
    'growth',
    'customer_acquisition',
    '{"new_customers": 487, "churn": 23, "net_growth": 464}'::jsonb,
    'monthly',
    DATE_TRUNC('month', CURRENT_DATE),
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  ),
  (
    'people',
    'employee_count',
    '{"total": 234, "new_hires": 12, "terminations": 3, "retention_rate": 94.5}'::jsonb,
    'monthly',
    DATE_TRUNC('month', CURRENT_DATE),
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  )
ON CONFLICT (metric_type, metric_name, period, period_start) DO NOTHING;

