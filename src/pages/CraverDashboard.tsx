import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AccessGuard from '@/components/AccessGuard';
import DasherMap from '@/components/DasherMap';
import ActiveOrderCard from '@/components/ActiveOrderCard';
import DailyEarningsTracker from '@/components/DailyEarningsTracker';
import DeliveryProximityDetector from '@/components/DeliveryProximityDetector';
import DriverTools from '@/components/DriverTools';
import OrderFilters from '@/components/OrderFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, Package, Filter, Settings } from 'lucide-react';

interface Order {
  id: string;
  pickup_name: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_name: string;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  payout_cents: number;
  distance_km: number;
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
  assigned_craver_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

const CraverDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [user, setUser] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      console.log('Fetching orders for user:', user.id);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      console.log('Fetched orders:', data);
      setOrders(data || []);
      setFilteredOrders(data || []);
      
      // Find active order for current user
      const active = data?.find(order => 
        order.assigned_craver_id === user.id && 
        ['assigned', 'picked_up'].includes(order.status)
      );
      console.log('Active order for user:', active);
      setActiveOrder(active || null);
    };

    fetchOrders();

    // Set up realtime subscription with more specific event handling
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order realtime update:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as Order;
            
            setOrders(prevOrders => {
              const updated = prevOrders.map(order => 
                order.id === updatedOrder.id ? updatedOrder : order
              );
              setFilteredOrders(updated);
              return updated;
            });

            // Update active order if it's the one that changed
            if (updatedOrder.assigned_craver_id === user.id && 
                ['assigned', 'picked_up'].includes(updatedOrder.status)) {
              setActiveOrder(updatedOrder);
            } else if (updatedOrder.assigned_craver_id !== user.id) {
              // Order was unassigned or assigned to someone else
              setActiveOrder(prev => prev?.id === updatedOrder.id ? null : prev);
            }
          }
          
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            setOrders(prevOrders => {
              const updated = [newOrder, ...prevOrders];
              setFilteredOrders(updated);
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const updateLocation = async (lat: number, lng: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('craver_locations')
      .upsert({
        user_id: user.id,
        lat,
        lng,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating location:', error);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Available",
        description: "Geolocation is not supported by this browser. Some features may be limited.",
        variant: "destructive",
      });
      return;
    }

    const handleLocationSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      updateLocation(latitude, longitude);
    };

    const handleLocationError = (error) => {
      let message = "Unable to get your location.";
      switch(error.code) {
        case error.PERMISSION_DENIED:
          message = "Location access denied. Please enable location access to receive nearby orders.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Location information is unavailable.";
          break;
        case error.TIMEOUT:
          message = "Location request timed out.";
          break;
      }
      
      console.warn('Location tracking error:', error);
      
      // Only show toast once, not repeatedly
      if (error.code === error.PERMISSION_DENIED) {
        toast({
          title: "Location Permission Required",
          description: message,
          variant: "destructive",
        });
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: false, // Reduce battery usage
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);

  const handleAcceptOrder = async (order: Order) => {
    if (!user) return;

    // First check if user is approved craver
    console.log('Checking craver status for user:', user.id);
    
    try {
      const { data: craverCheck, error: craverError } = await supabase
        .from('craver_applications')
        .select('status, id')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      console.log('Craver application check:', { craverCheck, craverError });

      if (craverError) {
        console.error('Error checking craver status:', craverError);
        toast({
          title: "Error",
          description: "Unable to verify craver status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!craverCheck) {
        toast({
          title: "Access Denied",
          description: "You need to be an approved craver to accept orders. Please complete your application first.",
          variant: "destructive",
        });
        return;
      }

      // Immediately update UI for instant feedback
      const updatedOrder = {
        ...order,
        status: 'assigned' as const,
        assigned_craver_id: user.id
      };
      
      // Update local state immediately
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === order.id ? updatedOrder : o)
      );
      setActiveOrder(updatedOrder);

      console.log('Attempting to accept order:', { orderId: order.id, userId: user.id });

      const { data: acceptedOrder, error } = await supabase
        .from('orders')
        .update({
          status: 'assigned',
          assigned_craver_id: user.id
        })
        .eq('id', order.id)
        .eq('status', 'pending') // Ensure order is still pending
        .select()
        .maybeSingle();

      console.log('Order acceptance result:', { acceptedOrder, error });

      if (error) {
        console.error('Failed to accept order:', error);
        // Revert local state on error
        setOrders(prevOrders => 
          prevOrders.map(o => o.id === order.id ? order : o)
        );
        setActiveOrder(null);
        
        toast({
          title: "Error",
          description: error.message || "Failed to accept order. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!acceptedOrder) {
        // Order was likely taken by another driver
        setOrders(prevOrders => 
          prevOrders.map(o => o.id === order.id ? order : o)
        );
        setActiveOrder(null);
        
        toast({
          title: "Order Unavailable",
          description: "This order was already taken by another driver.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Order Accepted! 🎉",
        description: `Navigate to ${order.pickup_name} for pickup`,
      });
      
    } catch (error) {
      console.error('Error accepting order:', error);
      // Revert local state on error
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === order.id ? order : o)
      );
      setActiveOrder(null);
      
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'picked_up' | 'delivered') => {
    if (!user) return;

    // Immediate UI update for responsiveness
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    if (newStatus === 'delivered') {
      setActiveOrder(null);
    } else {
      setActiveOrder(prev => prev ? { ...prev, status: newStatus } : prev);
    }

    try {
      // First check if user is approved craver
      const { data: craverCheck } = await supabase
        .from('craver_applications')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (!craverCheck) {
        toast({
          title: "Access Denied",
          description: "You need to be an approved craver to update order status.",
          variant: "destructive",
        });
        return;
      }

      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .eq('assigned_craver_id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Failed to update order status:', error);
        
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update order status. Please try again.",
          variant: "destructive",
        });
        
        // Revert UI on error
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();
        
        if (data) {
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === orderId ? data : order
            )
          );
          setActiveOrder(data.assigned_craver_id === user.id ? data : null);
        }
        return;
      }

      if (!updatedOrder) {
        toast({
          title: "Update Failed",
          description: "Order not found or not assigned to you. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Order status updated successfully:', updatedOrder);

      const statusMessages = {
        picked_up: "✅ Order picked up! Navigate to customer.",
        delivered: "🎉 Order delivered! Great job!",
      };

      toast({
        title: "Status Updated",
        description: statusMessages[newStatus],
      });
      
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error", 
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteDelivery = (orderId: string) => {
    handleStatusUpdate(orderId, 'delivered');
  };

  const availableOrders = filteredOrders.filter(order => order.status === 'pending');

  const handleToggleOnlineStatus = (status: boolean) => {
    setOnlineStatus(status);
    toast({
      title: status ? "You're now online!" : "You're now offline",
      description: status ? "You can now receive new delivery requests." : "You won't receive new orders while offline.",
    });
  };

  return (
    <AccessGuard>
      <div className="min-h-screen bg-background">
        {/* Delivery Proximity Detector */}
        <DeliveryProximityDetector 
          activeOrder={activeOrder}
          onCompleteDelivery={handleCompleteDelivery}
        />
        
        <div className="flex h-screen">
          {/* Map Section */}
          <div className="flex-1 p-4">
            <DasherMap 
              orders={filteredOrders}
              activeOrder={activeOrder}
              onOrderClick={(order) => {
                if (order.status === 'pending' && onlineStatus) {
                  handleAcceptOrder(order);
                }
              }}
            />
          </div>

          {/* Orders Panel */}
          <div className="w-96 border-l bg-muted/10 p-4 flex flex-col">
            <Tabs defaultValue="orders" className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="orders" className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="tools" className="flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  Tools
                </TabsTrigger>
                <TabsTrigger value="filters" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  Filters
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="flex-1 space-y-4 mt-4">
                {/* Online Status Indicator */}
                <Card className={`border-l-4 ${onlineStatus ? 'border-l-green-500 bg-green-50/50' : 'border-l-red-500 bg-red-50/50'}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${onlineStatus ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="font-medium">
                          {onlineStatus ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {onlineStatus ? 'Receiving orders' : 'Not receiving orders'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Earnings Tracker */}
                <DailyEarningsTracker user={user} />

                {/* Active Order */}
                {activeOrder && (
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Active Delivery
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <ActiveOrderCard
                        order={activeOrder}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Available Orders */}
                <Card className="flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Available Orders ({availableOrders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3 p-4">
                        {!onlineStatus ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                              <Car className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground mb-2 font-medium">You're currently offline</p>
                            <p className="text-sm text-muted-foreground">Go to Tools tab to go online</p>
                          </div>
                        ) : availableOrders.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground mb-2 font-medium">No orders available</p>
                            <p className="text-sm text-muted-foreground">New orders will appear here</p>
                          </div>
                        ) : (
                          availableOrders.map((order, index) => (
                            <div key={order.id}>
                              <Card 
                                className="cursor-pointer hover:shadow-lg transition-all transform hover:scale-[1.02] border-l-4 hover:border-l-primary"
                                style={{
                                  borderLeftColor: order.payout_cents >= 1000 ? '#ef4444' : 
                                                 order.payout_cents >= 700 ? '#f97316' : '#eab308'
                                }}
                                onClick={() => onlineStatus && handleAcceptOrder(order)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 pr-2">
                                      <h4 className="font-medium text-sm leading-tight">{order.pickup_name}</h4>
                                      <p className="text-xs text-muted-foreground mt-1">{order.pickup_address}</p>
                                      <p className="text-xs text-muted-foreground mt-1">→ {order.dropoff_name}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-lg font-bold text-green-600">
                                        ${(order.payout_cents / 100).toFixed(2)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {(order.distance_km * 0.621371).toFixed(1)} mi
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              {index < availableOrders.length - 1 && (
                                <Separator className="my-3" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tools" className="flex-1 mt-4">
                <DriverTools 
                  user={user}
                  onlineStatus={onlineStatus}
                  onToggleOnlineStatus={handleToggleOnlineStatus}
                />
              </TabsContent>

              <TabsContent value="filters" className="flex-1 mt-4">
                <OrderFilters
                  orders={orders}
                  onFilteredOrdersChange={setFilteredOrders}
                  userLocation={userLocation}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AccessGuard>
  );
};

export default CraverDashboard;