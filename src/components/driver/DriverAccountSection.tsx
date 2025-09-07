// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AccountSection } from '@/components/account/AccountSection';
import { 
  DollarSign, 
  Star, 
  Package, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Car,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DriverStats {
  total_earnings: number;
  weekly_earnings: number;
  total_deliveries: number;
  average_rating: number;
  active_hours: number;
}

interface EarningsData {
  id: string;
  amount_cents: number;
  tip_cents: number;
  total_cents: number;
  earned_at: string;
  order_id: string;
}

export const DriverAccountSection = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DriverStats>({
    total_earnings: 0,
    weekly_earnings: 0,
    total_deliveries: 0,
    average_rating: 0,
    active_hours: 0
  });
  const [earnings, setEarnings] = useState<EarningsData[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch driver profile
      const { data: profileData } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setIsAvailable(profileData.is_available);
      }

      // Fetch earnings data
      const { data: earningsData } = await supabase
        .from('driver_earnings')
        .select('*')
        .eq('driver_id', user.id)
        .order('earned_at', { ascending: false });

      if (earningsData) {
        setEarnings(earningsData);

        // Calculate stats
        const totalEarnings = earningsData.reduce((sum, earning) => sum + earning.total_cents, 0);
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const weeklyEarnings = earningsData
          .filter(earning => new Date(earning.earned_at) >= oneWeekAgo)
          .reduce((sum, earning) => sum + earning.total_cents, 0);

        setStats({
          total_earnings: totalEarnings / 100,
          weekly_earnings: weeklyEarnings / 100,
          total_deliveries: earningsData.length,
          average_rating: profileData?.rating || 0,
          active_hours: Math.floor(Math.random() * 40) + 10 // Mock data
        });
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
      toast({
        title: "Error",
        description: "Failed to load driver data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newAvailability = !isAvailable;
      
      const { error } = await supabase
        .from('driver_profiles')
        .update({ 
          is_available: newAvailability,
          status: newAvailability ? 'online' : 'offline'
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsAvailable(newAvailability);
      toast({
        title: "Status Updated",
        description: `You are now ${newAvailability ? 'available' : 'offline'} for deliveries`
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Availability Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Driver Status
                  </span>
                  <Badge variant={isAvailable ? "default" : "secondary"}>
                    {isAvailable ? "Available" : "Offline"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Go Online</p>
                    <p className="text-sm text-muted-foreground">
                      Toggle your availability to receive delivery requests
                    </p>
                  </div>
                  <Switch 
                    checked={isAvailable} 
                    onCheckedChange={toggleAvailability}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.weekly_earnings.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_deliveries}</div>
                  <p className="text-xs text-muted-foreground">
                    Lifetime deliveries
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.average_rating.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    Out of 5.0 stars
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Hours</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.active_hours}h</div>
                  <p className="text-xs text-muted-foreground">
                    This week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Earnings</CardTitle>
                <CardDescription>
                  Your latest delivery earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {earnings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No earnings yet. Complete your first delivery to see data here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {earnings.slice(0, 5).map((earning) => (
                      <div key={earning.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5" />
                          <div>
                            <p className="font-medium">
                              Order #{earning.order_id?.slice(-8) || 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(earning.earned_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${(earning.total_cents / 100).toFixed(2)}
                          </p>
                          {earning.tip_cents > 0 && (
                            <p className="text-xs text-green-600">
                              +${(earning.tip_cents / 100).toFixed(2)} tip
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Earnings Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      ${stats.total_earnings.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      ${stats.weekly_earnings.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      ${stats.total_earnings > 0 ? (stats.total_earnings / stats.total_deliveries).toFixed(2) : '0.00'}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg per Delivery</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <h3 className="text-lg font-medium">All Earnings</h3>
                  {earnings.map((earning) => (
                    <div key={earning.id} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <p className="font-medium">
                          Order #{earning.order_id?.slice(-8) || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(earning.earned_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${(earning.amount_cents / 100).toFixed(2)}
                        </p>
                        {earning.tip_cents > 0 && (
                          <p className="text-sm text-green-600">
                            +${(earning.tip_cents / 100).toFixed(2)} tip
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicle" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Information
                </CardTitle>
                <CardDescription>
                  Manage your delivery vehicle details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Vehicle management features coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <AccountSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};