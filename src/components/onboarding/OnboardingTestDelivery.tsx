import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Camera, CheckCircle } from "lucide-react";

interface OnboardingTestDeliveryProps {
  onNext: () => void;
  progress?: any;
}

export const OnboardingTestDelivery = ({ onNext }: OnboardingTestDeliveryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          Practice Delivery Walkthrough
        </CardTitle>
        <CardDescription>
          Let's walk through what a typical delivery looks like
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="relative pl-8 pb-8 border-l-2 border-primary/30">
            <div className="absolute left-0 top-0 -translate-x-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              1
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Accept Order</h4>
              <p className="text-sm text-muted-foreground">
                When online, you'll see delivery requests nearby. Review the order details, distance, and payout before accepting.
              </p>
            </div>
          </div>

          <div className="relative pl-8 pb-8 border-l-2 border-primary/30">
            <div className="absolute left-0 top-0 -translate-x-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              2
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Navigate to Restaurant</h4>
              <p className="text-sm text-muted-foreground">
                Tap "Navigate" to use GPS directions to the restaurant. Park safely and head inside.
              </p>
            </div>
          </div>

          <div className="relative pl-8 pb-8 border-l-2 border-primary/30">
            <div className="absolute left-0 top-0 -translate-x-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              3
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                Pick Up Order <Camera className="h-4 w-4" />
              </h4>
              <p className="text-sm text-muted-foreground">
                Show the order number to the restaurant staff. Verify all items are included, then mark "Picked Up" in the app.
              </p>
            </div>
          </div>

          <div className="relative pl-8 pb-8 border-l-2 border-primary/30">
            <div className="absolute left-0 top-0 -translate-x-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              4
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Deliver to Customer</h4>
              <p className="text-sm text-muted-foreground">
                Follow GPS to the delivery address. Handle the food carefully and follow any special delivery instructions.
              </p>
            </div>
          </div>

          <div className="relative pl-8">
            <div className="absolute left-0 top-0 -translate-x-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                Complete Delivery <Camera className="h-4 w-4" />
              </h4>
              <p className="text-sm text-muted-foreground">
                Take a photo of the delivered order (for contactless), mark as delivered, and you're done! Your earnings are updated immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
          <h4 className="font-semibold mb-2">💡 Pro Tips</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-orange-600 dark:text-orange-400">•</span>
              <span>Keep the food in insulated bags to maintain temperature</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 dark:text-orange-400">•</span>
              <span>Communicate with customers if there are any issues</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 dark:text-orange-400">•</span>
              <span>Always double-check the address before marking delivered</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 dark:text-orange-400">•</span>
              <span>Peak times (lunch & dinner) typically have more orders</span>
            </li>
          </ul>
        </div>

        <Button onClick={onNext} size="lg" className="w-full">
          I'm Ready to Start Delivering!
        </Button>
      </CardContent>
    </Card>
  );
};
