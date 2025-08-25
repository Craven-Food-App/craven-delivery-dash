import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Package, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DailyEarningsProps {
  user: any;
}

interface DailyStats {
  totalEarnings: number;
  completedOrders: number;
  averagePerOrder: number;
  hoursWorked: number;
}

const DailyEarningsTracker: React.FC<DailyEarningsProps> = ({ user }) => {
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    totalEarnings: 0,
    completedOrders: 0,
    averagePerOrder: 0,
    hoursWorked: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    fetchDailyEarnings();
    
    // Set up real-time subscription for earnings updates
    const channel = supabase
      .channel('earnings-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `assigned_craver_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.status === 'delivered') {
            fetchDailyEarnings();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchDailyEarnings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get today's date range (start and end of day)
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Fetch all delivered orders for today
      const { data: deliveredOrders, error } = await supabase
        .from('orders')
        .select('payout_cents, updated_at, created_at')
        .eq('assigned_craver_id', user.id)
        .eq('status', 'delivered')
        .gte('updated_at', startOfDay.toISOString())
        .lte('updated_at', endOfDay.toISOString());

      if (error) {
        console.error('Error fetching daily earnings:', error);
        return;
      }

      // Calculate stats
      const completedOrders = deliveredOrders?.length || 0;
      const totalEarnings = deliveredOrders?.reduce((sum, order) => sum + order.payout_cents, 0) || 0;
      const averagePerOrder = completedOrders > 0 ? totalEarnings / completedOrders : 0;
      
      // Calculate approximate hours worked (from first order to last order)
      let hoursWorked = 0;
      if (deliveredOrders && deliveredOrders.length > 0) {
        const times = deliveredOrders.map(order => new Date(order.updated_at).getTime());
        const earliest = Math.min(...times);
        const latest = Math.max(...times);
        hoursWorked = (latest - earliest) / (1000 * 60 * 60); // Convert to hours
      }

      setDailyStats({
        totalEarnings,
        completedOrders,
        averagePerOrder,
        hoursWorked: Math.max(hoursWorked, 0)
      });
      
    } catch (error) {
      console.error('Error calculating daily earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  if (!user) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Today's Earnings
          </CardTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Live
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Main earnings display */}
            <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {formatCurrency(dailyStats.totalEarnings)}
              </div>
              <p className="text-sm text-muted-foreground">Total earned today</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{dailyStats.completedOrders}</span>
                </div>
                <p className="text-xs text-muted-foreground">Orders</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{formatCurrency(dailyStats.averagePerOrder)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Per order</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{formatHours(dailyStats.hoursWorked)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>

            {/* Performance indicator */}
            {dailyStats.completedOrders > 0 && (
              <div className="text-center pt-2 border-t">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">
                    {dailyStats.hoursWorked > 0 
                      ? `${formatCurrency(dailyStats.totalEarnings / dailyStats.hoursWorked * 100)}/hour` 
                      : 'Great work!'
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Motivational message for no earnings */}
            {dailyStats.completedOrders === 0 && (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">
                  Start delivering to see your earnings! 🚗💨
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyEarningsTracker;