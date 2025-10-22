import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistEmailRequest {
  driverName: string;
  driverEmail: string;
  city: string;
  state: string;
  waitlistPosition: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { driverName, driverEmail, city, state, waitlistPosition }: WaitlistEmailRequest = await req.json();

    console.log(`Sending waitlist email to ${driverEmail} (Position #${waitlistPosition} in ${city}, ${state})`);

    const emailHtml = `
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
                <span class="position-badge">#${waitlistPosition} in ${city}, ${state}</span>
              </p>
            </div>
            
            <h3>📋 What You Submitted:</h3>
            <ul>
              <li><strong>Name:</strong> ${driverName}</li>
              <li><strong>Email:</strong> ${driverEmail}</li>
              <li><strong>Location:</strong> ${city}, ${state}</li>
              <li><strong>Documents:</strong> Driver's license & insurance (received)</li>
            </ul>
            
            <h3>⏰ What Happens Next:</h3>
            <ul class="checklist">
              <li>We're reviewing your documents (usually within 48 hours)</li>
              <li>You'll stay on the waitlist until delivery routes open in ${city}</li>
              <li>When routes launch, you'll receive an email invitation to complete your background check</li>
              <li>Once approved, you can start accepting deliveries immediately</li>
            </ul>
            
            <div class="highlight-box">
              <p><strong>⏳ Estimated Wait Time:</strong> 2-8 weeks</p>
              <p style="font-size: 14px; margin: 5px 0 0 0;">We're expanding rapidly! You'll be among the first to know when ${city} launches.</p>
            </div>
            
            <h3>💡 In the Meantime:</h3>
            <ul>
              <li>Download the Crave'N customer app to see what customers experience</li>
              <li>Follow us on Instagram: <a href="https://instagram.com/craven">@craven</a></li>
              <li>Check out our Driver FAQ</li>
            </ul>
            
            <p style="margin-top: 30px;">Questions? Reply to this email or text us at <strong>(419) 555-CRAVE</strong>.</p>
            
            <p>Thanks for your interest in driving with Crave'N!</p>
            
            <p><strong>The Crave'N Team</strong><br>
            Feeding Success, One Delivery at a Time 🚗🍔</p>
          </div>
          
          <div class="footer">
            <p>© 2025 Crave'N. All rights reserved.</p>
            <p>You're receiving this because you applied to drive with Crave'N.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Crave'N Drivers <onboarding@resend.dev>",
        to: [driverEmail],
        subject: `You're on the Crave'N Driver Waitlist! 🚗`,
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