import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Download, Heart, Star, Clock, Package, XCircle, Target, Store } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

const OperationsQualityDashboard = () => {
  const navigate = useNavigate();
  const sparklineData = [
    { value: 85 }, { value: 88 }, { value: 92 }, { value: 87 }, { value: 90 }, { value: 95 }, { value: 93 }
  ];

  const QualityCard = ({ icon: Icon, title, status, value, message, statusColor, sparkline = false }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusColor === 'green' ? 'bg-green-100' : statusColor === 'yellow' ? 'bg-yellow-100' : 'bg-muted'}`}>
            <Icon className={`w-6 h-6 ${statusColor === 'green' ? 'text-green-600' : statusColor === 'yellow' ? 'text-yellow-600' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{title}</h3>
            <p className="text-2xl font-bold mb-2">{value}</p>
            {sparkline && (
              <div className="h-12 mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
        <Button variant="link" className="p-0 h-auto text-sm">
          View details
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Description */}
      <p className="text-muted-foreground">
        A measure of how good of an experience you are providing to your customers.
      </p>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <Select defaultValue="this-month">
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This month</SelectItem>
            <SelectItem value="last-month">Last month</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Quality Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QualityCard 
          icon={Star}
          title="Ratings"
          status="Areas Requiring Your Attention"
          value="4.8 / 5.0"
          message="0 Ratings with a score of 1 or 2 since last week"
          statusColor="yellow"
        />
        
        <QualityCard 
          icon={Clock}
          title="Wait time"
          status="Areas On Track"
          value="12 mins"
          message="Average wait time is within target"
          statusColor="green"
        />
        
        <QualityCard 
          icon={Package}
          title="Orders"
          status="Areas On Track"
          value="0 mins late"
          message="There were no items with late orders"
          statusColor="green"
        />
        
        <QualityCard 
          icon={XCircle}
          title="Cancellations"
          status="Areas On Track"
          value="0.0% (0 out of 0)"
          message="There were no avoidable cancellations"
          statusColor="green"
          sparkline={true}
        />
        
        <QualityCard 
          icon={Target}
          title="Order accuracy"
          status="Areas On Track"
          value="100% (0 out of 0)"
          message="There were no items reported missing or incorrect"
          statusColor="green"
          sparkline={true}
        />
        
        <QualityCard 
          icon={Store}
          title="Downtime"
          status="Areas On Track"
          value="0 hours"
          message="There were no temporary deactivations"
          statusColor="green"
        />
      </div>

      {/* Get Rewarded Section */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Get rewarded for top notch operations</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Achieve excellence in operations and get recognized with special perks and visibility.
              </p>
              <Button 
                variant="link" 
                className="p-0 h-auto text-orange-600 font-semibold"
                onClick={() => navigate('/restaurant/most-loved')}
              >
                Learn more →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationsQualityDashboard;
