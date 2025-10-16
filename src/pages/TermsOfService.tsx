import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
            <p className="text-center text-muted-foreground">Last Updated: January 2025</p>
          </CardHeader>
          
          <CardContent className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing or using Crave'N's food delivery platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
              <p className="text-muted-foreground mb-4">
                You must be at least 18 years old to use our Service. By using Crave'N, you represent and warrant that you meet this age requirement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>You must create an account to use certain features of our Service</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You agree to provide accurate and complete information</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Orders and Payments</h2>
              <h3 className="text-xl font-semibold mb-3">Placing Orders</h3>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>All orders are subject to acceptance by the restaurant</li>
                <li>Prices are set by restaurants and may vary</li>
                <li>We reserve the right to refuse or cancel orders for any reason</li>
                <li>Order confirmation does not guarantee delivery time</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Payment Terms</h3>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Payment is due at the time of order</li>
                <li>We accept major credit cards and other payment methods</li>
                <li>You authorize us to charge your payment method for all fees</li>
                <li>All prices include applicable taxes and fees</li>
                <li>Service fees and delivery fees apply to each order</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Refunds and Cancellations</h3>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Cancellation policies vary by restaurant</li>
                <li>Refunds are issued at our sole discretion</li>
                <li>You may be charged a cancellation fee for late cancellations</li>
                <li>Issues with food quality should be reported within 24 hours</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Delivery Services</h2>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Delivery times are estimates and not guaranteed</li>
                <li>Drivers are independent contractors, not employees</li>
                <li>You must provide accurate delivery information</li>
                <li>Failed deliveries due to incorrect information are non-refundable</li>
                <li>Tips are optional and go entirely to the driver</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Driver Terms</h2>
              <p className="text-muted-foreground mb-4">For users providing delivery services ("Drivers"):</p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Drivers are independent contractors, not employees</li>
                <li>Must maintain valid driver's license and insurance</li>
                <li>Must pass background checks and vehicle inspections</li>
                <li>Comply with all traffic laws and safety regulations</li>
                <li>Provide professional and courteous service</li>
                <li>Maintain accurate location tracking during deliveries</li>
                <li>Earnings are calculated based on our payout structure</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Restaurant Partner Terms</h2>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Maintain accurate menu information and pricing</li>
                <li>Fulfill orders in a timely manner</li>
                <li>Comply with all food safety and health regulations</li>
                <li>Pay applicable commission fees</li>
                <li>Ensure food quality and proper packaging</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Prohibited Conduct</h2>
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Harass, abuse, or harm others</li>
                <li>Submit false or misleading information</li>
                <li>Interfere with the Service's operation</li>
                <li>Attempt to gain unauthorized access</li>
                <li>Use automated systems to access the Service</li>
                <li>Reverse engineer or decompile the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                All content on Crave'N, including logos, text, graphics, and software, is the property of Crave'N or its licensors and is protected by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Disclaimers</h2>
              <p className="text-muted-foreground mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Uninterrupted or error-free service</li>
                <li>Specific delivery times</li>
                <li>Food quality or safety (responsibility of restaurants)</li>
                <li>Accuracy of restaurant information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, CRAVE'N SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, DATA, OR GOODWILL.
              </p>
              <p className="text-muted-foreground mb-4">
                Our total liability for any claim shall not exceed the amount you paid us in the past 12 months.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
              <p className="text-muted-foreground mb-4">
                You agree to indemnify and hold harmless Crave'N from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Dispute Resolution</h2>
              <h3 className="text-xl font-semibold mb-3">Arbitration Agreement</h3>
              <p className="text-muted-foreground mb-4">
                Any disputes shall be resolved through binding arbitration rather than in court, except for small claims court matters.
              </p>
              
              <h3 className="text-xl font-semibold mb-3">Governing Law</h3>
              <p className="text-muted-foreground mb-4">
                These Terms are governed by the laws of [Your State/Country], without regard to conflict of law principles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">14. Modifications to Terms</h2>
              <p className="text-muted-foreground mb-4">
                We reserve the right to modify these Terms at any time. We will notify you of material changes. Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">15. Termination</h2>
              <p className="text-muted-foreground mb-4">
                We may suspend or terminate your account at any time for any reason, including violation of these Terms. Upon termination, your right to use the Service ceases immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">16. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                For questions about these Terms, contact us:
              </p>
              <ul className="list-none mb-4 text-muted-foreground">
                <li><strong>Email:</strong> legal@craven.com</li>
                <li><strong>Phone:</strong> 1-800-CRAVE-N</li>
                <li><strong>Mail:</strong> Crave'N Legal Department, [Company Address]</li>
              </ul>
            </section>

            <section className="mb-8 p-6 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Legal Notice:</strong> These Terms of Service are a template and must be reviewed and customized by a qualified attorney before use in production. Laws vary by jurisdiction and your specific business model may require additional terms.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
