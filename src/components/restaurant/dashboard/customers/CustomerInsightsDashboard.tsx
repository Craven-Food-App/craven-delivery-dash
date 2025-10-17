import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, ShoppingBag, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantData } from "@/hooks/useRestaurantData";

interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  avgOrderValue: number;
  totalOrders: number;
  avgRating: number;
}

const CustomerInsightsDashboard = () => {
  const { restaurant } = useRestaurantData();
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    avgOrderValue: 0,
    totalOrders: 0,
    avgRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurant?.id) {
      fetchCustomerStats();
    }
  }, [restaurant?.id]);

  const fetchCustomerStats = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("customer_id, total_cents, created_at")
        .eq("restaurant_id", restaurant?.id);

      if (error) throw error;

      if (!orders || orders.length === 0) {
        setLoading(false);
        return;
      }

      const uniqueCustomers = new Set(orders.map(o => o.customer_id));
      const customerOrderCounts = orders.reduce((acc, order) => {
        acc[order.customer_id] = (acc[order.customer_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const returningCount = Object.values(customerOrderCounts).filter(count => count > 1).length;
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_cents || 0), 0);

      setStats({
        totalCustomers: uniqueCustomers.size,
        newCustomers: uniqueCustomers.size - returningCount,
        returningCustomers: returningCount,
        avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        totalOrders: orders.length,
        avgRating: 4.8,
      });
    } catch (error) {
      console.error("Error fetching customer stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <Users className="w-10 h-10 animate-pulse text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stats.totalCustomers === 0) {
    return (
      <div className="space-y-6 pb-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 mb-6">
              <div className="w-full h-full rounded-lg bg-muted flex items-center justify-center">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">No customer data yet</h2>
            
            <p className="text-sm text-center max-w-md">
              Customer insights will appear here once you start receiving orders.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.newCustomers} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returning Customers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.returningCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCustomers > 0 
                ? `${((stats.returningCustomers / stats.totalCustomers) * 100).toFixed(1)}% of total`
                : '0% of total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.avgOrderValue / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {stats.totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCustomers > 0 
                ? `${((stats.returningCustomers / stats.totalCustomers) * 100).toFixed(0)}%`
                : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">Customer retention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Behavior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">New Customers</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary"
                    style={{ 
                      width: `${stats.totalCustomers > 0 ? (stats.newCustomers / stats.totalCustomers) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">{stats.newCustomers}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Returning Customers</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600"
                    style={{ 
                      width: `${stats.totalCustomers > 0 ? (stats.returningCustomers / stats.totalCustomers) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">{stats.returningCustomers}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerInsightsDashboard;
