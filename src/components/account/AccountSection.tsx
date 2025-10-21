import React, { useState, useEffect } from 'react';
import '../temp-fix';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { User, CreditCard, MapPin, Bell, Star, DollarSign, Clock, Package, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  preferences: any;
  settings: any;
}

interface PaymentMethod {
  id: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface DeliveryAddress {
  id: string;
  label: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  is_default: boolean;
}

interface OrderHistory {
  id: string;
  restaurant_name: string;
  total_cents: number;
  order_status: string;
  created_at: string;
}

export const AccountSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [expandedView, setExpandedView] = useState(false);

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to fetch user profile with error handling
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      if (profileData) {
        setProfile(profileData);
      } else {
        // Create a temporary profile object for display
        const tempProfile: UserProfile = {
          id: user.id,
          full_name: user.email || '',
          phone: null,
          avatar_url: null,
          role: 'customer',
          preferences: {},
          settings: {}
        };
        setProfile(tempProfile);
      }

      // Fetch payment methods with error handling
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (paymentError) {
        console.error('Error fetching payment methods:', paymentError);
      } else if (paymentData) {
        setPaymentMethods(paymentData.map((pm: any) => ({
          ...pm,
          exp_month: 12,
          exp_year: 2025
        })));
      }

      // Fetch delivery addresses with error handling
      const { data: addressData, error: addressError } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (addressError) {
        console.error('Error fetching addresses:', addressError);
      } else if (addressData) {
        setAddresses(addressData);
      }

      // Fetch order history with error handling
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (orderError) {
        console.error('Error fetching orders:', orderError);
      } else if (orderData) {
        const formattedOrders = orderData.map((order: any) => ({
          id: order.id,
          restaurant_name: 'Restaurant',
          total_cents: order.total_cents || 0,
          order_status: order.order_status || 'pending',
          created_at: order.created_at
        }));
        setOrderHistory(formattedOrders);
      }

    } catch (error) {
      console.error('Error fetching account data:', error);
      toast({
        title: "Notice",
        description: "Some account data may not be available. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if profile exists first
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking profile:', checkError);
        throw checkError;
      }

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();
      } else {
        // Create new profile
        result = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            role: 'customer',
            preferences: {},
            settings: {},
            ...updates
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error('Profile operation error:', result.error);
        throw result.error;
      }

      if (result.data) {
        setProfile(result.data);
      }

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/auth';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
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
    <div className="max-w-4xl mx-auto lg:p-6 space-y-4 lg:space-y-6">
      {/* Mobile Quick Access Card */}
      <div className="lg:hidden">
        <button
          onClick={() => setExpandedView(!expandedView)}
          className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="h-7 w-7" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 text-base">{profile?.full_name || 'User'}</h3>
              <p className="text-sm text-gray-600">View and edit profile</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>
        
        {/* Mobile Account Options */}
        <div className="mt-3 space-y-2">
          <button className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50 transition-colors flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">Payment Methods</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          
          <button className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50 transition-colors flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">Addresses</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          
          <button className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50 transition-colors flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">Notifications</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Desktop Profile Header */}
      <Card className="hidden lg:block">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{profile?.full_name || 'User'}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="mt-1">
                    {profile?.role || 'customer'}
                  </Badge>
                </div>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Account Management Tabs - Desktop or Expanded Mobile */}
      <Tabs defaultValue="profile" className={`w-full ${expandedView ? 'block' : 'hidden lg:block'}`}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile?.full_name || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                    onBlur={() => updateProfile({ full_name: profile?.full_name })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile?.phone || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    onBlur={() => updateProfile({ phone: profile?.phone })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Manage your saved payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payment methods saved
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5" />
                        <div>
                          <p className="font-medium">•••• •••• •••• {payment.last4}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.brand} • Expires {payment.exp_month}/{payment.exp_year}
                          </p>
                        </div>
                      </div>
                      {payment.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Button className="w-full mt-4" variant="outline">
                Add Payment Method
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Addresses
              </CardTitle>
              <CardDescription>
                Manage your saved delivery locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No delivery addresses saved
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div key={address.id} className="flex items-start justify-between p-3 border rounded">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 mt-0.5" />
                        <div>
                          <p className="font-medium">{address.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {address.street_address}, {address.city}, {address.state} {address.zip_code}
                          </p>
                        </div>
                      </div>
                      {address.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Button className="w-full mt-4" variant="outline">
                Add New Address
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order History
              </CardTitle>
              <CardDescription>
                View your recent orders and receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orderHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found
                </div>
              ) : (
                <div className="space-y-3">
                  {orderHistory.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{order.restaurant_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(order.total_cents / 100).toFixed(2)}</p>
                        <Badge 
                          variant={order.order_status === 'delivered' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {order.order_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Control when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order Updates</p>
                  <p className="text-sm text-muted-foreground">Get notified about order status changes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Promotions</p>
                  <p className="text-sm text-muted-foreground">Receive offers and promotional content</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Get text messages for important updates</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSignOut} 
                variant="destructive" 
                className="w-full"
                disabled={updating}
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};