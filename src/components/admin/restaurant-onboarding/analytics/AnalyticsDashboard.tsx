import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Target,
  Calendar,
  RefreshCw,
  Download,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import type { RestaurantOnboardingData, OnboardingStats } from '../types';
import { calculateStats } from '../utils/helpers';

interface AnalyticsData {
  stats: OnboardingStats;
  conversionFunnel: Array<{
    stage: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  timeToLaunch: Array<{
    period: string;
    avgDays: number;
    count: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    applications: number;
    approvals: number;
    launches: number;
  }>;
  teamPerformance: Array<{
    admin: string;
    processed: number;
    avgTime: number;
    quality: number;
  }>;
  revenueForecast: Array<{
    month: string;
    projected: number;
    actual: number;
    restaurants: number;
  }>;
}

interface AnalyticsDashboardProps {
  restaurants: RestaurantOnboardingData[];
}

export function AnalyticsDashboard({ restaurants }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    generateAnalytics();
  }, [restaurants, timeRange]);

  const generateAnalytics = () => {
    setLoading(true);
    
    // Calculate basic stats
    const stats = calculateStats(restaurants);
    
    // Generate conversion funnel
    const conversionFunnel = [
      { stage: 'Applications', count: stats.total, percentage: 100, color: '#8884d8' },
      { stage: 'Documents', count: stats.total - stats.new, percentage: Math.round(((stats.total - stats.new) / stats.total) * 100), color: '#82ca9d' },
      { stage: 'Under Review', count: stats.pendingReview, percentage: Math.round((stats.pendingReview / stats.total) * 100), color: '#ffc658' },
      { stage: 'In Progress', count: stats.inProgress, percentage: Math.round((stats.inProgress / stats.total) * 100), color: '#ff7300' },
      { stage: 'Ready', count: stats.readyToLaunch, percentage: Math.round((stats.readyToLaunch / stats.total) * 100), color: '#00c49f' },
      { stage: 'Live', count: stats.live, percentage: Math.round((stats.live / stats.total) * 100), color: '#0088fe' },
    ];

    // Generate time to launch data
    const timeToLaunch = [
      { period: '0-7 days', avgDays: 4.2, count: 12 },
      { period: '8-14 days', avgDays: 11.5, count: 8 },
      { period: '15-21 days', avgDays: 18.3, count: 5 },
      { period: '22+ days', avgDays: 28.7, count: 3 },
    ];

    // Generate weekly trends (mock data for now)
    const weeklyTrends = [
      { week: 'Week 1', applications: 15, approvals: 12, launches: 8 },
      { week: 'Week 2', applications: 22, approvals: 18, launches: 14 },
      { week: 'Week 3', applications: 18, approvals: 16, launches: 12 },
      { week: 'Week 4', applications: 25, approvals: 21, launches: 18 },
      { week: 'Week 5', applications: 20, approvals: 17, launches: 15 },
      { week: 'Week 6', applications: 28, approvals: 24, launches: 20 },
    ];

    // Generate team performance (mock data)
    const teamPerformance = [
      { admin: 'Admin A', processed: 45, avgTime: 3.2, quality: 98 },
      { admin: 'Admin B', processed: 38, avgTime: 4.1, quality: 96 },
      { admin: 'Admin C', processed: 42, avgTime: 2.8, quality: 99 },
      { admin: 'Admin D', processed: 35, avgTime: 3.7, quality: 97 },
    ];

    // Generate revenue forecast
    const revenueForecast = [
      { month: 'Jan', projected: 12500, actual: 11800, restaurants: 8 },
      { month: 'Feb', projected: 15800, actual: 16200, restaurants: 12 },
      { month: 'Mar', projected: 18200, actual: 17500, restaurants: 15 },
      { month: 'Apr', projected: 21500, actual: 22100, restaurants: 18 },
      { month: 'May', projected: 24800, actual: 23900, restaurants: 22 },
      { month: 'Jun', projected: 28100, actual: 0, restaurants: 0 },
    ];

    setAnalyticsData({
      stats,
      conversionFunnel,
      timeToLaunch,
      weeklyTrends,
      teamPerformance,
      revenueForecast,
    });
    
    setLoading(false);
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Exporting analytics data...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Generating analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  const { stats, conversionFunnel, timeToLaunch, weeklyTrends, teamPerformance, revenueForecast } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Deep insights into restaurant onboarding performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-900">{stats.conversionRate}%</div>
                <p className="text-xs text-blue-700">
                  {stats.live} of {stats.total} restaurants
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Avg. Time to Launch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">{stats.avgTimeToLaunch}d</div>
                <p className="text-xs text-green-700">Days from app to live</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-900">{stats.thisMonth}</div>
                <p className="text-xs text-purple-700">New applications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Active Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-900">{stats.inProgress + stats.pendingReview}</div>
                <p className="text-xs text-orange-700">In progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="funnel" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="trends">Weekly Trends</TabsTrigger>
          <TabsTrigger value="performance">Team Performance</TabsTrigger>
          <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
        </TabsList>

        {/* Conversion Funnel */}
        <TabsContent value="funnel" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Conversion Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conversionFunnel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Time to Launch Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={timeToLaunch}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ period, count }) => `${period}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {timeToLaunch.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Weekly Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Application & Launch Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="applications" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="approvals" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  <Area type="monotone" dataKey="launches" stackId="1" stroke="#ffc658" fill="#ffc658" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={teamPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="admin" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="processed" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Team Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamPerformance.map((admin, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {admin.admin.split(' ')[1]}
                      </div>
                      <div>
                        <p className="font-semibold">{admin.admin}</p>
                        <p className="text-sm text-muted-foreground">{admin.processed} restaurants processed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{admin.avgTime}d</p>
                        <p className="text-muted-foreground">Avg. Time</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{admin.quality}%</p>
                        <p className="text-muted-foreground">Quality</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Forecast */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Forecast vs Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueForecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="projected" stroke="#8884d8" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="actual" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Projected Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  ${revenueForecast.reduce((sum, month) => sum + month.projected, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Actual Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  ${revenueForecast.reduce((sum, month) => sum + month.actual, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Total Restaurants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  {revenueForecast.reduce((sum, month) => sum + month.restaurants, 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
