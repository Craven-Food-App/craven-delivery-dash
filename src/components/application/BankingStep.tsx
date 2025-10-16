import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApplicationStepProps } from "@/types/application";
import { Shield, DollarSign, CreditCard, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
        <p className="text-muted-foreground">How would you like to receive your earnings?</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Your information is secure</p>
              <p className="text-xs text-muted-foreground">
                We use bank-level encryption. This information is required for tax reporting and payouts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
            Required for IRS 1099 tax reporting (format: XXX-XX-XXXX)
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Payout Method *</Label>
        <div className="grid gap-3 md:grid-cols-2">
          <Card
            className={`cursor-pointer transition-all hover:border-primary ${
              data.payoutMethod === 'direct_deposit' && 'border-primary bg-primary/5'
            }`}
            onClick={() => onUpdate('payoutMethod', 'direct_deposit')}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <CreditCard className={`h-8 w-8 mb-2 ${
                data.payoutMethod === 'direct_deposit' ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <span className="font-medium">Direct Deposit</span>
              <span className="text-xs text-muted-foreground mt-1">Bank account</span>
            </CardContent>
          </Card>
          
          <Card
            className={`cursor-pointer transition-all hover:border-primary ${
              data.payoutMethod === 'cashapp' && 'border-primary bg-primary/5'
            }`}
            onClick={() => onUpdate('payoutMethod', 'cashapp')}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Wallet className={`h-8 w-8 mb-2 ${
                data.payoutMethod === 'cashapp' ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <span className="font-medium">Cash App</span>
              <span className="text-xs text-muted-foreground mt-1">Instant payout</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {data.payoutMethod === 'direct_deposit' && (
        <div className="space-y-4 p-4 border rounded-lg animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-medium">Bank Account Information</p>
          <div className="space-y-2">
            <Label htmlFor="bankAccountType">Account Type *</Label>
            <Select value={data.bankAccountType} onValueChange={(value: any) => onUpdate('bankAccountType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="routingNumber">Routing Number *</Label>
            <Input
              id="routingNumber"
              value={data.routingNumber}
              onChange={(e) => onUpdate('routingNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="123456789"
              maxLength={9}
            />
            <p className="text-xs text-muted-foreground">
              9-digit number found on your checks
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              value={data.accountNumber}
              onChange={(e) => onUpdate('accountNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="Enter full account number"
              maxLength={17}
              type="password"
            />
            <p className="text-xs text-muted-foreground">
              Enter your full account number (will be encrypted)
            </p>
          </div>
        </div>
      )}

      {data.payoutMethod === 'cashapp' && (
        <div className="space-y-4 p-4 border rounded-lg animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-medium">Cash App Information</p>
          <div className="space-y-2">
            <Label htmlFor="cashTag">Cash Tag *</Label>
            <Input
              id="cashTag"
              value={data.cashTag}
              onChange={(e) => {
                let value = e.target.value;
                if (!value.startsWith('$') && value.length > 0) {
                  value = '$' + value;
                }
                onUpdate('cashTag', value);
              }}
              placeholder="$YourCashTag"
            />
            <p className="text-xs text-muted-foreground">
              Your Cash App username (must start with $)
            </p>
          </div>
        </div>
      )}

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
