// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, Phone, Mail, Package, Truck } from "lucide-react";

interface CustomerOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_items: any[];
  subtotal_cents: number;
  delivery_fee_cents: number;
  tax_cents: number;
  total_cents: number;
  delivery_method: 'delivery' | 'pickup';
  delivery_address?: string;
  special_instructions?: string;
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  estimated_pickup_time?: string;
  estimated_delivery_time?: string;
  created_at: string;
}

interface RestaurantCustomerOrderManagementProps {
  restaurantId: string;
}

export const RestaurantCustomerOrderManagement = ({ restaurantId }: RestaurantCustomerOrderManagementProps) => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription for new orders
    const subscription = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [restaurantId]);

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders for restaurant:', restaurantId);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            quantity,
            price_cents,
            special_instructions,
            menu_items (name),
            order_item_modifiers (
              modifier_name,
              modifier_price_cents
            )
          ),
          user_profiles!customer_id (
            full_name,
            phone
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Raw orders data:', data);
      
      // Transform the data to match our interface
      const transformedOrders = (data || []).map(order => ({
        ...order,
        customer_name: order.user_profiles?.full_name || 'Customer', 
        customer_email: '', // Email not available in user_profiles
        customer_phone: order.user_profiles?.phone || '',
        order_items: order.order_items?.map((item: any) => ({
          ...item,
          name: item.menu_items?.name || 'Unknown Item',
          modifiers: item.order_item_modifiers?.map((mod: any) => ({
            name: mod.modifier_name,
            price_cents: mod.modifier_price_cents
          })) || []
        })) || [],
        delivery_method: order.delivery_address ? 'delivery' as const : 'pickup' as const,
        payment_status: 'paid' as const // Default value
      }));
      
      console.log('Transformed orders:', transformedOrders);
      setOrders(transformedOrders as CustomerOrder[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: CustomerOrder['order_status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order Updated",
        description: `Order status updated to ${newStatus}`,
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      confirmed: "secondary",
      preparing: "default",
      ready: "default",
      out_for_delivery: "default",
      delivered: "secondary",
      cancelled: "destructive"
    };
    return colors[status] || "default";
  };

  const getNextStatus = (currentStatus: CustomerOrder['order_status']) => {
    const statusFlow: Record<CustomerOrder['order_status'], CustomerOrder['order_status'] | null> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'out_for_delivery',
      out_for_delivery: 'delivered',
      delivered: null,
      cancelled: null
    };
    return statusFlow[currentStatus];
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filterOrdersByStatus = (status?: string) => {
    if (!status || status === 'all') return orders;
    return orders.filter(order => order.order_status === status);
  };

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  const pendingOrders = filterOrdersByStatus('pending');
  const activeOrders = orders.filter(o => ['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.order_status));
  const completedOrders = filterOrdersByStatus('delivered');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(orders.reduce((sum, order) => 
                order.order_status === 'delivered' && 
                new Date(order.created_at).toDateString() === new Date().toDateString()
                  ? sum + order.total_cents : sum, 0
              ) / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="delivered">Completed ({completedOrders.length})</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'active', 'delivered'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {filterOrdersByStatus(tab === 'active' ? undefined : tab === 'all' ? undefined : tab)
              .filter(order => tab === 'active' 
                ? ['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.order_status)
                : tab === 'all' ? true : order.order_status === tab
              )
              .map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleString()}
                        </span>
                        <Badge variant={getStatusColor(order.order_status)}>
                          {getStatusLabel(order.order_status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${(order.total_cents / 100).toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">{order.delivery_method}</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Customer Information */}
                  <div>
                    <h4 className="font-medium mb-2">Customer</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        <span>{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span>{order.customer_email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{order.customer_phone}</span>
                      </div>
                      {order.delivery_address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span>{order.delivery_address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium mb-2">Items ({order.order_items.length})</h4>
                    <div className="space-y-2">
                      {order.order_items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <div>
                            <span>{item.quantity}x {item.name}</span>
                            {item.modifiers?.length > 0 && (
                              <div className="text-muted-foreground ml-4">
                                {item.modifiers.map((mod: any) => (
                                  <div key={mod.id}>+ {mod.name}</div>
                                ))}
                              </div>
                            )}
                            {item.special_instructions && (
                              <div className="text-muted-foreground ml-4 italic">
                                Note: {item.special_instructions}
                              </div>
                            )}
                          </div>
                          <span>${((item.price_cents + (item.modifiers?.reduce((sum: number, mod: any) => sum + mod.price_cents, 0) || 0)) * item.quantity / 100).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.special_instructions && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Special Instructions</h4>
                        <p className="text-sm text-muted-foreground">{order.special_instructions}</p>
                      </div>
                    </>
                  )}

                  {/* Order Actions */}
                  {order.order_status !== 'delivered' && order.order_status !== 'cancelled' && (
                    <>
                      <Separator />
                      <div className="flex gap-2 flex-wrap">
                        {getNextStatus(order.order_status) && (
                          <Button
                            onClick={() => updateOrderStatus(order.id, getNextStatus(order.order_status)!)}
                            size="sm"
                          >
                            Mark as {getStatusLabel(getNextStatus(order.order_status)!)}
                          </Button>
                        )}
                        
                        {order.order_status === 'pending' && (
                          <>
                            <Button
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Confirm Order
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              size="sm"
                            >
                              Cancel Order
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};