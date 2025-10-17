import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wallet, CreditCard, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingPaymentSetupProps {
  onNext: () => void;
  progress?: any;
}

export const OnboardingPaymentSetup = ({ onNext }: OnboardingPaymentSetupProps) => {
  const [paymentType, setPaymentType] = useState<'bank' | 'cashapp' | 'paypal'>('bank');
  const [accountInfo, setAccountInfo] = useState({
    accountHolder: '',
    accountNumber: '',
    routingNumber: '',
    cashappTag: '',
    paypalEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let accountIdentifier = '';
      switch (paymentType) {
        case 'bank':
          if (!accountInfo.accountNumber || !accountInfo.routingNumber) {
            throw new Error('Please fill in all bank account fields');
          }
          accountIdentifier = `****${accountInfo.accountNumber.slice(-4)}`;
          break;
        case 'cashapp':
          if (!accountInfo.cashappTag) {
            throw new Error('Please enter your Cash App tag');
          }
          accountIdentifier = accountInfo.cashappTag;
          break;
        case 'paypal':
          if (!accountInfo.paypalEmail) {
            throw new Error('Please enter your PayPal email');
          }
          accountIdentifier = accountInfo.paypalEmail;
          break;
      }

      const { error } = await supabase
        .from('driver_payment_methods')
        .insert({
          driver_id: user.id,
          payment_type: paymentType,
          account_identifier: accountIdentifier,
          is_primary: true,
          is_verified: false,
        });

      if (error) throw error;

      toast({
        title: "Payment method added",
        description: "Your payment information has been saved securely",
      });

      onNext();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          Payment Setup
        </CardTitle>
        <CardDescription>
          Choose how you'd like to receive your earnings. This is your first time setting up payment information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
          <div className="flex items-center space-x-2 border rounded-lg p-4">
            <RadioGroupItem value="bank" id="bank" />
            <Label htmlFor="bank" className="flex items-center gap-2 flex-1 cursor-pointer">
              <Building2 className="h-5 w-5" />
              <div>
                <div className="font-medium">Bank Account</div>
                <div className="text-xs text-muted-foreground">Direct deposit (recommended)</div>
              </div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 border rounded-lg p-4">
            <RadioGroupItem value="cashapp" id="cashapp" />
            <Label htmlFor="cashapp" className="flex items-center gap-2 flex-1 cursor-pointer">
              <CreditCard className="h-5 w-5" />
              <div>
                <div className="font-medium">Cash App</div>
                <div className="text-xs text-muted-foreground">Instant transfers</div>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 border rounded-lg p-4">
            <RadioGroupItem value="paypal" id="paypal" />
            <Label htmlFor="paypal" className="flex items-center gap-2 flex-1 cursor-pointer">
              <Wallet className="h-5 w-5" />
              <div>
                <div className="font-medium">PayPal</div>
                <div className="text-xs text-muted-foreground">Quick payouts</div>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {paymentType === 'bank' && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="accountHolder">Account Holder Name</Label>
              <Input
                id="accountHolder"
                value={accountInfo.accountHolder}
                onChange={(e) => setAccountInfo({ ...accountInfo, accountHolder: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                type="password"
                value={accountInfo.accountNumber}
                onChange={(e) => setAccountInfo({ ...accountInfo, accountNumber: e.target.value })}
                placeholder="Enter account number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routingNumber">Routing Number</Label>
              <Input
                id="routingNumber"
                value={accountInfo.routingNumber}
                onChange={(e) => setAccountInfo({ ...accountInfo, routingNumber: e.target.value })}
                placeholder="Enter routing number"
              />
            </div>
          </div>
        )}

        {paymentType === 'cashapp' && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="cashappTag">Cash App $Cashtag</Label>
              <Input
                id="cashappTag"
                value={accountInfo.cashappTag}
                onChange={(e) => setAccountInfo({ ...accountInfo, cashappTag: e.target.value })}
                placeholder="$YourCashtag"
              />
            </div>
          </div>
        )}

        {paymentType === 'paypal' && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="paypalEmail">PayPal Email</Label>
              <Input
                id="paypalEmail"
                type="email"
                value={accountInfo.paypalEmail}
                onChange={(e) => setAccountInfo({ ...accountInfo, paypalEmail: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
          </div>
        )}

        <div className="bg-muted p-4 rounded-lg text-sm">
          <p className="font-medium mb-2">💡 Quick Facts:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Daily automatic payouts to your account</li>
            <li>• Instant cashout available (small fee may apply)</li>
            <li>• Your information is encrypted and secure</li>
            <li>• You can change payment methods anytime</li>
          </ul>
        </div>

        <Button onClick={handleSubmit} size="lg" className="w-full" disabled={loading}>
          {loading ? 'Saving...' : 'Continue to Test Delivery'}
        </Button>
      </CardContent>
    </Card>
  );
};
