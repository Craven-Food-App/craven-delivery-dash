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
import { AccountSection } from './AccountSection';
import MapboxMap from '@/components/Map';

type DriverState = 'offline' | 'online_searching' | 'online_paused' | 'on_delivery';
type VehicleType = 'car' | 'bike' | 'scooter' | 'walk' | 'motorcycle';
type EarningMode = 'perHour' | 'perOffer';
type TabType = 'home' | 'schedule' | 'earnings' | 'notifications' | 'account';

interface OrderAssignment {
  assignment_id: string;
  order_id: string;
  restaurant_name: string;
  pickup_address: string;
  dropoff_address: string;
  payout_cents: number;
  distance_km: number;
  distance_mi: string;
  expires_at: string;
  estimated_time: number;
}

export const MobileDriverDashboard: React.FC = () => {
  const [driverState, setDriverState] = useState<DriverState>('offline');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('car');
  const [earningMode, setEarningMode] = useState<EarningMode>('perHour');
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [onlineTime, setOnlineTime] = useState(0);
  const [currentCity, setCurrentCity] = useState('Toledo');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentOrderAssignment, setCurrentOrderAssignment] = useState<OrderAssignment | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  
  const { toast } = useToast();

  // Setup real-time listener for order assignments
  const setupRealtimeListener = (userId: string) => {
    const channel = supabase
      .channel(`driver_${userId}`)
      .on('broadcast', { event: 'order_assignment' }, (payload) => {
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
          estimated_time: payload.payload.estimated_time
        });
        setShowOrderModal(true);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('driver_profiles')
        .update({
          status: 'online',
          is_available: true
        })
        .eq('user_id', user.id);

      // Get location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        });
      }

      const now = new Date();
      const defaultEndTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      setEndTime(defaultEndTime);
      setDriverState('online_searching');
      setOnlineTime(0);
      
      setupRealtimeListener(user.id);
      
      toast({
        title: "You're online!",
        description: "Looking for delivery offers...",
      });

    } catch (error) {
      console.error('Error going online:', error);
    }
  };

  const handleGoOffline = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('driver_profiles')
          .update({ 
            status: 'offline',
            is_available: false 
          })
          .eq('user_id', user.id);
      }
      
      setDriverState('offline');
      setOnlineTime(0);
      
      toast({
        title: "You're offline",
        description: "You won't receive delivery offers.",
      });
    } catch (error) {
      console.error('Error going offline:', error);
    }
  };

  const handlePause = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('driver_profiles')
          .update({ 
            status: 'paused',
            is_available: false 
          })
          .eq('user_id', user.id);
      }
      
      setDriverState('online_paused');
      
      toast({
        title: "Paused",
        description: "You won't receive offers while paused.",
      });
    } catch (error) {
      console.error('Error pausing:', error);
    }
  };

  const handleUnpause = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('driver_profiles')
          .update({ 
            status: 'online',
            is_available: true 
          })
          .eq('user_id', user.id);
      }
      
      setDriverState('online_searching');
      
      toast({
        title: "Back online",
        description: "Looking for delivery offers...",
      });
    } catch (error) {
      console.error('Error unpausing:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const getVehicleIcon = () => {
    switch(selectedVehicle) {
      case 'car': return '🚗';
      case 'bike': return '🚲';
      case 'scooter': return '🛴';
      case 'motorcycle': return '🏍️';
      case 'walk': return '🚶';
      default: return '🚗';
    }
  };

  // Render different tabs
  if (activeTab === 'schedule') {
    return (
      <>
        <ScheduleSection />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    );
  }

  if (activeTab === 'earnings') {
    return (
      <>
        <EarningsSection />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    );
  }

  if (activeTab === 'notifications') {
    return (
      <>
        <PushNotificationSetup />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    );
  }

  if (activeTab === 'account') {
    return (
      <>
        <AccountSection activeTab={activeTab} onTabChange={setActiveTab} />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Full Screen Map Background */}
      <div className="absolute inset-0 z-0">
        <MapboxMap 
          orders={[]} 
          activeOrder={null} 
          onOrderClick={() => {}} 
        />
      </div>
      
      {/* Status Bar - Top */}
      {driverState !== 'offline' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-lg ${
            driverState === 'online_searching' ? 'bg-green-500 text-white' :
            driverState === 'online_paused' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-semibold">
              {driverState === 'online_searching' ? 'Online' :
               driverState === 'online_paused' ? 'Paused' :
               'On Delivery'}
            </span>
          </div>
        </div>
      )}

      {/* Main Content Overlay */}
      <div className="absolute inset-0 z-10">
        
        {/* OFFLINE STATE */}
        {driverState === 'offline' && (
          <>
            {/* Change Zone Button - Top Left */}
            <div className="absolute top-4 left-4 z-20">
              <Button 
                variant="secondary" 
                className="bg-card/95 backdrop-blur-sm text-foreground border border-border/20 shadow-sm rounded-xl px-4 py-2 text-sm font-medium"
              >
                Change zone
              </Button>
            </div>

            {/* Main Action Button - Large Orange Button */}
            <div className="absolute bottom-80 left-6 right-6 z-20">
              <Button
                onClick={handleGoOnline}
                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg rounded-2xl"
              >
                CRAVE NOW
              </Button>
            </div>

            {/* Popular Times Chart */}
            <div className="absolute bottom-16 left-6 right-6 z-20">
              <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-border/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Popular offer times: Today</h3>
                    <p className="text-sm text-muted-foreground">Explore additional days to drive this week.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="flex items-end justify-between h-24 gap-2">
                  {[
                    { time: '6a', value: 25 },
                    { time: '9a', value: 45 },
                    { time: '12p', value: 85 },
                    { time: '3p', value: 60 },
                    { time: '6p', value: 95 },
                    { time: '9p', value: 75 },
                  ].map((data, index) => (
                    <div key={data.time} className="flex flex-col items-center flex-1">
                      <div 
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          index === 4 ? 'bg-primary' : 'bg-muted'
                        }`}
                        style={{ 
                          height: `${(data.value / 95) * 100}%`,
                          minHeight: '8px'
                        }}
                      />
                      <span className="text-xs text-muted-foreground mt-2 font-medium">
                        {data.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ONLINE SEARCHING STATE */}
        {driverState === 'online_searching' && (
          <>
            {/* Change Zone Button - Top Left */}
            <div className="absolute top-4 left-4 z-20">
              <Button 
                variant="secondary" 
                className="bg-card/95 backdrop-blur-sm text-foreground border border-border/20 shadow-sm rounded-xl px-4 py-2 text-sm font-medium"
              >
                Change zone
              </Button>
            </div>

            {/* Get Offers Until Section */}
            <div className="absolute top-1/3 left-6 right-6 z-20">
              <div className="text-center mb-6">
                <div className="bg-card/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm border border-border/20 inline-block">
                  <span className="text-sm text-muted-foreground mr-2">Get offers until</span>
                  <span className="text-sm font-semibold text-foreground bg-muted/50 px-3 py-1 rounded-full">
                    {endTime ? endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '11:00 PM'}
                  </span>
                </div>
              </div>

              {/* Still Searching Section */}
              <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-border/20">
                <div className="flex items-center justify-between">
                  <span className="text-lg text-foreground font-medium">Still searching...</span>
                  <div className="w-8 h-8">
                    <svg className="animate-spin w-full h-full" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                      />
                      <path
                        className="opacity-75 text-primary"
                        fill="currentColor"
                        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Times Chart */}
            <div className="absolute bottom-16 left-6 right-6 z-20">
              <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-border/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Popular offer times: Today</h3>
                    <p className="text-sm text-muted-foreground">Explore additional days to drive this week.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="flex items-end justify-between h-24 gap-2">
                  {[
                    { time: '6a', value: 25 },
                    { time: '9a', value: 45 },
                    { time: '12p', value: 85 },
                    { time: '3p', value: 60 },
                    { time: '6p', value: 95 },
                    { time: '9p', value: 75 },
                  ].map((data, index) => (
                    <div key={data.time} className="flex flex-col items-center flex-1">
                      <div 
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          index === 4 ? 'bg-primary' : 'bg-muted'
                        }`}
                        style={{ 
                          height: `${(data.value / 95) * 100}%`,
                          minHeight: '8px'
                        }}
                      />
                      <span className="text-xs text-muted-foreground mt-2 font-medium">
                        {data.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pause Button - Top Right */}
            <div className="absolute top-4 right-4 z-20">
              <Button 
                onClick={handlePause}
                variant="ghost"
                size="sm"
                className="bg-card/80 backdrop-blur-sm border border-border/20 rounded-full p-3 shadow-sm hover:bg-card/90"
              >
                <Pause className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}

        {/* PAUSED STATE */}
        {driverState === 'online_paused' && (
          <>
            {/* Paused Message - Center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-border/20 text-center">
                <div className="text-6xl mb-4">⏸️</div>
                <div className="text-2xl font-bold text-foreground mb-2">
                  Delivery Paused
                </div>
                <div className="text-sm text-muted-foreground mb-6">
                  You won't receive new offers
                </div>
                
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-green-600">
                    ${todayEarnings.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Today's Earnings • {formatTime(onlineTime)} online
                  </div>
                </div>
              </div>
            </div>

            {/* Resume/Stop Controls - Bottom */}
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-4">
              <Button 
                onClick={handleUnpause}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Resume
              </Button>
              <Button 
                onClick={handleGoOffline}
                variant="outline"
                className="bg-background/95 backdrop-blur-sm border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop
              </Button>
            </div>
          </>
        )}

        {/* ON DELIVERY STATE */}
        {driverState === 'on_delivery' && activeDelivery && (
          <ActiveDeliveryFlow
            orderDetails={{
              restaurant_name: activeDelivery.restaurant_name || 'Restaurant',
              pickup_address: activeDelivery.pickup_address || 'Pickup Address',
              dropoff_address: activeDelivery.dropoff_address || 'Delivery Address',
              customer_name: activeDelivery.customer_name,
              customer_phone: activeDelivery.customer_phone,
              delivery_notes: activeDelivery.delivery_notes,
              payout_cents: activeDelivery.payout_cents || 0,
              estimated_time: activeDelivery.estimated_time || 30
            }}
            onCompleteDelivery={() => {
              setActiveDelivery(null);
              setDriverState('online_searching');
              toast({
                title: "Delivery Complete!",
                description: "Great job! Looking for your next order.",
              });
            }}
          />
        )}

      </div>

      {/* Order Assignment Modal */}
      <OrderAssignmentModal
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setCurrentOrderAssignment(null);
        }}
        assignment={currentOrderAssignment}
        onAccept={(assignment) => {
          setActiveDelivery({
            ...assignment,
            order_id: assignment.order_id,
            assignment_id: assignment.assignment_id,
            restaurant_name: assignment.restaurant_name,
            pickup_address: assignment.pickup_address,
            dropoff_address: assignment.dropoff_address,
            payout_cents: assignment.payout_cents,
            distance_mi: assignment.distance_mi
          });
          setDriverState('on_delivery');
          setShowOrderModal(false);
          setCurrentOrderAssignment(null);
        }}
        onDecline={(assignment) => {
          setShowOrderModal(false);
          setCurrentOrderAssignment(null);
        }}
      />

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};