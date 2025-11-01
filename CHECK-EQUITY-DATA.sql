-- Check current equity records
SELECT 
  e.id,
  e.employee_id,
  e.shares_percentage,
  e.shares_total,
  e.equity_type,
  e.grant_date,
  emp.first_name,
  emp.last_name,
  emp.position,
  emp.email
FROM public.employee_equity e
LEFT JOIN public.employees emp ON e.employee_id = emp.id
ORDER BY e.shares_percentage DESC, emp.last_name;

