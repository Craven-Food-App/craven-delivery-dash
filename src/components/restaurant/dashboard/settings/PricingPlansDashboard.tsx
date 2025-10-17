import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, HelpCircle } from "lucide-react";

const PricingPlansDashboard = () => {
  return (
    <div className="space-y-6 pb-8">
      {/* Description */}
      <p className="text-muted-foreground">
        View your plan and compare it with our other pricing plans.
      </p>

      <Tabs defaultValue="your-plan" className="w-full">
        <TabsList className="bg-muted">
          <TabsTrigger value="your-plan">Your plan</TabsTrigger>
          <TabsTrigger value="all-plans">All plans</TabsTrigger>
        </TabsList>

        <TabsContent value="your-plan" className="space-y-6 mt-6">
          {/* Contact Support Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Contact support to change plans</h3>
                    <p className="text-sm text-muted-foreground">
                      Please contact our support team who will be happy to help you change plans.
                    </p>
                  </div>
                </div>
                <Button variant="outline">Contact support</Button>
              </div>
            </CardContent>
          </Card>

          {/* Your Plan Details */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-6">Your plan</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium">Delivery commission rate</span>
                  <span className="text-lg font-semibold">0%</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium">Pickup commission rate</span>
                  <span className="text-lg font-semibold">0%</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Reach high-value customers with</span>
                    <span className="text-orange-600 font-semibold">CraveMore</span>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-lg font-semibold">Yes</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Get 20 orders/month or you pay no commission for your first 6 months</span>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-lg font-semibold">No</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Questions about your commission rates?{" "}
                  <a href="#" className="text-primary underline">Learn more</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-plans" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Compare all available plans and find the best fit for your business.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PricingPlansDashboard;
