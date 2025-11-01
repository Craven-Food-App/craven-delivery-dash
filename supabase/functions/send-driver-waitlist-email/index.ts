import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistEmailRequest {
  driverName: string;
  driverEmail: string;
  city?: string;
  state?: string;
  waitlistPosition?: number;
  location?: string;
  emailType?: 'waitlist' | 'invitation' | 'activation';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { driverName, driverEmail, city, state, waitlistPosition, location, emailType = 'waitlist' }: WaitlistEmailRequest = await req.json();

    console.log(`Sending ${emailType} email to ${driverEmail}`);

    // Select email template based on type
    let emailHtml = '';
    let subject = '';
    
    if (emailType === 'invitation') {
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .cta-button { background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 You've Been Invited to Drive with Crave'N!</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>${driverName}</strong>,</p>
              
              <p><strong>Great news!</strong> You've been removed from the waitlist and we're ready for you to complete your driver application.</p>
              
              <p>We need you to finish a few more steps to activate your driver account:</p>
              
              <ol>
                <li>Verify your identity and upload documents</li>
                <li>Provide vehicle and insurance information</li>
                <li>Complete background check</li>
                <li>Sign legal agreements</li>
              </ol>
              
              <div style="text-align: center;">
                <a href="https://feeder.crave-n.com/driver/post-waitlist-onboarding" class="cta-button">
                  Complete Your Application →
                </a>
              </div>
              
              <p>You can complete this in about 10-15 minutes. Your application will be reviewed within 24 hours.</p>
              
              <p><strong>The Crave'N Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2025 Crave'N. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      subject = 'Complete Your Crave\'N Driver Application';
    } else {
      // Waitlist email template
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .highlight-box { background: #fff3e0; border-left: 4px solid #FF6B35; padding: 15px; margin: 20px 0; }
            .checklist { list-style: none; padding: 0; }
            .checklist li { padding: 8px 0; }
            .checklist li:before { content: "✓ "; color: #4CAF50; font-weight: bold; }
            .position-badge { background: #FF6B35; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; }
            .cta-button { background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3); }
            .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 You're on the Crave'N Driver Waitlist!</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>${driverName}</strong>,</p>
              
              <p>Welcome to the Crave'N driver community! Your application has been successfully received.</p>
              
              <div class="highlight-box">
                <p style="margin: 0;"><strong>Your Waitlist Position:</strong></p>
                <p style="margin: 10px 0 0 0;">
                  <span class="position-badge">#${waitlistPosition} in ${location || `${city}, ${state}`}</span>
                </p>
              </div>
              
              <h3>📋 What You Submitted:</h3>
              <ul>
                <li><strong>Name:</strong> ${driverName}</li>
                <li><strong>Email:</strong> ${driverEmail}</li>
                <li><strong>Location:</strong> ${location || `${city}, ${state}`}</li>
              </ul>
              
              <h3>⏰ What Happens Next:</h3>
              <ul class="checklist">
                <li>You'll stay on the waitlist until delivery routes open in your area</li>
                <li>When routes launch, you'll receive an email invitation to complete your application</li>
                <li>Once approved, you can start accepting deliveries immediately</li>
              </ul>
              
              <div class="highlight-box">
                <p><strong>⏳ Estimated Wait Time:</strong> 2-8 weeks</p>
                <p style="font-size: 14px; margin: 5px 0 0 0;">We're expanding rapidly!</p>
              </div>
              
              <div style="text-align: center; margin: 40px 0 30px 0;">
                <a href="https://44d88461-c1ea-4d22-93fe-ebc1a7d81db9.lovableproject.com/onboarding" 
                   class="cta-button">
                  View My Dashboard
                </a>
              </div>
              
              <p><strong>The Crave'N Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2025 Crave'N. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      subject = 'You\'re on the Crave\'N Driver Waitlist! 🚗';
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Crave'N Drivers <onboarding@resend.dev>",
        to: [driverEmail],
        subject: subject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Resend API error: ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log('Email sent successfully:', result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in send-driver-waitlist-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);