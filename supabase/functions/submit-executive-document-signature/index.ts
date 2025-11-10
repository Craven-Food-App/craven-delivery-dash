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

    const signatureLayoutRaw = Array.isArray(document.signature_field_layout)
      ? (document.signature_field_layout as Array<any>)
      : [];

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
    let updatedLayout = signatureLayoutRaw;
    let officerFields: Array<any> = [];
    const completedFieldValues = new Map<string, string | null>();

    try {
      const pdfDoc = await PDFDocument.load(pdfBlob);
      let pages = pdfDoc.getPages();
      if (pages.length === 0) {
        pdfDoc.addPage([612, 792]);
        pages = pdfDoc.getPages();
      }

      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const signatureImage = signature_png_base64
        ? await pdfDoc.embedPng(base64ToUint8Array(signature_png_base64))
        : null;

      const documentRoleLower = (document.role || '').toLowerCase();
      const matchesOfficerField = (roleLabel: any) => {
        if (!roleLabel) return true;
        const roleLower = String(roleLabel).toLowerCase();
        if (['ceo', 'board', 'incorporator'].includes(roleLower)) return false;
        if (
          roleLower.includes('officer') ||
          roleLower.includes('executive') ||
          roleLower.includes('employee') ||
          roleLower.includes('signer') ||
          roleLower.includes('recipient')
        ) {
          return true;
        }
        if (documentRoleLower && (roleLower.includes(documentRoleLower) || documentRoleLower.includes(roleLower))) {
          return true;
        }
        return false;
      };

      officerFields = signatureLayoutRaw.filter(
        (field: any) => field && !field.auto_filled && matchesOfficerField(field.signer_role),
      );

      const getBox = (field: any, pageWidth: number, pageHeight: number) => {
        const widthPercent = Number(field.width_percent) || 0;
        const heightPercent = Number(field.height_percent) || 0;
        const xPercent = Number(field.x_percent) || 0;
        const yPercent = Number(field.y_percent) || 0;

        const boxWidth = Math.min(pageWidth, Math.max(pageWidth * (widthPercent / 100), 10));
        const boxHeight = Math.min(pageHeight, Math.max(pageHeight * (heightPercent / 100), 10));
        const rawX = pageWidth * (xPercent / 100);
        const rawYTop = pageHeight * (yPercent / 100);

        const boxX = Math.min(Math.max(rawX, 0), pageWidth - boxWidth);
        const boxY = Math.min(Math.max(pageHeight - rawYTop - boxHeight, 0), pageHeight - boxHeight);
        return { boxX, boxY, boxWidth, boxHeight };
      };

      const drawCenteredText = (
        page: any,
        text: string,
        x: number,
        y: number,
        width: number,
        font: any,
        size: number,
      ) => {
        const textWidth = font.widthOfTextAtSize(text, size);
        const textX = x + Math.max((width - textWidth) / 2, 0);
        page.drawText(text, {
          x: textX,
          y,
          size,
          font,
          color: rgb(0, 0, 0),
        });
      };

      if (officerFields.length > 0) {
        const signedDate = new Date(signedAtISO);
        const formattedDate = signedDate.toLocaleDateString('en-US');
        const signerDisplayName = typed_name || document.officer_name || 'Executive';
        const initials = signerDisplayName
          .split(/\s+/)
          .map((part) => part.trim().charAt(0).toUpperCase())
          .join('')
          .slice(0, 3) || 'ES';

        for (const field of officerFields) {
          const pageNumber = Math.max(1, Number(field.page_number) || 1);
          const pageIndex = Math.min(pageNumber - 1, pages.length - 1);
          const page = pages[pageIndex];
          const { width, height } = page.getSize();
          const { boxX, boxY, boxWidth, boxHeight } = getBox(field, width, height);

          page.drawRectangle({
            x: boxX,
            y: boxY,
            width: boxWidth,
            height: boxHeight,
            color: rgb(1, 1, 1),
            opacity: 1,
          });
          page.drawRectangle({
            x: boxX,
            y: boxY,
            width: boxWidth,
            height: boxHeight,
            borderColor: rgb(0.18, 0.32, 0.58),
            borderWidth: 1.3,
          });

          const fieldType = String(field.field_type || 'signature').toLowerCase();
          const fieldKey = String(field.id ?? `${pageNumber}-${fieldType}`);
          let renderedValue: string | null = null;

          if (fieldType === 'signature') {
            if (signatureImage) {
              const aspectRatio = signatureImage.width / signatureImage.height;
              let drawWidth = boxWidth * 0.9;
              let drawHeight = drawWidth / aspectRatio;
              if (drawHeight > boxHeight * 0.75) {
                drawHeight = boxHeight * 0.75;
                drawWidth = drawHeight * aspectRatio;
              }
              const imageX = boxX + (boxWidth - drawWidth) / 2;
              const imageY = boxY + (boxHeight - drawHeight) / 2;
              page.drawImage(signatureImage, {
                x: imageX,
                y: imageY,
                width: drawWidth,
                height: drawHeight,
              });
            } else {
              drawCenteredText(page, signerDisplayName, boxX, boxY + (boxHeight - 12) / 2, boxWidth, fontBold, 12);
            }
            renderedValue = signerDisplayName;
          } else if (fieldType === 'initials') {
            drawCenteredText(page, initials, boxX, boxY + (boxHeight - 12) / 2, boxWidth, fontBold, 12);
            renderedValue = initials;
          } else if (fieldType === 'date') {
            drawCenteredText(page, formattedDate, boxX, boxY + (boxHeight - 10) / 2, boxWidth, fontRegular, 10);
            renderedValue = formattedDate;
          } else {
            drawCenteredText(page, signerDisplayName, boxX, boxY + (boxHeight - 10) / 2, boxWidth, fontRegular, 10);
            renderedValue = signerDisplayName;
          }

          completedFieldValues.set(fieldKey, renderedValue);
        }

        signedPdfBytes = await pdfDoc.save();

        updatedLayout = signatureLayoutRaw.map((field: any) => {
          const key = String(field.id ?? `${field.page_number}-${field.field_type}`);
          if (completedFieldValues.has(key)) {
            return {
              ...field,
              auto_filled: true,
              rendered_value: completedFieldValues.get(key),
            };
          }
          return field;
        });
      } else {
        // Legacy fallback: place signature summary on final page
        const targetPage = pages[pages.length - 1];
        const { width, height } = targetPage.getSize();
        const margin = 50;
        let currentY = margin + 100;

        if (signatureImage) {
          const scaled = signatureImage.scaleToFit(width - margin * 2, 120);
          const sigX = (width - scaled.width) / 2;
          const sigY = margin + 60;
          targetPage.drawImage(signatureImage, {
            x: sigX,
            y: sigY,
            width: scaled.width,
            height: scaled.height,
          });
          currentY = sigY + scaled.height + 12;
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
      }
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
      ? (document.signer_roles as Record<string, boolean>)
      : {};
    const updatedSignerRoles: Record<string, boolean> = { ...existingSignerRoles };
    if (officerFields.length > 0) {
      officerFields.forEach((field: any) => {
        const roleKey = String(field.signer_role || 'officer').toLowerCase();
        updatedSignerRoles[roleKey || 'officer'] = true;
      });
    }
    updatedSignerRoles.officer = true;

    const { error: updateError } = await supabaseClient
      .from('executive_documents')
      .update({
        signature_status: 'signed',
        status: 'signed',
        signed_file_url: signedPublicUrl,
        signer_roles: updatedSignerRoles,
        signature_token: null,
        signature_token_expires_at: null,
        signature_field_layout: updatedLayout,
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

