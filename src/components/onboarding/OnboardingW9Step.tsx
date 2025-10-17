import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnboardingW9StepProps {
  onNext: () => void;
  progress?: any;
}

export const OnboardingW9Step = ({ onNext }: OnboardingW9StepProps) => {
  const [taxClassification, setTaxClassification] = useState<string>('individual');
  const [businessName, setBusinessName] = useState('');
  const [ssnConfirmed, setSsnConfirmed] = useState(false);
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!ssnConfirmed || !signature) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please confirm your SSN and provide your digital signature."
      });
      return;
    }

    if (taxClassification !== 'individual' && !businessName) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide your business name."
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate W-9 document
      const { data: w9Data, error: w9Error } = await supabase.functions.invoke('generate-w9', {
        body: {
          taxClassification,
          businessName: taxClassification !== 'individual' ? businessName : null,
          signature,
        }
      });

      if (w9Error) throw w9Error;

      // Update application with W-9 info
      const { error: updateError } = await supabase
        .from('craver_applications')
        .update({
          w9_document: w9Data.documentPath,
          tax_classification: taxClassification,
          business_name: taxClassification !== 'individual' ? businessName : null
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update onboarding progress
      const { error: progressError } = await supabase
        .from('driver_onboarding_progress')
        .update({ w9_completed: true })
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      toast({
        title: "W-9 Submitted Successfully",
        description: "Your tax information has been recorded."
      });

      onNext();
    } catch (error: any) {
      console.error('Error submitting W-9:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit W-9 form. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <CardTitle>IRS Form W-9</CardTitle>
          </div>
          <CardDescription>
            Required for tax reporting. As an independent contractor, we need your W-9 information to issue your 1099-NEC at year-end.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              Your information is encrypted and securely stored. We already have your SSN from the background check.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Tax Classification</Label>
              <RadioGroup value={taxClassification} onValueChange={setTaxClassification} className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="font-normal cursor-pointer">
                    Individual/Sole Proprietor (Most common)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="llc" id="llc" />
                  <Label htmlFor="llc" className="font-normal cursor-pointer">
                    Limited Liability Company (LLC)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="corporation" id="corporation" />
                  <Label htmlFor="corporation" className="font-normal cursor-pointer">
                    Corporation
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="partnership" id="partnership" />
                  <Label htmlFor="partnership" className="font-normal cursor-pointer">
                    Partnership
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {taxClassification !== 'individual' && (
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Enter your business legal name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ssnConfirmed}
                  onChange={(e) => setSsnConfirmed(e.target.checked)}
                  className="rounded"
                />
                <span>I confirm my Social Security Number is on file and correct</span>
              </Label>
              <p className="text-sm text-muted-foreground ml-6">
                (Collected during your background check application)
              </p>
            </div>

            <div>
              <Label htmlFor="signature">Digital Signature</Label>
              <Input
                id="signature"
                placeholder="Type your full legal name"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                By typing your name, you certify that the information provided is true, correct, and complete.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Under penalties of perjury</strong>, I certify that:
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  <li>The number shown on this form is my correct taxpayer identification number</li>
                  <li>I am not subject to backup withholding</li>
                  <li>I am a U.S. citizen or other U.S. person</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" disabled>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !ssnConfirmed || !signature}>
          {loading ? 'Submitting...' : 'Submit W-9 & Continue'}
        </Button>
      </div>
    </div>
  );
};
