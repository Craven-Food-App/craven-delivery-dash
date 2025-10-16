import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationData, ApplicationFiles } from "@/types/application";
import { CheckCircle, Edit, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validatePassword } from "@/utils/applicationValidation";

interface ReviewStepProps {
  data: ApplicationData;
  files: ApplicationFiles;
  existingUser: any;
  onBack: () => void;
  onEdit: (step: number) => void;
  onSubmit: (password: string) => Promise<void>;
}

export const ReviewStep = ({ data, files, existingUser, onBack, onEdit, onSubmit }: ReviewStepProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const passwordValidation = validatePassword(password, confirmPassword);

  const handleSubmit = async () => {
    if (!existingUser && !passwordValidation.isValid) {
      setError(passwordValidation.errors.join(', '));
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      await onSubmit(password);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const InfoSection = ({ title, step, items }: { title: string; step: number; items: { label: string; value: string }[] }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => onEdit(step)}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}:</span>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Submit</h2>
        <p className="text-muted-foreground">Please review your information before submitting</p>
      </div>

      {existingUser ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            You're already signed in as {existingUser.email}. Your application will be linked to this account.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Create a password for your new account. You'll use this to sign in after your application is approved.
          </AlertDescription>
        </Alert>
      )}

      <InfoSection
        title="Personal Information"
        step={1}
        items={[
          { label: "Name", value: `${data.firstName} ${data.lastName}` },
          { label: "Email", value: data.email },
          { label: "Phone", value: data.phone },
          { label: "Date of Birth", value: data.dateOfBirth },
        ]}
      />

      <InfoSection
        title="Address"
        step={2}
        items={[
          { label: "Street", value: data.streetAddress },
          { label: "City", value: data.city },
          { label: "State", value: data.state },
          { label: "ZIP", value: data.zipCode },
        ]}
      />

      <InfoSection
        title="Vehicle & License"
        step={3}
        items={[
          { label: "Vehicle Type", value: data.vehicleType },
          ...(data.vehicleType !== 'walking' ? [
            { label: "Vehicle", value: `${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}` },
            { label: "Color", value: data.vehicleColor },
            { label: "Plate", value: data.licensePlate },
          ] : []),
          { label: "License #", value: data.licenseNumber },
          { label: "License State", value: data.licenseState },
          { label: "Expires", value: data.licenseExpiry },
        ]}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(files).map(([key, file]) => file && (
            <div key={key} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{file.name}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {!existingUser && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-destructive">Passwords do not match</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="w-full" size="lg">
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || (!existingUser && !passwordValidation.isValid)} 
          className="w-full" 
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Application'
          )}
        </Button>
      </div>
    </div>
  );
};
