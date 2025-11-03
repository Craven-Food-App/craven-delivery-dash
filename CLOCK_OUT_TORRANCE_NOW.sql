-- Direct clock out for Torrance Stroman's active entry
-- Entry ID: 093f9d98-64f3-49ed-8fb9-8a21feec0554
-- User ID: 93a342c6-9dc2-4bf6-ab1c-0dc1d17148cd

UPDATE public.time_entries
SET 
  clock_out_at = now(),
  status = 'clocked_out',
  updated_at = now()
WHERE id = '093f9d98-64f3-49ed-8fb9-8a21feec0554';

-- Verify it worked
SELECT 
  id,
  user_id,
  clock_in_at,
  clock_out_at,
  status,
  total_hours
FROM public.time_entries
WHERE id = '093f9d98-64f3-49ed-8fb9-8a21feec0554';

