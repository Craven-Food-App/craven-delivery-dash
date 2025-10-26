import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ApplicationStepProps } from "@/types/application";
import { Upload, CheckCircle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploadFieldProps {
  label: string;
  description: string;
  required: boolean;
  file: File | undefined;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

const FileUploadField = ({ label, description, required, file, onUpload, onRemove }: FileUploadFieldProps) => {
  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      {file ? (
        <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
            className="hidden"
            id={`upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
          />
          <label
            htmlFor={`upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <div className="p-3 bg-primary/10 rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Click to upload</p>
              <p className="text-xs text-muted-foreground">PNG, JPG or PDF (max 10MB)</p>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};

export const DocumentsStep = ({ files, onFileUpload, onNext, onBack, isValid }: ApplicationStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Documents</h2>
        <p className="text-muted-foreground">We need a few documents to verify your identity</p>
      </div>

      <Alert>
        <AlertDescription>
          All documents must be clear, unedited photos or scans. Make sure all text is readable.
        </AlertDescription>
      </Alert>

      <FileUploadField
        label="Driver's License (Front)"
        description="Front side of your driver's license with photo visible"
        required
        file={files.driversLicenseFront}
        onUpload={(file) => onFileUpload('driversLicenseFront', file)}
        onRemove={() => {}}
      />

      <FileUploadField
        label="Driver's License (Back)"
        description="Back side of your driver's license (optional but recommended)"
        required={false}
        file={files.driversLicenseBack}
        onUpload={(file) => onFileUpload('driversLicenseBack', file)}
        onRemove={() => {}}
      />

      <FileUploadField
        label="Insurance Document"
        description="Proof of vehicle insurance (optional, if using a vehicle)"
        required={false}
        file={files.insuranceDocument}
        onUpload={(file) => onFileUpload('insuranceDocument', file)}
        onRemove={() => {}}
      />

      <FileUploadField
        label="Vehicle Registration"
        description="Vehicle registration document (optional, if using a vehicle)"
        required={false}
        file={files.vehicleRegistration}
        onUpload={(file) => onFileUpload('vehicleRegistration', file)}
        onRemove={() => {}}
      />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="w-full" size="lg">
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid} className="w-full" size="lg">
          Continue to Review
        </Button>
      </div>
    </div>
  );
};
