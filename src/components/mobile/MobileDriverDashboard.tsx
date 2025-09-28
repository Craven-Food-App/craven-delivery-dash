import React, { useState, useEffect } from 'react';
import { MapPin, Settings, Pause, Play, Square, Clock, Car, DollarSign, Calendar, Bell, User, Star, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrderAssignmentModal } from './OrderAssignmentModal';
import { ScheduleSection } from './ScheduleSection';
import { EarningsSection } from './EarningsSection';
import { BottomNavigation } from './BottomNavigation';
import { ActiveDeliveryFlow } from './ActiveDeliveryFlow';
import { PushNotificationSetup } from './PushNotificationSetup';
import { NotificationPreferences } from './NotificationPreferences';
import { AccountSection } from './AccountSection';
import { TestCompletionModal } from './TestCompletionModal';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { MobileMapbox } from './MobileMapbox';
import { DriveTimeSelector } from './DriveTimeSelector';
type DriverState = 'offline' | 'online_searching' | 'online_paused' | 'on_delivery';
type VehicleType = 'car' | 'bike' | 'scooter' | 'walk' | 'motorcycle';
type EarningMode = 'perHour' | 'perOffer';
type TabType = 'home' | 'schedule' | 'earnings' | 'notifications' | 'account';
interface OrderAssignment {
  assignment_id: string;
  order_id: string;
  restaurant_name: string;
  pickup_address: any; // JSON address object
  dropoff_address: any; // JSON address object
  payout_cents: number;
  distance_km: number;
  distance_mi: string;
  expires_at: string;
  estimated_time: number;
  isTestOrder?: boolean; // Add test order flag
}
export const MobileDriverDashboard: React.FC = () => {
  const [driverState, setDriverState] = useState<DriverState>('offline');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('car');
  const [earningMode, setEarningMode] = useState<EarningMode>('perHour');
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [onlineTime, setOnlineTime] = useState(0);
  const [currentCity, setCurrentCity] = useState('Toledo');
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentOrderAssignment, setCurrentOrderAssignment] = useState<OrderAssignment | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [showTestCompletionModal, setShowTestCompletionModal] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const {
    toast
  } = useToast();
  const {
    playNotification
  } = useNotificationSettings();

  // Setup real-time listener for order assignments (broadcast + DB changes)
  const setupRealtimeListener = (userId: string) => {
    const broadcastChannel = supabase.channel(`driver_${userId}`).on('broadcast', {
      event: 'order_assignment'
    }, payload => {
      setCurrentOrderAssignment({
        assignment_id: payload.payload.assignment_id,
        order_id: payload.payload.order_id,
        restaurant_name: payload.payload.restaurant_name,
        pickup_address: payload.payload.pickup_address,
        dropoff_address: payload.payload.dropoff_address,
        payout_cents: payload.payload.payout_cents,
        distance_km: payload.payload.distance_km,
        distance_mi: payload.payload.distance_mi,
        expires_at: payload.payload.expires_at,
        estimated_time: payload.payload.estimated_time,
        isTestOrder: payload.payload.isTestOrder // Add test order flag
      });
      setShowOrderModal(true);

      // Play notification sound
      playNotification();

      // Show toast notification
      toast({
        title: "New Order Available!",
        description: `${payload.payload.restaurant_name} - $${(payload.payload.payout_cents / 100).toFixed(2)}`
      });
    }).subscribe();
    const dbChannel = supabase.channel(`order_assignments_${userId}`).on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'order_assignments',
      filter: `driver_id=eq.${userId}`
    }, async (payload: any) => {
      const assignment = payload.new as {
        id: string;
        order_id: string;
        expires_at: string;
      };
      // Fetch order summary to populate modal
      const {
        data: order
      } = await supabase.from('orders').select('pickup_address, dropoff_address, payout_cents, distance_km').eq('id', assignment.order_id).maybeSingle();
      if (order) {
        setCurrentOrderAssignment({
          assignment_id: assignment.id,
          order_id: assignment.order_id,
          restaurant_name: 'New Order',
          pickup_address: order.pickup_address,
          dropoff_address: order.dropoff_address,
          payout_cents: order.payout_cents || 0,
          distance_km: Number(order.distance_km) || 0,
          distance_mi: ((Number(order.distance_km) || 0) * 0.621371).toFixed(1),
          expires_at: assignment.expires_at,
          estimated_time: Math.ceil((Number(order.distance_km) || 0) * 2.5)
        });
        setShowOrderModal(true);

        // Play notification sound
        playNotification();

        // Show toast notification
        toast({
          title: "New Order Available!",
          description: `$${((order.payout_cents || 0) / 100).toFixed(2)} - ${((Number(order.distance_km) || 0) * 0.621371).toFixed(1)} miles`
        });
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(dbChannel);
    };
  };

  // Check session persistence on component mount
  useEffect(() => {
    checkSessionPersistence();
  }, []);

  const checkSessionPersistence = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if driver was previously online
      const { data: session } = await supabase
        .from('driver_sessions')
        .select('*')
        .eq('driver_id', user.id)
        .maybeSingle();

      if (session?.is_online && session.session_data) {
        const sessionData = session.session_data as any;
        
        // Check if session is still valid (end time hasn't passed)
        if (sessionData.end_time) {
          const endTime = new Date(sessionData.end_time);
          const now = new Date();
          
          if (now >= endTime) {
            // Session expired, clear it
            await supabase
              .from('driver_sessions')
              .update({ 
                is_online: false, 
                session_data: {} 
              })
              .eq('driver_id', user.id);
            return;
          }
          
          // Restore end time
          setEndTime(endTime);
        }
        
        // Auto-restore online state
        setDriverState('online_searching');
        
        // Restore online time if available
        if (sessionData.online_since) {
          const onlineSince = new Date(sessionData.online_since);
          const now = new Date();
          const timeOnline = Math.floor((now.getTime() - onlineSince.getTime()) / 1000);
          setOnlineTime(timeOnline > 0 ? timeOnline : 0);
        }
        
        // Update driver profile to online
        await supabase
          .from('driver_profiles')
          .update({
            status: 'online',
            is_available: true,
            last_location_update: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        // Update last activity
        await supabase
          .from('driver_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('driver_id', user.id);
        
        // Setup realtime listener
        setupRealtimeListener(user.id);
        
        // Show seamless welcome back message
        const timeMessage = sessionData.end_time 
          ? ` until ${new Date(sessionData.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
          : '';
        
        toast({
          title: "Welcome back!",
          description: `You're back online${timeMessage}`,
        });
      }
    } catch (error) {
      console.error('Error checking session persistence:', error);
    }
  };

  // Track online time
  useEffect(() => {
    if (driverState === 'online_searching') {
      const timer = setInterval(() => {
        setOnlineTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [driverState]);
  const handleGoOnline = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      
      // Use the database function to ensure driver can go online
      const { error: ensureError } = await supabase.rpc('ensure_driver_can_go_online', {
        target_user_id: user.id
      });

      if (ensureError) {
        console.error('Failed to ensure driver can go online:', ensureError);
        toast({
          title: "Error",
          description: ensureError.message || "Failed to go online. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      // Create session data with online timestamp
      const sessionData: Record<string, any> = { 
        online_since: new Date().toISOString()
      };
      
      if (endTime) {
        sessionData.end_time = endTime.toISOString();
      }

      // Update or create driver session for persistence
      const { error: sessionError } = await supabase
        .from('driver_sessions')
        .upsert({
          driver_id: user.id,
          is_online: true,
          last_activity: new Date().toISOString(),
          session_data: sessionData
        }, { onConflict: 'driver_id' });

      if (sessionError) {
        console.error('Error updating driver session:', sessionError);
      }

      // Get location and update craver_locations table
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async position => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);

          // Update driver location in database for auto-assignment
          const {
            error: locationError
          } = await supabase.from('craver_locations').upsert({
            user_id: user.id,
            lat: location.lat,
            lng: location.lng,
            updated_at: new Date().toISOString()
          });
          if (locationError) {
            console.error('Error updating driver location:', locationError);
          }
        });
      }
      setDriverState('online_searching');
      setOnlineTime(0);
      
      // Only show time selector if no end time is already set
      if (!endTime) {
        setShowTimeSelector(true);
      }
      
      setupRealtimeListener(user.id);
      toast({
        title: "You're online!",
        description: endTime ? `Driving until ${endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : "Choose how long you want to drive."
      });
    } catch (error) {
      console.error('Error going online:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };
  const handleGoOffline = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        const { error: profileError } = await supabase.from('driver_profiles').update({
          status: 'offline',
          is_available: false,
          last_location_update: new Date().toISOString()
        }).eq('user_id', user.id);
        
        if (profileError) {
          console.error('Error updating driver profile:', profileError);
        }

        // Clear session data when going offline
        await supabase
          .from('driver_sessions')
          .upsert({
            driver_id: user.id,
            is_online: false,
            last_activity: new Date().toISOString(),
            session_data: {} // Clear session data
          }, { onConflict: 'driver_id' });
      }
      setDriverState('offline');
      setOnlineTime(0);
      setEndTime(null); // Clear end time
      toast({
        title: "You're offline",
        description: "You won't receive delivery offers."
      });
    } catch (error) {
      console.error('Error going offline:', error);
    }
  };
  const handlePause = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        const { error: profileError } = await supabase.from('driver_profiles').update({
          status: 'paused',
          is_available: false,
          last_location_update: new Date().toISOString()
        }).eq('user_id', user.id);
        
        if (profileError) {
          console.error('Error updating driver profile:', profileError);
        }
      }
      setDriverState('online_paused');
      toast({
        title: "Paused",
        description: "You won't receive offers while paused."
      });
    } catch (error) {
      console.error('Error pausing:', error);
    }
  };
  const handleUnpause = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        const { error: profileError } = await supabase.from('driver_profiles').update({
          status: 'online',
          is_available: true,
          last_location_update: new Date().toISOString()
        }).eq('user_id', user.id);
        
        if (profileError) {
          console.error('Error updating driver profile:', profileError);
        }
      }
      setDriverState('online_searching');
      toast({
        title: "Back online",
        description: "Looking for delivery offers..."
      });
    } catch (error) {
      console.error('Error unpausing:', error);
    }
  };
  const handleSelectDriveTime = async (minutes: number) => {
    const now = new Date();
    const selectedEnd = new Date(now.getTime() + minutes * 60 * 1000);
    setEndTime(selectedEnd);
    setShowTimeSelector(false);
    
    // Update session with end time
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: currentSession } = await supabase
          .from('driver_sessions')
          .select('session_data')
          .eq('driver_id', user.id)
          .maybeSingle();
        
        const sessionData: Record<string, any> = {
          ...(currentSession?.session_data as object || {}),
          end_time: selectedEnd.toISOString()
        };
        
        await supabase
          .from('driver_sessions')
          .update({ session_data: sessionData })
          .eq('driver_id', user.id);
      }
    } catch (error) {
      console.error('Error updating session with end time:', error);
    }
    
    toast({
      title: 'Drive time set',
      description: `Ends around ${selectedEnd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    });
  };
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };
  const getVehicleIcon = () => {
    switch (selectedVehicle) {
      case 'car':
        return '🚗';
      case 'bike':
        return '🚲';
      case 'scooter':
        return '🛴';
      case 'motorcycle':
        return '🏍️';
      case 'walk':
        return '🚶';
      default:
        return '🚗';
    }
  };

  // Render different tabs
  if (activeTab === 'schedule') {
    return <>
        <ScheduleSection />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </>;
  }
  if (activeTab === 'earnings') {
    return <>
        <EarningsSection />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </>;
  }
  if (activeTab === 'notifications') {
    return <>
        <div className="space-y-4 p-4">
          <NotificationPreferences />
          <PushNotificationSetup />
        </div>
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </>;
  }
  if (activeTab === 'account') {
    return <>
        <AccountSection activeTab={activeTab} onTabChange={setActiveTab} />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </>;
  }
  return <div className="h-screen bg-background relative overflow-hidden">
      {/* Full Screen Map Background - Constrained above bottom nav */}
      <div className="absolute inset-0 bottom-20 z-0">
        <MobileMapbox />
      </div>
      
      {/* Status Bar - Top */}
      {driverState !== 'offline' && <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 px-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${driverState === 'online_searching' ? 'bg-green-500 text-white' : driverState === 'online_paused' ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'}`}>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-semibold text-sm">
              {driverState === 'online_searching' ? 'Online' : driverState === 'online_paused' ? 'Paused' : 'On Delivery'}
            </span>
          </div>
        </div>}

      {/* Main Content Overlay - Constrained above bottom nav */}
      <div className="absolute inset-0 bottom-20 z-10 flex flex-col">
        
        {/* OFFLINE STATE */}
        {driverState === 'offline' && <>
            {/* Change Zone Button - Top Left */}
            <div className="absolute top-4 left-4 z-20 pointer-events-auto">
              
            </div>

            {/* Content Container */}
            <div className="flex flex-col justify-end h-full px-4 pb-7 space-y-4 pointer-events-auto">
              {/* Popular Times Chart with CRAVE NOW Button */}
              <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-border/10">
                {/* Main Action Button - Centered at top */}
                <div className="flex justify-center mb-4">
                  <Button onClick={handleGoOnline} className="w-full h-12 text-lg font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg rounded-2xl">
                    CRAVE NOW
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Popular offer times: Today</h3>
                    <p className="text-xs text-muted-foreground">Explore additional days to drive this week.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="flex items-end justify-between h-16 gap-2">
                  {[{
                time: '6a',
                value: 25
              }, {
                time: '9a',
                value: 45
              }, {
                time: '12p',
                value: 85
              }, {
                time: '3p',
                value: 60
              }, {
                time: '6p',
                value: 95
              }, {
                time: '9p',
                value: 75
              }].map((data, index) => <div key={data.time} className="flex flex-col items-center flex-1">
                      <div className={`w-full rounded-t-sm transition-all duration-300 ${index === 4 ? 'bg-primary' : 'bg-muted'}`} style={{
                  height: `${data.value / 95 * 100}%`,
                  minHeight: '6px'
                }} />
                      <span className="text-xs text-muted-foreground mt-1 font-medium">
                        {data.time}
                      </span>
                    </div>)}
                </div>
              </div>
            </div>
          </>}

        {/* ONLINE SEARCHING STATE */}
        {driverState === 'online_searching' && <>
            {/* Change Zone Button - Top Left */}
            <div className="absolute top-4 left-4 z-20 pointer-events-auto py-0 my-[525px] mx-0 px-0">
              
            </div>

            {/* Pause Button - Top Right */}
            <div className="absolute top-4 right-7 z-20 pointer-events-auto">
              <Button onClick={handlePause} variant="ghost" size="sm" className="bg-card/80 backdrop-blur-sm border border-border/20 rounded-full p-2 shadow-sm hover:bg-card/90 mx-[41px]">
                <Pause className="h-4 w-4" />
              </Button>
            </div>

            {/* Get Offers Until Section - Top */}
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-card/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-border/20">
                <span className="text-xs text-muted-foreground mr-2">Get offers until</span>
                <span className="text-xs font-semibold text-foreground bg-muted/50 px-2 py-1 rounded-full">
                  {endTime ? endTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              }) : '11:00 PM'}
                </span>
              </div>
            </div>

            {/* Bottom Content - Still Searching + Popular Times */}
            <div className="absolute bottom-7 left-4 right-4 z-20 space-y-3">
              {/* Still Searching Section */}
              <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-border/20">
                <div className="flex items-center justify-between">
                  <span className="text-base text-foreground font-medium">Still searching...</span>
                  <div className="w-6 h-6">
                    <svg className="animate-spin w-full h-full" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                      <path className="opacity-75 text-primary" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Popular Times Chart */}
              <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-border/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Popular offer times: Today</h3>
                    <p className="text-xs text-muted-foreground">Explore additional days to drive this week.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="flex items-end justify-between h-16 gap-2">
                  {[{
                time: '6a',
                value: 25
              }, {
                time: '9a',
                value: 45
              }, {
                time: '12p',
                value: 85
              }, {
                time: '3p',
                value: 60
              }, {
                time: '6p',
                value: 95
              }, {
                time: '9p',
                value: 75
              }].map((data, index) => <div key={data.time} className="flex flex-col items-center flex-1">
                      <div className={`w-full rounded-t-sm transition-all duration-300 ${index === 4 ? 'bg-primary' : 'bg-muted'}`} style={{
                  height: `${data.value / 95 * 100}%`,
                  minHeight: '6px'
                }} />
                      <span className="text-xs text-muted-foreground mt-1 font-medium">
                        {data.time}
                      </span>
                    </div>)}
                </div>
              </div>
            </div>
          </>}

        {/* PAUSED STATE */}
        {driverState === 'online_paused' && <>
            {/* Paused Message - Center */}
            <div className="flex flex-col justify-center items-center h-full px-4">
              <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-border/20 text-center max-w-sm w-full">
                <div className="text-4xl mb-3">⏸️</div>
                <div className="text-lg font-bold text-foreground mb-2">
                  Delivery Paused
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  You won't receive new offers
                </div>
                
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-green-600">
                    ${todayEarnings.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Today's Earnings • {formatTime(onlineTime)} online
                  </div>
                </div>
              </div>
              
              {/* Resume/Stop Controls */}
              <div className="flex gap-3 mt-6 w-full max-w-sm">
                <Button onClick={handleUnpause} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 text-sm font-semibold rounded-xl shadow-lg">
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
                <Button onClick={handleGoOffline} variant="outline" className="flex-1 bg-background/95 backdrop-blur-sm border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 py-3 text-sm font-semibold rounded-xl shadow-lg">
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </div>
            </div>
          </>}

        {/* ON DELIVERY STATE */}
        {driverState === 'on_delivery' && activeDelivery && <ActiveDeliveryFlow orderDetails={{
        restaurant_name: activeDelivery.restaurant_name || 'Restaurant',
        pickup_address: activeDelivery.pickup_address || 'Pickup Address',
        dropoff_address: activeDelivery.dropoff_address || 'Delivery Address',
        customer_name: activeDelivery.customer_name,
        customer_phone: activeDelivery.customer_phone,
        delivery_notes: activeDelivery.delivery_notes,
        payout_cents: activeDelivery.payout_cents || 0,
        estimated_time: activeDelivery.estimated_time || 30,
        isTestOrder: activeDelivery.isTestOrder // Pass through test order flag
      }} onCompleteDelivery={() => {
        // Check if this was a test order
        if (activeDelivery?.isTestOrder) {
          setShowTestCompletionModal(true);
        } else {
          // Record final driver earnings for real orders
          (async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              await supabase.functions.invoke('finalize-delivery', {
                body: { orderId: activeDelivery.order_id, driverId: user?.id }
              });
            } catch (e) {
              console.error('finalize-delivery failed', e);
            }
          })();
        }
        setActiveDelivery(null);
        setDriverState('online_searching');
        toast({
          title: "Delivery Complete!",
          description: activeDelivery?.isTestOrder ? "Test delivery completed successfully!" : "Great job! Looking for your next order."
        });
      }} />}

      </div>

      {/* Order Assignment Modal */}
      <OrderAssignmentModal
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setCurrentOrderAssignment(null);
        }}
        assignment={currentOrderAssignment}
        onAccept={assignment => {
          setActiveDelivery({
            ...assignment,
            order_id: assignment.order_id,
            assignment_id: assignment.assignment_id,
            restaurant_name: assignment.restaurant_name,
            pickup_address: assignment.pickup_address,
            dropoff_address: assignment.dropoff_address,
            payout_cents: assignment.payout_cents,
            distance_mi: assignment.distance_mi,
            isTestOrder: assignment.isTestOrder // Pass through test order flag
          });
          setDriverState('on_delivery');
          setShowOrderModal(false);
          setCurrentOrderAssignment(null);
        }}
        onDecline={() => {
          setShowOrderModal(false);
          setCurrentOrderAssignment(null);
        }}
      />

      {/* Drive Time Selector */}
      <DriveTimeSelector
        open={showTimeSelector}
        onClose={() => setShowTimeSelector(false)}
        onSelect={handleSelectDriveTime}
      />

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Test Completion Modal */}
      <TestCompletionModal isOpen={showTestCompletionModal} onClose={() => setShowTestCompletionModal(false)} />
    </div>;
};