import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Calendar,
  CreditCard,
  Zap,
  Gift,
  FileText,
  Target,
  ChevronRight,
  Download,
  Settings,
  PiggyBank,
  Users,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface EarningsData {
  today: {
    total: number;
    deliveries: number;
    activeTime: string;
    basePay: number;
    tips: number;
    bonuses: number;
  };
  week: {
    total: number;
    deliveries: number;
    activeTime: string;
    goal: number;
    daysWorked: number;
  };
  lifetime: {
    total: number;
    deliveries: number;
    totalTime: string;
    avgPerDelivery: number;
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
  basePay: number;
  tip: number;
  bonus: number;
  distance: number;
  time: string;
}

export const EarningsSection: React.FC = () => {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get driver profile
      const { data: driverProfile } = await supabase
        .from('driver_profiles')
        .select('total_deliveries, rating')
        .eq('user_id', user.id)
        .single();

      // Get completed orders for this driver
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('id, payout_cents, created_at, distance_km, pickup_name')
        .eq('assigned_craver_id', user.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });

      if (!completedOrders || completedOrders.length === 0) {
        setEarningsData({
          today: { total: 0, deliveries: 0, activeTime: '0h 0m', basePay: 0, tips: 0, bonuses: 0 },
          week: { total: 0, deliveries: 0, activeTime: '0h 0m', goal: 500, daysWorked: 0 },
          lifetime: { total: 0, deliveries: 0, totalTime: '0h 0m', avgPerDelivery: 0 },
          instantPay: { available: 0, dailyLimit: 500, used: 0 }
        });
        setDeliveryHistory([]);
        return;
      }

      // Calculate today's earnings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = completedOrders.filter(order => 
        new Date(order.created_at) >= today
      );
      const todayTotal = todayOrders.reduce((sum, order) => sum + order.payout_cents, 0) / 100;

      // Calculate this week's earnings
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekOrders = completedOrders.filter(order => 
        new Date(order.created_at) >= weekStart
      );
      const weekTotal = weekOrders.reduce((sum, order) => sum + order.payout_cents, 0) / 100;

      // Calculate lifetime earnings
      const lifetimeTotal = completedOrders.reduce((sum, order) => sum + order.payout_cents, 0) / 100;
      const lifetimeDeliveries = driverProfile?.total_deliveries || completedOrders.length;
      const avgPerDelivery = lifetimeDeliveries > 0 ? lifetimeTotal / lifetimeDeliveries : 0;

      // Estimate breakdown (in a real app, you'd track these separately)
      const estimateBreakdown = (total: number) => ({
        basePay: total * 0.65,
        tips: total * 0.25,
        bonuses: total * 0.10
      });

      const todayBreakdown = estimateBreakdown(todayTotal);

      setEarningsData({
        today: {
          total: todayTotal,
          deliveries: todayOrders.length,
          activeTime: `${todayOrders.length * 0.5}h ${(todayOrders.length * 30) % 60}m`,
          ...todayBreakdown
        },
        week: {
          total: weekTotal,
          deliveries: weekOrders.length,
          activeTime: `${Math.floor(weekOrders.length * 0.5)}h ${(weekOrders.length * 30) % 60}m`,
          goal: 500,
          daysWorked: new Set(weekOrders.map(o => 
            new Date(o.created_at).toDateString()
          )).size
        },
        lifetime: {
          total: lifetimeTotal,
          deliveries: lifetimeDeliveries,
          totalTime: `${Math.floor(lifetimeDeliveries * 0.5)}h ${(lifetimeDeliveries * 30) % 60}m`,
          avgPerDelivery: avgPerDelivery
        },
        instantPay: {
          available: Math.max(0, todayTotal - 10), // Keep $10 minimum
          dailyLimit: 500,
          used: 0
        }
      });

      // Create delivery history from recent orders
      const recentHistory = completedOrders.slice(0, 5).map((order, index) => {
        const orderDate = new Date(order.created_at);
        const earnings = order.payout_cents / 100;
        const breakdown = estimateBreakdown(earnings);
        
        return {
          id: order.id || index.toString(),
          date: orderDate.toLocaleDateString() === today.toLocaleDateString() 
            ? `Today ${orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : orderDate.toLocaleDateString(),
          restaurant: order.pickup_name || 'Restaurant',
          earnings: earnings,
          basePay: breakdown.basePay,
          tip: breakdown.tips,
          bonus: breakdown.bonuses,
          distance: order.distance_km * 0.621371, // Convert to miles
          time: `${Math.ceil(order.distance_km * 2)} min`
        };
      });

      setDeliveryHistory(recentHistory);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-16">
        <div className="text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-64 bg-muted rounded-lg mx-auto"></div>
            <div className="h-4 w-32 bg-muted rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-16">
        <div className="text-center">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Earnings Yet</h2>
          <p className="text-muted-foreground">Complete your first delivery to see your earnings!</p>
        </div>
      </div>
    );
  }

  const weekProgress = earningsData.week.goal > 0 ? (earningsData.week.total / earningsData.week.goal) * 100 : 0;

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-md mx-auto p-4 space-y-4">
        
        {/* Today's Earnings Header */}
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-green-100 text-sm">Today's Earnings</p>
              <h1 className="text-4xl font-bold">${earningsData.today.total.toFixed(2)}</h1>
              <div className="flex justify-center items-center gap-4 mt-3 text-green-100">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{earningsData.today.activeTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">{earningsData.today.deliveries} deliveries</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="h-16 flex flex-col items-center justify-center gap-1"
            variant="outline"
          >
            <Zap className="h-5 w-5 text-yellow-500" />
            <span className="text-xs">Instant Pay</span>
            <span className="text-xs font-bold">${earningsData.instantPay.available.toFixed(2)}</span>
          </Button>
          <Button 
            className="h-16 flex flex-col items-center justify-center gap-1"
            variant="outline"
          >
            <CreditCard className="h-5 w-5 text-blue-500" />
            <span className="text-xs">Payment</span>
            <span className="text-xs">Methods</span>
          </Button>
        </div>

        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                This Week
              </div>
              <Badge variant="secondary">{earningsData.week.daysWorked} days</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">${earningsData.week.total.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">of ${earningsData.week.goal} goal</span>
            </div>
            <Progress value={weekProgress} className="h-2" />
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="text-muted-foreground">Deliveries</p>
                <p className="font-semibold">{earningsData.week.deliveries}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active Time</p>
                <p className="font-semibold">{earningsData.week.activeTime}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg/Hour</p>
                <p className="font-semibold">
                  ${earningsData.week.deliveries > 0 ? (earningsData.week.total / (earningsData.week.deliveries * 0.5)).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Today's Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Base Pay</span>
              </div>
              <span className="font-semibold">${earningsData.today.basePay.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Tips</span>
              </div>
              <span className="font-semibold">${earningsData.today.tips.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Bonuses</span>
              </div>
              <span className="font-semibold">${earningsData.today.bonuses.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center font-semibold">
              <span>Total</span>
              <span>${earningsData.today.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Deliveries */}
        {deliveryHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Deliveries
                </div>
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deliveryHistory.map((delivery) => (
                <div key={delivery.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{delivery.restaurant}</p>
                      <p className="text-xs text-muted-foreground">{delivery.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${delivery.earnings.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{delivery.distance.toFixed(1)} mi • {delivery.time}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Base: ${delivery.basePay.toFixed(2)}</span>
                    <span>Tip: ${delivery.tip.toFixed(2)}</span>
                    {delivery.bonus > 0 && <span>Bonus: ${delivery.bonus.toFixed(2)}</span>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Lifetime Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Lifetime Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">${earningsData.lifetime.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{earningsData.lifetime.deliveries}</p>
                <p className="text-xs text-muted-foreground">Deliveries</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{earningsData.lifetime.totalTime}</p>
                <p className="text-xs text-muted-foreground">Active Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold">${earningsData.lifetime.avgPerDelivery.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Avg/Delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};