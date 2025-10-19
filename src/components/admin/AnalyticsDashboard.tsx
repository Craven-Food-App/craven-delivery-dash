import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Users, Car, Store, Download, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AnalyticsData {
  revenue: {
    total: number;
    change: number;
    daily: { date: string; amount: number }[];
  };
  orders: {
    total: number;
    change: number;
    byStatus: { status: string; count: number }[];
  };
  customers: {
    total: number;
    new: number;
    returning: number;
  };
  drivers: {
    active: number;
    total: number;
    avgRating: number;
  };
  restaurants: {
    active: number;
    total: number;
    topPerformers: { name: string; orders: number; revenue: number }[];
  };
}

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7'); // days
  const [exportType, setExportType] = useState<'csv' | 'pdf'>('csv');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));

      // Fetch revenue data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (ordersError) throw ordersError;

      // Calculate revenue
      const totalRevenue = (orders || []).reduce((sum, order) => sum + order.total_cents, 0);
      
      // Get previous period for comparison
      const prevStartDate = subDays(startDate, parseInt(dateRange));
      const { data: prevOrders } = await supabase
        .from('orders')
        .select('total_cents')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const prevRevenue = (prevOrders || []).reduce((sum, order) => sum + order.total_cents, 0);
      const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      // Group revenue by day
      const revenueByDay = (orders || []).reduce((acc: any, order) => {
        const date = format(new Date(order.created_at), 'yyyy-MM-dd');
        if (!acc[date]) acc[date] = 0;
        acc[date] += order.total_cents;
        return acc;
      }, {});

      const dailyRevenue = Object.entries(revenueByDay).map(([date, amount]) => ({
        date,
        amount: amount as number
      }));

      // Calculate order stats
      const ordersByStatus = (orders || []).reduce((acc: any, order) => {
        const status = order.order_status;
        if (!acc[status]) acc[status] = 0;
        acc[status]++;
        return acc;
      }, {});

      const orderStatusArray = Object.entries(ordersByStatus).map(([status, count]) => ({
        status,
        count: count as number
      }));

      // Fetch customer stats
      const { data: customers } = await supabase
        .from('user_profiles')
        .select('id, user_id, created_at');

      const newCustomers = (customers || []).filter(
        c => new Date(c.created_at) >= startDate
      ).length;

      // Fetch driver stats
      const { data: drivers } = await supabase
        .from('driver_profiles')
        .select('*');

      const activeDrivers = (drivers || []).filter(d => d.is_available).length;
      const avgDriverRating = (drivers || []).reduce((sum, d) => sum + (d.rating || 0), 0) / (drivers?.length || 1);

      // Fetch restaurant stats
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('*');

      const activeRestaurants = (restaurants || []).filter(r => r.is_active).length;

      // Get top performing restaurants
      const restaurantOrders = (orders || []).reduce((acc: any, order) => {
        const restId = order.restaurant_id;
        if (!acc[restId]) {
          acc[restId] = { orders: 0, revenue: 0, name: '' };
        }
        acc[restId].orders++;
        acc[restId].revenue += order.total_cents;
        return acc;
      }, {});

      // Match restaurant names
      const topPerformers = await Promise.all(
        Object.entries(restaurantOrders)
          .sort((a: any, b: any) => b[1].revenue - a[1].revenue)
          .slice(0, 5)
          .map(async ([id, stats]: any) => {
            const { data: restaurant } = await supabase
              .from('restaurants')
              .select('name')
              .eq('id', id)
              .single();

            return {
              name: restaurant?.name || 'Unknown',
              orders: stats.orders,
              revenue: stats.revenue
            };
          })
      );

      setAnalytics({
        revenue: {
          total: totalRevenue,
          change: revenueChange,
          daily: dailyRevenue
        },
        orders: {
          total: orders?.length || 0,
          change: ((orders?.length || 0) - (prevOrders?.length || 0)) / (prevOrders?.length || 1) * 100,
          byStatus: orderStatusArray
        },
        customers: {
          total: customers?.length || 0,
          new: newCustomers,
          returning: (customers?.length || 0) - newCustomers
        },
        drivers: {
          active: activeDrivers,
          total: drivers?.length || 0,
          avgRating: avgDriverRating
        },
        restaurants: {
          active: activeRestaurants,
          total: restaurants?.length || 0,
          topPerformers
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error loading analytics',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      if (!analytics) return;

      const data = {
        dateRange: `Last ${dateRange} days`,
        generatedAt: new Date().toISOString(),
        revenue: {
          total: analytics.revenue.total / 100,
          change: analytics.revenue.change
        },
        orders: analytics.orders,
        customers: analytics.customers,
        drivers: analytics.drivers,
        restaurants: analytics.restaurants
      };

      if (exportType === 'csv') {
        // Create CSV
        const csv = [
          ['Metric', 'Value'],
          ['Total Revenue', `$${(analytics.revenue.total / 100).toFixed(2)}`],
          ['Revenue Change', `${analytics.revenue.change.toFixed(2)}%`],
          ['Total Orders', analytics.orders.total.toString()],
          ['Total Customers', analytics.customers.total.toString()],
          ['New Customers', analytics.customers.new.toString()],
          ['Active Drivers', analytics.drivers.active.toString()],
          ['Active Restaurants', analytics.restaurants.active.toString()]
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
      } else {
        // Create PDF (would use a library like jsPDF in production)
        toast({
          title: 'PDF Export',
          description: 'PDF export feature coming soon'
        });
      }

      toast({
        title: 'Export successful',
        description: `Analytics data exported as ${exportType.toUpperCase()}`
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export analytics data',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <BarChart3 className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive platform analytics and insights</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={exportType} onValueChange={(v) => setExportType(v as 'csv' | 'pdf')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Revenue
              </span>
              {analytics.revenue.change > 0 ? (
                <ArrowUp className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(analytics.revenue.total / 100).toFixed(2)}
            </div>
            <p className={`text-xs ${analytics.revenue.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.revenue.change > 0 ? '+' : ''}{analytics.revenue.change.toFixed(1)}% from previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-500" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.orders.total}</div>
            <p className={`text-xs ${analytics.orders.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.orders.change > 0 ? '+' : ''}{analytics.orders.change.toFixed(1)}% change
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.customers.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.customers.new} new, {analytics.customers.returning} returning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4 text-orange-500" />
              Active Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.drivers.active}</div>
            <p className="text-xs text-muted-foreground">
              of {analytics.drivers.total} total drivers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue</CardTitle>
              <CardDescription>Revenue breakdown by day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.revenue.daily.map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-3 border rounded-md">
                    <span className="text-sm font-medium">{format(new Date(day.date), 'MMM dd, yyyy')}</span>
                    <span className="text-sm font-bold">${(day.amount / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
              <CardDescription>Distribution of order statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.orders.byStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between p-3 border rounded-md">
                    <span className="text-sm font-medium capitalize">{item.status.replace('_', ' ')}</span>
                    <span className="text-sm font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Customers</span>
                    <span className="text-2xl font-bold">{analytics.customers.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Customers</span>
                    <span className="text-2xl font-bold text-green-600">{analytics.customers.new}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Returning Customers</span>
                    <span className="text-2xl font-bold text-blue-600">{analytics.customers.returning}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Driver Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Drivers</span>
                    <span className="text-2xl font-bold">{analytics.drivers.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Drivers</span>
                    <span className="text-2xl font-bold">{analytics.drivers.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Rating</span>
                    <span className="text-2xl font-bold text-yellow-600">
                      {analytics.drivers.avgRating.toFixed(1)} ⭐
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="restaurants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Restaurants</CardTitle>
              <CardDescription>Restaurants with highest revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.restaurants.topPerformers.map((restaurant, index) => (
                  <div key={restaurant.name} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-xs text-muted-foreground">{restaurant.orders} orders</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold">${(restaurant.revenue / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Restaurants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.restaurants.active}</div>
                <p className="text-sm text-muted-foreground">Currently accepting orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Restaurants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.restaurants.total}</div>
                <p className="text-sm text-muted-foreground">Registered on platform</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
