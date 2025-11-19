import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission (Corporate Secretary, Founder, or CEO)
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['CRAVEN_CORPORATE_SECRETARY', 'CRAVEN_FOUNDER', 'CRAVEN_CEO']);

    const { data: execUser } = await supabase
      .from('exec_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'ceo')
      .single();

    const hasPermission = 
      (userRoles && userRoles.length > 0) || 
      execUser || 
      user.email === 'craven@usa.com';

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Only Corporate Secretary, Founder, or CEO can backfill documents' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const appointment_id = body.appointment_id; // Optional: specific appointment, or null for all

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Fetch appointments
    let query = supabaseAdmin.from('executive_appointments').select('*');
    
    if (appointment_id) {
      query = query.eq('id', appointment_id);
    }

    const { data: appointments, error: fetchError } = await query;

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No appointments found', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    const generateDocUrl = `${supabaseUrl}/functions/v1/governance-generate-appointment-document`;

    for (const appointment of appointments) {
      const docTypes: string[] = [];
      
      // Determine which documents to generate based on status
      // Check for null, undefined, or empty string
      const hasAppointmentLetter = appointment.appointment_letter_url && String(appointment.appointment_letter_url).trim() !== '';
      const hasBoardResolution = appointment.board_resolution_url && String(appointment.board_resolution_url).trim() !== '';
      const hasCertificate = appointment.certificate_url && String(appointment.certificate_url).trim() !== '';
      const hasEmploymentAgreement = appointment.employment_agreement_url && String(appointment.employment_agreement_url).trim() !== '';
      
      console.log(`Appointment ${appointment.id} (${appointment.status}) document status:`, {
        hasAppointmentLetter,
        hasBoardResolution,
        hasCertificate,
        hasEmploymentAgreement,
        board_resolution_id: appointment.board_resolution_id
      });
      
      switch (appointment.status) {
        case 'DRAFT':
          // Only appointment letter for drafts
          if (!hasAppointmentLetter) {
            docTypes.push('appointment_letter');
          }
          break;
        
        case 'SENT_TO_BOARD':
          // Appointment letter + board resolution
          if (!hasAppointmentLetter) {
            docTypes.push('appointment_letter');
          }
          if (!hasBoardResolution && appointment.board_resolution_id) {
            docTypes.push('board_resolution');
          }
          break;
        
        case 'APPROVED':
          // All documents for approved appointments
          // Always try to generate appointment letter, certificate, and employment agreement
          // Board resolution only if board_resolution_id exists
          if (!hasAppointmentLetter) {
            docTypes.push('appointment_letter');
          }
          if (!hasBoardResolution && appointment.board_resolution_id) {
            docTypes.push('board_resolution');
          }
          if (!hasCertificate) {
            docTypes.push('certificate');
          }
          if (!hasEmploymentAgreement) {
            docTypes.push('employment_agreement');
          }
          
          // If no documents were queued, log a warning
          if (docTypes.length === 0) {
            console.warn(`Appointment ${appointment.id} is APPROVED but all documents appear to exist. Document URLs:`, {
              appointment_letter_url: appointment.appointment_letter_url,
              certificate_url: appointment.certificate_url,
              employment_agreement_url: appointment.employment_agreement_url,
            });
          }
          break;
        
        default:
          // For other statuses, just generate appointment letter if missing
          if (!hasAppointmentLetter) {
            docTypes.push('appointment_letter');
          }
      }
      
      console.log(`Documents to generate for appointment ${appointment.id}:`, docTypes);

      // Generate documents
      const generatedDocs: string[] = [];
      const errors: string[] = [];

      for (const docType of docTypes) {
        try {
          console.log(`Attempting to generate ${docType} for appointment ${appointment.id}`);
          const response = await fetch(generateDocUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              appointment_id: appointment.id,
              document_type: docType,
            }),
          });

          let data: any;
          let responseText = '';
          try {
            responseText = await response.text();
            if (responseText) {
              data = JSON.parse(responseText);
            } else {
              data = {};
            }
          } catch (parseError) {
            console.error(`Failed to parse response for ${docType}:`, parseError, responseText);
            errors.push(`${docType}: Invalid response from server (${response.status}): ${responseText.substring(0, 200)}`);
            continue;
          }

          console.log(`Response for ${docType}:`, { status: response.status, data });
          
          if (response.ok && data.success) {
            generatedDocs.push(docType);
            console.log(`Successfully generated ${docType} for appointment ${appointment.id}`);
          } else {
            // Extract error message with better fallbacks
            let errorMsg = 'Unknown error';
            if (data?.error) {
              errorMsg = String(data.error);
            } else if (data?.message) {
              errorMsg = String(data.message);
            } else if (!response.ok) {
              errorMsg = `HTTP ${response.status} ${response.statusText}`;
              if (responseText) {
                errorMsg += `: ${responseText.substring(0, 200)}`;
              }
            } else if (data && typeof data === 'object') {
              errorMsg = `Unexpected response: ${JSON.stringify(data).substring(0, 200)}`;
            }
            
            console.error(`Failed to generate ${docType} for appointment ${appointment.id}:`, errorMsg);
            errors.push(`${docType}: ${errorMsg}`);
          }
        } catch (err: any) {
          const errorMsg = err?.message || err?.toString() || 'Failed to generate document';
          console.error(`Error generating ${docType} for appointment ${appointment.id}:`, errorMsg, err);
          errors.push(`${docType}: ${errorMsg}`);
        }
      }

      results.push({
        appointment_id: appointment.id,
        appointment_name: appointment.proposed_officer_name,
        status: appointment.status,
        documents_generated: generatedDocs,
        documents_queued: docTypes,
        errors: errors.length > 0 ? errors : null,
        reason_no_docs: docTypes.length === 0 ? 
          (appointment.status === 'APPROVED' ? 
            'All documents already exist for this approved appointment' : 
            `No documents need to be generated for status: ${appointment.status}`) : 
          null,
      });
    }

    // Calculate totals
    const totalGenerated = results.reduce((sum, r) => sum + r.documents_generated.length, 0);
    const totalErrors = results.reduce((sum, r) => sum + (r.errors ? r.errors.length : 0), 0);
    
    // Collect all unique errors
    const allErrors: string[] = [];
    results.forEach(r => {
      if (r.errors) {
        r.errors.forEach(err => {
          if (!allErrors.includes(err)) {
            allErrors.push(err);
          }
        });
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        processed: appointments.length,
        documents_generated: totalGenerated,
        errors_count: totalErrors,
        all_errors: allErrors,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in governance-backfill-appointment-documents:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

