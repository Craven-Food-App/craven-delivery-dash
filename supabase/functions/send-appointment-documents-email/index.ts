import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendAppointmentDocumentsEmailRequest {
  appointmentId: string;
  documentIds?: string[]; // Optional: specific document IDs to include
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId, documentIds }: SendAppointmentDocumentsEmailRequest = await req.json();

    if (!appointmentId) {
      return new Response(
        JSON.stringify({ error: "Missing appointmentId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select('*, appointee_user_id')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      // Try executive_appointments table as fallback
      const { data: execAppointment } = await supabaseAdmin
        .from('executive_appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (!execAppointment) {
        return new Response(
          JSON.stringify({ error: 'Appointment not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use executive_appointments data
      const appointeeEmail = execAppointment.proposed_officer_email;
      const appointeeName = execAppointment.proposed_officer_name;

      if (!appointeeEmail) {
        return new Response(
          JSON.stringify({ error: 'Appointee email not found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get documents for this appointment
      let documents: any[] = [];
      
      if (documentIds && documentIds.length > 0) {
        const { data: docs } = await supabaseAdmin
          .from('board_documents')
          .select('id, title, type, pdf_url, html_template')
          .in('id', documentIds)
          .eq('signing_status', 'pending');
        documents = docs || [];
      } else {
        // Get all pending documents for this appointment
        const { data: docs } = await supabaseAdmin
          .from('board_documents')
          .select('id, title, type, pdf_url, html_template')
          .eq('related_appointment_id', appointmentId)
          .eq('signing_status', 'pending');
        documents = docs || [];
      }

      if (documents.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No documents found for this appointment' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get signature token from first document
      const { data: execDoc } = await supabaseAdmin
        .from('executive_documents')
        .select('signature_token')
        .eq('appointment_id', appointmentId)
        .not('signature_token', 'is', null)
        .limit(1)
        .maybeSingle();

      const signatureToken = execDoc?.signature_token || null;

      // Build document list for email
      const documentList = documents.map(doc => ({
        title: doc.title,
        url: doc.pdf_url || '',
        id: doc.id,
      }));

      // Call the existing send-executive-document-email function
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-executive-document-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: appointeeEmail,
          executiveName: appointeeName,
          documentTitle: `${documents.length} Document${documents.length > 1 ? 's' : ''} Ready for Signature`,
          documents: documentList,
          executiveId: null, // Not using exec_users for appointments
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        throw new Error(`Failed to send email: ${errorText}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully',
          documentsCount: documents.length,
          recipient: appointeeEmail,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle appointments table (governance system)
    const appointeeUserId = appointment.appointee_user_id;

    // Get appointee email from auth.users
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(appointeeUserId);
    
    if (userError || !user?.email) {
      return new Response(
        JSON.stringify({ error: 'Appointee email not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get appointee name
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', appointeeUserId)
      .maybeSingle();

    const appointeeName = profile?.full_name || user.email?.split('@')[0] || 'Appointee';

    // Get documents for this appointment
    let documents: any[] = [];
    
    if (documentIds && documentIds.length > 0) {
      const { data: docs } = await supabaseAdmin
        .from('board_documents')
        .select('id, title, type, pdf_url, html_template')
        .in('id', documentIds)
        .eq('signing_status', 'pending');
      documents = docs || [];
    } else {
      // Get all pending documents linked to this appointment
      const { data: appointmentDocs } = await supabaseAdmin
        .from('appointment_documents')
        .select('governance_document_id, board_documents(*)')
        .eq('appointment_id', appointmentId);

      if (appointmentDocs) {
        documents = appointmentDocs
          .map(ad => ad.board_documents)
          .filter((doc: any) => doc && doc.signing_status === 'pending')
          .map((doc: any) => ({
            id: doc.id,
            title: doc.title,
            type: doc.type,
            pdf_url: doc.pdf_url,
            html_template: doc.html_template,
          }));
      }
    }

    if (documents.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No documents found for this appointment' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get signature token from board_documents
    const firstDoc = documents[0];
    const signatureToken = firstDoc.signature_token || null;

    // Build document list for email
    const documentList = documents.map(doc => ({
      title: doc.title,
      url: doc.pdf_url || '',
      id: doc.id,
    }));

    // Call the existing send-executive-document-email function
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-executive-document-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.email,
        executiveName: appointeeName,
        documentTitle: `${documents.length} Document${documents.length > 1 ? 's' : ''} Ready for Signature`,
        documents: documentList,
        executiveId: null,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        documentsCount: documents.length,
        recipient: user.email,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Error sending appointment documents email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

