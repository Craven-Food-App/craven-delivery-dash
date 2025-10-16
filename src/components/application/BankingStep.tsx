import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApplicationStepProps } from "@/types/application";
import { Shield, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const BankingStep = ({ data, onUpdate, onNext, onBack, isValid }: ApplicationStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Banking & Tax Information</h2>
        <p className="text-muted-foreground">Secure info needed for payments and tax reporting</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Your information is secure</p>
              <p className="text-xs text-muted-foreground">
                We use bank-level encryption to protect your sensitive data.
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
          <Label htmlFor="ssnLastFour">Last 4 Digits of SSN *</Label>
          <Input
            id="ssnLastFour"
            value={data.ssnLastFour}
            onChange={(e) => onUpdate('ssnLastFour', e.target.value.replace(/\D/g, ''))}
            placeholder="1234"
            maxLength={4}
            type="password"
          />
          <p className="text-xs text-muted-foreground">
            Required for IRS 1099 tax reporting
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4 border rounded-lg">
        <p className="text-sm font-medium">Bank Account (for Direct Deposit)</p>
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
          <Label htmlFor="accountNumberLastFour">Last 4 Digits of Account Number *</Label>
          <Input
            id="accountNumberLastFour"
            value={data.accountNumberLastFour}
            onChange={(e) => onUpdate('accountNumberLastFour', e.target.value.replace(/\D/g, ''))}
            placeholder="5678"
            maxLength={4}
            type="password"
          />
        </div>
      </div>

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
