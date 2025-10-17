import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Rocket, DollarSign } from "lucide-react";

interface OnboardingCompleteProps {
  onNext?: () => void;
}

export const OnboardingComplete = ({ onNext }: OnboardingCompleteProps) => {
  const navigate = useNavigate();

  const handleStartDriving = () => {
    navigate('/mobile');
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        <CardTitle className="text-3xl">You're All Set!</CardTitle>
        <CardDescription className="text-lg">
          Congratulations! You've completed driver onboarding.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-4">
            <Rocket className="h-6 w-6 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-lg">Ready to Earn!</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            You can now go online and start accepting delivery requests. Your first delivery earns you a bonus!
          </p>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
            <DollarSign className="h-5 w-5" />
            <span>First Delivery Bonus: $10 extra!</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Application Approved</p>
              <p className="text-xs text-muted-foreground">Background check & documents verified</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Training Complete</p>
              <p className="text-xs text-muted-foreground">Orientation video & safety quiz passed</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Payment Method Added</p>
              <p className="text-xs text-muted-foreground">Ready to receive daily payouts</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <h4 className="font-semibold mb-2 text-sm">Quick Start Tips:</h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>• Tap "Go Online" to start receiving delivery requests</li>
            <li>• Keep your phone charged and GPS enabled</li>
            <li>• Work during peak times (lunch & dinner) for more orders</li>
            <li>• Check the app regularly for bonus opportunities</li>
            <li>• Contact support anytime if you need help</li>
          </ul>
        </div>

        <Button onClick={handleStartDriving} size="lg" className="w-full">
          <Rocket className="mr-2 h-5 w-5" />
          Start Driving Now
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Need help? Visit the Help Center or contact driver support
        </p>
      </CardContent>
    </Card>
  );
};
