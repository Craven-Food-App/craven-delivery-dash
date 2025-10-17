import { X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useApplicationState } from "@/hooks/useApplicationState";
import { validateStep } from "@/utils/applicationValidation";
import { ApplicationService } from "@/services/applicationService";
import { useToast } from "@/hooks/use-toast";
import { AccountSetupStep } from "./application/AccountSetupStep";
import { AddressStep } from "./application/AddressStep";
import { VehicleStep } from "./application/VehicleStep";
import { BankingStep } from "./application/BankingStep";
import { DocumentsStep } from "./application/DocumentsStep";
import { ReviewStep } from "./application/ReviewStep";

interface DriverApplicationWizardProps {
  onClose: () => void;
}

const STEPS = [
  { number: 1, title: "Account Setup", component: AccountSetupStep },
  { number: 2, title: "Address", component: AddressStep },
  { number: 3, title: "Vehicle & License", component: VehicleStep },
  { number: 4, title: "Background Check", component: BankingStep },
  { number: 5, title: "Documents", component: DocumentsStep },
  { number: 6, title: "Review", component: null }, // Special case
];

export const DriverApplicationWizard = ({ onClose }: DriverApplicationWizardProps) => {
  const {
    data,
    files,
    currentStep,
    existingUser,
    isLoading,
    updateData,
    updateFile,
    nextStep,
    prevStep,
    goToStep,
    clearDraft,
  } = useApplicationState();

  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <p className="text-muted-foreground">Loading your application...</p>
        </Card>
      </div>
    );
  }

  const currentValidation = validateStep(currentStep, data, files);
  const progress = (currentStep / STEPS.length) * 100;

  const handleSubmit = async (password: string) => {
    try {
      // Step 1: Authenticate user (or use existing session)
      let userId = existingUser?.id;
      let isNewUser = false;

      if (!existingUser) {
        const { user, isNewUser: newUser } = await ApplicationService.authenticateUser(
          data.email,
          password,
          `${data.firstName} ${data.lastName}`,
          data.phone
        );
        userId = user.id;
        isNewUser = newUser;
      }

      // Step 2: Upload documents
      const documentPaths: Record<string, string> = {};
      const uploadPromises = Object.entries(files).map(async ([key, file]) => {
        if (file) {
          try {
            const path = await ApplicationService.uploadDocument(userId!, key, file);
            documentPaths[key] = path;
          } catch (error) {
            console.error(`Failed to upload ${key}:`, error);
          }
        }
      });
      await Promise.all(uploadPromises);

      // Step 3: Submit application
      await ApplicationService.submitApplication(userId!, data, documentPaths);

      // Step 4: Send welcome email (non-blocking)
      if (isNewUser) {
        const { supabase } = await import('@/integrations/supabase/client');
        supabase.functions.invoke('send-driver-welcome-email', {
          body: {
            driverName: `${data.firstName} ${data.lastName}`,
            driverEmail: data.email
          }
        }).catch(err => console.error('Failed to send driver welcome email:', err));
      }

      // Clear draft and show success
      clearDraft();
      
      toast({
        title: "Application Submitted!",
        description: isNewUser
          ? "Check your email to verify your account. We'll review your application within 3-5 business days."
          : "We'll review your application and notify you within 3-5 business days.",
      });

      onClose();
    } catch (error: any) {
      throw error;
    }
  };

  const renderStep = () => {
    const stepConfig = STEPS[currentStep - 1];
    const StepComponent = stepConfig.component;

    const commonProps = {
      data,
      files,
      onUpdate: updateData,
      onFileUpload: updateFile,
      onNext: nextStep,
      onBack: prevStep,
      isValid: currentValidation.isValid,
    };

    if (currentStep === 6) {
      return (
        <ReviewStep
          data={data}
          files={files}
          existingUser={existingUser}
          onBack={prevStep}
          onEdit={goToStep}
          onSubmit={handleSubmit}
        />
      );
    }

    if (!StepComponent) return null;
    return <StepComponent {...commonProps} />;
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8 relative">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Progress header */}
        <div className="p-6 border-b">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-primary">Feeder Application</h1>
            <p className="text-sm text-muted-foreground">Step {currentStep} of {STEPS.length}</p>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-all duration-200
                    ${step.number < currentStep
                      ? 'bg-green-500 text-white'
                      : step.number === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {step.number < currentStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className="text-xs text-center hidden sm:block">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="p-6">
          {renderStep()}
        </div>
      </Card>
    </div>
  );
};
