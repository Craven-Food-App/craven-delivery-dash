import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Package, MapPin, CreditCard, Clock, Star, Heart, Plus } from "lucide-react";
import Header from "@/components/Header";
import { AccountSection } from "@/components/account/AccountSection";
import RestaurantGrid from "@/components/RestaurantGrid";
import OrderTrackingBox from "@/components/OrderTrackingBox";
import OrderDetailsModal from "@/components/OrderDetailsModal";

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

interface FavoriteRestaurant {
  id: string;
  name: string;
  image_url?: string;
  cuisine_type?: string;
  rating: number;
  delivery_fee_cents: number;
}

const CustomerDashboard = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Record<string, Restaurant>>({});
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);
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

      // Fetch favorites
      const { data: favoritesData, error: favoritesError } = await supabase
        .from("customer_favorites")
        .select(`
          restaurant_id,
          restaurants (
            id,
            name,
            image_url,
            cuisine_type,
            rating,
            delivery_fee_cents
          )
        `)
        .eq("customer_id", user.id);

      if (favoritesError) {
        console.error("Error fetching favorites:", favoritesError);
        setFavorites([]);
      } else if (favoritesData) {
        const formattedFavorites = favoritesData
          .filter(fav => fav.restaurants)
          .map(fav => fav.restaurants as FavoriteRestaurant);
        setFavorites(formattedFavorites);
      } else {
        setFavorites([]);
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

  const handleViewOrderDetails = (orderId: string) => {
    setDetailsOrderId(orderId);
  };

  const handleTrackOrder = (orderId: string) => {
    setTrackingOrderId(orderId);
  };

  const removeFavorite = async (restaurantId: string) => {
    try {
      const { error } = await supabase
        .from("customer_favorites")
        .delete()
        .eq("customer_id", user?.id)
        .eq("restaurant_id", restaurantId);

      if (error) throw error;

      setFavorites(prev => prev.filter(fav => fav.id !== restaurantId));
      toast({
        title: "Removed from favorites",
        description: "Restaurant removed from your favorites"
      });
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive"
      });
    }
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewOrderDetails(order.id)}
                            >
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
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleTrackOrder(order.id)}
                              >
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
                  <Heart className="h-5 w-5" />
                  Favorite Restaurants
                </CardTitle>
                <CardDescription>Your saved restaurants</CardDescription>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No favorites yet</p>
                    <Button onClick={() => navigate("/")}>
                      Explore Restaurants
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map((restaurant) => (
                      <Card key={restaurant.id} className="relative group">
                        <CardContent className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFavorite(restaurant.id)}
                          >
                            <Heart className="h-4 w-4 fill-current text-red-500" />
                          </Button>
                          
                          {restaurant.image_url && (
                            <img
                              src={restaurant.image_url}
                              alt={restaurant.name}
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                          )}
                          
                          <h3 className="font-semibold mb-1">{restaurant.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {restaurant.cuisine_type}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-current text-yellow-500" />
                              <span>{restaurant.rating}</span>
                            </div>
                            <span>${(restaurant.delivery_fee_cents / 100).toFixed(2)} delivery</span>
                          </div>
                          
                          <Button 
                            className="w-full mt-3" 
                            size="sm"
                            onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                          >
                            Order Now
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                <div className="mt-6">
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                      <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground mb-4">Discover more restaurants</p>
                      <RestaurantGrid />
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <AccountSection />
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Tracking Box */}
      {trackingOrderId && (
        <OrderTrackingBox 
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
        />
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal 
        isOpen={detailsOrderId !== null}
        onClose={() => setDetailsOrderId(null)}
        orderId={detailsOrderId || ''}
      />
    </div>
  );
};

export default CustomerDashboard;