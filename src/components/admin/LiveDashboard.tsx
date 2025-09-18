// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Truck, 
  Users, 
  DollarSign, 
  Clock, 
  MapPin,
  Phone,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  customer_id: string;
  driver_id?: string;
  restaurant_id: string;
  total_cents: number;
  order_status: string;
  created_at: string;
  delivery_address?: any;
  restaurants: {
    name: string;
    address: string;
    city: string;
    state: string;
  };
}

interface Driver {
  id: string;
  user_id: string;
  status: string;
  is_available: boolean;
  rating: number;
  total_deliveries: number;
  driver_level: number;
}

const LiveDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    activeDrivers: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      // Fetch recent orders
      const { data: ordersData, error: ordersError } = await (supabase as any)
        .from('orders')
        .select(`
          *,
          restaurants (
            name,
            address,
            city,
            state
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (ordersError) throw ordersError;

      // Fetch drivers
      const { data: driversData, error: driversError } = await supabase
        .from('driver_profiles')
        .select('*')
        .order('rating', { ascending: false });

      if (driversError) throw driversError;

      setOrders((ordersData || []) as any);
      setDrivers((driversData || []).map((d: any) => ({ ...d, driver_level: 'standard' })));

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = ordersData?.filter(order => 
        order.created_at.startsWith(today)
      ) || [];

      setStats({
        totalOrders: todayOrders.length,
        pendingOrders: ordersData?.filter(order => 
          order.order_status === 'pending' || order.order_status === 'confirmed'
        ).length || 0,
        activeDrivers: driversData?.filter(driver => 
          driver.status === 'online' && driver.is_available
        ).length || 0,
        totalRevenue: todayOrders.reduce((sum, order) => 
          sum + (order.payment_status === 'paid' ? order.total_cents : 0), 0
        )
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error loading dashboard",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      const { error } = await supabase.functions.invoke('assign-driver', {
        body: { orderId, driverId }
      });

      if (error) throw error;

      toast({
        title: "Driver assigned successfully",
        description: "The driver has been notified about the order.",
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        title: "Error assigning driver",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('orders')
        .update({ order_status: 'canceled' })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order canceled",
        description: "The order has been canceled successfully.",
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error canceling order:', error);
      toast({
        title: "Error canceling order",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();

    // Set up real-time subscriptions
    const ordersSubscription = supabase
      .channel('admin_orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchData()
      )
      .subscribe();

    const driversSubscription = supabase
      .channel('admin_drivers')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'driver_profiles' },
        () => fetchData()
      )
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => {
      ordersSubscription.unsubscribe();
      driversSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'picked_up': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDriverStatusColor = (status: string, isAvailable: boolean) => {
    if (!isAvailable) return 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Today's Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Drivers</p>
                <p className="text-2xl font-bold">{stats.activeDrivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold">${(stats.totalRevenue / 100).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="orders" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Active Orders
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Drivers
            </TabsTrigger>
          </TabsList>
          
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No orders found</p>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">#{order.id.slice(-8)}</span>
                            <Badge className={getStatusColor(order.order_status)}>
                              {order.order_status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Order from {order.restaurants.name}
                          </p>
                          <p className="text-sm font-medium">${(order.total_cents / 100).toFixed(2)}</p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>

                      {order.delivery_address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">
                            {typeof order.delivery_address === 'object' 
                              ? `${order.delivery_address.street_address}, ${order.delivery_address.city}` 
                              : order.delivery_address}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {order.order_status === 'pending' && (
                          <Button 
                            onClick={() => handleCancelOrder(order.id)}
                            variant="destructive" 
                            size="sm"
                          >
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Driver Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drivers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 col-span-full">No drivers found</p>
                ) : (
                  drivers.map((driver) => (
                    <Card key={driver.id}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Driver #{driver.id.slice(-8)}</span>
                            <Badge className={getDriverStatusColor(driver.status, driver.is_available)}>
                              {driver.is_available ? driver.status : 'offline'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Rating:</span>
                              <span className="flex items-center gap-1">
                                ⭐ {driver.rating.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Deliveries:</span>
                              <span>{driver.total_deliveries}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Level:</span>
                              <span>{driver.driver_level}</span>
                            </div>
                          </div>

                          {driver.status === 'online' && driver.is_available && (
                            <div className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              Available for orders
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveDashboard;