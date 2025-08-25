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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    usedToday: number;
  };
  referrals: {
    pending: number;
    completed: number;
    earnings: number;
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
  const [earnings] = useState<EarningsData>({
    today: {
      total: 87.50,
      deliveries: 8,
      activeTime: "4h 23m",
      basePay: 52.00,
      tips: 28.50,
      bonuses: 7.00
    },
    week: {
      total: 542.25,
      deliveries: 47,
      activeTime: "28h 15m",
      goal: 600,
      daysWorked: 5
    },
    lifetime: {
      total: 4247.85,
      deliveries: 389,
      totalTime: "245h 30m",
      avgPerDelivery: 10.92
    },
    instantPay: {
      available: 87.50,
      dailyLimit: 500,
      usedToday: 0
    },
    referrals: {
      pending: 2,
      completed: 3,
      earnings: 150
    }
  });

  const [deliveryHistory] = useState<DeliveryHistory[]>([
    {
      id: '1',
      date: 'Today 6:45 PM',
      restaurant: 'McDonald\'s',
      earnings: 12.50,
      basePay: 4.50,
      tip: 6.00,
      bonus: 2.00,
      distance: 2.3,
      time: '23 min'
    },
    {
      id: '2',
      date: 'Today 5:30 PM',
      restaurant: 'Chipotle',
      earnings: 15.75,
      basePay: 5.25,
      tip: 8.50,
      bonus: 2.00,
      distance: 3.1,
      time: '31 min'
    },
    {
      id: '3',
      date: 'Today 4:15 PM',
      restaurant: 'Taco Bell',
      earnings: 8.25,
      basePay: 4.00,
      tip: 4.25,
      bonus: 0,
      distance: 1.8,
      time: '18 min'
    }
  ]);

  const weekProgress = (earnings.week.total / earnings.week.goal) * 100;

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-md mx-auto p-4 space-y-4">
        
        {/* Today's Earnings Header */}
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-green-100 text-sm">Today's Earnings</p>
              <h1 className="text-4xl font-bold">${earnings.today.total.toFixed(2)}</h1>
              <div className="flex justify-center items-center gap-4 mt-3 text-green-100">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{earnings.today.activeTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">{earnings.today.deliveries} deliveries</span>
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
            <span className="text-xs font-bold">${earnings.instantPay.available.toFixed(2)}</span>
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
              <Badge variant="secondary">{earnings.week.daysWorked} days</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">${earnings.week.total.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">of ${earnings.week.goal} goal</span>
            </div>
            <Progress value={weekProgress} className="h-2" />
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="text-muted-foreground">Deliveries</p>
                <p className="font-semibold">{earnings.week.deliveries}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active Time</p>
                <p className="font-semibold">{earnings.week.activeTime}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg/Hour</p>
                <p className="font-semibold">${(earnings.week.total / parseFloat(earnings.week.activeTime.split('h')[0])).toFixed(2)}</p>
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
              <span className="font-semibold">${earnings.today.basePay.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Tips</span>
              </div>
              <span className="font-semibold">${earnings.today.tips.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Bonuses</span>
              </div>
              <span className="font-semibold">${earnings.today.bonuses.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center font-semibold">
              <span>Total</span>
              <span>${earnings.today.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Instant Pay */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Instant Pay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">${earnings.instantPay.available.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Available for instant transfer</p>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Daily limit</span>
              <span>${earnings.instantPay.dailyLimit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Used today</span>
              <span>${earnings.instantPay.usedToday.toFixed(2)}</span>
            </div>
            
            <Button className="w-full" size="lg">
              <Zap className="h-4 w-4 mr-2" />
              Cash Out Now - $1.99 fee
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Free transfers available with DasherDirect
            </p>
          </CardContent>
        </Card>

        {/* Referrals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Referral Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-500">{earnings.referrals.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{earnings.referrals.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">${earnings.referrals.earnings}</p>
                <p className="text-xs text-muted-foreground">Earned</p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <Gift className="h-4 w-4 mr-2" />
              Invite Friends - Earn $50 Each
            </Button>
          </CardContent>
        </Card>

        {/* Recent Deliveries */}
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
                    <p className="text-xs text-muted-foreground">{delivery.distance} mi • {delivery.time}</p>
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
                <p className="text-2xl font-bold">${earnings.lifetime.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{earnings.lifetime.deliveries}</p>
                <p className="text-xs text-muted-foreground">Deliveries</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{earnings.lifetime.totalTime}</p>
                <p className="text-xs text-muted-foreground">Active Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold">${earnings.lifetime.avgPerDelivery.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Avg/Delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tax Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between">
              <span>2024 Tax Summary</span>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              <span>1099 Forms</span>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              <span>Expense Tracking</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardContent className="pt-6">
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Earnings Settings</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};