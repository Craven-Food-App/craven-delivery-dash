import { useState } from "react";
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
import { WaitlistSuccessModal } from "./WaitlistSuccessModal";

interface DriverApplicationWizardProps {
  onClose: () => void;
}

const STEPS = [
  { number: 1, title: "Account Setup", component: AccountSetupStep },
  { number: 2, title: "Address", component: AddressStep },
  { number: 3, title: "Vehicle & License", component: VehicleStep },
  { number: 4, title: "Payment & Tax Info", component: BankingStep },
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
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistData, setWaitlistData] = useState<{
    position: number;
    city: string;
    state: string;
  } | null>(null);

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

      // Step 3: Submit application (goes to waitlist now)
      const application = await ApplicationService.submitApplication(userId!, data, documentPaths);

      // Step 4: Show waitlist success modal
      setWaitlistData({
        position: 1, // TODO: Implement proper waitlist position calculation
        city: data.city,
        state: data.state,
      });
      setShowWaitlistModal(true);

      // Clear draft on success
      clearDraft();

      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted to the waitlist.",
      });
    } catch (error) {
      console.error("Failed to submit application:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    const commonProps = {
      data,
      files,
      onUpdate: updateData,
      onFileUpload: updateFile,
      onNext: nextStep,
      onBack: prevStep,
      isValid: currentValidation.isValid,
      errors: currentValidation.errors,
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

    const StepComponent = STEPS.find(step => step.number === currentStep)?.component;
    if (!StepComponent) return null;
    return <StepComponent {...commonProps} />;
  };

  return (
    <>
      <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
        {/* Header */}
        <div className="bg-primary text-primary-foreground py-4">
          <div className="w-full max-w-4xl mx-auto px-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">Crave'N Driver Application</h1>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
        
        <div className="w-full max-w-4xl mx-auto p-4 pb-8">
          <Card className="w-full relative">

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
      </div>
    
      {/* Waitlist Success Modal (appears on top of wizard) */}
      {showWaitlistModal && waitlistData && (
        <WaitlistSuccessModal
          firstName={data.firstName}
          city={waitlistData.city}
          state={waitlistData.state}
          waitlistPosition={waitlistData.position}
          onClose={() => {
            setShowWaitlistModal(false);
            onClose(); // Close wizard too
          }}
        />
      )}
    </>
  );
};
