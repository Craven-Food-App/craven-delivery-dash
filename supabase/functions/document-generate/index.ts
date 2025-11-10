import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1?bundle";

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
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        html: fullHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('aPDF.io error:', response.status, errorText);
      throw new Error(`PDF conversion failed: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    if (!json?.file) {
      throw new Error(`aPDF.io did not return a file URL: ${JSON.stringify(json)}`);
    }
    const fileResp = await fetch(json.file);
    if (!fileResp.ok) {
      const t = await fileResp.text();
      throw new Error(`Failed to download generated PDF: ${fileResp.status} - ${t}`);
    }
    const pdfBuffer = await fileResp.arrayBuffer();
    console.log('PDF generated successfully using aPDF.io, size:', pdfBuffer.byteLength, 'bytes');
    return new Uint8Array(pdfBuffer);
  } catch (error) {
    console.error('Error in convertHtmlToPdf:', error);
    throw error;
  }
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

interface CeoSignatureSetting {
  typed_name?: string;
  signature_png_base64?: string;
  title?: string;
  updated_at?: string;
}

interface CeoSignatureRow {
  setting_value: CeoSignatureSetting;
}

async function applyCeoSignatureToPdf(
  pdfBytes: Uint8Array,
  signature: CeoSignatureSetting,
): Promise<Uint8Array> {
  if (!signature.signature_png_base64) {
    return pdfBytes;
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const referencePage = pages.length > 0 ? pages[pages.length - 1] : undefined;
  const { width, height } = referencePage
    ? referencePage.getSize()
    : { width: 612, height: 792 };
  const targetPage = pdfDoc.addPage([width, height]);
  const margin = 72;

  const signatureBytes = base64ToUint8Array(signature.signature_png_base64);
  const pngImage = await pdfDoc.embedPng(signatureBytes);

  const maxImageWidth = Math.min(width * 0.35, 220);
  const maxImageHeight = 90;
  const scale = Math.min(
    1,
    maxImageWidth / pngImage.width,
    maxImageHeight / pngImage.height,
  );
  const imageWidth = pngImage.width * scale;
  const imageHeight = pngImage.height * scale;
  const imageX = (width - imageWidth) / 2;
  const imageY = margin + 140;

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const headingY = height - margin - 24;

  targetPage.drawText('Authorized Executive Signature', {
    x: margin,
    y: headingY,
    size: 14,
    font: fontBold,
    color: rgb(0.09, 0.09, 0.1),
  });

  targetPage.drawImage(pngImage, {
    x: imageX,
    y: imageY,
    width: imageWidth,
    height: imageHeight,
  });

  const blockCenterX = width / 2;
  const textWidth = 280;
  let textY = imageY - 28;
  const lines: Array<{ text: string; bold?: boolean }> = [
    { text: `Signed electronically by: ${signature.typed_name ?? 'Chief Executive Officer'}`, bold: true },
    { text: `Title: ${signature.title ?? 'Chief Executive Officer'}` },
    { text: `Signed on: ${new Date().toLocaleString('en-US')} (UTC)` },
    { text: 'Authentication: CEO Portal registered signature on file' },
  ];

  lines.forEach((line, index) => {
    targetPage.drawText(line.text, {
      x: blockCenterX - textWidth / 2,
      y: textY,
      size: index === 0 ? 12 : 11,
      font: line.bold ? fontBold : fontRegular,
      color: rgb(0.09, 0.09, 0.1),
    });
    textY -= 16;
  });

  return await pdfDoc.save();
}

function buildCeoSignatureBlock(signature: CeoSignatureSetting): string {
  const typedName = signature.typed_name || "Torrance A Stroman";
  const signatureDataUrl = signature.signature_png_base64;
  if (!signatureDataUrl) {
    return "";
  }

  return `
    <div style="page-break-before: always; break-before: page; padding: 48px 32px; display: flex; flex-direction: column; align-items: center;">
      <h2 style="margin: 0 0 24px; font-size: 20px; color: #0f172a; font-weight: 700;">Authorized Executive Signature</h2>
      <div style="width: 220px; text-align: center;">
        <img src="${signatureDataUrl}" alt="${typedName} signature" style="width: 180px; height: auto; display: block; margin: 0 auto 16px;" />
        <div style="font-weight: 600; color: #0f172a; font-size: 13px;">${typedName}</div>
        <div style="margin-top: 6px; width: 180px; height: 1px; background: #0f172a; margin-left: auto; margin-right: auto;"></div>
        <div style="margin-top: 6px; color: #475569; font-size: 11px;">Chief Executive Officer</div>
        <div style="margin-top: 10px; color: #64748b; font-size: 11px;">Authentication: CEO Portal registered signature on file</div>
      </div>
    </div>
  `;
}

function enhanceHtmlWithCeoSignature(
  html: string,
  signature: CeoSignatureSetting | null,
): { html: string; embedded: boolean } {
  if (!signature?.signature_png_base64) {
    return { html, embedded: false };
  }

  let resultHtml = html;
  let embedded = false;
  const block = buildCeoSignatureBlock(signature);
  const typedName = signature.typed_name || "Torrance A Stroman";

  if (!block) {
    return { html, embedded: false };
  }

  const replacePlaceholder = (pattern: RegExp) => {
    if (pattern.test(resultHtml)) {
      resultHtml = resultHtml.replace(pattern, block);
      embedded = true;
    }
  };

  replacePlaceholder(/{{\s*ceo_signature_block\s*}}/gi);
  replacePlaceholder(/{{\s*ceo_signature_image\s*}}/gi);
  replacePlaceholder(/{{\s*ceo_signature_png\s*}}/gi);

  if (!embedded && typedName) {
    const escapedTypedName = typedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const typedNamePattern = new RegExp(escapedTypedName, "g");
    if (typedNamePattern.test(resultHtml)) {
      resultHtml = resultHtml.replace(typedNamePattern, block);
      embedded = true;
    } else {
      const fallbackPattern = /Torrance\s+A\.?\s+Stroman/gi;
      if (fallbackPattern.test(resultHtml)) {
        resultHtml = resultHtml.replace(fallbackPattern, block);
        embedded = true;
      }
    }
  }

  return { html: resultHtml, embedded };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      template_id,
      data,
      officer_name,
      role,
      equity,
      html_content,
      executive_id,
      packet_id,
      signing_stage,
      signing_order,
      depends_on_document_id,
      required_signers,
      signer_roles,
      template_key,
      document_title,
    } = await req.json();
    
    console.log('Generating document:', { template_id, officer_name, role, executive_id });

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

    let htmlForPdf = String(html_content);
    let ceoSignatureSetting: CeoSignatureSetting | null = null;
    let htmlEmbeddedSignature = false;

    try {
      const { data: ceoSigRow, error: ceoSigError } = await supabaseClient
        .from('ceo_system_settings')
        .select<CeoSignatureRow>('setting_value')
        .eq('setting_key', 'ceo_signature')
        .maybeSingle();

      if (ceoSigError) throw ceoSigError;
      if (ceoSigRow?.setting_value?.signature_png_base64) {
        ceoSignatureSetting = ceoSigRow.setting_value;
        const enhanced = enhanceHtmlWithCeoSignature(htmlForPdf, ceoSignatureSetting);
        htmlForPdf = enhanced.html;
        htmlEmbeddedSignature = enhanced.embedded;
      } else {
        console.warn('CEO signature setting found but missing image data.');
      }
    } catch (signatureFetchError) {
      console.error('Failed to load CEO signature setting:', signatureFetchError);
    }

    const normalizedSigners = Array.isArray(required_signers)
      ? required_signers.map((signer: string) => String(signer || '').toLowerCase())
      : [];
    let computedSignerRoles = signer_roles ?? (normalizedSigners.length > 0
      ? Object.fromEntries(normalizedSigners.map((signer) => [signer, false]))
      : null);

    const htmlContainsCeoName = htmlForPdf.toLowerCase().includes('torrance') && htmlForPdf.toLowerCase().includes('stroman');
    const requiresCeoSignature = htmlEmbeddedSignature
      || htmlContainsCeoName
      || normalizedSigners.some((signer) => ['board', 'ceo', 'incorporator'].includes(signer));
    let ceoSignatureApplied = htmlEmbeddedSignature;

    // Generate a unique filename for PDF
    const filename = `executive_docs/${crypto.randomUUID()}.pdf`;

    console.log('Converting HTML to PDF...');
    let pdfBuffer: Uint8Array = await convertHtmlToPdf(htmlForPdf);
    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');

    if (!ceoSignatureApplied && requiresCeoSignature && ceoSignatureSetting?.signature_png_base64) {
      try {
        pdfBuffer = await applyCeoSignatureToPdf(pdfBuffer, ceoSignatureSetting);
        ceoSignatureApplied = true;
        console.log('Applied CEO signature automatically to document.');
      } catch (autoSignError) {
        console.error('Failed to apply CEO signature automatically:', autoSignError);
      }
    }

    if (ceoSignatureApplied) {
      if (!computedSignerRoles) {
        computedSignerRoles = {};
      }
      ['board', 'ceo', 'incorporator'].forEach((roleKey) => {
        computedSignerRoles![roleKey] = true;
      });
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

    // Generate signature token if executive_id is provided (for documents requiring signature)
    const resolvedTemplateKey = template_key || template_id;
    const requiresSignature = ['employment_agreement', 'offer_letter', 'stock_issuance', 'founders_agreement', 'confidentiality_ip', 'deferred_comp_addendum'].includes(resolvedTemplateKey);
    let signatureToken: string | null = null;
    let tokenExpiresAt: Date | null = null;
    
    if (executive_id && requiresSignature) {
      // Generate unique token (32 chars)
      signatureToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      // Token expires in 30 days
      tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);
    }

    // Save document record
    const { data: document, error: dbError } = await supabaseClient
      .from('executive_documents')
      .insert({
        type: template_id,
        template_key: resolvedTemplateKey,
        officer_name: officer_name || document_title || data.full_name || '',
        role: role || data.role || '',
        equity: equity,
        status: 'generated',
        file_url: publicUrl,
        executive_id: executive_id || null,
        signature_token: signatureToken,
        signature_token_expires_at: tokenExpiresAt ? tokenExpiresAt.toISOString() : null,
        signature_status: requiresSignature && executive_id ? 'pending' : null,
        packet_id: packet_id || null,
        signing_stage: signing_stage ?? null,
        signing_order: signing_order ?? null,
        depends_on_document_id: depends_on_document_id ?? null,
        required_signers: Array.isArray(required_signers) ? required_signers : null,
        signer_roles: computedSignerRoles,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    console.log('Document created successfully:', document.id);

    if (ceoSignatureApplied && document?.id && ceoSignatureSetting) {
      try {
        await supabaseClient.from('signatures').insert({
          document_id: document.id,
          signed_by: ceoSignatureSetting.typed_name ?? 'Chief Executive Officer',
          signature_data_url: ceoSignatureSetting.signature_png_base64 ?? null,
          signed_at: new Date().toISOString(),
          ip: 'SYSTEM_AUTOSIGN',
        });
        console.log('Recorded automatic CEO signature for document', document.id);
      } catch (signatureInsertError) {
        console.error('Failed to record CEO signature metadata:', signatureInsertError);
      }
    }

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
