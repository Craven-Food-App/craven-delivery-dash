import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Rocket, GraduationCap, CreditCard, Shield, Smartphone, PartyPopper } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

type OnboardingStep = 'welcome' | 'orientation' | 'payment' | 'safety' | 'tutorial' | 'complete';

const OnboardingWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [progress, setProgress] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videoWatched, setVideoWatched] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'direct_deposit' | 'cashapp'>('direct_deposit');
  const [paymentDetails, setPaymentDetails] = useState({
    routingNumber: '',
    accountNumber: '',
    cashTag: ''
  });
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const steps: OnboardingStep[] = ['welcome', 'orientation', 'payment', 'safety', 'tutorial', 'complete'];
  
  useEffect(() => {
    loadOnboardingProgress();
  }, []);

  useEffect(() => {
    const stepIndex = steps.indexOf(currentStep);
    setProgress((stepIndex / (steps.length - 1)) * 100);
  }, [currentStep]);

  const loadOnboardingProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('driver_onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setOnboardingData(data);
      
      // Resume from saved progress
      if (data.onboarding_completed_at) {
        navigate('/mobile');
        return;
      }
      
      // Set current step based on progress
      if (data.safety_quiz_passed) setCurrentStep('tutorial');
      else if (data.payment_method_added) setCurrentStep('safety');
      else if (data.orientation_video_watched) setCurrentStep('payment');
      else if (data.profile_creation_completed) setCurrentStep('orientation');
      
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (updates: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('driver_onboarding_progress')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNext = async () => {
    const stepIndex = steps.indexOf(currentStep);
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepIndex = steps.indexOf(currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1]);
    }
  };

  const completeOrientation = async () => {
    await updateProgress({
      orientation_video_watched: true,
      safety_quiz_passed: quizScore >= 80,
      current_step: 'orientation_completed'
    });
    handleNext();
  };

  const completePaymentSetup = async () => {
    await updateProgress({
      payment_method_added: true,
      current_step: 'payment_added'
    });
    
    // Save payment method to driver_payment_methods
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('driver_payment_methods').upsert({
        driver_id: user.id,
        payment_type: paymentMethod,
        account_identifier: paymentMethod === 'direct_deposit' 
          ? `****${paymentDetails.accountNumber.slice(-4)}`
          : paymentDetails.cashTag,
        is_primary: true,
        is_verified: false
      });
    } catch (error) {
      console.error('Error saving payment method:', error);
    }
    
    handleNext();
  };

  const completeSafety = async () => {
    if (!safetyAcknowledged) {
      toast({
        title: "Required",
        description: "Please acknowledge the safety guidelines.",
        variant: "destructive",
      });
      return;
    }
    
    await updateProgress({
      current_step: 'safety_completed'
    });
    handleNext();
  };

  const completeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await updateProgress({
        onboarding_completed_at: new Date().toISOString(),
        current_step: 'completed'
      });

      // Update craver_applications
      await supabase
        .from('craver_applications')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('user_id', user.id);

      toast({
        title: "Congratulations! 🎉",
        description: "You're ready to start delivering!",
      });

      // Small delay for celebration
      setTimeout(() => {
        navigate('/mobile');
      }, 1500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-2xl mx-auto p-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {steps.indexOf(currentStep) + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Welcome Step */}
        {currentStep === 'welcome' && (
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <PartyPopper className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl">Welcome to Crave'N!</CardTitle>
              <CardDescription className="text-lg">
                Your application has been approved. Let's get you ready to deliver!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">What to expect:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Quick orientation video (5 minutes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Set up your payment method</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>Review safety guidelines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <span>App tutorial walkthrough</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <p className="font-semibold text-primary mb-1">🎁 First Delivery Bonus</p>
                <p className="text-sm">Earn $20 bonus on your first 5 deliveries!</p>
              </div>

              <Button onClick={handleNext} className="w-full" size="lg">
                Get Started <Rocket className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Orientation Step */}
        {currentStep === 'orientation' && (
          <Card>
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Orientation & Safety Training</CardTitle>
              <CardDescription>Watch this short video to learn the basics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Button onClick={() => setVideoWatched(true)} variant="outline">
                  {videoWatched ? 'Video Completed ✓' : 'Start Video'}
                </Button>
              </div>

              {videoWatched && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Quick Quiz (80% required to pass)</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm mb-2">1. What should you do before picking up food?</p>
                      <RadioGroup>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="verify" id="q1a" />
                          <Label htmlFor="q1a" className="text-sm">Verify order details</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <Button 
                      onClick={() => {
                        setQuizScore(100);
                        completeOrientation();
                      }}
                      disabled={!videoWatched}
                      className="w-full"
                    >
                      Submit Quiz
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Setup Step */}
        {currentStep === 'payment' && (
          <Card>
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Payment Method Setup</CardTitle>
              <CardDescription>Choose how you want to receive your earnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="direct_deposit" id="dd" />
                  <Label htmlFor="dd" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Direct Deposit</p>
                      <p className="text-sm text-muted-foreground">Get paid directly to your bank</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="cashapp" id="ca" />
                  <Label htmlFor="ca" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Cash App</p>
                      <p className="text-sm text-muted-foreground">Instant payouts available</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === 'direct_deposit' && (
                <div className="space-y-4">
                  <div>
                    <Label>Routing Number</Label>
                    <Input
                      type="text"
                      placeholder="000000000"
                      value={paymentDetails.routingNumber}
                      onChange={(e) => setPaymentDetails({...paymentDetails, routingNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input
                      type="text"
                      placeholder="00000000000"
                      value={paymentDetails.accountNumber}
                      onChange={(e) => setPaymentDetails({...paymentDetails, accountNumber: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'cashapp' && (
                <div>
                  <Label>Cash App $Cashtag</Label>
                  <Input
                    type="text"
                    placeholder="$YourCashtag"
                    value={paymentDetails.cashTag}
                    onChange={(e) => setPaymentDetails({...paymentDetails, cashTag: e.target.value})}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleBack} variant="outline" className="flex-1">Back</Button>
                <Button onClick={completePaymentSetup} className="flex-1">Continue</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Safety Step */}
        {currentStep === 'safety' && (
          <Card>
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Safety & Community Guidelines</CardTitle>
              <CardDescription>Your safety and our customers' safety is our top priority</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Key Safety Rules:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Always follow traffic laws</li>
                    <li>• Never deliver while impaired</li>
                    <li>• Use insulated bags for food safety</li>
                    <li>• Contact support for any safety concerns</li>
                    <li>• Verify drop-off locations before leaving</li>
                  </ul>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="safety"
                    checked={safetyAcknowledged}
                    onCheckedChange={(checked) => setSafetyAcknowledged(checked as boolean)}
                  />
                  <label htmlFor="safety" className="text-sm leading-relaxed cursor-pointer">
                    I have read and agree to follow all safety guidelines and community standards.
                    I understand that violations may result in account deactivation.
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleBack} variant="outline" className="flex-1">Back</Button>
                <Button onClick={completeSafety} className="flex-1" disabled={!safetyAcknowledged}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tutorial Step */}
        {currentStep === 'tutorial' && (
          <Card>
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>App Tutorial</CardTitle>
              <CardDescription>Learn how to use the driver app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3">App Basics:</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium">Going Online</p>
                      <p className="text-muted-foreground">Tap "CRAVE NOW" to start accepting orders</p>
                    </div>
                    <div>
                      <p className="font-medium">Accepting Orders</p>
                      <p className="text-muted-foreground">Review details and tap Accept within 30 seconds</p>
                    </div>
                    <div>
                      <p className="font-medium">Navigation</p>
                      <p className="text-muted-foreground">Built-in maps guide you to pickup and dropoff</p>
                    </div>
                    <div>
                      <p className="font-medium">Completing Deliveries</p>
                      <p className="text-muted-foreground">Take a photo at dropoff and confirm completion</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleBack} variant="outline" className="flex-1">Back</Button>
                <Button onClick={handleNext} className="flex-1">Continue</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <Card className="border-2 border-primary">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Rocket className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-3xl">You're All Set!</CardTitle>
              <CardDescription className="text-lg">
                Ready to start earning with Crave'N
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
                <h3 className="font-bold text-xl mb-2">🎁 First Delivery Bonus</h3>
                <p className="text-lg">Earn <span className="font-bold text-primary">$20 extra</span> on your first 5 deliveries!</p>
                <p className="text-sm text-muted-foreground mt-2">Complete them within 30 days to qualify</p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-medium">What's next?</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Tap "Go Online" to start accepting orders</li>
                  <li>• Keep your phone charged and accessible</li>
                  <li>• Drive safely and deliver with care</li>
                  <li>• Contact support anytime for help</li>
                </ul>
              </div>

              <Button onClick={completeOnboarding} className="w-full" size="lg">
                Go to Dashboard <Rocket className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;