// @ts-nocheck
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
  Award,
  HelpCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { InstantCashoutModal } from './InstantCashoutModal';

interface DailyEarnings {
  day: string;
  date: number;
  amount: number;
}

interface WeeklyEarnings {
  weekStart: string;
  weekEnd: string;
  total: number;
  isCurrentWeek: boolean;
}

interface EarningsData {
  today: {
    total: number;
    deliveries: number;
    activeTime: string;
    basePay: number;
    tips: number;
    bonuses: number;
  };
  currentWeek: {
    total: number;
    deliveries: number;
    activeTime: string;
    goal: number;
    daysWorked: number;
    dailyEarnings: DailyEarnings[];
    weekRange: string;
  };
  weeklyHistory: WeeklyEarnings[];
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
  const [showCashoutModal, setShowCashoutModal] = useState(false);

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

      // Get driver earnings from the earnings table
      const { data: earnings } = await supabase
        .from('driver_earnings')
        .select('*')
        .eq('driver_id', user.id)
        .order('earned_at', { ascending: false });

      // Get completed orders for this driver
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('id, payout_cents, created_at, distance_km, pickup_address, restaurants(name)')
        .eq('driver_id', user.id)
        .eq('order_status', 'delivered')
        .order('created_at', { ascending: false });

      // Use earnings data if available, otherwise use orders
      const earningsToUse = earnings && earnings.length > 0 ? earnings : [];
      const ordersToUse = completedOrders || [];

      if (earningsToUse.length === 0 && ordersToUse.length === 0) {
        const emptyDailyEarnings = Array.from({ length: 7 }, (_, i) => ({
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
          date: new Date().getDate() - new Date().getDay() + i,
          amount: 0
        }));
        
        setEarningsData({
          today: { total: 0, deliveries: 0, activeTime: '0h 0m', basePay: 0, tips: 0, bonuses: 0 },
          currentWeek: { 
            total: 0, 
            deliveries: 0, 
            activeTime: '0h 0m', 
            goal: 500, 
            daysWorked: 0,
            dailyEarnings: emptyDailyEarnings,
            weekRange: 'Current Week'
          },
          weeklyHistory: [],
          lifetime: { total: 0, deliveries: 0, totalTime: '0h 0m', avgPerDelivery: 0 },
          instantPay: { available: 0, dailyLimit: 500, used: 0 }
        });
        setDeliveryHistory([]);
        return;
      }

      // Calculate today's time window and totals
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Earnings rows for today (if present)
      const todayEarnings = earningsToUse.filter((earning) =>
        new Date(earning.earned_at) >= today
      );

      // Orders completed today (fallback when earnings rows are missing)
      const todayOrders = ordersToUse.filter((order) => {
        const d = new Date(order.created_at);
        d.setHours(0, 0, 0, 0);
        return d >= today;
      });

      // Today's total, prefer earnings rows, fallback to orders payout
      const todayTotal = (
        todayEarnings.length > 0
          ? todayEarnings.reduce((sum, earning) => sum + (earning.total_cents || 0), 0)
          : todayOrders.reduce((sum, order) => sum + (order.payout_cents || 0), 0)
      ) / 100;

      // Calculate this week's range and totals
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekEarnings = earningsToUse.filter((earning) => {
        const d = new Date(earning.earned_at);
        return d >= weekStart && d <= weekEnd;
      });

      // Orders within this week (fallback)
      const weekOrders = ordersToUse.filter((order) => {
        const d = new Date(order.created_at);
        return d >= weekStart && d <= weekEnd;
      });

      // Weekly total, prefer earnings rows, fallback to orders payout
      const weekTotal = (
        weekEarnings.length > 0
          ? weekEarnings.reduce((sum, earning) => sum + (earning.total_cents || 0), 0)
          : weekOrders.reduce((sum, order) => sum + (order.payout_cents || 0), 0)
      ) / 100;

      // Create daily earnings breakdown for current week
      const dailyEarnings = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        day.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        // Earnings rows on this day
        const dayEarnings = weekEarnings.filter((earning) => {
          const earningDate = new Date(earning.earned_at);
          return earningDate >= day && earningDate <= dayEnd;
        });

