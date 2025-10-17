import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus, Info } from "lucide-react";

const StoreAvailabilityDashboard = () => {
  return (
    <div className="w-full h-full bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Store availability</h1>

        {/* Store Status and Ordering Channel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Store Status */}
          <Card>
            <CardHeader>
              <CardTitle>Store status</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="inactive">
                <div className="flex items-center space-x-2 mb-4">
                  <RadioGroupItem value="inactive" id="inactive" />
                  <Label htmlFor="inactive" className="font-semibold">Inactive</Label>
                </div>
              </RadioGroup>
              <p className="text-sm text-muted-foreground mb-4">
                This store is unavailable on CraveDash. View the status of your ordering channels to determine how you can begin accepting orders.
              </p>
              <button className="text-sm text-primary hover:underline">
                View status history
              </button>
            </CardContent>
          </Card>

          {/* Ordering Channel */}
          <Card>
            <CardHeader>
              <CardTitle>Ordering channel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold mb-1">
                    Marketplace{" "}
                    <button className="text-sm text-primary hover:underline font-normal">
                      View store page
                    </button>
                  </h3>
                  <p className="text-sm text-orange-600">
                    This store is permanently inactive or has been inactive for a long period of time.
                  </p>
                </div>
                <RadioGroup defaultValue="inactive">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inactive" id="marketplace-inactive" />
                    <Label htmlFor="marketplace-inactive" className="text-sm">Inactive</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Busy Mode */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Schedule busy mode</CardTitle>
            <CardDescription>
              Choose when to add extra prep time during the week. You can adjust your schedule anytime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              {/* Table Header */}
              <div className="grid grid-cols-3 gap-4 p-4 border-b bg-muted/30">
                <div className="text-sm font-medium">Day</div>
                <div className="text-sm font-medium">Store hours</div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  Additional prep time
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Empty State */}
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-24 h-24 mb-4">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="15" width="60" height="70" rx="4" fill="#BFDBFE" stroke="#3B82F6" strokeWidth="2"/>
                    <rect x="30" y="25" width="15" height="15" fill="#10B981"/>
                    <rect x="50" y="25" width="20" height="15" fill="#EF4444"/>
                    <rect x="30" y="45" width="25" height="15" fill="#8B5CF6"/>
                    <circle cx="70" cy="75" r="15" fill="#F97316"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No schedule yet</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                  Scheduling busy mode can help minimize early Feeder arrivals and reduce wait times at your store.
                </p>
                <Button variant="outline">Schedule busy mode</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regular Menu Hours */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Regular menu hours</CardTitle>
            <CardDescription>
              These are the hours your store is available on Crave'N.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
              <div className="w-20 h-20 mb-4">
                <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="10" width="60" height="80" rx="4" fill="white" stroke="#D1D5DB" strokeWidth="2"/>
                  <line x1="20" y1="25" x2="60" y2="25" stroke="#E5E7EB" strokeWidth="2"/>
                  <line x1="20" y1="35" x2="60" y2="35" stroke="#E5E7EB" strokeWidth="2"/>
                  <line x1="20" y1="45" x2="50" y2="45" stroke="#E5E7EB" strokeWidth="2"/>
                  <line x1="20" y1="55" x2="55" y2="55" stroke="#E5E7EB" strokeWidth="2"/>
                  <line x1="20" y1="65" x2="45" y2="65" stroke="#E5E7EB" strokeWidth="2"/>
                </svg>
              </div>
              <p className="text-sm text-primary">
                There are no menus for your store
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Special Hours and Closures */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Special hours and closures</CardTitle>
                <CardDescription>
                  Add special hours or closures for holidays, special events, or other exceptional events. This will temporarily replace your regular menu hours.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              {/* Table Header */}
              <div className="grid grid-cols-2 gap-4 p-4 border-b bg-muted/30">
                <div className="text-sm font-medium">Name</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Dates</div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-muted rounded">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-muted rounded">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Empty State - No special hours yet */}
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No special hours or closures scheduled
                </p>
              </div>
            </div>

            <Button variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add new
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StoreAvailabilityDashboard;
