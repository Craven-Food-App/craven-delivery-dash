import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: equityRows, error } = await supabase
      .from('employee_equity')
      .select('id, employee_id, shares_percentage, shares_total, equity_type, grant_date');

    if (error) throw error;

    const employeeIds = Array.from(new Set((equityRows || []).map((r: any) => r.employee_id))).filter(Boolean);

    let employeesById: Record<string, any> = {};
    if (employeeIds.length > 0) {
      const { data: employees, error: empErr } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position, email')
        .in('id', employeeIds);
      if (empErr) throw empErr;
      employeesById = (employees || []).reduce((acc: any, e: any) => { acc[e.id] = e; return acc; }, {});
    }

    const shareholders = (equityRows || []).map((eq: any) => ({
      id: eq.employee_id,
      first_name: employeesById[eq.employee_id]?.first_name || '',
      last_name: employeesById[eq.employee_id]?.last_name || '',
      position: employeesById[eq.employee_id]?.position || '',
      email: employeesById[eq.employee_id]?.email || '',
      employee_equity: [{
        id: eq.id,
        shares_percentage: eq.shares_percentage,
        shares_total: eq.shares_total,
        equity_type: eq.equity_type,
        grant_date: eq.grant_date,
      }]
    }));

    // Format for response - include both employee_equity and executives_equity (for backwards compatibility)
    const formattedExecutives = shareholders.map((sh: any) => ({
      id: sh.id,
      name: `${sh.first_name} ${sh.last_name}`.trim(),
      position: sh.position,
      equity_percent: sh.employee_equity[0]?.shares_percentage || 0,
      shares_issued: sh.employee_equity[0]?.shares_total || 0,
      strike_price: 0.0001,
      vesting_schedule: '4 years with 1 year cliff',
      grant_date: sh.employee_equity[0]?.grant_date,
      status: 'active',
    }));

    return new Response(JSON.stringify({ 
      ok: true, 
      shareholders,
      employee_equity: (equityRows || []),
      executives_equity: formattedExecutives,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
