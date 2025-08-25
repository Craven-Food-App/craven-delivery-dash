import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, MapPin, DollarSign, Clock, User, Navigation, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  created_at: string;
  updated_at: string;
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

interface Craver {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cravers, setCravers] = useState<Craver[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningOrders, setAssigningOrders] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
          toast({
            title: "Error",
            description: "Failed to load orders",
            variant: "destructive",
          });
          return;
        }

        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    const fetchCravers = async () => {
      try {
        const { data, error } = await supabase
          .from('craver_applications')
          .select('id, user_id, first_name, last_name, email')
          .eq('status', 'approved');

        if (error) {
          console.error('Error fetching cravers:', error);
          return;
        }

        setCravers(data || []);
      } catch (error) {
        console.error('Error fetching cravers:', error);
      }
    };

    const loadData = async () => {
      await Promise.all([fetchOrders(), fetchCravers()]);
      setLoading(false);
    };

    loadData();

    // Set up real-time subscription for orders
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Admin order realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            setOrders(prevOrders => [newOrder, ...prevOrders]);
            
            toast({
              title: "New Order! 🆕",
              description: `Order from ${newOrder.pickup_name} - $${(newOrder.payout_cents / 100).toFixed(2)}`,
            });
          }
          
          if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as Order;
            setOrders(prevOrders => 
              prevOrders.map(order => 
                order.id === updatedOrder.id ? updatedOrder : order
              )
            );
          }
          
          if (payload.eventType === 'DELETE') {
            const deletedOrder = payload.old as Order;
            setOrders(prevOrders => 
              prevOrders.filter(order => order.id !== deletedOrder.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      assigned: { variant: 'default' as const, color: 'bg-blue-100 text-blue-700', label: 'Assigned' },
      picked_up: { variant: 'default' as const, color: 'bg-orange-100 text-orange-700', label: 'Picked Up' },
      delivered: { variant: 'default' as const, color: 'bg-green-100 text-green-700', label: 'Delivered' },
      cancelled: { variant: 'destructive' as const, color: 'bg-red-100 text-red-700', label: 'Cancelled' }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const assignOrder = async (orderId: string, craverId: string) => {
    setAssigningOrders(prev => new Set(prev).add(orderId));
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          assigned_craver_id: craverId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error assigning order:', error);
        toast({
          title: "Error",
          description: "Failed to assign order",
          variant: "destructive",
        });
        return;
      }

      const craver = cravers.find(c => c.user_id === craverId);
      toast({
        title: "Order Assigned! 🚗",
        description: `Order assigned to ${craver?.first_name} ${craver?.last_name}`,
      });
    } catch (error) {
      console.error('Error assigning order:', error);
      toast({
        title: "Error",
        description: "Failed to assign order",
        variant: "destructive",
      });
    } finally {
      setAssigningOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const ordersByStatus = {
    pending: orders.filter(order => order.status === 'pending'),
    assigned: orders.filter(order => order.status === 'assigned'),
    picked_up: orders.filter(order => order.status === 'picked_up'),
    delivered: orders.filter(order => order.status === 'delivered'),
    cancelled: orders.filter(order => order.status === 'cancelled')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{ordersByStatus.pending.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold text-blue-600">{ordersByStatus.assigned.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold text-orange-600">{ordersByStatus.picked_up.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{ordersByStatus.delivered.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(ordersByStatus.delivered.reduce((sum, order) => sum + order.payout_cents, 0) / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            All Orders ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No orders found
                </p>
              ) : (
                orders.map((order, index) => (
                  <div key={order.id}>
                    <Card className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-mono text-muted-foreground">
                            #{order.id.slice(-8)}
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ${(order.payout_cents / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {order.distance_km} km
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">{order.pickup_name}</p>
                              <p className="text-xs text-muted-foreground">{order.pickup_address}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">{order.dropoff_name}</p>
                              <p className="text-xs text-muted-foreground">{order.dropoff_address}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {order.status === 'pending' && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-3">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            <Select onValueChange={(craverId) => assignOrder(order.id, craverId)}>
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Assign to craver..." />
                              </SelectTrigger>
                              <SelectContent>
                                {cravers.map((craver) => (
                                  <SelectItem key={craver.user_id} value={craver.user_id}>
                                    {craver.first_name} {craver.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {assigningOrders.has(order.id) && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                Assigning...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created: {formatTime(order.created_at)}
                          </div>
                          {order.updated_at !== order.created_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Updated: {formatTime(order.updated_at)}
                            </div>
                          )}
                        </div>
                        {order.assigned_craver_id && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Craver: {cravers.find(c => c.user_id === order.assigned_craver_id)?.first_name || order.assigned_craver_id.slice(-8)}
                          </div>
                        )}
                      </div>
                    </Card>
                    {index < orders.length - 1 && <Separator className="my-4" />}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderManagement;