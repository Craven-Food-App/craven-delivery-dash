// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Store, Menu, Settings, BarChart } from "lucide-react";
import Header from "@/components/Header";
import { MenuManagement } from "@/components/restaurant/MenuManagement";
import { RestaurantSettings } from "@/components/restaurant/RestaurantSettings";
import MenuImportTool from "@/components/restaurant/MenuImportTool";
import RestaurantHours from "@/components/restaurant/RestaurantHours";
import { NewOrderAlert } from "@/components/restaurant/NewOrderAlert";
import { RestaurantCustomerOrderManagement } from "@/components/restaurant/RestaurantCustomerOrderManagement";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  delivery_fee_cents: number;
  min_delivery_time: number;
  max_delivery_time: number;
  is_active: boolean;
  is_promoted: boolean;
  rating: number;
  total_reviews: number;
  image_url: string;
  created_at: string;
}

const RestaurantDashboard = () => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No restaurant found
      toast({
        title: "No restaurant found",
        description: "You haven't registered a restaurant yet. Let's get started!",
      });
          navigate("/restaurant/register");
          return;
        }
        throw error;
      }

      setRestaurant(data);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      toast({
        title: "Error loading restaurant",
        description: "There was a problem loading your restaurant information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async () => {
    if (!restaurant) return;

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ is_active: !restaurant.is_active })
        .eq("id", restaurant.id);

      if (error) throw error;

      setRestaurant({ ...restaurant, is_active: !restaurant.is_active });
      toast({
        title: restaurant.is_active ? "Restaurant deactivated" : "Restaurant activated",
        description: restaurant.is_active 
          ? "Your restaurant is now offline and won't accept orders."
          : "Your restaurant is now online and accepting orders!"
      });
    } catch (error) {
      console.error("Error updating restaurant status:", error);
      toast({
        title: "Error updating status",
        description: "There was a problem updating your restaurant status.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading your restaurant dashboard...</div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No Restaurant Found</h1>
            <p className="text-muted-foreground mb-6">You haven't registered a restaurant yet.</p>
            <Button onClick={() => navigate("/restaurant/register")}>
              Register Your Restaurant
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Restaurant Dashboard</h1>
              <p className="text-muted-foreground">Manage your restaurant and orders</p>
            </div>
            <NewOrderAlert restaurantId={restaurant.id} />
          </div>
          <div className="flex gap-2">
            <Badge variant={restaurant.is_active ? "default" : "secondary"}>
              {restaurant.is_active ? "Active" : "Inactive"}
            </Badge>
            {restaurant.is_promoted && <Badge variant="outline">Promoted</Badge>}
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {restaurant.is_active ? "Online" : "Offline"}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={toggleActiveStatus}
                  >
                    {restaurant.is_active ? "Go Offline" : "Go Online"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rating</CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{restaurant.rating.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    {restaurant.total_reviews} reviews
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Delivery Fee</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(restaurant.delivery_fee_cents / 100).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {restaurant.min_delivery_time}-{restaurant.max_delivery_time} min
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cuisine</CardTitle>
                  <Menu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{restaurant.cuisine_type}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
                <CardDescription>Your restaurant details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">{restaurant.name}</h3>
                    <p className="text-sm text-muted-foreground">{restaurant.description}</p>
                  </div>
                  <div>
                    <p className="text-sm"><strong>Phone:</strong> {restaurant.phone}</p>
                    <p className="text-sm"><strong>Email:</strong> {restaurant.email}</p>
                    <p className="text-sm">
                      <strong>Address:</strong> {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip_code}
                    </p>
                  </div>
                </div>
                {restaurant.image_url && (
                  <div className="mt-4">
                    <img 
                      src={restaurant.image_url} 
                      alt={restaurant.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="space-y-4">
            <MenuImportTool restaurantId={restaurant.id} onItemsImported={fetchRestaurant} />
            <MenuManagement restaurantId={restaurant.id} />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <RestaurantCustomerOrderManagement restaurantId={restaurant.id} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <RestaurantHours restaurantId={restaurant.id} />
            <RestaurantSettings restaurant={restaurant} onUpdate={fetchRestaurant} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RestaurantDashboard;