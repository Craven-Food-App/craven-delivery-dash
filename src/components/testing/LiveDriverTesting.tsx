import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Car, 
  MapPin, 
  Zap, 
  Send, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Users
} from 'lucide-react';
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
  status: string;
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
    // Set up real-time subscription for driver status changes
    const subscription = supabase
      .channel('driver_status_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'driver_profiles' },
        () => {
          fetchOnlineDrivers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchOnlineDrivers = async () => {
    setIsLoading(true);
    try {
      // Get online drivers with their profiles
      const { data: drivers, error: driversError } = await supabase
        .from('driver_profiles')
        .select(`
          id,
          user_id,
          vehicle_type,
          vehicle_make,
          vehicle_model,
          is_available,
          status,
          rating
        `)
        .eq('status', 'online')
        .eq('is_available', true);

      if (driversError) throw driversError;

      if (!drivers || drivers.length === 0) {
        setOnlineDrivers([]);
        setIsLoading(false);
        return;
      }

      // Get user profiles for the drivers
      const driverUserIds = drivers.map(d => d.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', driverUserIds);

      if (profilesError) throw profilesError;

      // Get locations for the drivers
      const { data: locations, error: locationsError } = await supabase
        .from('craver_locations')
        .select('user_id, lat, lng')
        .in('user_id', driverUserIds);

      if (locationsError) throw locationsError;

      // Combine the data
      const combinedDrivers: OnlineDriver[] = drivers.map(driver => {
        const profile = profiles?.find(p => p.user_id === driver.user_id);
        const location = locations?.find(l => l.user_id === driver.user_id);
        
        return {
          id: driver.id,
          user_id: driver.user_id,
          full_name: profile?.full_name || 'Unknown Driver',
          vehicle_type: driver.vehicle_type,
          vehicle_make: driver.vehicle_make,
          vehicle_model: driver.vehicle_model,
          current_latitude: location?.lat || null,
          current_longitude: location?.lng || null,
          is_available: driver.is_available,
          status: driver.status,
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
      // First, get a test restaurant
      const { data: restaurants, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .limit(1);

      if (restaurantError) throw restaurantError;
      if (!restaurants || restaurants.length === 0) {
        throw new Error('No restaurants found. Please create a test restaurant first.');
      }

      const restaurant = restaurants[0];

      // Create a test order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          customer_id: (await supabase.auth.getUser()).data.user?.id,
          order_status: 'pending',
          total_cents: 2599, // $25.99
          subtotal_cents: 2299, // $22.99
          tax_cents: 200, // $2.00
          tip_cents: 100, // $1.00
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

      if (orderError) throw orderError;

      // Add test items to the order
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert([
          {
            order_id: order.id,
            menu_item_id: null,
            name: "🧪 Test Burger",
            price_cents: 1599,
            quantity: 1
          },
          {
            order_id: order.id,  
            menu_item_id: null,
            name: "🧪 Test Fries",
            price_cents: 899,
            quantity: 1
          }
        ]);

      if (itemsError) {
        console.warn('Failed to create order items:', itemsError);
      }

      // Manually assign to selected driver
      const { error: assignError } = await supabase
        .from('orders')
        .update({
          driver_id: selectedDriver,
          order_status: 'assigned'
        })
        .eq('id', order.id);

      if (assignError) throw assignError;

      // Send push notification to the driver
      const { error: notificationError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          driverId: selectedDriver,
          title: '🧪 Test Order Assignment',
          body: 'Crave\'N would like to send you a test order for testing purposes. This helps us improve our service!',
          data: {
            orderId: order.id,
            type: 'test_order_assignment',
            isTestOrder: true
          }
        }
      });

      if (notificationError) {
        console.warn('Failed to send push notification:', notificationError);
      }

      // Trigger real-time update
      await supabase
        .channel('order_assignments')
        .send({
          type: 'broadcast',
          event: 'order_assigned',
          payload: {
            orderId: order.id,
            driverId: selectedDriver,
            isTestOrder: true
          }
        });

      toast({
        title: 'Test Order Sent!',
        description: `Test order has been assigned to the selected driver. They should receive a notification shortly.`,
        duration: 5000
      });

      // Reset selection
      setSelectedDriver('');

    } catch (error: any) {
      console.error('Error sending test order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test order',
        variant: 'destructive'
      });
    }
    setIsSendingTest(false);
  };

  const getDriverInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Live Driver Testing
          </CardTitle>
          <CardDescription>
            Send test orders to real online drivers for comprehensive testing of push notifications and order flow.
            The driver will see a special message indicating this is a test order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This sends real push notifications to actual drivers. Only use for legitimate testing purposes.
              The order will be clearly marked as a test order for the driver.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Online Drivers Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Online Drivers ({onlineDrivers.length})
          </CardTitle>
          <CardDescription>
            Currently available drivers who can receive test orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={fetchOnlineDrivers} 
            variant="outline" 
            className="mb-4"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh Drivers'}
          </Button>

          {onlineDrivers.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No drivers are currently online. Make sure drivers are logged in and have gone "Online" in the mobile app.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {onlineDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedDriver === driver.user_id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getDriverInitials(driver.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{driver.full_name}</p>
                        <p className="text-sm text-muted-foreground">Driver ID: {driver.user_id.slice(0, 8)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Car className="h-3 w-3" />
                          <span className="text-xs">
                            {driver.vehicle_make} {driver.vehicle_model}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        Online
                      </Badge>
                      <Badge variant="outline">
                        ⭐ {driver.rating.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                  {driver.current_latitude && driver.current_longitude && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>
                        Location: {driver.current_latitude.toFixed(4)}, {driver.current_longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Selection and Test Order */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Test Order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Driver for Testing
            </label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a driver to send test order..." />
              </SelectTrigger>
              <SelectContent>
                {onlineDrivers.map((driver) => (
                  <SelectItem key={driver.user_id} value={driver.user_id}>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      <span>{driver.full_name}</span>
                      <Badge variant="outline" className="ml-2">
                        {driver.vehicle_type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={sendTestOrder}
            disabled={!selectedDriver || isSendingTest || onlineDrivers.length === 0}
            className="w-full"
            size="lg"
          >
            {isSendingTest ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Sending Test Order...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Order to Driver
              </>
            )}
          </Button>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              The selected driver will receive a push notification and see a test order assignment modal.
              They can accept and go through the complete delivery flow. At the end, they'll see a thank you message.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">How to test:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Ensure you have drivers logged in and online (use /mobile route)</li>
              <li>Select a driver from the list above</li>
              <li>Click "Send Test Order to Driver"</li>
              <li>The driver should receive a push notification and assignment modal</li>
              <li>Driver can accept and go through the complete delivery process</li>
              <li>At completion, driver will see a thank you message for testing</li>
            </ol>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">What gets tested:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Push notification delivery to mobile devices</li>
              <li>Real-time order assignment modal display</li>
              <li>Order acceptance and status updates</li>
              <li>Navigation and delivery flow</li>
              <li>Order completion and driver feedback</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};