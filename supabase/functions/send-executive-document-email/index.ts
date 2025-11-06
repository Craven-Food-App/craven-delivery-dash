import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ExecutiveDocumentEmailRequest {
  to: string;
  executiveName: string;
  documentTitle: string;
  documentUrl?: string;
  pdfBase64?: string;
  htmlContent?: string;
  documents?: Array<{ title: string; url: string }>; // multiple docs support
}

// Convert HTML to PDF using aPDF.io for legacy .html documents
async function convertHtmlToPdf(htmlContent: string): Promise<Uint8Array> {
  const apiKey = Deno.env.get('APDF_API_KEY');
  if (!apiKey) throw new Error('APDF_API_KEY not configured.');

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

  const resp = await fetch('https://apdf.io/api/pdf/file/create', {
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

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`aPDF convert failed: ${resp.status} ${errorText}`);
  }
  const json = await resp.json();
  if (!json?.file) {
    throw new Error(`aPDF.io did not return a file URL: ${JSON.stringify(json)}`);
  }
  const fileResp = await fetch(json.file);
  if (!fileResp.ok) {
    const t = await fileResp.text();
    throw new Error(`Failed to download generated PDF: ${fileResp.status} - ${t}`);
  }
  const buf = await fileResp.arrayBuffer();
  return new Uint8Array(buf);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, executiveName, documentTitle, documentUrl, pdfBase64, htmlContent, documents }: ExecutiveDocumentEmailRequest = await req.json();

    if (!to || !executiveName || !documentTitle) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, executiveName, documentTitle" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Allow sending email even if documents array is empty (for error notifications)
    if (documents && documents.length === 0 && !documentUrl && !pdfBase64 && !htmlContent) {
      console.warn('No documents provided, but sending email anyway for notification purposes');
    }

    console.log(`Sending ${documentTitle} to ${executiveName} at ${to}`);

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Crave'N HR <hr@craven.com>";

    // Prepare attachments and links
    let attachments: any[] = [];
    let linksHtml = '';

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch email template from database
    let emailTemplate: { subject: string; html_content: string } | null = null;
    try {
      // First try to get from template_usage
      const { data: usage } = await supabaseClient
        .from('template_usage')
        .select('template_id')
        .eq('template_type', 'email')
        .eq('usage_context', 'executive_document_email')
        .eq('is_default', true)
        .single();

      if (usage?.template_id) {
        const { data: template } = await supabaseClient
          .from('email_templates')
          .select('subject, html_content')
          .eq('id', usage.template_id)
          .eq('is_active', true)
          .single();
        
        if (template) {
          emailTemplate = template;
        }
      }
      
      // Fallback: try by template_key
      if (!emailTemplate) {
        const { data: template } = await supabaseClient
          .from('email_templates')
          .select('subject, html_content')
          .eq('template_key', 'executive_document_email')
          .eq('is_active', true)
          .single();
        
        if (template) {
          emailTemplate = template;
        }
      }
    } catch (error) {
      console.warn('Could not fetch email template from database, using fallback:', error);
    }

    if (documents && documents.length > 0) {
      console.log(`Preparing ${documents.length} documents for email...`);
      const itemsHtml: string[] = [];
      let successfulAttachments = 0;

      for (const doc of documents) {
        try {
          // Always add link, even if attachment fails
          itemsHtml.push(`<li style="margin: 6px 0;"><a href="${doc.url}" style="color: #ff7a45; text-decoration: none;">${doc.title}</a></li>`);

          // Parse storage URL to bucket/path (supports public and signed URLs)
          const parts = doc.url.split('/storage/v1/object/');
          if (parts.length === 2) {
            const rest = parts[1]; // e.g. "public/bucket/path" or "sign/bucket/path?..."
            const restParts = rest.split('/');
            // restParts[0] is 'public' or 'sign'
            const bucket = restParts[1];
            const pathWithQuery = restParts.slice(2).join('/');
            const path = pathWithQuery.split('?')[0];

            const { data: fileData, error: downloadError } = await supabaseClient.storage
              .from(bucket)
              .download(path);
            if (downloadError) {
              console.warn(`Failed to download ${doc.title} from storage:`, downloadError);
              continue; // Skip this attachment but keep the link
            }

            const lowerPath = path.toLowerCase();
            let pdfBytes: Uint8Array | null = null;

            if (lowerPath.endsWith('.html') || lowerPath.endsWith('.htm')) {
              // Legacy HTML document: convert to PDF on the fly
              const html = await fileData.text();
              try {
                pdfBytes = await convertHtmlToPdf(html);
              } catch (convErr) {
                console.error('HTML->PDF conversion failed for', path, convErr);
                pdfBytes = null;
              }
            } else if (lowerPath.endsWith('.pdf')) {
              const arrayBuffer = await fileData.arrayBuffer();
              pdfBytes = new Uint8Array(arrayBuffer);
            } else {
              // Unknown type, attempt to attach as-is but label as PDF
              const arrayBuffer = await fileData.arrayBuffer();
              pdfBytes = new Uint8Array(arrayBuffer);
            }

            if (pdfBytes && pdfBytes.length > 0) {
              const base64 = base64Encode(pdfBytes);
              attachments.push({
                filename: `${doc.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
                content: base64,
              });
              successfulAttachments++;
              console.log(`✓ Successfully attached ${doc.title} (${pdfBytes.length} bytes)`);
            } else {
              console.warn('Skipping attachment due to empty bytes for', doc.title);
            }
          } else {
            console.warn('Unrecognized storage URL format, skipping attachment for', doc.url);
          }
        } catch (err) {
          console.error('Failed to attach document:', doc.title, err);
          // continue without attachment, link will still be present
        }
      }

      if (itemsHtml.length > 0) {
        linksHtml = `
          <div style="background-color: #f9f9f9; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px;">Included Documents</h3>
            <ul style="margin: 0; padding-left: 18px; color: #4a4a4a; font-size: 14px; line-height: 1.6;">${itemsHtml.join('')}</ul>
            ${successfulAttachments > 0 ? `<p style="margin: 10px 0 0 0; color: #2e7d32; font-size: 13px;">✓ ${successfulAttachments} PDF attachment(s) included</p>` : ''}
          </div>
        `;
      }
    } else if (pdfBase64) {
      // If we have a base64 PDF, attach it
      attachments = [{
        filename: `${documentTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        content: pdfBase64,
      }];
      console.log(`Attaching PDF: ${documentTitle}`);
    } else if (documentUrl) {
      // Try to fetch PDF from Supabase storage
      try {
        console.log(`Fetching PDF from storage URL: ${documentUrl}`);
        // Extract the path from the public URL
        const urlParts = documentUrl.split('/storage/v1/object/public/');
        if (urlParts.length === 2) {
          const pathParts = urlParts[1].split('/');
          const bucket = pathParts[0];
          const path = pathParts.slice(1).join('/');
          // Download the file from storage
          const { data: fileData, error: downloadError } = await supabaseClient.storage
            .from(bucket)
            .download(path);
          if (downloadError) throw downloadError;
          if (fileData) {
            // Convert Blob to ArrayBuffer to base64
            const arrayBuffer = await fileData.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            attachments = [{
              filename: `${documentTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`,
              content: base64,
            }];
            console.log(`Successfully downloaded PDF from storage, size: ${arrayBuffer.byteLength} bytes`);
          }
        } else {
          console.error('Could not parse storage URL:', documentUrl);
        }
      } catch (fetchError) {
        console.error("Failed to fetch PDF from storage:", fetchError);
      }
    }

    // Build dynamic content sections
    let dynamicContent = '';
    
    if (documents && documents.length > 0) {
      dynamicContent += linksHtml;
      if (attachments.length > 0) {
        dynamicContent += `
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #2e7d32; font-size: 16px; font-weight: bold;">✅ PDF Attachments Included</p>
          <p style="margin: 8px 0 0 0; color: #4a4a4a; font-size: 14px;">All documents are attached as PDFs.</p>
        </div>
        `;
      }
    } else if (attachments.length > 0) {
      dynamicContent = `
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 6px; margin: 30px 0; text-align: center;">
          <p style="margin: 0; color: #2e7d32; font-size: 16px; font-weight: bold;">
            ✅ PDF Document Attached
          </p>
          <p style="margin: 10px 0 0 0; color: #4a4a4a; font-size: 14px;">
            Please see the attached PDF file
          </p>
        </div>
      `;
    } else if (documentUrl) {
      dynamicContent = `
        <div style="text-align: center; margin: 40px 0 30px 0;">
          <a href="${documentUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #ff7a45 0%, #ff8c00 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(255, 122, 69, 0.3);">
            View Document
          </a>
        </div>
      `;
    }

    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const portalUrl = Deno.env.get('SUPABASE_URL')?.replace('https://xaxbucnjlrfkccsfiddq.supabase.co', 'https://44d88461-c1ea-4d22-93fe-ebc1a7d81db9.lovableproject.com') || 'https://44d88461-c1ea-4d22-93fe-ebc1a7d81db9.lovableproject.com';
    const currentYear = String(new Date().getFullYear());

    // Use database template if available, otherwise use fallback
    if (!emailTemplate) {
      console.warn('Email template not found in database, using fallback template');
      emailTemplate = {
        subject: '{{documentTitle}} - Executive Documents',
        html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ff7a45 0%, #ff8c00 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">Executive Documents</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">Hello {{executiveName}},</h2>
              
              <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Please find your {{documentTitle}} attached below. These documents require your review and signature.
              </p>
              
              {{dynamicContent}}
              
              <p style="margin: 30px 0 0 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                If you have any questions, please contact HR at <a href="mailto:hr@cravenusa.com" style="color: #ff7a45; text-decoration: none;">hr@cravenusa.com</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #898989; font-size: 12px;">
                © {{currentYear}} Crave'N, Inc. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `
      };
    }

    // Replace variables in database template
    const emailSubject = emailTemplate.subject
      .replace(/\{\{documentTitle\}\}/g, documentTitle);
    
    const emailHtml = emailTemplate.html_content
      .replace(/\{\{documentTitle\}\}/g, documentTitle)
      .replace(/\{\{executiveName\}\}/g, executiveName)
      .replace(/\{\{date\}\}/g, dateStr)
      .replace(/\{\{portalUrl\}\}/g, portalUrl)
      .replace(/\{\{currentYear\}\}/g, currentYear)
      .replace(/\{\{dynamicContent\}\}/g, dynamicContent);
    
    console.log('Using email template from database');

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: emailSubject,
      attachments: attachments.length > 0 ? attachments : undefined,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: emailResponse.error.message || "Failed to send email" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Email sent successfully to ${to}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        to,
        documentTitle 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending executive document email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

