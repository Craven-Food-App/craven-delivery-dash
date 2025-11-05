import { supabase } from "@/integrations/supabase/client";

export interface ExecutiveData {
  id: string; // exec_users.id
  user_id: string;
  role: string;
  title: string;
  department: string;
  access_level: number;
  full_name: string;
  email: string;
  position?: string;
  employee_id?: string;
  salary?: number;
  salary_status?: string;
  funding_trigger?: number;
  equity_percent?: number;
  shares_issued?: number;
  strike_price?: number;
  vesting_schedule?: any;
  grant_date?: string;
  equity_type?: string;
}

/**
 * Unified function to fetch executive data from all relevant tables.
 * This ensures consistency across the entire application.
 * 
 * Performs a 3-way join:
 * exec_users -> employees -> employee_equity
 */
export async function getExecutiveData(userId?: string): Promise<ExecutiveData[]> {
  try {
    // Step 1: Get exec_users
    let execQuery = supabase
      .from('exec_users')
      .select('id, user_id, role, title, department, access_level');
    
    if (userId) {
      execQuery = execQuery.eq('user_id', userId);
    }
    
    const { data: execUsers, error: execError } = await execQuery;
    
    if (execError) {
      console.error('Error fetching exec_users:', execError);
      return [];
    }
    
    if (!execUsers || execUsers.length === 0) {
      return [];
    }

    // Step 2: Get employees for these user_ids
    const userIds = execUsers.map(eu => eu.user_id).filter(Boolean);
    
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, user_id, first_name, last_name, email, position, salary, salary_status, funding_trigger')
      .in('user_id', userIds);
    
    if (empError) {
      console.error('Error fetching employees:', empError);
    }

    // Step 3: Get equity data for these employees
    const employeeIds = (employees || []).map(e => e.id).filter(Boolean);
    
    const { data: equityData, error: equityError } = await supabase
      .from('employee_equity')
      .select('employee_id, shares_percentage, shares_total, equity_type, strike_price, vesting_schedule, grant_date')
      .in('employee_id', employeeIds);
    
    if (equityError) {
      console.error('Error fetching employee_equity:', equityError);
    }

    // Step 4: Merge all data
    const employeesMap = new Map((employees || []).map(e => [e.user_id, e]));
    const equityMap = new Map((equityData || []).map(eq => [eq.employee_id, eq]));

    const mergedData: ExecutiveData[] = execUsers.map(execUser => {
      const employee = employeesMap.get(execUser.user_id);
      const equity = employee ? equityMap.get(employee.id) : null;

      const fullName = employee 
        ? `${employee.first_name} ${employee.last_name}`.trim()
        : 'Executive';
      
      const email = employee?.email || '';

      return {
        id: execUser.id,
        user_id: execUser.user_id,
        role: execUser.role,
        title: execUser.title,
        department: execUser.department,
        access_level: execUser.access_level,
        full_name: fullName,
        email: email,
        position: employee?.position,
        employee_id: employee?.id,
        salary: employee?.salary,
        salary_status: employee?.salary_status,
        funding_trigger: employee?.funding_trigger,
        equity_percent: equity?.shares_percentage,
        shares_issued: equity?.shares_total,
        strike_price: equity?.strike_price,
        vesting_schedule: equity?.vesting_schedule,
        grant_date: equity?.grant_date,
        equity_type: equity?.equity_type,
      };
    });

    return mergedData;
  } catch (error) {
    console.error('Error in getExecutiveData:', error);
    return [];
  }
}

/**
 * Format executive data for document generation
 */
export function formatExecutiveForDocuments(exec: ExecutiveData) {
  // Format vesting schedule if it's JSON
  let vestingScheduleText = '4 years with 1 year cliff';
  if (exec.vesting_schedule) {
    if (typeof exec.vesting_schedule === 'string') {
      vestingScheduleText = exec.vesting_schedule;
    } else if (typeof exec.vesting_schedule === 'object') {
      const vs = exec.vesting_schedule;
      if (vs.type === 'immediate') {
        vestingScheduleText = 'Immediate vesting';
      } else if (vs.duration_months && vs.cliff_months) {
        const years = Math.floor(vs.duration_months / 12);
        const cliffYears = Math.floor(vs.cliff_months / 12);
        vestingScheduleText = cliffYears > 0 
          ? `${years} years with ${cliffYears} year cliff`
          : `${years} years`;
      }
    }
  }

  return {
    id: exec.id,
    user_id: exec.user_id,
    role: exec.role,
    title: exec.title || exec.role.toUpperCase(),
    full_name: exec.full_name,
    email: exec.email,
    // Use actual database values - only fallback if truly null/undefined
    equity_percent: exec.equity_percent != null ? exec.equity_percent.toString() : '0',
    shares_issued: exec.shares_issued != null ? Math.floor(exec.shares_issued).toString() : '0',
    annual_salary: exec.salary != null ? exec.salary.toString() : '0',
    funding_trigger: exec.funding_trigger != null ? exec.funding_trigger.toString() : '0',
    vesting_schedule: vestingScheduleText,
    strike_price: exec.strike_price != null ? exec.strike_price.toString() : '0.00',
    salary_status: exec.salary_status || 'deferred',
  };
}
