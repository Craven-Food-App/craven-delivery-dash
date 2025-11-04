import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Generate a unique filename
    const filename = `executive_docs/${crypto.randomUUID()}.html`;

    // Store the HTML content
    const { data: upload, error: uploadError } = await supabaseClient.storage
      .from('documents')
      .upload(filename, html_content, {
        contentType: 'text/html',
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
        htmlPreview: html_content
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
