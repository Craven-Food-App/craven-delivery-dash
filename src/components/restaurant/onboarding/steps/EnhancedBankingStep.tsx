import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, Shield, AlertCircle } from 'lucide-react';
import { validateRoutingNumber } from '@/utils/bankingValidation';

interface EnhancedBankingStepProps {
  data: any;
  updateData: (updates: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function EnhancedBankingStep({ data, updateData, onNext, onBack }: EnhancedBankingStepProps) {
  const isRoutingNumberValid = data.routingNumber?.length === 9 && validateRoutingNumber(data.routingNumber);
  const showRoutingError = data.routingNumber?.length === 9 && !isRoutingNumberValid;
  
  const isValid = 
    data.bankAccountType &&
    isRoutingNumberValid &&
    data.accountNumber?.length >= 4 &&
    data.w9Completed;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <CreditCard className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Payment Information</h2>
        <p className="text-muted-foreground">
          Set up your bank account for receiving payments
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bankAccountType">Account Type *</Label>
          <Select
            value={data.bankAccountType || ''}
            onValueChange={(value) => updateData({ bankAccountType: value })}
          >
            <SelectTrigger id="bankAccountType">
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checking">Checking Account</SelectItem>
              <SelectItem value="savings">Savings Account</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="routingNumber">Routing Number *</Label>
          <Input
            id="routingNumber"
            type="text"
            maxLength={9}
            placeholder="123456789"
            value={data.routingNumber || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              updateData({ routingNumber: value });
            }}
            className={showRoutingError ? 'border-red-500' : ''}
          />
          {showRoutingError ? (
            <p className="text-xs text-red-600">Invalid routing number. Please enter a valid 9-digit bank routing number.</p>
          ) : (
            <p className="text-xs text-muted-foreground">9-digit bank routing number</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number *</Label>
          <Input
            id="accountNumber"
            type="password"
            placeholder="••••••••••"
            value={data.accountNumber || ''}
            onChange={(e) => updateData({ accountNumber: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountNumberConfirm">Confirm Account Number *</Label>
          <Input
            id="accountNumberConfirm"
            type="text"
            placeholder="Re-enter account number"
            value={data.accountNumberConfirm || ''}
            onChange={(e) => updateData({ accountNumberConfirm: e.target.value })}
          />
          {data.accountNumber && data.accountNumberConfirm && data.accountNumber !== data.accountNumberConfirm && (
            <p className="text-xs text-red-600">Account numbers don't match</p>
          )}
        </div>

        {/* Verification Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900 mb-1">Bank Account Verification</p>
              <p className="text-amber-800">
                We'll send two small test deposits (less than $1 each) to verify your account. 
                This process typically takes 1-2 business days. You'll need to verify these amounts 
                before going live.
              </p>
            </div>
          </div>
        </div>

        {/* W-9 */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-start gap-2">
            <Checkbox
              id="w9Completed"
              checked={data.w9Completed || false}
              onCheckedChange={(checked) => updateData({ w9Completed: checked })}
            />
            <div className="space-y-1">
              <Label htmlFor="w9Completed" className="text-sm font-medium cursor-pointer">
                W-9 Tax Form Completion *
              </Label>
              <p className="text-xs text-muted-foreground">
                I certify that the information provided is accurate and I authorize Crave'N to use 
                this information for IRS reporting purposes (Form 1099-K).
              </p>
            </div>
          </div>
        </div>

        {/* Security & Payout Info */}
        <div className="space-y-4 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Your Payment Schedule</p>
                <ul className="space-y-1 text-blue-800">
                  <li>• <strong>Daily Payouts:</strong> Receive payments daily for previous day's orders</li>
                  <li>• <strong>Processing Time:</strong> 1-2 business days to your account</li>
                  <li>• <strong>Minimum Payout:</strong> $25 (below this amount rolls to next day)</li>
                  <li>• <strong>Fees:</strong> See commission structure in your agreement</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-900">
                <p className="font-semibold mb-1">Bank-Level Security</p>
                <p className="text-green-800">
                  Your banking information is encrypted with 256-bit SSL encryption and never stored in plain text. 
                  We comply with PCI DSS Level 1 standards for payment security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isValid || data.accountNumber !== data.accountNumberConfirm}
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
