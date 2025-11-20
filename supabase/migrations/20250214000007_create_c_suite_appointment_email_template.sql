-- Create C-SUITE EXECUTIVE APPOINTMENT EMAIL template
-- This is the default email template used when executives are appointed

INSERT INTO public.email_templates (
  template_key,
  name,
  subject,
  html_content,
  category,
  is_active,
  created_at,
  updated_at
) VALUES (
  'c_suite_executive_appointment',
  'C-Suite Executive Appointment Email',
  'Your Executive Appointment Documents - {{company_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header with Orange Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">🎉 Executive Appointment</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">Dear {{executiveName}},</h2>
              
              <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Congratulations on your appointment as an executive officer of <strong>{{company_name}}</strong>! We are thrilled to have you join our leadership team.
              </p>
              
              <div style="background-color: #fff5ec; border-left: 4px solid #ff6b00; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #ff6b00; font-size: 18px;">📋 Action Required: Document Signing</h3>
                <p style="margin: 0 0 15px 0; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                  Your appointment documents are now ready for your review and signature. Please complete the signing process at your earliest convenience.
                </p>
                <p style="margin: 0; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                  <strong>Documents Included:</strong> {{documentTitle}}
                </p>
              </div>

              {{#documents}}
              <div style="background-color: #f9f9f9; padding: 16px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px;">Included Documents</h3>
                <ul style="margin: 0; padding-left: 18px; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                  <li style="margin: 6px 0;"><a href="{{preview_url}}" style="color: #ff6b00; text-decoration: none;">{{title}}</a></li>
                </ul>
              </div>
              {{/documents}}

              <div style="text-align: center; margin: 40px 0 30px 0;">
                <a href="{{portalUrl}}" 
                   style="display: inline-block; background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);">
                  Access Signing Portal
                </a>
              </div>

              <div style="background-color: #e8f5e9; padding: 20px; border-radius: 6px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 16px;">📎 Signing Instructions Attached</h3>
                <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                  A detailed README file with step-by-step signing instructions has been attached to this email. Please review it for guidance on accessing and signing your documents.
                </p>
              </div>

              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px;">⏰ Important Next Steps</h3>
                <ol style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                  <li>Review the attached README for detailed signing instructions</li>
                  <li>Access the signing portal using the button above</li>
                  <li>Review each document carefully</li>
                  <li>Sign all required documents</li>
                  <li>Complete your executive profile setup</li>
                </ol>
              </div>
              
              <p style="margin: 30px 0 0 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance, please contact our executive onboarding team at <a href="mailto:executive@cravenusa.com" style="color: #ff6b00; text-decoration: none;">executive@cravenusa.com</a>
              </p>

              <p style="margin: 20px 0 0 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                We look forward to working with you!
              </p>

              <p style="margin: 20px 0 0 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                Best regards,<br>
                <strong>The {{company_name}} Executive Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px; font-weight: bold;">Welcome to the Team! 🚀</p>
              <p style="margin: 0; color: #898989; font-size: 12px;">
                © {{currentYear}} {{company_name}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'executive',
  true,
  now(),
  now()
)
ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Set this as the default template for executive appointments
-- First, unset any existing default for this context
UPDATE public.template_usage
SET is_default = false
WHERE template_type = 'email'
  AND usage_context = 'executive_appointment'
  AND is_default = true;

-- Then insert the new default (or update if it already exists)
INSERT INTO public.template_usage (
  template_id,
  template_type,
  usage_context,
  is_default
)
SELECT 
  id,
  'email',
  'executive_appointment',
  true
FROM public.email_templates
WHERE template_key = 'c_suite_executive_appointment'
ON CONFLICT (template_type, usage_context, template_id) 
DO UPDATE SET
  is_default = EXCLUDED.is_default,
  updated_at = now();

COMMENT ON TABLE public.email_templates IS 'Email templates for various system notifications. The c_suite_executive_appointment template is the default for executive appointments.';

