import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AccessGuard from '@/components/AccessGuard';
import OrderMap from '@/components/OrderMap';
import OrderCard from '@/components/OrderCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Car, Package } from 'lucide-react';

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
}

const CraverDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [user, setUser] = useState(null);
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
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      setOrders(data || []);
      
      // Find active order for current user
      const active = data?.find(order => 
        order.assigned_craver_id === user.id && 
        ['assigned', 'picked_up'].includes(order.status)
      );
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
            
            setOrders(prevOrders => 
              prevOrders.map(order => 
                order.id === updatedOrder.id ? updatedOrder : order
              )
            );

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
            setOrders(prevOrders => [newOrder, ...prevOrders]);
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
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateLocation(latitude, longitude);
      },
      (error) => {
        console.warn('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);

  const handleAcceptOrder = async (order: Order) => {
    if (!user) return;

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

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'assigned',
          assigned_craver_id: user.id
        })
        .eq('id', order.id)
        .eq('status', 'pending'); // Ensure order is still pending

      if (error) {
        console.error('Failed to accept order:', error);
        // Revert local state on error
        setOrders(prevOrders => 
          prevOrders.map(o => o.id === order.id ? order : o)
        );
        setActiveOrder(null);
        
        toast({
          title: "Error",
          description: "Failed to accept order. It may have been taken by another driver.",
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
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .eq('assigned_craver_id', user?.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
      return;
    }

    const statusMessages = {
      picked_up: "Order picked up successfully",
      delivered: "Order delivered successfully! Great job!",
    };

    toast({
      title: "Status Updated",
      description: statusMessages[newStatus as keyof typeof statusMessages] || "Order status updated",
    });
  };

  const availableOrders = orders.filter(order => order.status === 'pending');

  return (
    <AccessGuard>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          {/* Map Section */}
          <div className="flex-1 p-4">
            <OrderMap 
              orders={orders}
              activeOrder={activeOrder}
              onOrderClick={(order) => {
                if (order.status === 'pending') {
                  handleAcceptOrder(order);
                }
              }}
            />
          </div>

          {/* Orders Panel */}
          <div className="w-96 border-l bg-muted/10 p-4 flex flex-col">
            <div className="space-y-4">
              {/* Active Order */}
              {activeOrder && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Active Delivery
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OrderCard
                      order={activeOrder}
                      variant="active"
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
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4 p-4">
                      {availableOrders.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No orders available at the moment
                        </p>
                      ) : (
                        availableOrders.map((order, index) => (
                          <div key={order.id}>
                            <OrderCard
                              order={order}
                              variant="available"
                              onAccept={handleAcceptOrder}
                            />
                            {index < availableOrders.length - 1 && (
                              <Separator className="my-4" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AccessGuard>
  );
};

export default CraverDashboard;