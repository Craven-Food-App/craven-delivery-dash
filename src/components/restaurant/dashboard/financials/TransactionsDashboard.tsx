import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Folder, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [dateRange, setDateRange] = useState("last-7-days");
  const [channel, setChannel] = useState("all");
  const [transactionType, setTransactionType] = useState("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("20");

  useEffect(() => {
    if (restaurant?.id) {
      fetchTransactions();
    }
  }, [restaurant?.id, dateRange, transactionType]);

  const fetchTransactions = async () => {
    try {
      let daysAgo = 7;
      if (dateRange === "last-30-days") daysAgo = 30;
      if (dateRange === "last-3-months") daysAgo = 90;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      let query = supabase
        .from("orders")
        .select("id, order_number, customer_name, total_cents, created_at, order_status")
        .eq("restaurant_id", restaurant?.id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      // Filter by transaction type
      if (transactionType === "orders") {
        query = query.in("order_status", ["pending", "confirmed", "preparing", "ready", "picked_up", "delivered"]);
      } else if (transactionType === "refunds") {
        query = query.eq("order_status", "cancelled");
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions((data || []) as Transaction[]);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(transactions.length / parseInt(rowsPerPage));
  const startIndex = (currentPage - 1) * parseInt(rowsPerPage);
  const endIndex = startIndex + parseInt(rowsPerPage);
  const currentTransactions = transactions.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 pb-8">
      <p className="text-muted-foreground">
        All charges from all orders, campaigns, fees, and adjustments associated with your Crave'N account. To track real-time orders, go to{" "}
        <a href="#" className="text-primary underline">Orders</a>.
      </p>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 days</SelectItem>
              <SelectItem value="last-30-days">Last 30 days</SelectItem>
              <SelectItem value="last-3-months">Last 3 months</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              <SelectItem value="marketplace">Marketplace</SelectItem>
              <SelectItem value="storefront">Storefront</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="destructive">
          Create report
        </Button>
      </div>

      <div className="flex justify-end">
        <Button variant="link" className="text-sm">
          Show details
        </Button>
      </div>

      <div>
        <Select value={transactionType} onValueChange={setTransactionType}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All transaction types</SelectItem>
            <SelectItem value="orders">Orders</SelectItem>
            <SelectItem value="adjustments">Adjustments</SelectItem>
            <SelectItem value="fees">Fees</SelectItem>
            <SelectItem value="refunds">Refunds</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading transactions...</div>
          </CardContent>
        </Card>
      ) : currentTransactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 mb-6">
              <Folder className="w-full h-full text-orange-400" strokeWidth={1.5} />
            </div>
            
            <h3 className="text-xl font-semibold mb-2">No transactions available</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Missing a transaction?{" "}
              <a href="#" className="text-primary underline">Contact us</a> for help.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Order #</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium">{transaction.order_number}</td>
                      <td className="p-4">{transaction.customer_name || 'Guest'}</td>
                      <td className="p-4 text-muted-foreground">
                        {format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                          {transaction.order_status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold">
                        ${(transaction.total_cents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{transactions.length} results</span>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm px-3">{currentPage}</span>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
            <SelectTrigger className="w-32 ml-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">Rows per page: 20</SelectItem>
              <SelectItem value="50">Rows per page: 50</SelectItem>
              <SelectItem value="100">Rows per page: 100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default TransactionsDashboard;
