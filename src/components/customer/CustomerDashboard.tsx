// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RestaurantGrid from '@/components/RestaurantGrid';
import { AccountSection } from '@/components/account/AccountSection';
import AddressManager from '@/components/address/AddressManager';
import { Package, MapPin, Clock, Star, ShoppingBag, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActiveOrder {
  id: string;
  restaurant_name: string;
  order_status: string;
  estimated_delivery_time: string | null;
  total_cents: number;
}

export const CustomerDashboard = () => {
  const { toast } = useToast();
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser();
    fetchActiveOrders();
    
    // Set up real-time subscription for order updates
    const subscription = supabase
      .channel('customer-orders')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'customer_orders'
        }, 
        () => {
          fetchActiveOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchActiveOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('customer_orders')
        .select(`
          id,
          order_status,
          estimated_delivery_time,
          total_cents,
          restaurants (name)
        `)
        .in('order_status', ['pending', 'confirmed', 'preparing', 'ready', 'picked_up'])
        .order('created_at', { ascending: false });

      if (data) {
        const formattedOrders = data.map(order => ({
          id: order.id,
          restaurant_name: (order.restaurants as any)?.name || 'Unknown',
          order_status: order.order_status,
          estimated_delivery_time: order.estimated_delivery_time,
          total_cents: order.total_cents
        }));
        setActiveOrders(formattedOrders);
      }
    } catch (error) {
      console.error('Error fetching active orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'preparing': return 'secondary';
      case 'ready': return 'destructive';
      case 'picked_up': return 'outline';
      default: return 'secondary';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              My Orders
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Active Orders Summary */}
            {activeOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Active Orders ({activeOrders.length})
                  </CardTitle>
                  <CardDescription>
                    Track your current orders in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {activeOrders.slice(0, 2).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{order.restaurant_name}</p>
                            <p className="text-sm text-muted-foreground">
                              ${(order.total_cents / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(order.order_status)}>
                          {formatStatus(order.order_status)}
                        </Badge>
                      </div>
                    ))}
                    {activeOrders.length > 2 && (
                      <Button variant="outline" className="w-full">
                        View All Active Orders
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Restaurant Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Restaurants Near You</CardTitle>
                <CardDescription>
                  Discover delicious food from local restaurants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RestaurantGrid />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Tracking
                </CardTitle>
                <CardDescription>
                  Monitor your current and past orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : activeOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No active orders</p>
                    <p className="text-muted-foreground mb-4">
                      Start browsing restaurants to place your first order
                    </p>
                    <Button>Browse Restaurants</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOrders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-medium">{order.restaurant_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Order #{order.id.slice(-8)}
                              </p>
                            </div>
                            <Badge variant={getStatusColor(order.order_status)}>
                              {formatStatus(order.order_status)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {order.estimated_delivery_time 
                                  ? new Date(order.estimated_delivery_time).toLocaleTimeString()
                                  : 'Calculating...'
                                }
                              </span>
                              <span>${(order.total_cents / 100).toFixed(2)}</span>
                            </div>
                            <Button variant="outline" size="sm">
                              Track Order
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Addresses
                </CardTitle>
                <CardDescription>
                  Manage your delivery addresses (up to 3)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user && <AddressManager userId={user.id} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <AccountSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};