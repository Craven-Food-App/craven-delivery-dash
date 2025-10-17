import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign } from "lucide-react";

const PayoutsDashboard = () => {
  const [dateRange, setDateRange] = useState("last-30-days");

  return (
    <div className="space-y-6 pb-8">
      {/* Description */}
      <p className="text-muted-foreground">
        Here is where you will find a summary of your Transactions and Payouts.{" "}
        <a href="#" className="text-primary underline">Learn more</a>
      </p>

      {/* Filters */}
      <div className="flex justify-between items-center">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-30-days">Last 30 days</SelectItem>
            <SelectItem value="last-60-days">Last 60 days</SelectItem>
            <SelectItem value="last-90-days">Last 90 days</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="destructive">
          Create report
        </Button>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-6">
            <DollarSign className="w-12 h-12 text-blue-600" strokeWidth={2} />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">
            No financial records were found for
          </h3>
          <p className="text-muted-foreground">
            the selected time range or store.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutsDashboard;
