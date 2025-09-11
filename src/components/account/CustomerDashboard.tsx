import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Package, MapPin, CreditCard, Clock, Star } from "lucide-react";
import Header from "@/components/Header";
import { AccountSection } from "@/components/account/AccountSection";

interface Order {
  id: string;
  restaurant_id: string;
  order_status: string;
  total_cents: number;
  created_at: string;
  estimated_delivery_time: string;
}

interface Restaurant {
  id: string;
  name: string;
  image_url?: string;
}

const CustomerDashboard = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Record<string, Restaurant>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      // Fetch user's orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch restaurant details for orders
      if (ordersData && ordersData.length > 0) {
        const restaurantIds = [...new Set(ordersData.map(order => order.restaurant_id))];
        const { data: restaurantsData, error: restaurantsError } = await supabase
          .from("restaurants")
          .select("id, name, image_url")
          .in("id", restaurantIds);

        if (restaurantsError) throw restaurantsError;
        
        const restaurantsMap = {};
        restaurantsData?.forEach(restaurant => {
          restaurantsMap[restaurant.id] = restaurant;
        });
        setRestaurants(restaurantsMap);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error loading data",
        description: "There was a problem loading your information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-purple-500';
      case 'picked_up': return 'bg-indigo-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Account</h1>
            <p className="text-muted-foreground">Manage your orders and account settings</p>
          </div>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="active">Active Orders</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order History
                </CardTitle>
                <CardDescription>View all your past orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No orders yet</p>
                    <Button onClick={() => navigate("/")}>
                      Browse Restaurants
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const restaurant = restaurants[order.restaurant_id];
                      return (
                        <div key={order.id} className="border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {restaurant?.image_url && (
                              <img
                                src={restaurant.image_url}
                                alt={restaurant.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <h3 className="font-semibold">
                                {restaurant?.name || 'Unknown Restaurant'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(order.created_at)}
                              </p>
                              <p className="text-sm font-medium">
                                {formatPrice(order.total_cents)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge 
                              variant="secondary" 
                              className={`${getStatusColor(order.order_status)} text-white`}
                            >
                              {getStatusText(order.order_status)}
                            </Badge>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Active Orders
                </CardTitle>
                <CardDescription>Track your current orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.filter(order => !['delivered', 'cancelled'].includes(order.order_status)).length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No active orders</p>
                    <Button onClick={() => navigate("/")}>
                      Order Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders
                      .filter(order => !['delivered', 'cancelled'].includes(order.order_status))
                      .map((order) => {
                        const restaurant = restaurants[order.restaurant_id];
                        return (
                          <div key={order.id} className="border-2 border-primary rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                {restaurant?.image_url && (
                                  <img
                                    src={restaurant.image_url}
                                    alt={restaurant.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                )}
                                <div>
                                  <h3 className="font-semibold">
                                    {restaurant?.name || 'Unknown Restaurant'}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    Order #{order.id.slice(0, 8)}
                                  </p>
                                </div>
                              </div>
                              <Badge 
                                variant="secondary" 
                                className={`${getStatusColor(order.order_status)} text-white`}
                              >
                                {getStatusText(order.order_status)}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="font-medium">{formatPrice(order.total_cents)}</p>
                              <Button variant="outline" size="sm">
                                Track Order
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Favorite Restaurants
                </CardTitle>
                <CardDescription>Your saved restaurants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No favorites yet</p>
                  <Button onClick={() => navigate("/")}>
                    Explore Restaurants
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <AccountSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerDashboard;