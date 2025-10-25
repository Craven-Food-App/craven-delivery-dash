import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ApplicationStepProps } from "@/types/application";
import { Shield, DollarSign, CreditCard, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export const BankingStep = ({ data, onUpdate, onNext, onBack, isValid }: ApplicationStepProps) => {
  const formatSSN = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Format as XXX-XX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  };

  const handleSSNChange = (value: string) => {
    const formatted = formatSSN(value);
    onUpdate('ssn', formatted);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment & Tax Information</h2>
        <p className="text-muted-foreground">Choose how you want to receive payments and provide tax information</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Your information is secure</p>
              <p className="text-xs text-muted-foreground">
                Your Social Security Number is required for tax purposes. Payment information is encrypted and secure.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Method Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-4 w-4" />
          <p className="text-sm font-medium">Payout Method *</p>
        </div>
        
        <RadioGroup 
          value={data.payoutMethod || 'direct_deposit'} 
          onValueChange={(value) => onUpdate('payoutMethod', value)}
        >
          <div className="flex items-center space-x-2 p-4 border rounded-lg">
            <RadioGroupItem value="direct_deposit" id="direct_deposit" />
            <Label htmlFor="direct_deposit" className="flex-1 cursor-pointer">
              <div>
                <p className="font-medium">Direct Deposit</p>
                <p className="text-sm text-muted-foreground">Get paid directly to your bank account</p>
              </div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 p-4 border rounded-lg">
            <RadioGroupItem value="cashapp" id="cashapp" />
            <Label htmlFor="cashapp" className="flex-1 cursor-pointer">
              <div>
                <p className="font-medium">Cash App</p>
                <p className="text-sm text-muted-foreground">Instant payouts to your Cash App</p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Direct Deposit Fields */}
      {data.payoutMethod === 'direct_deposit' && (
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4" />
            <p className="text-sm font-medium">Bank Account Information</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bankAccountType">Account Type *</Label>
              <Select 
                value={data.bankAccountType || ''} 
                onValueChange={(value) => onUpdate('bankAccountType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="routingNumber">Routing Number *</Label>
              <Input
                id="routingNumber"
                value={data.routingNumber || ''}
                onChange={(e) => onUpdate('routingNumber', e.target.value)}
                placeholder="9-digit routing number"
                maxLength={9}
              />
            </div>
            
            <div>
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                value={data.accountNumber || ''}
                onChange={(e) => onUpdate('accountNumber', e.target.value)}
                placeholder="Account number"
                type="password"
              />
            </div>
          </div>
        </div>
      )}

      {/* Cash App Fields */}
      {data.payoutMethod === 'cashapp' && (
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4" />
            <p className="text-sm font-medium">Cash App Information</p>
          </div>
          
          <div>
            <Label htmlFor="cashTag">Cash App Tag *</Label>
            <Input
              id="cashTag"
              value={data.cashTag || ''}
              onChange={(e) => onUpdate('cashTag', e.target.value)}
              placeholder="@yourcashtag"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter your Cash App username (without the @ symbol)
            </p>
          </div>
        </div>
      )}

      {/* SSN for Tax Purposes */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4" />
          <p className="text-sm font-medium">Tax Information</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ssn">Social Security Number *</Label>
          <Input
            id="ssn"
            value={data.ssn}
            onChange={(e) => handleSSNChange(e.target.value)}
            placeholder="XXX-XX-XXXX"
            maxLength={11}
            type="text"
          />
          <p className="text-xs text-muted-foreground">
            Required for tax reporting purposes (format: XXX-XX-XXXX)
          </p>
        </div>
      </div>

      {/* Background Check Consent */}
      <Card className="p-4 border-2">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="background_check_consent"
            checked={data.backgroundCheckConsent}
            onCheckedChange={(checked) => onUpdate('backgroundCheckConsent', checked as boolean)}
          />
          <div className="flex-1">
            <Label htmlFor="background_check_consent" className="cursor-pointer">
              <p className="text-sm font-medium">Background Check Authorization *</p>
              <p className="text-xs text-muted-foreground mt-1">
                I authorize Crave'N to obtain a consumer report and/or investigative consumer report for employment purposes. 
                I understand this may include criminal history, motor vehicle records, and employment verification as permitted by law.
              </p>
            </Label>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="w-full" size="lg">
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid} className="w-full" size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
};
