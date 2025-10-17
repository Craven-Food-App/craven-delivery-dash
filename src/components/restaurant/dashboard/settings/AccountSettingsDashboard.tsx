import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";

const AccountSettingsDashboard = () => {
  return (
    <div className="space-y-6 pb-8">
      {/* Permission Alert */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">
                You do not have permission to access the daily payout currently.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto">
              ×
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Menu Settings */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Menu settings</h2>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Use auto-generated menu descriptions</h3>
                <p className="text-sm text-muted-foreground">
                  Add AI-powered descriptions to items that don't already have them across all of your stores.{" "}
                  <a href="#" className="text-primary underline">Learn more</a>
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="pt-6 border-t">
              <h3 className="font-semibold mb-2">Alcohol sales</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sell alcohol on Crave'N in compliance with local laws and regulations. To get started, confirm that alcohol delivery is allowed in your state.{" "}
                <a href="#" className="text-primary underline">Learn more</a>
              </p>
              <Button variant="destructive">Add</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tablet Settings */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-6">Tablet Settings</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Login information</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Username:</p>
                  <p className="font-mono">15672251495itg</p>
                </div>
                <Button variant="outline">Reset password</Button>
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="font-semibold mb-2">Pause store PIN</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create and manage your PIN to pause your store on the Crave'N Tablet.
              </p>
              <p className="text-sm text-red-600">You haven't created a PIN yet.</p>
            </div>

            <div className="pt-6 border-t">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Chat feature</h3>
                  <p className="text-sm text-muted-foreground">
                    Add chat functionality to contact customers directly through the Crave'N Tablet.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pickup Instructions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Craver pickup instructions</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Provide Cravers with instructions to help them navigate your store and improve the order delivery experience.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Default instructions</h3>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Add pickup instructions to help Cravers navigate your store when picking up orders. This will ultimately improve your customer's delivery experience.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Dynamic instructions</h3>
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  You must add default instructions first to add dynamic instructions.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Pickup Instructions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold mb-2">Customer pickup instructions</h2>
              <p className="text-sm text-muted-foreground">
                You haven't provided any customer pickup instructions. Adding them can help customers pick up orders faster.
              </p>
            </div>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSettingsDashboard;
