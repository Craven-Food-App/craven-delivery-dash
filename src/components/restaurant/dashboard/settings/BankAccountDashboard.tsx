import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";

const BankAccountDashboard = () => {
  return (
    <div className="space-y-6 pb-8">
      {/* Description */}
      <p className="text-muted-foreground">
        Here is where you will find a summary of your banking information.
      </p>

      {/* Bank Account Information */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Bank account information</h2>
              <p className="text-sm text-muted-foreground">
                Crave'N only uses your bank account information to deposit payouts.
              </p>
            </div>
            <Button variant="outline">Edit</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">Verification status</h3>
              </div>
              <p className="text-green-600 font-semibold mb-2">Verified</p>
              <p className="text-sm text-muted-foreground">
                Your bank account information has been reviewed and verified.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-4">Bank account</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account number</span>
                  <span className="font-mono">••••••5jq1</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Routing number</span>
                  <span className="font-mono">••••1279</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bank name</span>
                  <span>THE BANCORP BANK</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Business information</h2>
          <p className="text-sm text-muted-foreground mb-6">
            To process payouts, Crave'N and our payments processing partner, Stripe, are required to collect your business information for compliance and tax purposes.
          </p>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Verification status</h3>
                <p className="text-red-700 font-semibold mb-2">Not verified—action required</p>
                <p className="text-sm text-red-900">
                  To avoid delayed payouts, you're required to verify your business information. This should only take a few minutes.
                </p>
              </div>
            </div>
            <Button variant="destructive">Learn more</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankAccountDashboard;
