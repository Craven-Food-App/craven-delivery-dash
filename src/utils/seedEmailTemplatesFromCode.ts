/**
 * Script to seed database with actual email templates from edge functions and codebase
 */

import { supabase } from '@/integrations/supabase/client';

// Executive Document Email Template (from send-executive-document-email edge function)
const executiveDocumentEmailTemplate = {
  template_key: 'executive_document_email',
  name: 'Executive Document Email',
  category: 'executive',
  subject: 'Your {{documentTitle}} - Crave\'n, Inc.',
  html_content: `<!DOCTYPE html>
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
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">📄 {{documentTitle}}</h1>
              </td>
            </tr>
            
            <!-- Main Content -->
            <tr>
              <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">Dear {{executiveName}},</h2>
                
                <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                  Please find your <strong>{{documentTitle}}</strong> attached below. This document is part of your C-Suite executive documentation package.
                </p>
                
                <div style="background-color: #fff5ec; border-left: 4px solid #ff7a45; padding: 20px; margin: 30px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #ff7a45; font-size: 18px;">📋 Document Details:</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                    <li><strong>Document:</strong> {{documentTitle}}</li>
                    <li><strong>Recipient:</strong> {{executiveName}}</li>
                    <li><strong>Date:</strong> {{date}}</li>
                  </ul>
                </div>
                
                {{dynamicContent}}
                
                <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; border-radius: 6px; margin: 30px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #1976d2; font-size: 18px;">✍️ Digital Signature Portal</h3>
                  <p style="margin: 0 0 15px 0; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                    To sign these documents digitally, please log in to your secure Executive Document Portal. You'll be able to review and sign all pending documents in one place.
                  </p>
                  <div style="text-align: center; margin: 20px 0 0 0;">
                    <a href="{{portalUrl}}/executive-portal/documents" 
                       style="display: inline-block; background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);">
                      Access Document Portal
                    </a>
                  </div>
                  <p style="margin: 15px 0 0 0; color: #666; font-size: 13px; line-height: 1.5; text-align: center;">
                    Use your executive credentials to log in. If you don't have access, contact HR at hr@craven.com
                  </p>
                </div>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 30px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px;">📝 Important Notes:</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                    <li>Please review this document carefully</li>
                    <li>Documents requiring signature can be signed in the secure portal above</li>
                    <li>Keep signed documents for your records</li>
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
                  © {{currentYear}} Crave'n, Inc. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  variables: ['documentTitle', 'executiveName', 'date', 'portalUrl', 'dynamicContent', 'currentYear'],
  description: 'Email template for sending executive documents via email',
};

// Extract variables from HTML content
function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches).sort();
}

export async function seedAllEmailTemplates(overwrite: boolean = false): Promise<{ created: number; updated: number; skipped: number; errors: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    throw new Error('User not authenticated');
  }

  console.log('Starting to seed email templates...');

  const emailTemplates = [
    executiveDocumentEmailTemplate,
    // Add more email templates here as needed
  ];

  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  for (const template of emailTemplates) {
    try {
      // Extract variables from HTML content
      const allVariables = extractVariables(template.html_content + template.subject);
      const uniqueVariables = [...new Set([...template.variables, ...allVariables])].sort();

      // Check if template already exists
      const { data: existing } = await supabase
        .from('email_templates')
        .select('id')
        .eq('template_key', template.template_key)
        .single();

      if (existing && !overwrite) {
        console.log(`Email template ${template.template_key} already exists, skipping...`);
        results.skipped++;
        continue;
      }

      if (existing && overwrite) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: template.name,
            category: template.category,
            subject: template.subject,
            html_content: template.html_content,
            variables: uniqueVariables,
            is_active: true,
            description: template.description,
          })
          .eq('id', existing.id);

        if (error) {
          console.error(`Error updating email template ${template.template_key}:`, error);
          results.errors++;
        } else {
          console.log(`✓ Updated email template: ${template.name}`);
          results.updated++;
        }
      } else {
        // Insert new template
        const { error } = await supabase.from('email_templates').insert({
          template_key: template.template_key,
          name: template.name,
          category: template.category,
          subject: template.subject,
          html_content: template.html_content,
          variables: uniqueVariables,
          is_active: true,
          description: template.description,
          created_by: user.id,
        });

        if (error) {
          console.error(`Error seeding email template ${template.template_key}:`, error);
          results.errors++;
        } else {
          console.log(`✓ Seeded email template: ${template.name}`);
          results.created++;
        }
      }
    } catch (error: any) {
      console.error(`Error processing email template ${template.template_key}:`, error.message);
      results.errors++;
    }
  }

  console.log('Finished seeding email templates!', results);
  return results;
}

// Function that can be called from the UI
export async function seedEmailTemplatesFromUI(overwrite: boolean = false): Promise<{ success: boolean; message: string; results?: any }> {
  try {
    const results = await seedAllEmailTemplates(overwrite);
    const summary = `Created: ${results.created}, Updated: ${results.updated}, Skipped: ${results.skipped}, Errors: ${results.errors}`;
    return { 
      success: true, 
      message: `Email templates imported successfully! ${summary}`,
      results 
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to seed email templates' };
  }
}

