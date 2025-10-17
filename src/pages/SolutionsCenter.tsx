import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Megaphone, Gift, TrendingUp, Wine, Percent, DollarSign, Instagram, Store, ShoppingBag, Package, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SolutionsCenter = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold mb-2">Solutions center</h1>
          <p className="text-muted-foreground">
            Power your growth with these tools and offers from Crave'N today's most powerful apps
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        
        {/* DoorDash Top Picks */}
        <section>
          <h2 className="text-2xl font-bold mb-6">DoorDash Top Picks</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center">
                <Wine className="w-16 h-16 text-white" />
              </div>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Alcohol</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add alcohol to your menu to drive more sales and reach new customers. <a href="#" className="text-primary underline">Learn More</a>
                </p>
                <Button variant="outline" className="w-full">Add Product</Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white">
              <div className="h-32 flex items-center justify-center">
                <Megaphone className="w-16 h-16" />
              </div>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Advertise to Customers</h3>
                <p className="text-sm mb-4 opacity-90">
                  Stand out and attract new customers on Crave'N. You can add any ads ads with one of the profiles <a href="#" className="underline">see more info</a>
                </p>
                <Button variant="secondary" className="w-full">Create a Campaign</Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden bg-gradient-to-br from-purple-200 to-purple-300">
              <div className="h-32 flex items-center justify-center">
                <Gift className="w-16 h-16 text-purple-700" />
              </div>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Discount for New Customers</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Bring new customers with a discount for their first order. You can add any ads ads with one of the profiles
                </p>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Create a Campaign</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Attract New Customers */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Attract New Customers</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Acquire customers by getting new customers
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <Megaphone className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-bold mb-2">Advertise to Customers</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Promote your store in the Crave'N app. Sponsored listings put you in front of new customers. 
                  <a href="#" className="text-primary underline ml-1">See campaign types</a>
                </p>
                <Button variant="outline" className="w-full">Create a Campaign</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <Gift className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-bold mb-2">Discount for New Customers</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Encourage first-time customers to try your restaurant by offering a discount on their first order.
                </p>
                <Button variant="outline" className="w-full">Create a Campaign</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-bold mb-2">First Order: $0 delivery fee</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Give first-time customers free delivery on their first order from your store.
                </p>
                <Button variant="outline" className="w-full">Create a Campaign</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Build Repeat Business */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Build Repeat Business</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Add features that encourage customers to come back
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold mb-2">Discount for Lapsed Customers</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Win back customers who haven't ordered in a while with a special discount.
                </p>
                <Button variant="outline" className="w-full">Create a Campaign</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Increase Order Volume & Size */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Increase Order Volume & Size</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Get larger orders and ordering more often
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <Wine className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold mb-2">Alcohol</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add alcoholic beverages to your menu. Alcohol can increase average order values and attract more customers. <a href="#" className="text-primary underline">Learn More</a>
                </p>
                <Button variant="outline" className="w-full">Add Product</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <Percent className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold mb-2">Discount for All Customers</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Increase order frequency by offering discounts to your existing customers for their next purchase.
                </p>
                <Button variant="outline" className="w-full">Create a Campaign</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold mb-2">First item or Discounted Items</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drive larger order sizes with discounts on specific menu items or bundles.
                </p>
                <Button variant="outline" className="w-full">Create a Campaign</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Grow Online */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Grow Online</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Drive orders from your own digital ordering
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Instagram className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold mb-2">Instagram</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Let customers order directly from your Instagram profile. <a href="#" className="text-primary underline">Learn More</a>
                </p>
                <Button variant="outline" className="w-full">Purchase product</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Store className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold mb-2">Storefront</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a branded storefront for commission-free online ordering from your own website. <a href="#" className="text-primary underline">Learn More</a>
                </p>
                <Button variant="outline" className="w-full">Purchase product</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold mb-2">DashPass</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  DashPass subscribers ordering on Crave'N have higher order frequency. <a href="#" className="text-primary underline">Learn More</a>
                </p>
                <Button variant="outline" className="w-full">Purchase product</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pickup */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Pickup</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Offer pickup for delivery-free, commission-free ordering
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold mb-2">Pickup</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enable customers to order ahead for pickup. Great for customers who want to skip delivery fees. <a href="#" className="text-primary underline">Learn More</a>
                </p>
                <Button variant="outline" className="w-full">Purchase product</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Other Ways To Grow */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Other Ways To Grow</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Explore additional tools from Crave'N to reach customers
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="font-bold mb-2">Drive On-Demand</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Use Dashers to fulfill your own orders from phone, online, or third-party apps. <a href="#" className="text-primary underline">Learn More</a>
                </p>
                <Button variant="outline" className="w-full">Add Channel</Button>
              </CardContent>
            </Card>
          </div>
        </section>

      </div>
    </div>
  );
};

export default SolutionsCenter;
