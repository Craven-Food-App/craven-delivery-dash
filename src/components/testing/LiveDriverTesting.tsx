import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Car, MapPin, Zap, Send, Clock, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnlineDriver {
  id: string;
  user_id: string;
  full_name: string;
  vehicle_type: string;
  vehicle_make: string;
  vehicle_model: string;
  current_latitude: number | null;
  current_longitude: number | null;
  is_available: boolean;
  rating: number;
}

export const LiveDriverTesting = () => {
  const [onlineDrivers, setOnlineDrivers] = useState<OnlineDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOnlineDrivers();

    const subscription = supabase
      .channel('driver_availability')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'driver_profiles' },
        () => fetchOnlineDrivers()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  const fetchOnlineDrivers = async () => {
    setIsLoading(true);
    try {
      const { data: drivers, error: driversError } = await supabase
        .from('driver_profiles')
        .select(`
          id,
          user_id,
          vehicle_type,
          vehicle_make,
          vehicle_model,
          is_available,
          rating
        `)
        .eq('is_available', true);

      if (driversError) throw driversError;

      if (!drivers || drivers.length === 0) {
        setOnlineDrivers([]);
        setIsLoading(false);
        return;
      }

      const driverUserIds = [...new Set(drivers.map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', driverUserIds);

      const { data: locations } = await supabase
        .from('craver_locations')
        .select('user_id, lat, lng')
        .in('user_id', driverUserIds);

      const seenUserIds = new Set();
      const combinedDrivers: OnlineDriver[] = drivers
        .filter(driver => {
          if (seenUserIds.has(driver.user_id)) return false;
          seenUserIds.add(driver.user_id);
          return true;
        })
        .map(driver => {
          const profile = profiles?.find(p => p.user_id === driver.user_id);
          const location = locations?.find(l => l.user_id === driver.user_id);
          return {
            ...driver,
            full_name: profile?.full_name || 'Unknown Driver',
            current_latitude: location?.lat || null,
            current_longitude: location?.lng || null,
            rating: driver.rating || 5.0
          };
        });

      setOnlineDrivers(combinedDrivers);
    } catch (error: any) {
      console.error('Error fetching online drivers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch online drivers',
        variant: 'destructive'
      });
    }
    setIsLoading(false);
  };

  const sendTestOrder = async () => {
    if (!selectedDriver) {
      toast({
        title: 'No Driver Selected',
        description: 'Please select a driver to send the test order to',
        variant: 'destructive'
      });
      return;
    }

    setIsSendingTest(true);
    try {
      const { data: restaurants } = await supabase.from('restaurants').select('*').limit(1);
      if (!restaurants || restaurants.length === 0) throw new Error('No restaurants found.');

      const restaurant = restaurants[0];
      const { data: order } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          customer_id: (await supabase.auth.getUser()).data.user?.id,
          order_status: 'pending',
          total_cents: 2599,
          subtotal_cents: 2299,
          tax_cents: 200,
          tip_cents: 100,
          delivery_fee_cents: 0,
          delivery_address: {
            street: "123 Test Street",
            city: "Test City",
            state: "TS",
            zip: "12345",
            latitude: 40.7128,
            longitude: -74.0060
          }
        })
        .select()
        .single();

      await supabase.from('orders').update({ driver_id: selectedDriver, order_status: 'confirmed' }).eq('id', order.id);

      const distanceKm = 3.2;
      const expiresAt = new Date(Date.now() + 30_000).toISOString();
      const estimatedTime = Math.ceil(distanceKm * 3);

      await supabase.channel(`driver_${selectedDriver}`).send({
        type: 'broadcast',
        event: 'order_assignment',
        payload: {
          assignment_id: `${order.id}-test`,
          order_id: order.id,
          restaurant_name: restaurant.name || 'Test Restaurant',
          pickup_address: {
            street: restaurant.address || 'Test Pickup Address',
            city: restaurant.city || 'Test City',
            state: restaurant.state || 'TS',
            zip: restaurant.zip_code || '12345'
          },
          dropoff_address: order.delivery_address,
          payout_cents: 500,
          distance_km: distanceKm,
          distance_mi: (distanceKm * 0.621371).toFixed(1),
          expires_at: expiresAt,
          estimated_time: estimatedTime,
          isTestOrder: true
        }
      });

      toast({
        title: 'Test Order Sent!',
        description: `Test order has been assigned to the selected driver.`,
        duration: 5000
      });
      setSelectedDriver('');
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error', description: error.message || 'Failed to send test order', variant: 'destructive' });
    }
    setIsSendingTest(false);
  };

  const getDriverInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Live Driver Testing
          </CardTitle>
          <CardDescription>
            Send test orders to real online drivers for testing push notifications and order flow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This sends real push notifications to actual drivers. Only use for testing purposes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Online Drivers ({onlineDrivers.length})
          </CardTitle>
          <CardDescription>Currently available drivers</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchOnlineDrivers} variant="outline" className="mb-4" disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh Drivers'}
          </Button>
          {onlineDrivers.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No drivers are currently online.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {onlineDrivers.map(driver => (
                <div
                  key={driver.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedDriver === driver.user_id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarFallback>{getDriverInitials(driver.full_name)}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium">{driver.full_name}</p>
                        <p className="text-sm text-muted-foreground">Driver ID: {driver.user_id.slice(0, 8)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Car className="h-3 w-3" />
                          <span className="text-xs">{driver.vehicle_make} {driver.vehicle_model}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500 hover:bg-green-600">Online</Badge>
                      <Badge variant="outline">⭐ {driver.rating.toFixed(1)}</Badge>
                    </div>
                  </div>
                  {driver.current_latitude && driver.current_longitude && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>Location: {driver.current_latitude.toFixed(4)}, {driver.current_longitude.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" />Send Test Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger><SelectValue placeholder="Choose a driver..." /></SelectTrigger>
            <SelectContent>
              {onlineDrivers.map(driver => (
                <SelectItem key={driver.user_id} value={driver.user_id}>
                  <div className="flex items-center gap-2"><Car className="h-4 w-4" />{driver.full_name}<Badge variant="outline" className="ml-2">{driver.vehicle_type}</Badge></div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={sendTestOrder}
            disabled={!selectedDriver || isSendingTest || onlineDrivers.length === 0}
            className="w-full"
            size="lg"
          >
            {isSendingTest ? <><Clock className="h-4 w-4 mr-2 animate-spin" />Sending Test Order...</> : <><Send className="h-4 w-4 mr-2" />Send Test Order</>}
          </Button>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              The selected driver will receive a push notification and see a test order assignment modal.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
