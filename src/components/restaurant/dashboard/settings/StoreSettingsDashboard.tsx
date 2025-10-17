import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Instagram, Image, Video } from "lucide-react";

const StoreSettingsDashboard = () => {
  return (
    <div className="space-y-6 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Store Details */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-6">Store details</h2>
              
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold mb-1">Store name</h3>
                    <p>InveroInc</p>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>

                <div className="flex justify-between items-start pt-4 border-t">
                  <div>
                    <h3 className="font-semibold mb-1">Address</h3>
                    <p className="text-sm">6759 Nebraska Ave, Toledo, OH 43615, USA</p>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>

                <div className="flex justify-between items-start pt-4 border-t">
                  <div>
                    <h3 className="font-semibold mb-1">Phone number</h3>
                    <p className="text-sm">5672251495</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This phone number is used to send or confirm orders and verify your store is open
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>

                <div className="flex justify-between items-start pt-4 border-t">
                  <div>
                    <h3 className="font-semibold mb-1">Website</h3>
                    <p className="text-sm text-muted-foreground">Add your website to your Crave'N store page</p>
                  </div>
                  <Button variant="destructive" size="sm">Add</Button>
                </div>

                <div className="flex justify-between items-start pt-4 border-t">
                  <div>
                    <h3 className="font-semibold mb-1">Description</h3>
                    <p className="text-sm text-muted-foreground">
                      Write a short description of your store for customers to read on your Crave'N store page
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">Add</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brand Assets */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2">Brand assets</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Showcase your brand on Crave'N by adding photos and videos.{" "}
                <a href="#" className="text-primary underline">View media guidelines</a>
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                These assets will be applied to all of your stores.
              </p>

              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <Image className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-1">Header photo</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add a photo to make sure your store shows up in search and categories.
                  </p>
                  <Button>Add photo</Button>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <Image className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-1">Logo</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add a logo to make sure your store shows up in search and categories.
                  </p>
                  <Button>Add logo</Button>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <Video className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-1">Header video</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Elevate your store with a header video to attract new customers and highlight your menu. This will only appear in the app.
                  </p>
                  <Button>Add video</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instagram Account */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2">Instagram account</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Connect your Instagram account to feature content directly on Crave'N.
              </p>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Instagram className="w-6 h-6 text-pink-600" />
                  <div>
                    <h3 className="font-semibold">Connect account</h3>
                    <p className="text-sm text-muted-foreground">Log in to connect your account to Crave'N.</p>
                  </div>
                </div>
                <Button variant="destructive">Connect</Button>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                By tapping "Connect", Merchant agrees to the terms of the Merchant Media Addendum ("MMA") and (1) directs Crave'N to (a) use text and images from identified accounts (2) grants Crave'N a license per the MMA to all Merchant Media from such accounts and (4) represents that Merchant owns Merchant Media or otherwise has all necessary rights in and to the Merchant Media to grant such a license to Crave'N.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - 1/3 width */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Your store preview</h3>
              <p className="text-xs text-muted-foreground mb-4">
                For illustrative purposes only.{" "}
                <a href="#" className="text-primary underline">View on Crave'N</a> to highlight your brand.
              </p>

              <div className="bg-muted rounded-lg overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Add a header photo and video to attract new customers
                  </p>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 rounded-lg bg-gray-300 flex items-center justify-center">
                      <span className="text-xs">Logo</span>
                    </div>
                    <h4 className="font-semibold text-lg">InveroInc</h4>
                  </div>

                  <div className="space-y-2">
                    <div className="h-20 bg-gray-200 rounded" />
                    <div className="h-20 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StoreSettingsDashboard;
