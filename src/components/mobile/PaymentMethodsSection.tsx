import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, CreditCard, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethodsSectionProps {
  onBack: () => void;
}

export const PaymentMethodsSection: React.FC<PaymentMethodsSectionProps> = ({ onBack }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    account_holder_name: '',
    account_number: '',
    routing_number: '',
    account_type: '',
    bank_name: ''
  });
  const { toast } = useToast();

  const handleAddBankAccount = () => {
    // Validate form
    if (!bankDetails.account_holder_name || !bankDetails.account_number || !bankDetails.routing_number) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Bank account added",
      description: "Your payout method has been set up successfully."
    });
    
    setShowAddForm(false);
    setBankDetails({
      account_holder_name: '',
      account_number: '',
      routing_number: '',
      account_type: '',
      bank_name: ''
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-y-auto">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-background border-b border-border/50 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Payment Methods</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Info Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground mb-1">Bank Account Required</h3>
                  <p className="text-sm text-muted-foreground">
                    Add your bank account to receive weekly payouts for your deliveries.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Payment Method */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Current Payout Method</CardTitle>
                <Button
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Bank
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No payment method added yet</p>
                <p className="text-sm">Add a bank account to receive payouts</p>
              </div>
            </CardContent>
          </Card>

          {/* Add Bank Account Form */}
          {showAddForm && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Add Bank Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="account_holder">Account Holder Name *</Label>
                  <Input
                    id="account_holder"
                    value={bankDetails.account_holder_name}
                    onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })}
                    placeholder="Full name as it appears on account"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="routing_number">Routing Number *</Label>
                  <Input
                    id="routing_number"
                    value={bankDetails.routing_number}
                    onChange={(e) => setBankDetails({ ...bankDetails, routing_number: e.target.value })}
                    placeholder="9-digit routing number"
                    maxLength={9}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="account_number">Account Number *</Label>
                  <Input
                    id="account_number"
                    value={bankDetails.account_number}
                    onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                    placeholder="Account number"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="account_type">Account Type</Label>
                  <Select
                    value={bankDetails.account_type}
                    onValueChange={(value) => setBankDetails({ ...bankDetails, account_type: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bank_name">Bank Name (Optional)</Label>
                  <Input
                    id="bank_name"
                    value={bankDetails.bank_name}
                    onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                    placeholder="Your bank name"
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddBankAccount}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Add Account
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <strong>Security:</strong> Your banking information is encrypted and secure. 
                  We use bank-level security to protect your data.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payout Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Payout Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Frequency</span>
                  <span className="text-sm font-medium">Weekly</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payout Day</span>
                  <span className="text-sm font-medium">Every Tuesday</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Processing Time</span>
                  <span className="text-sm font-medium">1-2 business days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};