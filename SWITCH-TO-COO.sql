-- Switch your user from CTO to COO to test the COO portal

UPDATE public.exec_users 
SET 
  role = 'coo', 
  title = 'Chief Operating Officer', 
  department = 'Operations'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'craven@usa.com');

-- Verify
SELECT eu.role, u.email, eu.title, eu.department
FROM public.exec_users eu
JOIN auth.users u ON u.id = eu.user_id
WHERE u.email = 'craven@usa.com';

-- Now refresh your browser and visit: coo.cravenusa.com
-- You should see the COO Operations Portal with Fleet, Partners, Compliance tabs

