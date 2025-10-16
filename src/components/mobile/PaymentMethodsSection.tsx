import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, CreditCard, Building2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentMethodsSectionProps {
  onBack: () => void;
}

interface PaymentMethod {
  id: string;
  payment_type: string;
  account_identifier: string;
  is_primary: boolean;
}

export const PaymentMethodsSection: React.FC<PaymentMethodsSectionProps> = ({ onBack }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState({
    payment_type: 'cashapp',
    account_identifier: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('driver_payment_methods')
        .select('*')
        .eq('driver_id', user.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!paymentDetails.account_identifier) {
      toast({
        title: "Missing information",
        description: "Please enter your payment account details.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('driver_payment_methods')
        .insert({
          driver_id: user.id,
          payment_type: paymentDetails.payment_type,
          account_identifier: paymentDetails.account_identifier,
          is_primary: paymentMethods.length === 0,
          is_verified: false
        });

      if (error) throw error;

      toast({
        title: "Payment method added",
        description: "Your payout method has been set up successfully."
      });
      
      setShowAddForm(false);
      setPaymentDetails({
        payment_type: 'cashapp',
        account_identifier: '',
      });
      fetchPaymentMethods();
    } catch (error) {
      toast({
        title: "Error adding payment method",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('driver_payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Payment method removed",
      });
      fetchPaymentMethods();
    } catch (error) {
      toast({
        title: "Error removing payment method",
        variant: "destructive"
      });
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Unset all as primary
      await supabase
        .from('driver_payment_methods')
        .update({ is_primary: false })
        .eq('driver_id', user.id);

      // Set selected as primary
      const { error } = await supabase
        .from('driver_payment_methods')
        .update({ is_primary: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Primary method updated",
      });
      fetchPaymentMethods();
    } catch (error) {
      toast({
        title: "Error updating primary method",
        variant: "destructive"
      });
    }
  };

  const formatAccountIdentifier = (type: string, identifier: string) => {
    switch (type) {
      case 'cashapp':
        return identifier.startsWith('$') ? identifier : `$${identifier}`;
      case 'venmo':
        return identifier.startsWith('@') ? identifier : `@${identifier}`;
      default:
        return identifier;
    }
  };

  const getMethodDisplayName = (type: string) => {
    switch (type) {
      case 'cashapp':
        return 'Cash App';
      case 'paypal':
        return 'PayPal';
      case 'venmo':
        return 'Venmo';
      case 'zelle':
        return 'Zelle';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
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

          {/* Current Payment Methods */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Payment Methods</CardTitle>
                <Button
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Method
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No payment method added yet</p>
                  <p className="text-sm">Add CashApp, PayPal, or other method</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {getMethodDisplayName(method.payment_type)}
                            {method.is_primary && (
                              <Badge variant="secondary" className="text-xs">Primary</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatAccountIdentifier(method.payment_type, method.account_identifier)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.is_primary && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetPrimary(method.id)}
                          >
                            Set Primary
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(method.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Payment Method Form */}
          {showAddForm && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Add Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="payment_type">Payment Type</Label>
                  <Select
                    value={paymentDetails.payment_type}
                    onValueChange={(value) => setPaymentDetails({ ...paymentDetails, payment_type: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cashapp">Cash App</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="venmo">Venmo</SelectItem>
                      <SelectItem value="zelle">Zelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="account_identifier">
                    {paymentDetails.payment_type === 'cashapp' && 'CashTag (e.g., $username)'}
                    {paymentDetails.payment_type === 'paypal' && 'PayPal Email'}
                    {paymentDetails.payment_type === 'venmo' && 'Venmo Username (e.g., @username)'}
                    {paymentDetails.payment_type === 'zelle' && 'Phone or Email'}
                  </Label>
                  <Input
                    id="account_identifier"
                    value={paymentDetails.account_identifier}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, account_identifier: e.target.value })}
                    placeholder={
                      paymentDetails.payment_type === 'cashapp' ? '$username' :
                      paymentDetails.payment_type === 'venmo' ? '@username' :
                      paymentDetails.payment_type === 'paypal' ? 'email@example.com' :
                      'Phone or email'
                    }
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
                    onClick={handleAddPaymentMethod}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Add Method
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <strong>Note:</strong> For instant payouts, we recommend Cash App. 
                  Make sure your account details are correct.
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