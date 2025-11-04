import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert HTML to PDF using a service API
// Options: htmlpdfapi.com, pdfshift.io, or self-hosted Gotenberg
async function convertHtmlToPdf(htmlContent: string): Promise<Uint8Array> {
  // Try multiple service options
  const apiKey = Deno.env.get('HTMLPDFAPI_KEY') || Deno.env.get('PDFSHIFT_API_KEY');
  const serviceUrl = Deno.env.get('PDF_SERVICE_URL') || 'https://api.htmlpdfapi.com/v1/pdf';
  
  if (!apiKey && !serviceUrl.includes('gotenberg')) {
    // For development, you can use a free service or self-hosted Gotenberg
    // For production, set HTMLPDFAPI_KEY or PDFSHIFT_API_KEY in Supabase environment variables
    console.warn('No PDF API key configured. Trying free service...');
    
    // Try using a free HTML-to-PDF service (no API key required)
    try {
      const response = await fetch('https://api.html2pdf.app/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: htmlContent,
          format: 'Letter',
          margin: '0.5in',
        }),
      });

      if (response.ok) {
        const pdfBuffer = await response.arrayBuffer();
        return new Uint8Array(pdfBuffer);
      }
    } catch (e) {
      console.warn('Free PDF service failed, trying alternative...');
    }
    
    // Alternative: Use pdfshift.io (requires API key) or htmlpdfapi.com
    if (apiKey) {
      const response = await fetch(serviceUrl, {
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

      if (response.ok) {
        const pdfBuffer = await response.arrayBuffer();
        return new Uint8Array(pdfBuffer);
      }
    }
    
    throw new Error('PDF conversion service not available. Please configure HTMLPDFAPI_KEY or PDFSHIFT_API_KEY in Supabase environment variables.');
  }

  // Use configured service
  const response = await fetch(serviceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'X-API-Key': apiKey }),
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
    throw new Error(`PDF API error: ${response.status} - ${errorText}`);
  }

  const pdfBuffer = await response.arrayBuffer();
  return new Uint8Array(pdfBuffer);
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

    // Convert HTML to PDF
    console.log('Converting HTML to PDF...');
    let pdfBuffer: Uint8Array;
    
    try {
      pdfBuffer = await convertHtmlToPdf(html_content);
      console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    } catch (pdfError: any) {
      console.error('PDF conversion failed, falling back to HTML:', pdfError.message);
      // Fallback to HTML if PDF conversion fails
      const htmlFilename = `executive_docs/${crypto.randomUUID()}.html`;
      const { data: upload, error: uploadError } = await supabaseClient.storage
        .from('documents')
        .upload(htmlFilename, html_content, {
          contentType: 'text/html',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseClient.storage
        .from('documents')
        .getPublicUrl(htmlFilename);

      // Save document record with HTML fallback
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

      return new Response(
        JSON.stringify({
          ok: true,
          document,
          file_url: publicUrl,
          warning: 'Document saved as HTML (PDF conversion failed)',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    }

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
