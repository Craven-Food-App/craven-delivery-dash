import { supabase } from '@/integrations/supabase/client';
import { renderHtml } from '@/lib/templates';

/**
 * Fetch email template from database, with fallback to hardcoded templates
 */
export async function getEmailTemplate(
  templateKey: string,
  usageContext?: string
): Promise<{ subject: string; html_content: string; variables: string[] } | null> {
  try {
    // First, try to get from template_usage if usageContext is provided
    if (usageContext) {
      const { data: usage } = await supabase
        .from('template_usage')
        .select('template_id')
        .eq('template_type', 'email')
        .eq('usage_context', usageContext)
        .eq('is_default', true)
        .single();

      if (usage?.template_id) {
        const { data: template } = await supabase
          .from('email_templates')
          .select('subject, html_content, variables')
          .eq('id', usage.template_id)
          .eq('is_active', true)
          .single();

        if (template) {
          return {
            subject: template.subject,
            html_content: template.html_content,
            variables: template.variables || [],
          };
        }
      }
    }

    // Fallback: try to get by template_key
    const { data: template } = await supabase
      .from('email_templates')
      .select('subject, html_content, variables')
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single();

    if (template) {
      return {
        subject: template.subject,
        html_content: template.html_content,
        variables: template.variables || [],
      };
    }
  } catch (error) {
    console.warn(`Template not found in database for ${templateKey}, using fallback`);
  }

  // Hardcoded fallback - return null to indicate fallback should be used
  return null;
}

/**
 * Fetch document template from database, with fallback to hardcoded templates
 */
export async function getDocumentTemplate(
  templateKey: string,
  usageContext?: string
): Promise<{ html_content: string; placeholders: string[] } | null> {
  try {
    // First, try to get from template_usage if usageContext is provided
    if (usageContext) {
      const { data: usage } = await supabase
        .from('template_usage')
        .select('template_id')
        .eq('template_type', 'document')
        .eq('usage_context', usageContext)
        .eq('is_default', true)
        .single();

      if (usage?.template_id) {
        const { data: template } = await supabase
          .from('document_templates')
          .select('html_content, placeholders')
          .eq('id', usage.template_id)
          .eq('is_active', true)
          .single();

        if (template) {
          return {
            html_content: template.html_content,
            placeholders: template.placeholders || [],
          };
        }
      }
    }

    // Fallback: try to get by template_key
    const { data: template } = await supabase
      .from('document_templates')
      .select('html_content, placeholders')
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single();

    if (template) {
      return {
        html_content: template.html_content,
        placeholders: template.placeholders || [],
      };
    }
  } catch (error) {
    console.warn(`Template not found in database for ${templateKey}, using fallback`);
  }

  // Hardcoded fallback - return null to indicate fallback should be used
  return null;
}

/**
 * Render document HTML - tries database template first, falls back to hardcoded
 */
export async function renderDocumentHtml(
  templateId: string,
  data: Record<string, any>,
  usageContext?: string
): Promise<string> {
  // Try database template first
  const dbTemplate = await getDocumentTemplate(templateId, usageContext);
  
  if (dbTemplate) {
    // Replace placeholders in database template
    let html = dbTemplate.html_content;
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      html = html.replace(regex, String(data[key] || ''));
    });
    return html;
  }

  // Fallback to hardcoded template
  return renderHtml(templateId, data);
}

/**
 * Seed initial email templates from hardcoded values
 */
export async function seedEmailTemplates(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const initialTemplates = [
    {
      template_key: 'executive_document_email',
      name: 'Executive Document Email',
      category: 'executive',
      subject: 'Your C-Suite Executive Documents - Crave\'n, Inc.',
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
            <tr>
              <td style="background: linear-gradient(135deg, #ff7a45 0%, #ff8c00 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">📄 {{documentTitle}}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">Dear {{executiveName}},</h2>
                <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                  Please find your <strong>{{documentTitle}}</strong> attached below. This document is part of your C-Suite executive documentation package.
                </p>
                <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; border-radius: 6px; margin: 30px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #1976d2; font-size: 18px;">✍️ Digital Signature Portal</h3>
                  <p style="margin: 0 0 15px 0; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                    To sign these documents digitally, please log in to your secure Executive Document Portal.
                  </p>
                  <div style="text-align: center; margin: 20px 0 0 0;">
                    <a href="{{portalUrl}}/executive-portal/documents" 
                       style="display: inline-block; background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);">
                      Access Document Portal
                    </a>
                  </div>
                </div>
                <p style="margin: 30px 0 0 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                  Best regards,<br/>
                  <strong>Crave'n HR Team</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
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
</html>`,
      variables: ['documentTitle', 'executiveName', 'portalUrl'],
      description: 'Email template for sending executive documents',
    },
  ];

  for (const template of initialTemplates) {
    // Check if template already exists
    const { data: existing } = await supabase
      .from('email_templates')
      .select('id')
      .eq('template_key', template.template_key)
      .single();

    if (!existing) {
      await supabase.from('email_templates').insert({
        ...template,
        created_by: user.id,
      });
    }
  }
}

/**
 * Seed initial document templates from hardcoded templates
 */
export async function seedDocumentTemplates(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Note: This would need to extract HTML from src/lib/templates.ts
  // For now, we'll just create placeholder entries that can be edited
  const initialTemplates = [
    {
      template_key: 'employment_agreement',
      name: 'Executive Employment Agreement',
      category: 'executive',
      html_content: '<!-- Template will be loaded from src/lib/templates.ts by default. Edit this template to customize. -->',
      placeholders: ['company_name', 'full_name', 'role', 'equity_percentage', 'effective_date', 'funding_trigger', 'governing_law'],
      description: 'Executive employment agreement template',
    },
    {
      template_key: 'board_resolution',
      name: 'Board Resolution – Appointment of Officers',
      category: 'executive',
      html_content: '<!-- Template will be loaded from src/lib/templates.ts by default. Edit this template to customize. -->',
      placeholders: ['company_name', 'date', 'directors', 'ceo_name', 'cfo_name', 'cxo_name', 'equity_ceo', 'equity_cfo', 'equity_cxo', 'funding_trigger'],
      description: 'Board resolution template for officer appointments',
    },
    {
      template_key: 'stock_issuance',
      name: 'Stock Subscription / Issuance Agreement',
      category: 'executive',
      html_content: '<!-- Template will be loaded from src/lib/templates.ts by default. Edit this template to customize. -->',
      placeholders: ['company_name', 'full_name', 'role', 'share_count', 'price_per_share', 'total_purchase_price', 'share_class', 'consideration_type', 'vesting_schedule', 'currency'],
      description: 'Stock issuance agreement template',
    },
    {
      template_key: 'offer_letter',
      name: 'Executive Offer Letter',
      category: 'executive',
      html_content: '<!-- Template will be loaded from src/lib/templates.ts by default. Edit this template to customize. -->',
      placeholders: ['company_name', 'offer_date', 'executive_name', 'position_title', 'annual_base_salary', 'share_count', 'ownership_percent', 'vesting_period', 'vesting_cliff'],
      description: 'Executive offer letter template',
    },
  ];

  for (const template of initialTemplates) {
    const { data: existing } = await supabase
      .from('document_templates')
      .select('id')
      .eq('template_key', template.template_key)
      .single();

    if (!existing) {
      await supabase.from('document_templates').insert({
        ...template,
        created_by: user.id,
      });
    }
  }
}

