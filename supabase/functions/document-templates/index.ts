import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Template definitions
const templates = [
  { 
    id: "employment_agreement", 
    title: "Executive Employment Agreement", 
    placeholders: ["company_name", "full_name", "role", "equity_percentage", "effective_date", "funding_trigger", "governing_law"]
  },
  { 
    id: "board_resolution", 
    title: "Board Resolution – Appointment of Officers", 
    placeholders: ["company_name", "date", "directors", "ceo_name", "cfo_name", "cxo_name", "equity_ceo", "equity_cfo", "equity_cxo", "funding_trigger"]
  },
  { 
    id: "founders_agreement", 
    title: "Founders' / Shareholders' Agreement", 
    placeholders: ["company_name", "founders_table_html", "vesting_years", "cliff_months", "governing_law"]
  },
  { 
    id: "stock_issuance", 
    title: "Stock Subscription / Issuance Agreement", 
    placeholders: ["company_name", "full_name", "role", "share_count", "class_name", "par_value", "consideration", "vesting_schedule"]
  },
  { 
    id: "confidentiality_ip", 
    title: "Confidentiality & IP Assignment Agreement", 
    placeholders: ["company_name", "full_name", "role", "effective_date", "governing_law"]
  },
  { 
    id: "deferred_comp_addendum", 
    title: "Deferred Compensation Addendum", 
    placeholders: ["company_name", "full_name", "role", "funding_trigger", "effective_date", "governing_law"]
  },
  { 
    id: "offer_letter", 
    title: "Executive Offer Letter", 
    placeholders: [
      "company_name","offer_date","executive_name","executive_first_name","executive_address","executive_email",
      "position_title","reporting_to_title","work_location","start_date",
      "annual_base_salary","currency","funding_trigger_amount",
      "share_count","share_class","ownership_percent","vesting_period","vesting_cliff","bonus_structure",
      "employment_country","governing_law_state","signatory_name","signatory_title","company_mission_statement"
    ]
  },
  { 
    id: "bylaws_officers_excerpt", 
    title: "Bylaws – Officers (Excerpt)", 
    placeholders: [
      "company_name","state_of_incorporation","adoption_date","effective_date","execution_date","secretary_name"
    ]
  },
  { 
    id: "irs_83b", 
    title: "IRS Form 83(b) – Info Sheet", 
    placeholders: [
      "company_name","recipient_name","grant_date","share_class","share_type","share_count","price_per_share","currency",
      "total_grant_value","total_payment","cfo_name","cfo_email","company_address",
      "recipient_address","recipient_ssn","tax_year","taxable_difference","vesting_schedule"
    ]
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching document templates');
    
    return new Response(
      JSON.stringify(templates),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error fetching templates:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
