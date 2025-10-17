import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Folder, ChevronLeft, ChevronRight } from "lucide-react";

const TransactionsDashboard = () => {
  const [dateRange, setDateRange] = useState("last-7-days");
  const [channel, setChannel] = useState("all");
  const [transactionType, setTransactionType] = useState("all");

  return (
    <div className="space-y-6 pb-8">
      {/* Description */}
      <p className="text-muted-foreground">
        All charges from all orders, campaigns, fees, and adjustments associated with your Crave'N account. To track real-time orders, go to{" "}
        <a href="#" className="text-primary underline">Orders</a>.
      </p>

      {/* Filters */}
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

      {/* Show details toggle */}
      <div className="flex justify-end">
        <Button variant="link" className="text-sm">
          Show details
        </Button>
      </div>

      {/* Transaction Type Filter */}
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

      {/* Empty State */}
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">0 results</span>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm px-3">1</span>
          <Button variant="outline" size="sm" disabled>
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <Select defaultValue="20">
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
