import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { OnboardingWelcome } from "./OnboardingWelcome";
import { OnboardingVideo } from "./OnboardingVideo";
import { OnboardingSafetyQuiz } from "./OnboardingSafetyQuiz";
import { OnboardingW9Step } from "./OnboardingW9Step";
import { OnboardingPaymentSetup } from "./OnboardingPaymentSetup";
import { OnboardingTestDelivery } from "./OnboardingTestDelivery";
import { OnboardingComplete } from "./OnboardingComplete";

interface OnboardingProgress {
  user_id: string;
  current_step: string;
  profile_creation_completed: boolean;
  orientation_video_watched: boolean;
  safety_quiz_passed: boolean;
  w9_completed: boolean;
  payment_method_added: boolean;
  onboarding_completed_at: string | null;
}

const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Welcome', component: OnboardingWelcome },
  { id: 'video', title: 'Orientation', component: OnboardingVideo },
  { id: 'safety', title: 'Safety Quiz', component: OnboardingSafetyQuiz },
  { id: 'w9', title: 'Tax Form', component: OnboardingW9Step },
  { id: 'payment', title: 'Payment Setup', component: OnboardingPaymentSetup },
  { id: 'test', title: 'Test Delivery', component: OnboardingTestDelivery },
  { id: 'complete', title: 'Complete', component: OnboardingComplete },
];

export const DriverOnboardingWizard = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('driver_onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProgress(data);
        // Determine current step based on progress
        if (!data.orientation_video_watched) {
          setCurrentStepIndex(1);
        } else if (!data.safety_quiz_passed) {
          setCurrentStepIndex(2);
        } else if (!data.w9_completed) {
          setCurrentStepIndex(3);
        } else if (!data.payment_method_added) {
          setCurrentStepIndex(4);
        } else if (!data.onboarding_completed_at) {
          setCurrentStepIndex(5);
        } else {
          setCurrentStepIndex(6);
        }
      }
    } catch (error: any) {
      console.error('Error loading progress:', error);
      toast({
        title: "Error",
        description: "Failed to load onboarding progress",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (updates: Partial<OnboardingProgress>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('driver_onboarding_progress')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      await loadProgress();
    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const handleNext = async () => {
    const currentStep = ONBOARDING_STEPS[currentStepIndex];
    
    // Update progress based on current step
    switch (currentStep.id) {
      case 'video':
        await updateProgress({ orientation_video_watched: true });
        break;
      case 'safety':
        await updateProgress({ safety_quiz_passed: true });
        break;
      case 'w9':
        await updateProgress({ w9_completed: true });
        break;
      case 'payment':
        await updateProgress({ payment_method_added: true });
        break;
      case 'test':
        await updateProgress({ onboarding_completed_at: new Date().toISOString() });
        break;
    }

    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const progressPercentage = ((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const CurrentStepComponent = ONBOARDING_STEPS[currentStepIndex].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-2xl">Driver Onboarding</CardTitle>
                <CardDescription>
                  Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </CardHeader>
        </Card>

        {/* Steps Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
          {ONBOARDING_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 p-3 rounded-lg border ${
                index === currentStepIndex
                  ? 'bg-primary/10 border-primary'
                  : index < currentStepIndex
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                  : 'bg-card border-border'
              }`}
            >
              {index < currentStepIndex ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <Circle className={`h-5 w-5 flex-shrink-0 ${
                  index === currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                }`} />
              )}
              <span className={`text-xs font-medium truncate ${
                index === currentStepIndex ? 'text-primary' : 'text-foreground'
              }`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <CurrentStepComponent onNext={handleNext} progress={progress} />
      </div>
    </div>
  );
};
