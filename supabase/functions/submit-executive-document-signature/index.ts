import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1?bundle";

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
  signature_token?: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SubmitSignaturePayload = await req.json();
    const { document_id, typed_name, signature_png_base64, signer_ip, signer_user_agent, signature_token } = body;

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

    const authHeader = req.headers.get('Authorization');
    const tokenProvided = Boolean(signature_token && signature_token.trim().length > 0);

    if (!authHeader && !tokenProvided) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Signature token required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    if (tokenProvided) {
      if (!document.signature_token || document.signature_token !== signature_token) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Invalid signature token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }
      if (document.signature_token_expires_at) {
        const expires = new Date(document.signature_token_expires_at);
        if (Number.isFinite(expires.getTime()) && expires.getTime() < Date.now()) {
          return new Response(
            JSON.stringify({ ok: false, error: 'This signing link has expired' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 410 }
          );
        }
      }
    }

    if (document.signature_status === 'signed') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Document already signed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

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

    const signedAtISO = new Date().toISOString();

    if (document.signature_token) {
      await supabaseClient
        .from('executive_signatures')
        .upsert({
          employee_email: document.officer_name,
          employee_name: document.officer_name,
          position: document.role,
          document_type: document.type,
          token: document.signature_token,
          signed_at: signedAtISO,
          typed_name: typed_name || document.officer_name,
          signature_png_base64: signature_png_base64,
          signer_ip: signer_ip,
          signer_user_agent: signer_user_agent,
          document_id: document_id,
        }, {
          onConflict: 'token'
        });
    }

    const base64ToUint8Array = (base64: string): Uint8Array => {
      const cleaned = base64.includes(',') ? base64.split(',').pop() ?? '' : base64;
      const binaryString = atob(cleaned);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    };

    const pdfResponse = await fetch(document.file_url);
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch original PDF');
    }
    const pdfBlob = await pdfResponse.arrayBuffer();

    let signedPdfBytes: Uint8Array | null = null;
    try {
      const pdfDoc = await PDFDocument.load(pdfBlob);
      const pages = pdfDoc.getPages();
      const targetPage = pages[pages.length - 1];
      const { width, height } = targetPage.getSize();
      const margin = 50;
      let currentY = margin + 100;

      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      if (signature_png_base64) {
        try {
          const signatureBytes = base64ToUint8Array(signature_png_base64);
          const pngImage = await pdfDoc.embedPng(signatureBytes);
          const scaled = pngImage.scaleToFit(width - margin * 2, 120);
          const sigX = (width - scaled.width) / 2;
          const sigY = margin + 60;
          targetPage.drawImage(pngImage, {
            x: sigX,
            y: sigY,
            width: scaled.width,
            height: scaled.height,
          });
          currentY = sigY + scaled.height + 12;
        } catch (err) {
          console.error('Failed to embed signature image, falling back to text only:', err);
          currentY = margin + 40;
        }
      } else {
        currentY = margin + 40;
      }

      const textLines: string[] = [];
      textLines.push(`Signed electronically by: ${typed_name || document.officer_name || 'Executive'}`);
      textLines.push(`Signed on: ${new Date(signedAtISO).toLocaleString('en-US', { timeZone: 'UTC' })} UTC`);
      if (signer_ip) {
        textLines.push(`Signer IP: ${signer_ip}`);
      }
      if (signer_user_agent) {
        textLines.push(`User Agent: ${signer_user_agent.substring(0, 120)}`);
      }

      let textY = currentY;
      textLines.forEach((line, index) => {
        const isHeader = index === 0;
        targetPage.drawText(line, {
          x: margin,
          y: textY,
          size: isHeader ? 12 : 10,
          font: isHeader ? fontBold : fontRegular,
          color: rgb(0, 0, 0),
        });
        textY -= isHeader ? 18 : 14;
      });

      signedPdfBytes = await pdfDoc.save();
    } catch (pdfErr) {
      console.error('Failed to embed signature into PDF, using original file:', pdfErr);
    }

    const finalPdfBytes = signedPdfBytes ?? new Uint8Array(pdfBlob);
    const signedPath = `executive_docs/signed/${document_id}.pdf`;
    const { error: signedUploadError } = await supabaseClient.storage
      .from('documents')
      .upload(signedPath, finalPdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (signedUploadError) {
      console.error('Failed to upload signed PDF, falling back to original URL:', signedUploadError);
    }

    const { data: signedUrlData } = supabaseClient.storage
      .from('documents')
      .getPublicUrl(signedPath);
    const signedPublicUrl = signedUrlData?.publicUrl ?? document.file_url;

    const existingSignerRoles = document.signer_roles && typeof document.signer_roles === 'object'
      ? document.signer_roles as Record<string, boolean>
      : {};
    const updatedSignerRoles = { ...existingSignerRoles, officer: true };

    const { error: updateError } = await supabaseClient
      .from('executive_documents')
      .update({
        signature_status: 'signed',
        status: 'signed',
        signed_file_url: signedPublicUrl,
        signer_roles: updatedSignerRoles,
        signature_token: null,
        signature_token_expires_at: null,
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
        signed_pdf_url: signedPublicUrl,
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

