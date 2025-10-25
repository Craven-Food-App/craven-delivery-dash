import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, DollarSign } from 'lucide-react';

export const PayoutSetup: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'direct_deposit' | 'cashapp'>('cashapp');
  const [payoutData, setPayoutData] = useState({
    cashTag: '',
    bankAccountType: 'checking' as 'checking' | 'savings',
    routingNumber: '',
    accountNumber: ''
  });

  useEffect(() => {
    loadPayoutInfo();
  }, []);

  const loadPayoutInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: application } = await supabase
        .from('craver_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (application) {
        setPayoutMethod((application.payout_method as 'cashapp' | 'direct_deposit') || 'cashapp');
        setPayoutData({
          cashTag: application.cash_tag || '',
          bankAccountType: (application.bank_account_type as 'checking' | 'savings') || 'checking',
          routingNumber: application.routing_number || '',
          accountNumber: application.account_number_encrypted || ''
        });
      }
    } catch (error) {
      console.error('Error loading payout info:', error);
    }
  };

  const handleSave = async () => {
    // Validate inputs
    if (payoutMethod === 'cashapp' && !payoutData.cashTag) {
      toast({
        title: "Missing Information",
        description: "Please enter your Cash App tag.",
        variant: "destructive",
      });
      return;
    }

    if (payoutMethod === 'direct_deposit' && (!payoutData.routingNumber || !payoutData.accountNumber)) {
      toast({
        title: "Missing Information",
        description: "Please enter your routing and account numbers.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: application } = await supabase
        .from('craver_applications')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!application) return;

      // Update application
      const { error: updateError } = await supabase
        .from('craver_applications')
        .update({
          payout_method: payoutMethod,
          cash_tag: payoutData.cashTag,
          bank_account_type: payoutData.bankAccountType,
          routing_number: payoutData.routingNumber,
          account_number_encrypted: payoutData.accountNumber,
          account_number_last_four: payoutData.accountNumber.slice(-4)
        })
        .eq('id', application.id);

      if (updateError) throw updateError;

      // Complete the task
      const { data: task } = await supabase
        .from('onboarding_tasks')
        .select('id')
        .eq('driver_id', application.id)
        .eq('task_key', 'setup_cashapp_payouts')
        .single();

      if (task) {
        await supabase.functions.invoke('complete-onboarding-task', {
          body: {
            task_id: task.id,
            driver_id: application.id,
          },
        });
      }

      toast({
        title: "Payout Method Saved! 💰",
        description: "Your payout information has been updated.",
      });

      navigate('/enhanced-onboarding');
    } catch (error) {
      console.error('Error saving payout info:', error);
      toast({
        title: "Error",
        description: "Failed to save payout information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/enhanced-onboarding')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Onboarding
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Set Up Payout Method
            </CardTitle>
            <p className="text-sm text-gray-600">
              Choose how you'd like to receive your earnings
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={payoutMethod} onValueChange={(value: any) => setPayoutMethod(value)}>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border rounded-lg p-4">
                  <RadioGroupItem value="cashapp" id="cashapp" />
                  <Label htmlFor="cashapp" className="flex-1 cursor-pointer">
                    <div className="font-medium">Cash App</div>
                    <div className="text-sm text-gray-500">Fast and easy payouts</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4">
                  <RadioGroupItem value="direct_deposit" id="direct_deposit" />
                  <Label htmlFor="direct_deposit" className="flex-1 cursor-pointer">
                    <div className="font-medium">Direct Deposit</div>
                    <div className="text-sm text-gray-500">Direct to your bank account</div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {payoutMethod === 'cashapp' && (
              <div className="space-y-2">
                <Label htmlFor="cashTag">Cash App Tag</Label>
                <Input
                  id="cashTag"
                  placeholder="$yourcashtag"
                  value={payoutData.cashTag}
                  onChange={(e) => setPayoutData({ ...payoutData, cashTag: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Enter your Cash App tag (e.g., $johndoe)
                </p>
              </div>
            )}

            {payoutMethod === 'direct_deposit' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <RadioGroup 
                    value={payoutData.bankAccountType} 
                    onValueChange={(value: any) => setPayoutData({ ...payoutData, bankAccountType: value })}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="checking" id="checking" />
                        <Label htmlFor="checking">Checking</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="savings" id="savings" />
                        <Label htmlFor="savings">Savings</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    placeholder="9 digits"
                    value={payoutData.routingNumber}
                    onChange={(e) => setPayoutData({ ...payoutData, routingNumber: e.target.value })}
                    maxLength={9}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Your account number"
                    value={payoutData.accountNumber}
                    onChange={(e) => setPayoutData({ ...payoutData, accountNumber: e.target.value })}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {loading ? 'Saving...' : 'Save & Complete Task'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
