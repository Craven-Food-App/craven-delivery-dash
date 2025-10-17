import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantData } from "@/hooks/useRestaurantData";
import { toast } from "sonner";

interface StripeConnectStatus {
  hasAccount: boolean;
  accountId: string | null;
  onboardingComplete: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  externalAccounts?: any[];
  requirements?: any;
}


const BankAccountDashboard = () => {
  const { restaurant, loading: restaurantLoading } = useRestaurantData();
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingLink, setCreatingLink] = useState(false);

  useEffect(() => {
    if (restaurant?.id) {
      fetchStripeStatus();
    }
  }, [restaurant?.id]);

  const fetchStripeStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-stripe-connect-status');
      
      if (error) throw error;
      setStripeStatus(data);
    } catch (error) {
      console.error('Error fetching Stripe status:', error);
      toast.error('Failed to load banking information');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBankAccount = async () => {
    setCreatingLink(true);
    try {
      const returnUrl = `${window.location.origin}/merchant-portal?tab=settings&subtab=bank-account`;
      const { data, error } = await supabase.functions.invoke('create-stripe-connect-link', {
        body: { returnUrl, refreshUrl: returnUrl }
      });
      
      if (error) throw error;
      
      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating Stripe link:', error);
      toast.error('Failed to open banking setup');
      setCreatingLink(false);
    }
  };

  if (restaurantLoading || loading) {
    return (
      <div className="space-y-6 pb-8">
        <Card>
          <CardContent className="p-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading banking information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bankAccount = stripeStatus?.externalAccounts?.[0];
  const isVerified = stripeStatus?.onboardingComplete && stripeStatus?.payoutsEnabled;

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
                Crave'N uses Stripe Connect to securely manage your payouts.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleEditBankAccount}
              disabled={creatingLink}
            >
              {creatingLink ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : stripeStatus?.hasAccount ? 'Edit' : 'Setup Banking'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-4 border rounded-lg ${isVerified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                {isVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <h3 className="font-semibold">Verification status</h3>
              </div>
              <p className={`font-semibold mb-2 ${isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {isVerified ? 'Verified' : stripeStatus?.hasAccount ? 'Pending Verification' : 'Not Setup'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isVerified 
                  ? 'Your bank account is verified and ready to receive payouts.' 
                  : stripeStatus?.hasAccount 
                    ? 'Complete your Stripe Connect onboarding to receive payouts.'
                    : 'Set up your bank account to receive payouts from orders.'}
              </p>
            </div>

            {bankAccount ? (
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-4">Bank account</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account number</span>
                    <span className="font-mono">••••{bankAccount.last4}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Routing number</span>
                    <span className="font-mono">{bankAccount.routing_number ? `••••${bankAccount.routing_number.slice(-4)}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bank name</span>
                    <span>{bankAccount.bank_name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-4">No bank account connected</h3>
                <p className="text-sm text-muted-foreground">
                  Click "Setup Banking" to connect your bank account and start receiving payouts.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Business information</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To process payouts, Crave'N and our payments processing partner, Stripe, are required to collect your business information for compliance and tax purposes.
            </p>

            {stripeStatus?.requirements?.currently_due && stripeStatus.requirements.currently_due.length > 0 ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Action Required</h3>
                    <p className="text-red-700 font-semibold mb-2">
                      {stripeStatus.requirements.currently_due.length} requirement(s) pending
                    </p>
                    <p className="text-sm text-red-900 mb-3">
                      To avoid delayed payouts, please complete the required business verification. This should only take a few minutes.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={handleEditBankAccount}
                      disabled={creatingLink}
                    >
                      {creatingLink ? 'Loading...' : 'Complete Verification'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : stripeStatus?.onboardingComplete ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-semibold">Business information verified</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Set up your Stripe Connect account to begin receiving payouts from your orders.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankAccountDashboard;
