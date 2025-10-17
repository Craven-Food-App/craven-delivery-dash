import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Receipt, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantData } from "@/hooks/useRestaurantData";
import { format } from "date-fns";

interface Transaction {
  id: string;
  order_number: string;
  customer_name: string;
  total_cents: number;
  created_at: string;
  order_status: string;
}

const TransactionsDashboard = () => {
  const { restaurant } = useRestaurantData();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    if (restaurant?.id) {
      fetchTransactions();
    }
  }, [restaurant?.id, dateRange]);

  const fetchTransactions = async () => {
    try {
      let daysAgo = 7;
      if (dateRange === "30d") daysAgo = 30;
      if (dateRange === "90d") daysAgo = 90;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, total_cents, created_at, order_status")
        .eq("restaurant_id", restaurant?.id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as Transaction[];
      setTransactions(typedData);
      
      const revenue = typedData.reduce((sum, t) => sum + (t.total_cents || 0), 0);
      setTotalRevenue(revenue);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <DollarSign className="w-10 h-10 animate-pulse text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-6 pb-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 mb-6">
              <div className="w-full h-full rounded-lg bg-muted flex items-center justify-center">
                <DollarSign className="w-10 h-10 text-muted-foreground" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">No transactions yet</h2>
            
            <p className="text-sm text-center max-w-md">
              Transaction history will appear here once you start processing orders.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedTransactions = transactions.filter(t => 
    t.order_status === 'delivered' || t.order_status === 'completed'
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{transactions.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTransactions.length}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${transactions.length > 0 ? (totalRevenue / transactions.length / 100).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map(transaction => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{transaction.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.customer_name || 'Guest'} • {format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${(transaction.total_cents / 100).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground capitalize">{transaction.order_status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsDashboard;
