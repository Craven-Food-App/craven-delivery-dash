import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitSignaturePayload {
  document_id: string;
  typed_name?: string | null;
  signature_png_base64?: string | null;
  signer_ip?: string | null;
  signer_user_agent?: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SubmitSignaturePayload = await req.json();
    const { document_id, typed_name, signature_png_base64, signer_ip, signer_user_agent } = body;

    if (!document_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing document_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Verify document exists and is pending signature
    const { data: document, error: docError } = await supabaseClient
      .from('executive_documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Document not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (document.signature_status === 'signed') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Document already signed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 2. Create signature record
    const { data: signature, error: sigError } = await supabaseClient
      .from('signatures')
      .insert({
        document_id: document_id,
        signed_by: typed_name || document.officer_name,
        signature_data_url: signature_png_base64,
        ip: signer_ip || null,
      })
      .select()
      .single();

    if (sigError) {
      console.error('Error creating signature:', sigError);
      throw sigError;
    }

    // 3. Also create entry in executive_signatures for legacy compatibility
    if (document.signature_token) {
      await supabaseClient
        .from('executive_signatures')
        .upsert({
          employee_email: document.officer_name, // Fallback
          employee_name: document.officer_name,
          position: document.role,
          document_type: document.type,
          token: document.signature_token,
          signed_at: new Date().toISOString(),
          typed_name: typed_name || document.officer_name,
          signature_png_base64: signature_png_base64,
          signer_ip: signer_ip,
          signer_user_agent: signer_user_agent,
          document_id: document_id,
        }, {
          onConflict: 'token'
        });
    }

    // 4. Generate signed PDF (embed signature into original PDF)
    // For now, we'll store the signature separately and update the document status
    // In a production system, you'd use a PDF library to embed the signature
    
    // Download original PDF
    const pdfResponse = await fetch(document.file_url);
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch original PDF');
    }
    const pdfBlob = await pdfResponse.arrayBuffer();
    
    // TODO: Use a PDF library (like pdf-lib) to embed signature into PDF
    // For now, we'll store the signed version URL as the same file
    // and mark it as signed in the database
    
    // 5. Update document status to 'signed'
    const { error: updateError } = await supabaseClient
      .from('executive_documents')
      .update({
        signature_status: 'signed',
        status: 'signed',
        signed_file_url: document.file_url, // TODO: Replace with actual signed PDF URL
      })
      .eq('id', document_id);

    if (updateError) {
      console.error('Error updating document status:', updateError);
      throw updateError;
    }

    console.log(`Document ${document_id} signed successfully by ${typed_name || 'unknown'}`);

    return new Response(
      JSON.stringify({
        ok: true,
        signature_id: signature.id,
        document_id: document_id,
        message: 'Document signed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error submitting signature:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message || 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

