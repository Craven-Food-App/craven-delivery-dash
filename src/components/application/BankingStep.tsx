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
        <h2 className="text-2xl font-bold mb-2">Background Check Information</h2>
        <p className="text-muted-foreground">Required for identity verification</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Your information is secure</p>
              <p className="text-xs text-muted-foreground">
                Your Social Security Number is required for background check only. Tax forms (W-9) and payment setup will be completed after approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4" />
          <p className="text-sm font-medium">Identity Verification</p>
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
            Used exclusively for background check verification (format: XXX-XX-XXXX)
          </p>
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
