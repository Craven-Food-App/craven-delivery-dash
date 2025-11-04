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
    console.log('HTML content length:', htmlContent.length);
    
    // Ensure HTML has proper structure with inline styles
    const fullHtml = htmlContent.includes('<!DOCTYPE html>') 
      ? htmlContent 
      : `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
  </style>
</head>
<body>${htmlContent}</body>
</html>`;
    
    const response = await fetch('https://apdf.io/api/pdf/file/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        html: fullHtml,
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

    if (!html_content || String(html_content).trim().length < 20) {
      console.error('Received empty or too short html_content');
      return new Response(
        JSON.stringify({ ok: false, error: 'Generated HTML content is empty. Cannot create PDF.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log('html_content length:', String(html_content).length);
    console.log('html_content preview:', String(html_content).slice(0, 200));

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
