// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Car, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Settings, 
  Bell,
  Shield,
  CreditCard,
  FileText,
  Edit,
  LogOut
} from 'lucide-react';
import { VehicleSelector } from './VehicleSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type VehicleType = 'car' | 'bike' | 'scooter' | 'walk' | 'motorcycle';

interface CraverProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  vehicle_type: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  profile_photo?: string;
}

export const AccountSection: React.FC<{
  activeTab: 'home' | 'schedule' | 'earnings' | 'notifications' | 'account';
  onTabChange: (tab: 'home' | 'schedule' | 'earnings' | 'notifications' | 'account') => void;
}> = ({ activeTab, onTabChange }) => {
  const [profile, setProfile] = useState<CraverProfile | null>(null);
  const [driverStats, setDriverStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('car');
  const [docsStatus, setDocsStatus] = useState<Record<VehicleType, boolean>>({
    car: false,
    bike: false,
    scooter: false,
    walk: false,
    motorcycle: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get craver application
      const { data: application } = await supabase
        .from('craver_applications')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Get driver profile and stats
      const { data: driverProfile } = await supabase
        .from('driver_profiles')
        .select('total_deliveries, rating')
        .eq('user_id', user.id)
        .single();

      // Get recent earnings (this week)
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data: weekOrders } = await supabase
        .from('orders')
        .select('payout_cents')
        .eq('assigned_craver_id', user.id)
        .eq('status', 'delivered')
        .gte('created_at', weekStart.toISOString());

      const weekEarnings = weekOrders?.reduce((sum, order) => sum + order.payout_cents, 0) || 0;

      if (application) {
        setProfile({
          id: user.id,
          first_name: application.first_name,
          last_name: application.last_name,
          email: application.email,
          phone: application.phone,
          status: application.status,
          vehicle_type: application.vehicle_type,
          vehicle_make: application.vehicle_make,
          vehicle_model: application.vehicle_model,
          vehicle_color: application.vehicle_color,
          profile_photo: application.profile_photo
        });

        setDriverStats({
          weekEarnings: weekEarnings / 100,
          totalDeliveries: driverProfile?.total_deliveries || 0,
          rating: driverProfile?.rating || 0
        });

        // Map vehicle type and set docs status
        const vehicleTypeMapping: Record<string, VehicleType> = {
          'car': 'car',
          'bike': 'bike',
          'scooter': 'scooter',
          'motorcycle': 'motorcycle',
          'walking': 'walk'
        };
        
        const mappedVehicleType = vehicleTypeMapping[application.vehicle_type] || 'car';
        setSelectedVehicle(mappedVehicleType);

        // Set document status based on application data
        const newDocsStatus: Record<VehicleType, boolean> = {
          car: false,
          bike: false,
          scooter: false,
          walk: true,
          motorcycle: false,
        };

        if (application.vehicle_type !== 'walking') {
          const hasRequiredDocs = !!(
            application.drivers_license_front && 
            application.drivers_license_back &&
            (application.vehicle_type === 'bike' || 
             (application.insurance_document && application.vehicle_registration))
          );
          newDocsStatus[mappedVehicleType] = hasRequiredDocs;
        }

        setDocsStatus(newDocsStatus);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account"
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'under_review':
        return 'bg-blue-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-20 bg-muted rounded-full mx-auto"></div>
            <div className="h-4 w-32 bg-muted rounded mx-auto"></div>
            <div className="h-3 w-24 bg-muted rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-4">
        <div className="border-l bg-muted/10 p-4 flex flex-col h-[calc(100vh-8rem)]">
          <Tabs defaultValue="profile" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1">
                <Bell className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="flex-1 space-y-4 mt-4">
              {/* Profile Header */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile?.profile_photo} />
                      <AvatarFallback>
                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold">
                        {profile?.first_name} {profile?.last_name}
                      </h2>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${getStatusColor(profile?.status || 'pending')} text-white`}>
                          {getStatusIcon(profile?.status || 'pending')}
                          <span className="ml-1 capitalize">{profile?.status}</span>
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Active Vehicle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VehicleSelector 
                    selectedVehicle={selectedVehicle}
                    onVehicleSelect={setSelectedVehicle}
                    docsStatus={docsStatus}
                  />
                </CardContent>
              </Card>

              {/* Vehicle Information */}
              {profile?.vehicle_type && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Vehicle Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{profile.vehicle_type}</p>
                      </div>
                      {profile.vehicle_make && (
                        <div>
                          <p className="text-muted-foreground">Make</p>
                          <p className="font-medium">{profile.vehicle_make}</p>
                        </div>
                      )}
                    </div>
                    {profile.vehicle_model && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Model</p>
                          <p className="font-medium">{profile.vehicle_model}</p>
                        </div>
                        {profile.vehicle_color && (
                          <div>
                            <p className="text-muted-foreground">Color</p>
                            <p className="font-medium">{profile.vehicle_color}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">${driverStats?.weekEarnings?.toFixed(0) || '0'}</p>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{driverStats?.totalDeliveries || 0}</p>
                    <p className="text-xs text-muted-foreground">Deliveries</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <User className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <p className="text-2xl font-bold">{driverStats?.rating?.toFixed(1) || '0.0'}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tools" className="flex-1 space-y-4 mt-4">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Driver Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <CreditCard className="h-4 w-4 mr-3" />
                    Payment Methods
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <FileText className="h-4 w-4 mr-3" />
                    Documents
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Shield className="h-4 w-4 mr-3" />
                    Safety Center
                  </Button>
                </CardContent>
              </Card>

              {/* Sign Out */}
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 space-y-4 mt-4">
              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    App Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Push notifications</span>
                    </div>
                    <Switch 
                      checked={notifications} 
                      onCheckedChange={setNotifications}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Location sharing</span>
                    </div>
                    <Switch 
                      checked={locationSharing} 
                      onCheckedChange={setLocationSharing}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom Navigation - Import and use it */}
      <div className="fixed bottom-0 left-0 right-0">
        <div className="bg-card/95 backdrop-blur-sm border-t border-border/50 h-20 shadow-lg">
          <div className="flex h-full">
            {[
              { id: 'home', label: 'Home', icon: '🏠' },
              { id: 'schedule', label: 'Schedule', icon: '📅' },
              { id: 'earnings', label: 'Earnings', icon: '💰' },
              { id: 'notifications', label: 'Alerts', icon: '🔔' },
              { id: 'account', label: 'Account', icon: '👤' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 h-full transition-all duration-200 ${
                  activeTab === tab.id ? 'text-primary' : 'text-muted-foreground/70'
                }`}
              >
                <span className="text-xl mb-1">{tab.icon}</span>
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};