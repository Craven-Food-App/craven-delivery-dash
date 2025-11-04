import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert HTML to PDF using aPDF.io (free service)
async function convertHtmlToPdf(htmlContent: string): Promise<Uint8Array> {
  // Get API key from environment variable (set in Supabase Edge Function secrets)
  const apiKey = Deno.env.get('APDF_API_KEY');
  
  if (!apiKey) {
    throw new Error('APDF_API_KEY not configured. Please set it in Supabase Edge Function secrets.');
  }
  
  try {
    console.log('Converting HTML to PDF using aPDF.io...');
    
    const response = await fetch('https://api.apdf.io/v1/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        html: htmlContent,
        format: 'Letter',
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
        },
        printBackground: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('aPDF.io error:', response.status, errorText);
      throw new Error(`PDF conversion failed: ${response.status} - ${errorText}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    console.log('PDF generated successfully using aPDF.io, size:', pdfBuffer.byteLength, 'bytes');
    return new Uint8Array(pdfBuffer);
  } catch (error) {
    console.error('Error in convertHtmlToPdf:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template_id, data, officer_name, role, equity, html_content } = await req.json();
    
    console.log('Generating document:', { template_id, officer_name, role });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate a unique filename for PDF
    const filename = `executive_docs/${crypto.randomUUID()}.pdf`;

    // Convert HTML to PDF - NO HTML FALLBACK
    console.log('Converting HTML to PDF...');
    const pdfBuffer: Uint8Array = await convertHtmlToPdf(html_content);
    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');

    // Upload PDF to storage
    const { data: upload, error: uploadError } = await supabaseClient.storage
      .from('documents')
      .upload(filename, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseClient.storage
      .from('documents')
      .getPublicUrl(filename);

    // Save document record
    const { data: document, error: dbError } = await supabaseClient
      .from('executive_documents')
      .insert({
        type: template_id,
        officer_name: officer_name || data.full_name || '',
        role: role || data.role || '',
        equity: equity,
        status: 'generated',
        file_url: publicUrl
      })
      .select()
      .single();

    if (dbError) throw dbError;

    console.log('Document created successfully:', document.id);

    return new Response(
      JSON.stringify({
        ok: true,
        document,
        file_url: publicUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error generating document:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
