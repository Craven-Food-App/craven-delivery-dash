import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Zap,
  Activity,
  Award,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EarningsData {
  currentPeriod: {
    total: number;
    deliveries: number;
    activeTime: string;
    avgPerHour: number;
    avgPerDelivery: number;
    tips: number;
    basePay: number;
    bonuses: number;
  };
  previousPeriod: {
    total: number;
    deliveries: number;
    activeTime: string;
  };
  weeklyBreakdown: {
    day: string;
    earnings: number;
    deliveries: number;
    hours: number;
  }[];
  monthlyTrend: {
    month: string;
    earnings: number;
    deliveries: number;
  }[];
  lifetime: {
    total: number;
    deliveries: number;
    totalHours: number;
    avgPerHour: number;
    avgPerDelivery: number;
  };
  goals: {
    weekly: number;
    monthly: number;
    yearly: number;
  };
  instantPay: {
    available: number;
    dailyLimit: number;
    used: number;
  };
}

interface DeliveryHistory {
  id: string;
  date: string;
  restaurant: string;
  earnings: number;
  distance: number;
  time: string;
  tip: number;
  basePay: number;
}

const CorporateEarningsDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setEarningsData({
        currentPeriod: {
          total: 127.45,
          deliveries: 8,
          activeTime: '6h 30m',
          avgPerHour: 19.61,
          avgPerDelivery: 15.93,
          tips: 32.25,
          basePay: 85.20,
          bonuses: 10.00
        },
        previousPeriod: {
          total: 98.75,
          deliveries: 6,
          activeTime: '5h 15m'
        },
        weeklyBreakdown: [
          { day: 'Mon', earnings: 35.20, deliveries: 2, hours: 2.5 },
          { day: 'Tue', earnings: 46.50, deliveries: 3, hours: 3.0 },
          { day: 'Wed', earnings: 0, deliveries: 0, hours: 0 },
          { day: 'Thu', earnings: 45.75, deliveries: 3, hours: 1.0 },
          { day: 'Fri', earnings: 0, deliveries: 0, hours: 0 },
          { day: 'Sat', earnings: 0, deliveries: 0, hours: 0 },
          { day: 'Sun', earnings: 0, deliveries: 0, hours: 0 }
        ],
        monthlyTrend: [
          { month: 'Jan', earnings: 1247.80, deliveries: 89 },
          { month: 'Feb', earnings: 1189.45, deliveries: 85 },
          { month: 'Mar', earnings: 1356.20, deliveries: 92 },
          { month: 'Apr', earnings: 1423.15, deliveries: 95 },
          { month: 'May', earnings: 1389.75, deliveries: 88 },
          { month: 'Jun', earnings: 1456.30, deliveries: 96 }
        ],
        lifetime: {
          total: 1247.80,
          deliveries: 89,
          totalHours: 52.15,
          avgPerHour: 23.94,
          avgPerDelivery: 14.02
        },
        goals: {
          weekly: 500,
          monthly: 2000,
          yearly: 24000
        },
        instantPay: {
          available: 127.45,
          dailyLimit: 500,
          used: 0
        }
      });

      setDeliveryHistory([
        {
          id: "delivery-004",
          date: new Date().toISOString(),
          restaurant: "Chipotle Mexican Grill",
          earnings: 16.50,
          distance: 2.3,
          time: '18 min',
          tip: 4.50,
          basePay: 12.00
        },
        {
          id: "delivery-003",
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          restaurant: "Panda Express",
          earnings: 14.75,
          distance: 1.8,
          time: '12 min',
          tip: 2.75,
          basePay: 12.00
        },
        {
          id: "delivery-002",
          date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          restaurant: "McDonald's",
          earnings: 14.50,
          distance: 1.2,
          time: '15 min',
          tip: 2.50,
          basePay: 12.00
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Earnings Data</h2>
          <p className="text-gray-600">Unable to load earnings information.</p>
        </div>
      </div>
    );
  }

  const current = earningsData.currentPeriod;
  const previous = earningsData.previousPeriod;
  const lifetime = earningsData.lifetime;
  const instantPay = earningsData.instantPay;

  // Calculate growth percentages
  const earningsGrowth = ((current.total - previous.total) / previous.total) * 100;
  const deliveriesGrowth = ((current.deliveries - previous.deliveries) / previous.deliveries) * 100;

  // Calculate goal progress
  const weeklyGoalProgress = (current.total / earningsData.goals.weekly) * 100;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 safe-area-top">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Earnings Dashboard</h1>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Button variant="outline" size="sm">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Settings
              </Button>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                <Zap className="h-4 w-4 mr-2" />
                Cash Out ${instantPay.available.toFixed(2)}
              </Button>
            </div>
            <p className="text-sm text-gray-600">Track your performance and income</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Earnings */}
            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex items-center space-x-1">
                    {earningsGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${earningsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(earningsGrowth).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">${current.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">This Week</p>
                </div>
              </CardContent>
            </Card>

            {/* Deliveries */}
            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex items-center space-x-1">
                    {deliveriesGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${deliveriesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(deliveriesGrowth).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{current.deliveries}</p>
                  <p className="text-sm text-gray-600">Deliveries</p>
                </div>
              </CardContent>
            </Card>

            {/* Average per Hour */}
            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    <Award className="h-3 w-3 mr-1" />
                    Top 10%
                  </Badge>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">${current.avgPerHour.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Per Hour</p>
                </div>
              </CardContent>
            </Card>

            {/* Goal Progress */}
            <Card className="bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-orange-600">
                    {weeklyGoalProgress.toFixed(0)}%
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">${earningsData.goals.weekly}</p>
                  <p className="text-sm text-gray-600">Weekly Goal</p>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-orange-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, weeklyGoalProgress)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Weekly Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-gray-600" />
                  Weekly Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {earningsData.weeklyBreakdown.map((day, index) => {
                    const maxEarnings = Math.max(...earningsData.weeklyBreakdown.map(d => d.earnings));
                    const height = maxEarnings > 0 ? (day.earnings / maxEarnings) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-12 text-sm font-medium text-gray-600">{day.day}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div 
                              className="bg-orange-500 rounded-full h-3 transition-all duration-500"
                              style={{ width: `${Math.max(10, height)}%` }}
                            />
                            <span className="text-sm font-medium text-gray-900">
                              ${day.earnings.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {day.deliveries} deliveries • {day.hours}h active
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Earnings Composition */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-gray-600" />
                  Earnings Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm text-gray-600">Base Pay</span>
                    </div>
                    <span className="font-medium">${current.basePay.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm text-gray-600">Tips</span>
                    </div>
                    <span className="font-medium">${current.tips.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-purple-500 rounded"></div>
                      <span className="text-sm text-gray-600">Bonuses</span>
                    </div>
                    <span className="font-medium">${current.bonuses.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-lg">${current.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Deliveries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Deliveries</span>
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliveryHistory.map((delivery, index) => (
                  <div key={delivery.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{delivery.restaurant}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(delivery.date).toLocaleDateString()} • {delivery.time} • {delivery.distance}mi
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${delivery.earnings.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        ${delivery.basePay.toFixed(2)} + ${delivery.tip.toFixed(2)} tip
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lifetime Stats */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Lifetime Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">${lifetime.total.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{lifetime.deliveries}</p>
                    <p className="text-sm text-gray-600">Total Deliveries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">${lifetime.avgPerHour.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Avg per Hour</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">${lifetime.avgPerDelivery.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Avg per Delivery</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateEarningsDashboard;
