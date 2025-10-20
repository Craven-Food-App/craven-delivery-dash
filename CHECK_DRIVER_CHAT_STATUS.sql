-- Run this in Supabase SQL Editor to check your driver chat system status

-- 1. Check if realtime is enabled
SELECT 
  schemaname,
  tablename,
  'Realtime enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('driver_support_chats', 'driver_support_messages');

-- 2. Check RLS policies
SELECT 
  tablename,
  policyname,
  cmd as command,
  roles
FROM pg_policies 
WHERE tablename IN ('driver_support_chats', 'driver_support_messages')
ORDER BY tablename, policyname;

-- 3. Check if there are any chats
SELECT 
  COUNT(*) as total_chats,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_chats,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_chats,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_chats
FROM driver_support_chats;

-- 4. Check your admin role
SELECT 
  user_id,
  full_name,
  role,
  'Your current role' as note
FROM user_profiles 
WHERE user_id = auth.uid();

-- 5. Check if any drivers have profiles
SELECT 
  COUNT(*) as drivers_with_profiles
FROM user_profiles 
WHERE role = 'driver';

-- 6. Sample of recent chats (if any)
SELECT 
  dsc.id,
  dsc.status,
  dsc.category,
  dsc.created_at,
  up.full_name as driver_name,
  (SELECT COUNT(*) FROM driver_support_messages WHERE chat_id = dsc.id) as message_count
FROM driver_support_chats dsc
LEFT JOIN user_profiles up ON up.user_id = dsc.driver_id
ORDER BY dsc.created_at DESC
LIMIT 5;