        // Orders on this day (fallback)
        const dayOrders = weekOrders.filter((order) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= day && orderDate <= dayEnd;
        });

        const cents =
          dayEarnings.length > 0
            ? dayEarnings.reduce((sum, earning) => sum + (earning.total_cents || 0), 0)
            : dayOrders.reduce((sum, order) => sum + (order.payout_cents || 0), 0);
        
        return {
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
          date: day.getDate(),
          amount: cents / 100,
        };
      });

      // Calculate weekly history (last 8 weeks)
      const weeklyHistory = [];
      for (let i = 1; i <= 8; i++) {
        const historyWeekStart = new Date(weekStart);
        historyWeekStart.setDate(weekStart.getDate() - (i * 7));
        const historyWeekEnd = new Date(historyWeekStart);
        historyWeekEnd.setDate(historyWeekStart.getDate() + 6);
        
        const historyWeekOrders = completedOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= historyWeekStart && orderDate <= historyWeekEnd;
        });
        
        const historyWeekTotal = historyWeekOrders.reduce((sum, order) => sum + order.payout_cents, 0) / 100;
        
        if (historyWeekTotal > 0) {
          weeklyHistory.push({
            weekStart: historyWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            weekEnd: historyWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            total: historyWeekTotal,
            isCurrentWeek: false
          });
        }
      }

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
        currentWeek: {
          total: weekTotal,
          deliveries: weekOrders.length,
          activeTime: `${Math.floor(weekOrders.length * 0.5)}h ${(weekOrders.length * 30) % 60}m`,
          goal: 500,
          daysWorked: new Set(weekOrders.map(o => 
            new Date(o.created_at).toDateString()
          )).size,
          dailyEarnings: dailyEarnings,
          weekRange: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        },
        weeklyHistory: weeklyHistory,
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
        const earnings = (order.payout_cents || 0) / 100;
        const breakdown = estimateBreakdown(earnings);
        
        return {
          id: order.id || index.toString(),
          date: orderDate.toLocaleDateString() === today.toLocaleDateString() 
            ? `Today ${orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : orderDate.toLocaleDateString(),
          restaurant: (order.restaurants && order.restaurants.name) ? order.restaurants.name : 'Restaurant',
          earnings: earnings,
          basePay: breakdown.basePay,
          tip: breakdown.tips,
          bonus: breakdown.bonuses,
          distance: ((order.distance_km || 0) * 0.621371), // Convert to miles
          time: `${Math.ceil(((order.distance_km || 0) * 2))} min`
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

  const maxWeeklyEarning = Math.max(...earningsData.currentWeek.dailyEarnings.map(d => d.amount));

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Earnings Header with Gradient Background */}
      <div className="bg-gradient-to-b from-primary to-primary-glow text-white">
        <div className="flex items-center justify-between p-4 pt-12">
          <h1 className="text-xl font-semibold">Earnings</h1>
          <HelpCircle className="h-6 w-6" />
        </div>
        
        <div className="px-4 pb-6">
          <p className="text-orange-100 text-center mb-6">Confirmed Earnings for Current Week</p>
          
          {/* Daily Earnings Bar Chart */}
          <div className="flex items-end justify-center gap-2 mb-6 h-32">
            {earningsData.currentWeek.dailyEarnings.map((day, index) => {
              const height = maxWeeklyEarning > 0 ? (day.amount / maxWeeklyEarning) * 100 : 0;
              const isToday = day.date === new Date().getDate();
              
              return (
                <div key={index} className="flex flex-col items-center w-10">
                  {/* Fixed container for amount label */}
                  <div className="h-6 flex items-start justify-center mb-1">
                    {day.amount > 0 && (
                      <span className="text-white text-xs font-medium whitespace-nowrap">
                        ${day.amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {/* Fixed container for bars */}
                  <div className="h-16 flex items-end justify-center mb-2">
                    <div 
                      className={`w-8 ${day.amount > 0 ? 'bg-green-400' : 'bg-primary/30'} rounded-t transition-all duration-300`}
                      style={{ height: `${Math.max(height * 0.6, day.amount > 0 ? 16 : 4)}px` }}
                    />
                  </div>
                  
                  {/* Fixed container for day/date labels */}
                  <div className="h-8 flex flex-col items-center justify-start w-full">
                    <div className={`text-xs leading-tight ${isToday ? 'text-white font-semibold' : 'text-orange-200'}`}>
                      {day.day}
                    </div>
                    <div className={`text-xs leading-tight ${isToday ? 'text-white font-semibold' : 'text-orange-200'}`}>
                      {day.date}
                    </div>
                  </div>
                  
                  {/* Today indicator */}
                  {isToday && (
                    <div className="w-0.5 h-4 bg-white/60 mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Current Week Summary */}
        <div className="bg-primary/20 mx-4 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Current Week</p>
              <p className="text-white font-medium">{earningsData.currentWeek.weekRange}</p>
            </div>
            <div className="text-right">
              <p className="text-orange-100 text-sm">Confirmed Earnings</p>
              <p className="text-green-400 text-xl font-bold">${earningsData.currentWeek.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* White Background Content */}
      <div className="bg-white">
        {/* Weekly Earnings Summary */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Weekly Earnings Summary</h2>
            <Info className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm text-gray-600 mb-6">
            For more details about your earnings, including when you can expect to get them, you can visit the Crave'n portal.
          </p>
          
          {/* Year Header */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">2025</h3>
          
          {/* Weekly History */}
          <div className="space-y-4">
            {earningsData.weeklyHistory.map((week, index) => (
              <div key={index} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="text-primary font-medium">
                    {week.weekStart} - {week.weekEnd}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    ${week.total.toFixed(2)}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
            
            {/* Empty weeks with dashes */}
            {Array.from({ length: Math.max(0, 6 - earningsData.weeklyHistory.length) }, (_, i) => (
              <div key={`empty-${i}`} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="text-primary font-medium">
                    Week {earningsData.weeklyHistory.length + i + 1}
                  </span>
                </div>
                <span className="text-lg font-semibold text-gray-900">-</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              className="h-16 flex flex-col items-center justify-center gap-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0"
              onClick={() => setShowCashoutModal(true)}
              disabled={earningsData.instantPay.available < 0.50}
            >
              <Zap className="h-5 w-5" />
              <span className="text-xs">Instant Pay</span>
              <span className="text-xs font-bold">${earningsData.instantPay.available.toFixed(2)}</span>
            </Button>
            <Button 
              className="h-16 flex flex-col items-center justify-center gap-1"
              variant="outline"
            >
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="text-xs">Payment</span>
              <span className="text-xs">Methods</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Instant Cashout Modal */}
      <InstantCashoutModal
        isOpen={showCashoutModal}
        onClose={() => setShowCashoutModal(false)}
        availableAmount={earningsData.instantPay.available}
        onSuccess={() => {
          // Refresh earnings data after successful cashout
          fetchEarningsData();
        }}
      />
    </div>
  );
};