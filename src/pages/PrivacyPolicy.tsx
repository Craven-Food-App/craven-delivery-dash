import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CraveMoreText } from "@/components/ui/cravemore-text";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
            <p className="text-center text-muted-foreground">Last Updated: January 2025</p>
          </CardHeader>
          
          <CardContent className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground mb-4">
                Welcome to Crave'N ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our food delivery platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold mb-3">Personal Information</h3>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Name, email address, phone number</li>
                <li>Delivery addresses</li>
                <li>Payment information (processed securely through third-party payment processors)</li>
                <li>Order history and preferences</li>
                <li><CraveMoreText /> membership status and subscription information</li>
                <li>Billing and payment history for membership subscriptions</li>
              </ul>
              
              <h3 className="text-xl font-semibold mb-3">Driver Information</h3>
              <p className="text-sm text-muted-foreground mb-2 italic">
                We collect this information to compensate drivers for delivery services and comply with tax laws.
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Driver's license and vehicle information</li>
                <li>Background check results</li>
                <li>Real-time location data (only while actively delivering)</li>
                <li>Banking information for ACH payouts including bank account numbers and routing numbers (encrypted and stored securely) - <strong>Required to pay you for deliveries</strong></li>
                <li>Payment method preferences (Cash App, bank accounts)</li>
                <li>Earnings and payout history - <strong>Required for accurate compensation and tax reporting</strong></li>
                <li>Tax information (W-9, SSN/EIN for IRS reporting) - <strong>Required by law for payments over $600/year</strong></li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Restaurant Partner Information</h3>
              <p className="text-sm text-muted-foreground mb-2 italic">
                We collect this information to transfer revenue from food sales and comply with financial regulations.
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Business name, address, and contact information</li>
                <li>Menu items and pricing</li>
                <li>Order and sales data</li>
                <li>Banking information for ACH deposits via Stripe Connect (bank account numbers, routing numbers) - <strong>Required to pay you for customer orders</strong></li>
                <li>Business tax identification numbers (EIN) - <strong>Required by law for business transactions and tax reporting</strong></li>
                <li>Business owner verification documents - <strong>Required to prevent fraud and comply with Know Your Customer (KYC) regulations</strong></li>
                <li>Revenue and payout transaction history - <strong>Required for accurate accounting and tax compliance</strong></li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Automatically Collected Information</h3>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Device information (browser type, operating system)</li>
                <li>IP address and location data</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              
              <h3 className="text-xl font-semibold mb-3">Why We Need Your Banking Information</h3>
              <p className="text-muted-foreground mb-4">
                We collect and use banking information for specific, lawful purposes:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li><strong>To Pay You:</strong> We need bank account details to transfer money you've earned through our platform. Without this information, we cannot compensate you for your work.</li>
                <li><strong>Legal Compliance:</strong> Federal law requires us to collect tax information (W-9, SSN/EIN) for anyone earning over $600 per year and issue 1099 forms to the IRS.</li>
                <li><strong>Fraud Prevention:</strong> Bank verification helps us ensure accounts are legitimate and prevent unauthorized access to funds.</li>
                <li><strong>Financial Regulations:</strong> We must comply with Anti-Money Laundering (AML) and Know Your Customer (KYC) regulations.</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">General Uses of Your Information</h3>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Process and fulfill your orders</li>
                <li>Facilitate communication between customers, drivers, and restaurants</li>
                <li>Process payments and prevent fraud</li>
                <li>Send order updates and notifications</li>
                <li>Manage <CraveMoreText /> membership subscriptions and benefits</li>
                <li>Process recurring subscription payments</li>
                <li>Apply membership discounts and benefits to orders</li>
                <li><strong>Process ACH bank transfers and payouts</strong> to drivers and restaurant partners</li>
                <li><strong>Verify bank account ownership</strong> for fraud prevention</li>
                <li><strong>Calculate and distribute earnings</strong> through daily automated payout systems</li>
                <li><strong>Generate tax documentation</strong> (1099 forms) for independent contractors</li>
                <li>Comply with financial regulations and reporting requirements</li>
                <li>Improve our services and user experience</li>
                <li>Comply with legal obligations</li>
                <li>Send promotional communications (with your consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-muted-foreground mb-4">We may share your information with:</p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li><strong>Restaurants:</strong> Order details and delivery addresses</li>
                <li><strong>Drivers:</strong> Pickup and delivery information</li>
                <li><strong>Payment Processors:</strong> Stripe (including Stripe Connect for ACH transfers), Cash App, and other secure payment services for processing bank transfers and payouts</li>
                <li><strong>Banking Partners:</strong> Your bank account information is shared with our payment processors to facilitate ACH deposits and withdrawals</li>
                <li><strong>Tax Authorities:</strong> Earnings and tax information as required by law (IRS 1099 reporting)</li>
                <li><strong>Service Providers:</strong> Analytics, marketing, and technical support</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect rights</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                <strong>Financial Data Protection:</strong> Banking information is encrypted in transit and at rest. We use industry-standard security measures including tokenization and PCI-DSS compliant processors. Bank account numbers are never stored in plain text.
              </p>
              <p className="text-muted-foreground">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate technical and organizational measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Encryption of sensitive data in transit (TLS/SSL) and at rest (AES-256)</li>
                <li><strong>Banking Data Protection:</strong> All bank account numbers and routing numbers are encrypted and tokenized</li>
                <li><strong>PCI-DSS Compliance:</strong> Payment processing through certified payment processors</li>
                <li>Secure authentication and access controls with role-based permissions</li>
                <li>Regular security audits and penetration testing</li>
                <li>Compliance with industry security standards (SOC 2, PCI-DSS)</li>
                <li>Secure data centers with 24/7 monitoring</li>
                <li>Two-factor authentication for sensitive account operations</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                <strong>ACH Transfer Security:</strong> All bank transfers are processed through regulated financial institutions and use bank-level encryption standards.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Your Privacy Rights</h2>
              <p className="text-muted-foreground mb-4">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Data Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Restriction:</strong> Limit how we use your data</li>
              </ul>
              <p className="text-muted-foreground">
                To exercise these rights, contact us at customerservice@cravenusa.com
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar technologies to enhance your experience. You can control cookies through your browser settings. See our <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a> for details.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
              <p className="text-muted-foreground mb-4">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
              <p className="text-muted-foreground mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions or concerns about this Privacy Policy, please contact us:
              </p>
              <ul className="list-none mb-4 text-muted-foreground">
                <li><strong>Email:</strong> customerservice@cravenusa.com</li>
                <li><strong>Phone:</strong> 1-800-CRAVE-N</li>
                <li><strong>Mail:</strong> Crave'N Privacy Team, [Company Address]</li>
              </ul>
            </section>

            <section className="mb-8 p-6 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This privacy policy is a template and should be reviewed by a legal professional before use in production. It may need to be customized based on your specific business practices, applicable laws (GDPR, CCPA, etc.), and jurisdictions.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
