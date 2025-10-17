import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Lightbulb, TrendingUp } from "lucide-react";

const RatingsReviewsDashboard = () => {
  const [dateRange, setDateRange] = useState("last-7-days");
  const [showTip, setShowTip] = useState(true);

  return (
    <div className="space-y-6 pb-8">
      {/* Description */}
      <div>
        <p className="text-muted-foreground mb-2">
          Track your customer ratings and respond to their feedback.
        </p>
        <p className="text-sm text-muted-foreground">
          Respond to customer feedback within 7 days of receiving it to show your appreciation, and encourage them to come back.
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-4 items-center">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-7-days">Last 7 days</SelectItem>
            <SelectItem value="last-30-days">Last 30 days</SelectItem>
            <SelectItem value="last-3-months">Last 3 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageCircle className="w-12 h-12 text-muted-foreground" />
              </div>
              <p className="text-center text-muted-foreground">
                You didn't receive any ratings for the selected store(s) and timeframe.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tip Card */}
          {showTip && (
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={() => setShowTip(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="font-semibold mb-2">
                  Drive more sales by responding to customer reviews
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Restaurants responding to reviews typically see an increase in sales and orders.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Ratings Summary Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Ratings during this period</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Data between 10/9/2025 - 10/15/2025
              </p>
              
              <div className="space-y-4">
                <div>
                  <div className="text-4xl font-bold mb-1">NA</div>
                  <p className="text-xs text-muted-foreground">
                    Not available due to 0 ratings
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold">0</span>
                    <span className="text-xs text-muted-foreground">ratings</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No ratings found
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RatingsReviewsDashboard;
