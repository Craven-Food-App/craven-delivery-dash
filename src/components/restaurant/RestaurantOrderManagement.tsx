import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, MapPin, DollarSign, Phone } from "lucide-react";

interface Order {
  id: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  pickup_name: string;
  pickup_address: string;
  dropoff_name: string;
  dropoff_address: string;
  payout_cents: number;
  distance_km: number;
  assigned_craver_id?: string;
}

interface RestaurantOrderManagementProps {
  restaurantId: string;
}

export const RestaurantOrderManagement = ({ restaurantId }: RestaurantOrderManagementProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription for order updates for this restaurant
    const channel = supabase
      .channel('restaurant-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('Order update received:', payload);
          fetchOrders();
          
          // If a new order is created, trigger auto-assignment
          if (payload.eventType === 'INSERT' && payload.new) {
            triggerAutoAssignment(payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const triggerAutoAssignment = async (orderId: string) => {
    try {
      console.log('Triggering auto-assignment for order:', orderId);
      
      const { data, error } = await supabase.functions.invoke('auto-assign-orders', {
        body: { orderId }
      });

      if (error) {
        console.error('Auto-assignment error:', error);
        toast({
          title: "Assignment Error",
          description: "Failed to find available drivers. Order will remain pending.",
          variant: "destructive",
        });
      } else {
        console.log('Auto-assignment result:', data);
        if (data.success) {
          toast({
            title: "Driver Assigned",
            description: "A driver has been notified about this order.",
          });
        }
      }
    } catch (error) {
      console.error('Error calling auto-assignment:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      // Fetch orders for this specific restaurant
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'assigned':
        return 'secondary';
      case 'picked_up':
        return 'default';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    switch (currentStatus) {
      case 'pending':
        return 'assigned';
      case 'assigned':
        return 'picked_up';
      case 'picked_up':
        return 'delivered';
      default:
        return null;
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const filterOrdersByStatus = (status: Order['status'] | 'all') => {
    if (status === 'all') return orders;
    return orders.filter(order => order.status === status);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading orders...</div>;
  }

  // Test function to create a sample order
  const createTestOrder = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurantId,
          pickup_name: 'CMIH Kitchen',
          pickup_address: '6759 Nebraska Ave, Toledo, OH 43615',
          pickup_lat: 41.6528,
          pickup_lng: -83.6982,
          dropoff_name: 'Test Customer',
          dropoff_address: '123 Test St, Toledo, OH 43604',
          dropoff_lat: 41.6639,
          dropoff_lng: -83.5552,
          payout_cents: Math.floor(Math.random() * 1000) + 800, // $8-18
          distance_km: Math.random() * 10 + 2, // 2-12 km
          status: 'pending'
        });

      if (error) throw error;
      
      toast({
        title: "Test Order Created",
        description: "A test order has been created and auto-assignment initiated.",
      });
    } catch (error) {
      console.error('Error creating test order:', error);
      toast({
        title: "Error",
        description: "Failed to create test order",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Order Management</h3>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={createTestOrder}
          >
            Create Test Order
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Updates in real-time
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({filterOrdersByStatus('pending').length})</TabsTrigger>
          <TabsTrigger value="assigned">Assigned ({filterOrdersByStatus('assigned').length})</TabsTrigger>
          <TabsTrigger value="picked_up">Picked Up ({filterOrdersByStatus('picked_up').length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({filterOrdersByStatus('delivered').length})</TabsTrigger>
        </TabsList>

        {(['all', 'pending', 'assigned', 'picked_up', 'delivered'] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {filterOrdersByStatus(tab).length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No {tab === 'all' ? '' : tab} orders found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterOrdersByStatus(tab).map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">Order #{order.id.slice(-8)}</CardTitle>
                          <CardDescription>
                            {new Date(order.created_at).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge variant={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Pickup</span>
                          </div>
                          <div className="pl-6">
                            <p className="font-medium">{order.pickup_name}</p>
                            <p className="text-sm text-muted-foreground">{order.pickup_address}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Delivery</span>
                          </div>
                          <div className="pl-6">
                            <p className="font-medium">{order.dropoff_name}</p>
                            <p className="text-sm text-muted-foreground">{order.dropoff_address}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">${(order.payout_cents / 100).toFixed(2)}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(order.distance_km * 0.621371).toFixed(1)} mi
                          </div>
                          {order.assigned_craver_id && (
                            <Badge variant="outline">
                              Assigned to Craver
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {getNextStatus(order.status) && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                            >
                              Mark as {getStatusLabel(getNextStatus(order.status)!)}
                            </Button>
                          )}
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};