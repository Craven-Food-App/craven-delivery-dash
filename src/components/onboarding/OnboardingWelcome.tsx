import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, DollarSign, Clock, Shield } from "lucide-react";

interface OnboardingWelcomeProps {
  onNext: () => void;
  progress?: any;
}

export const OnboardingWelcome = ({ onNext }: OnboardingWelcomeProps) => {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-4">
          <Truck className="h-10 w-10 text-white" />
        </div>
        <CardTitle className="text-3xl">Welcome to Crave'N!</CardTitle>
        <CardDescription className="text-lg">
          You're approved! Let's get you ready to start earning.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400 mt-1" />
            <div>
              <h3 className="font-semibold">Earn on Your Schedule</h3>
              <p className="text-sm text-muted-foreground">
                Work when you want. Average $15-25/hour during peak times.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400 mt-1" />
            <div>
              <h3 className="font-semibold">Fast Daily Payouts</h3>
              <p className="text-sm text-muted-foreground">
                Get paid daily with instant cashout options available.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400 mt-1" />
            <div>
              <h3 className="font-semibold">Safety First</h3>
              <p className="text-sm text-muted-foreground">
                Your safety is our priority. We provide 24/7 support.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <Truck className="h-6 w-6 text-orange-600 dark:text-orange-400 mt-1" />
            <div>
              <h3 className="font-semibold">Easy to Use App</h3>
              <p className="text-sm text-muted-foreground">
                Simple navigation, GPS routing, and real-time updates.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
          <h3 className="font-semibold text-lg mb-2">What to Expect</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Watch a short orientation video (5 minutes)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Pass a quick safety quiz
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Set up your payment method
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Complete a practice delivery walkthrough
            </li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            This should take about 10-15 minutes total
          </p>
        </div>

        <Button onClick={onNext} size="lg" className="w-full">
          Let's Get Started
        </Button>
      </CardContent>
    </Card>
  );
};
