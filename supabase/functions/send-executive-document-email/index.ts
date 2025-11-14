import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const escapeHtml = (input: string = '') =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

interface ExecutiveDocumentEmailRequest {
  to: string;
  executiveName: string;
  documentTitle: string;
  documentUrl?: string;
  pdfBase64?: string;
  htmlContent?: string;
  documents?: Array<{ title: string; url: string; id?: string }>; // multiple docs support
  executiveId?: string; // Optional: to help find documents
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

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Crave'N HR <hr@craven.com>";

    // Prepare attachments and links
    let attachments: Array<{ filename: string; content: string; type?: string }> = [];
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
        .eq('usage_context', 'executive_onboarding_packet')
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
          .eq('template_key', 'executive_onboarding_packet')
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
          const safeTitle = escapeHtml(doc.title);
          itemsHtml.push(`<li style="margin: 6px 0;"><a href="${doc.url}" style="color: #ff7a45; text-decoration: none;">${safeTitle}</a></li>`);

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
                type: "application/pdf",
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
        type: "application/pdf",
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
              type: "application/pdf",
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
    const companyWebsiteUrl = Deno.env.get('COMPANY_WEBSITE_URL') || 'https://cravenusa.com';
    const currentYear = String(new Date().getFullYear());
    
    // Fetch signature tokens for documents
    let signatureToken: string | null = null;
    if (documents && documents.length > 0) {
      try {
        // Try to find documents by file_url or executive_id
        const docUrls = documents.map(d => d.url);
        let query = supabaseClient
          .from('executive_documents')
          .select('signature_token, file_url')
          .in('file_url', docUrls)
          .not('signature_token', 'is', null)
          .limit(1);
        
        // If executiveId provided, also search by that
        if (executiveId) {
          const { data: execDocs } = await supabaseClient
            .from('executive_documents')
            .select('signature_token, file_url')
            .eq('executive_id', executiveId)
            .not('signature_token', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (execDocs?.signature_token) {
            signatureToken = execDocs.signature_token;
          }
        }
        
        // If no token found yet, try by URL
        if (!signatureToken) {
          const { data: docs } = await query;
          if (docs && docs.length > 0 && docs[0].signature_token) {
            signatureToken = docs[0].signature_token;
          }
        }
        
        console.log(`Found signature token: ${signatureToken ? 'Yes' : 'No'}`);
      } catch (tokenError) {
        console.warn('Failed to fetch signature token:', tokenError);
        // Continue without token - template might not need it
      }
    }
    
    // Signing portal URL - points to the executive document signing route
    // Include token if available
    const portalUrl = signatureToken 
      ? `${companyWebsiteUrl}/executive/sign?token=${signatureToken}`
      : `${companyWebsiteUrl}/executive/sign`;

    const safeDocumentTitle = escapeHtml(documentTitle);
    const safeExecutiveName = escapeHtml(executiveName);

    if (!emailTemplate) {
      throw new Error("No active email template configured for executive onboarding packet emails.");
    }

    let emailSubject = emailTemplate.subject;
    let emailHtmlContent = emailTemplate.html_content;

    const safeDocuments = (documents ?? []).filter((doc) => doc && doc.title && doc.url);
    emailHtmlContent = emailHtmlContent.replace(/{{#documents}}([\s\S]*?){{\/documents}}/g, (_match, block) => {
      if (safeDocuments.length === 0) {
        return '<tr><td colspan="2" style="padding:15px 10px;color:#6b7280;text-align:center;">Documents are available in the secure signing portal.</td></tr>';
      }
      return safeDocuments
        .map((doc) =>
          block
            .replace(/{{title}}/g, escapeHtml(doc.title))
            .replace(/{{preview_url}}/g, doc.url)
        )
        .join('');
    });

    const subjectReplacements: Record<string, string> = {
      '{{documentTitle}}': documentTitle,
      '{{executiveName}}': executiveName,
      '{{executive_name}}': executiveName,
      '{{date}}': dateStr,
      '{{currentYear}}': currentYear,
      '{{current_year}}': currentYear,
    };

    const htmlReplacements: Record<string, string> = {
      '{{documentTitle}}': safeDocumentTitle,
      '{{executiveName}}': safeExecutiveName,
      '{{executive_name}}': safeExecutiveName,
      '{{date}}': dateStr,
      '{{currentYear}}': currentYear,
      '{{current_year}}': currentYear,
      '{{portalUrl}}': portalUrl,
      '{{signing_portal_url}}': portalUrl,
      '{{signature_token}}': signatureToken || '',
      '{{company_website_url}}': companyWebsiteUrl,
      '{{dynamicContent}}': dynamicContent,
      '{{linksHtml}}': linksHtml,
    };

    const applyReplacements = (input: string, replacements: Record<string, string>) =>
      Object.entries(replacements).reduce((acc, [token, value]) => acc.split(token).join(value), input);

    emailSubject = applyReplacements(emailSubject, subjectReplacements);
    let emailHtml = applyReplacements(emailHtmlContent, htmlReplacements);
    
    // Fallback: Replace any hardcoded app.cravenusa.com URLs with the correct signing portal URL
    // This handles cases where the template has hardcoded URLs instead of placeholders
    // Match various URL formats: http://app.cravenusa.com, https://app.cravenusa.com, app.cravenusa.com
    const appCravenUrlPatterns = [
      // Full URLs with protocol
      /https?:\/\/app\.cravenusa\.com(\/[^\s"'>]*)?/gi,
      // URLs in href attributes
      /(href=["'])(https?:\/\/)?app\.cravenusa\.com(\/[^\s"']*)?(["'])/gi,
      // URLs in src attributes
      /(src=["'])(https?:\/\/)?app\.cravenusa\.com(\/[^\s"']*)?(["'])/gi,
      // Plain text URLs (without quotes)
      /\bapp\.cravenusa\.com(\/[^\s"'>]*)?/gi,
    ];
    
    // Replace all variations
    emailHtml = emailHtml.replace(/https?:\/\/app\.cravenusa\.com(\/[^\s"'>]*)?/gi, portalUrl);
    emailHtml = emailHtml.replace(/(href=["'])(https?:\/\/)?app\.cravenusa\.com(\/[^\s"']*)?(["'])/gi, `$1${portalUrl}$4`);
    emailHtml = emailHtml.replace(/(src=["'])(https?:\/\/)?app\.cravenusa\.com(\/[^\s"']*)?(["'])/gi, `$1${portalUrl}$4`);
    emailHtml = emailHtml.replace(/\bapp\.cravenusa\.com(\/[^\s"'>]*)?/gi, portalUrl.replace('https://', '').replace('http://', ''));
    
    // Log if we found and replaced any URLs (for debugging)
    if (emailHtmlContent.includes('app.cravenusa.com')) {
      console.log(`Found hardcoded app.cravenusa.com URLs in template, replacing with: ${portalUrl}`);
    }

    console.log('Using email template from database');

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: emailSubject,
      html: emailHtml,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    console.log(`Email sent successfully to ${to}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: (emailResponse.data as any)?.id || emailResponse.id,
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

