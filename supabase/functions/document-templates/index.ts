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
    placeholders: ["company_name", "full_name", "role", "equity_percentage", "effective_date", "funding_trigger"]
  },
  { 
    id: "bylaws_officers_excerpt", 
    title: "Bylaws – Officers (Excerpt)", 
    placeholders: ["company_name", "funding_trigger", "officer_roles_html", "governing_law"]
  },
  { 
    id: "irs_83b", 
    title: "IRS Form 83(b) – Info Sheet", 
    placeholders: ["taxpayer_name", "taxpayer_address", "company_name", "date_of_transfer", "stock_class", "number_of_shares", "fair_market_value", "amount_paid"]
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
