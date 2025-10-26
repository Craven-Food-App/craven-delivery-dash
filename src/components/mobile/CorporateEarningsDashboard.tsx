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
  MoreHorizontal,
  Brain,
  Cpu,
  Database,
  Sparkles,
  Rocket,
  Satellite,
  Atom,
  Orbit,
  Layers,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Share2,
  Bookmark,
  Trophy,
  Crown,
  Gem,
  Flame,
  Lightning,
  Waves,
  Hexagon,
  Triangle,
  Circle,
  Square,
  Pentagon,
  Octagon,
  Maximize2,
  Minimize2,
  Filter,
  Search,
  Settings,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star,
  Moon,
  Sun,
  Thermometer,
  Wind,
  Cloud,
  Play,
  Pause,
  RotateCcw
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

interface AIInsight {
  id: string;
  type: 'optimization' | 'prediction' | 'alert' | 'achievement';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  icon: React.ReactNode;
  color: string;
  action?: string;
  value?: number;
}

interface PredictiveAnalytics {
  nextWeek: number;
  nextMonth: number;
  confidence: number;
  factors: string[];
  recommendations: string[];
}

interface PerformanceMetrics {
  efficiency: number;
  rating: number;
  rank: number;
  trends: number[];
  benchmarks: {
    top10: number;
    top25: number;
    average: number;
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
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [predictiveAnalytics, setPredictiveAnalytics] = useState<PredictiveAnalytics>({
    nextWeek: 1450,
    nextMonth: 6200,
    confidence: 89,
    factors: ['Historical patterns', 'Seasonal trends', 'Market conditions'],
    recommendations: ['Focus on weekend shifts', 'Target high-tip areas', 'Optimize route efficiency']
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    efficiency: 92,
    rating: 4.8,
    rank: 15,
    trends: [1200, 1180, 1250, 1320, 1280, 1350, 1250],
    benchmarks: {
      top10: 1800,
      top25: 1500,
      average: 1200
    }
  });

  const generateAIInsights = () => {
    const insights: AIInsight[] = [
      {
        id: '1',
        type: 'optimization',
        title: 'AI Optimization: Peak Hours',
        description: 'Your earnings increase 35% during 6-9 PM shifts',
        impact: 'high',
        confidence: 94,
        icon: <Brain className="h-5 w-5" />,
        color: 'bg-orange-500',
        action: 'Schedule Peak Hours',
        value: 35
      },
      {
        id: '2',
        type: 'prediction',
        title: 'Earnings Forecast',
        description: 'Next week projected: $1,450 (+12% from current)',
        impact: 'high',
        confidence: 89,
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'bg-green-500',
        value: 1450
      },
      {
        id: '3',
        type: 'achievement',
        title: 'Performance Milestone',
        description: 'You\'re in the top 15% of drivers this month',
        impact: 'medium',
        confidence: 96,
        icon: <Trophy className="h-5 w-5" />,
        color: 'bg-yellow-500',
        value: 15
      },
      {
        id: '4',
        type: 'alert',
        title: 'Efficiency Tip',
        description: 'Route optimization could save 20 minutes daily',
        impact: 'medium',
        confidence: 87,
        icon: <Lightning className="h-5 w-5" />,
        color: 'bg-blue-500',
        action: 'Optimize Routes'
      }
    ];
    setAiInsights(insights);
  };

  useEffect(() => {
    generateAIInsights();
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
        {/* Ultra High-Tech AI Header */}
        <div className="bg-gradient-to-br from-orange-900 via-orange-800 to-red-900 text-white px-6 py-6 safe-area-top relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-4 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <div className="absolute top-8 right-8 w-1 h-1 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute bottom-4 left-8 w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"></div>
            <div className="absolute bottom-8 right-4 w-2 h-2 bg-orange-300 rounded-full animate-pulse"></div>
          </div>
          
          <div className="relative z-10">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2">
                AI Earnings Command
              </h1>
              <p className="text-orange-200 text-sm">Neural network optimized earnings analytics</p>
            </div>

            {/* AI Control Panel */}
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIInsights(!showAIInsights)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Brain className="h-4 w-4 mr-1" />
                AI Insights
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPredictions(!showPredictions)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Cpu className="h-4 w-4 mr-1" />
                Predictions
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Database className="h-4 w-4 mr-1" />
                Analytics
              </Button>
            </div>

            {/* Payment & Cashout Buttons */}
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Settings
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                <Zap className="h-4 w-4 mr-2" />
                Cash Out ${instantPay.available.toFixed(2)}
              </Button>
            </div>

            <p className="text-center text-orange-200 text-sm">Track your performance and income with AI</p>
          </div>
        </div>

        {/* AI Insights Dashboard */}
        {showAIInsights && (
          <div className="p-6 space-y-4">
            <Card className="bg-gradient-to-br from-orange-900 to-red-900 text-white border-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-6 w-6 text-orange-400" />
                    <h2 className="text-lg font-semibold">AI Insights</h2>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className={`${insight.color} bg-opacity-20 backdrop-blur-sm rounded-lg p-4 border border-white/20`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        {insight.icon}
                        <div>
                          <h3 className="font-semibold text-white">{insight.title}</h3>
                          <p className="text-sm text-white/80">{insight.description}</p>
                        </div>
                        <div className="text-xs text-white/60 ml-auto">{insight.confidence}%</div>
                      </div>
                      {insight.action && (
                        <Button
                          size="sm"
                          className="mt-2 bg-white/20 hover:bg-white/30 text-white text-xs"
                        >
                          {insight.action}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Predictive Analytics */}
        {showPredictions && (
          <div className="p-6 space-y-4">
            <Card className="bg-gradient-to-br from-purple-900 to-blue-900 text-white border-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-6 w-6 text-purple-400" />
                    <h2 className="text-lg font-semibold">Predictive Analytics</h2>
                  </div>
                  <div className="text-xs text-purple-300">{predictiveAnalytics.confidence}% confidence</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-sm text-white/70 mb-1">Next Week</div>
                    <div className="text-2xl font-bold text-white">${predictiveAnalytics.nextWeek}</div>
                    <div className="text-xs text-green-400">+12% from current</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-sm text-white/70 mb-1">Next Month</div>
                    <div className="text-2xl font-bold text-white">${predictiveAnalytics.nextMonth}</div>
                    <div className="text-xs text-blue-400">+8% from last month</div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-sm font-semibold text-white mb-2">AI Recommendations</div>
                  <ul className="text-sm text-white/80 space-y-1">
                    {predictiveAnalytics.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
