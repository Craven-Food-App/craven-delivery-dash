import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    console.log(`Sending ${documentTitle} to ${executiveName} at ${to}`);

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Crave'N HR <hr@craven.com>";

    // Prepare attachments and links
    let attachments: any[] = [];
    let linksHtml = '';

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (documents && documents.length > 0) {
      console.log(`Preparing ${documents.length} documents for email...`);
      const itemsHtml: string[] = [];

      for (const doc of documents) {
        try {
          itemsHtml.push(`<li style=\"margin: 6px 0;\"><a href=\"${doc.url}\" style=\"color: #ff7a45; text-decoration: none;\">${doc.title}</a></li>`);

          // Parse storage URL to bucket/path
          const urlParts = doc.url.split('/storage/v1/object/public/');
          if (urlParts.length === 2) {
            const pathParts = urlParts[1].split('/');
            const bucket = pathParts[0];
            const path = pathParts.slice(1).join('/');

            const { data: fileData, error: downloadError } = await supabaseClient.storage
              .from(bucket)
              .download(path);
            if (downloadError) throw downloadError;

            const arrayBuffer = await fileData.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            attachments.push({
              filename: `${doc.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
              content: base64,
            });
          }
        } catch (err) {
          console.error('Failed to attach document:', doc.title, err);
          // continue without attachment, link will still be present
        }
      }

      linksHtml = `
        <div style=\"background-color: #f9f9f9; padding: 16px; border-radius: 6px; margin: 20px 0;\">
          <h3 style=\"margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px;\">Included Documents</h3>
          <ul style=\"margin: 0; padding-left: 18px; color: #4a4a4a; font-size: 14px; line-height: 1.6;\">${itemsHtml.join('')}</ul>
        </div>
      `;
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

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Your ${documentTitle} - Crave'n, Inc.`,
      attachments: attachments.length > 0 ? attachments : undefined,
      html: `
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
                    <!-- Header with Orange Banner -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #ff7a45 0%, #ff8c00 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">📄 ${documentTitle}</h1>
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">Dear ${executiveName},</h2>
                        
                        <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                          Please find your <strong>${documentTitle}</strong> attached below. This document is part of your C-Suite executive documentation package.
                        </p>
                        
                        <div style="background-color: #fff5ec; border-left: 4px solid #ff7a45; padding: 20px; margin: 30px 0;">
                          <h3 style="margin: 0 0 15px 0; color: #ff7a45; font-size: 18px;">📋 Document Details:</h3>
                          <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                            <li><strong>Document:</strong> ${documentTitle}</li>
                            <li><strong>Recipient:</strong> ${executiveName}</li>
                            <li><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
                          </ul>
                        </div>
                        
                        ${documents && documents.length > 0 ? `
                        ${linksHtml}
                        ${attachments.length > 0 ? `
                        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
                          <p style="margin: 0; color: #2e7d32; font-size: 16px; font-weight: bold;">✅ PDF Attachments Included</p>
                          <p style="margin: 8px 0 0 0; color: #4a4a4a; font-size: 14px;">All documents are attached as PDFs.</p>
                        </div>
                        ` : ''}
                        ` : `
                        ${attachments.length > 0 ? `
                        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 6px; margin: 30px 0; text-align: center;">
                          <p style="margin: 0; color: #2e7d32; font-size: 16px; font-weight: bold;">
                            ✅ PDF Document Attached
                          </p>
                          <p style="margin: 10px 0 0 0; color: #4a4a4a; font-size: 14px;">
                            Please see the attached PDF file
                          </p>
                        </div>
                        ` : documentUrl ? `
                        <div style="text-align: center; margin: 40px 0 30px 0;">
                          <a href="${documentUrl}" 
                             style="display: inline-block; background: linear-gradient(135deg, #ff7a45 0%, #ff8c00 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(255, 122, 69, 0.3);">
                            View Document
                          </a>
                        </div>
                        ` : ''}
                        `
                        
                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 30px 0;">
                          <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px;">📝 Important Notes:</h3>
                          <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                            <li>Please review this document carefully</li>
                            <li>Keep this document for your records</li>
                            <li>If you have any questions, contact HR at hr@craven.com</li>
                          </ul>
                        </div>
                        
                        <p style="margin: 30px 0 0 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                          Best regards,<br/>
                          <strong>Crave'n HR Team</strong><br/>
                          <a href="mailto:hr@craven.com" style="color: #ff7a45; text-decoration: none;">hr@craven.com</a>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e5e5;">
                        <p style="margin: 0; color: #898989; font-size: 12px;">
                          © ${new Date().getFullYear()} Crave'n, Inc. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
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

