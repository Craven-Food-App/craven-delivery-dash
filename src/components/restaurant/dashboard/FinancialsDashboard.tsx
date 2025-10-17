import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const FinancialsDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [payoutData, setPayoutData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState("last-7-days");

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (!restaurantData) return;
      setRestaurant(restaurantData);

      // Calculate date range
      const endDate = new Date().toISOString();
      let startDate = new Date();
      
      switch (dateRange) {
        case "last-7-days":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "last-30-days":
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "last-90-days":
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      // Fetch payout data
      const payoutResponse = await supabase.functions.invoke('calculate-restaurant-payouts', {
        body: {
          restaurantId: restaurantData.id,
          startDate: startDate.toISOString(),
          endDate: endDate
        }
      });

      if (payoutResponse.data) {
        setPayoutData(payoutResponse.data);
      }

      // Fetch transactions (orders)
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      setTransactions(ordersData || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="w-full h-full bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Financials</h1>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Last 7 days</SelectItem>
                <SelectItem value="last-30-days">Last 30 days</SelectItem>
                <SelectItem value="last-90-days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="bg-muted">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
              <TabsTrigger value="statements">Statements</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="mt-6 space-y-6">
              {/* Summary Cards */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {payoutData ? formatCurrency(payoutData.totalRevenue) : "$0.00"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        From {payoutData?.orderCount || 0} orders
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Commission</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {payoutData ? formatCurrency(payoutData.totalCommission) : "$0.00"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {payoutData?.commissionRate || 0}% platform fee
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Net Payout</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {payoutData ? formatCurrency(payoutData.netPayout) : "$0.00"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        After commission
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Transactions List */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    View all completed orders and their payment details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions found for this period
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map(transaction => {
                        const createdDate = new Date(transaction.created_at);
                        return (
                          <div key={transaction.id} className="flex items-center justify-between border-b pb-3">
                            <div>
                              <div className="font-medium">{transaction.order_number}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatTimeAgo(createdDate)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{formatCurrency(transaction.total_cents || 0)}</div>
                              <div className="text-xs text-muted-foreground">Completed</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payout Schedule</CardTitle>
                  <CardDescription>
                    Your payouts are processed automatically
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : payoutData ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">Next Payout</div>
                          <div className="text-sm text-muted-foreground">
                            Estimated based on current period
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(payoutData.netPayout)}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Payouts are processed weekly on Fridays.</p>
                        <p className="mt-2">
                          Connect your bank account in{" "}
                          <Button variant="link" className="p-0 h-auto text-primary">
                            Bank Account Settings
                          </Button>{" "}
                          to receive payouts.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No payout data available yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statements" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Statements</CardTitle>
                  <CardDescription>
                    Download your financial statements and tax documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Monthly Statement - Current</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Previous statements will appear here as they become available
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default FinancialsDashboard;