import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { generateSalesData } from "@/utils/restaurantDataGenerator";

const SalesDashboard = () => {
  const [dateRange, setDateRange] = useState("last7");
  const [chartView, setChartView] = useState<"sales" | "orders" | "ticket">("sales");
  
  const salesData = generateSalesData();

  const MetricCard = ({ title, value, change, isPositive }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground mb-2">{title}</div>
        <div className="text-3xl font-bold mb-2">{value}</div>
        <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(change)}%</span>
          <span className="text-muted-foreground ml-1">vs previous period</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Date Range Selector */}
      <div className="flex gap-4 items-center">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last7">Last 7 days</SelectItem>
            <SelectItem value="last30">Last 30 days</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">vs</span>
        <Select defaultValue="7days-prior">
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days-prior">7 days prior</SelectItem>
            <SelectItem value="14days-prior">14 days prior</SelectItem>
            <SelectItem value="30days-prior">30 days prior</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Gross sales" 
          value={`$${salesData.overview.grossSales.toLocaleString()}.00`}
          change={salesData.overview.grossSalesChange}
          isPositive={salesData.overview.grossSalesChange >= 0}
        />
        <MetricCard 
          title="Total orders" 
          value={salesData.overview.totalOrders.toLocaleString()}
          change={salesData.overview.totalOrdersChange}
          isPositive={salesData.overview.totalOrdersChange >= 0}
        />
        <MetricCard 
          title="Average ticket size" 
          value={`$${salesData.overview.avgTicket.toFixed(2)}`}
          change={salesData.overview.avgTicketChange}
          isPositive={salesData.overview.avgTicketChange >= 0}
        />
      </div>

      {/* Sales Over Time */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Sales over time</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant={chartView === "sales" ? "default" : "outline"} 
                size="sm"
                onClick={() => setChartView("sales")}
              >
                Sales
              </Button>
              <Button 
                variant={chartView === "orders" ? "default" : "outline"} 
                size="sm"
                onClick={() => setChartView("orders")}
              >
                Total orders
              </Button>
              <Button 
                variant={chartView === "ticket" ? "default" : "outline"} 
                size="sm"
                onClick={() => setChartView("ticket")}
              >
                Average ticket value
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={chartView === "sales" ? "current" : chartView === "orders" ? "currentOrders" : "currentTicket"} 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Current period"
              />
              <Line 
                type="monotone" 
                dataKey={chartView === "sales" ? "previous" : chartView === "orders" ? "previousOrders" : "previousTicket"} 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Previous period"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Day of Week Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by day of week</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData.dayOfWeekData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="current" fill="hsl(var(--primary))" name="Current period" />
              <Bar dataKey="previous" fill="hsl(var(--muted))" name="Previous period" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hour of Day Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by hour of day</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData.hourOfDayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesDashboard;
