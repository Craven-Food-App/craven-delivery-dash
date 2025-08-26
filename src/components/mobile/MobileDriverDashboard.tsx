import React, { useState, useEffect } from 'react';
import { Bell, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VehicleSelector } from './VehicleSelector';
import { EarningModeToggle } from './EarningModeToggle';
import { EndTimeSheet } from './EndTimeSheet';
import { BottomNavigation } from './BottomNavigation';
import { OnlineSearchPanel } from './OnlineSearchPanel';
import { OfferCard } from './OfferCard';
import { OrderAssignmentModal } from './OrderAssignmentModal';
import { AccountSection } from './AccountSection';
import { RatingsSection } from './RatingsSection';
import { EarningsSection } from './EarningsSection';
import LeafletMap from '@/components/LeafletMap';

type DriverState = 'offline' | 'setEndTime' | 'online_searching' | 'online_paused' | 'offer_presented' | 'on_delivery';
type VehicleType = 'car' | 'bike' | 'scooter' | 'walk' | 'motorcycle';
type EarningMode = 'perHour' | 'perOffer';
type TabType = 'main' | 'schedule' | 'account' | 'ratings' | 'earnings';

interface MockOffer {
  id: string;
  pickupName: string;
  pickupRating: number;
  dropoffDistance: number;
  estimatedTime: number;
  estimatedPay: number;
  itemCount: number;
  miles: number;
}

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
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [onlineTime, setOnlineTime] = useState(0);
  const [currentOffer, setCurrentOffer] = useState<MockOffer | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<OrderAssignment | null>(null);
  const [currentCity, setCurrentCity] = useState('Toledo');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEndTimeSheet, setShowEndTimeSheet] = useState(false);
  
  const { toast } = useToast();

  // Mock docs status
  const [docsStatus] = useState<Record<VehicleType, boolean>>({
    car: true,
    bike: true,
    scooter: false,
    walk: true,
    motorcycle: false,
  });

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Track online time
  useEffect(() => {
    if (driverState === 'online_searching') {
      const timer = setInterval(() => {
        setOnlineTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [driverState]);

  // Remove demo offer logic - this was interfering with real assignments
  // Real order assignments come through the WebSocket channel in handleGoOnline

  const handleSatisfyCraveNow = () => {
    if (!docsStatus[selectedVehicle]) {
      toast({
        title: "Complete vehicle docs",
        description: "You need to complete documents for your selected vehicle before going online.",
        variant: "destructive",
      });
      return;
    }
    setShowEndTimeSheet(true);
  };

  const handleGoOnline = async (endTime: Date, autoExtend: boolean, breakReminder: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update driver status to online
      await supabase
        .from('driver_profiles')
        .upsert({
          user_id: user.id,
          status: 'online',
          is_available: true
        });

      // Update location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          await supabase
            .from('craver_locations')
            .upsert({
              user_id: user.id,
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
        });
      }

      setEndTime(endTime);
      setDriverState('online_searching');
      setShowEndTimeSheet(false);
      setOnlineTime(0);
      
      toast({
        title: "You're now online!",
        description: "Looking for delivery offers in your area.",
      });

      // Set up real-time order assignment listener
      const channel = supabase
        .channel(`driver_${user.id}`)
        .on('broadcast', { event: 'order_assignment' }, (payload) => {
          console.log('Received order assignment:', payload);
          setCurrentAssignment(payload.payload);
          setDriverState('offer_presented');
        })
        .subscribe();

    } catch (error) {
      console.error('Error going online:', error);
      toast({
        title: "Error",
        description: "Failed to go online. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptAssignment = (assignmentId: string) => {
    setCurrentAssignment(null);
    setDriverState('on_delivery');
    toast({
      title: "Order Accepted!",
      description: "Navigate to pickup location to start your delivery.",
    });
  };

  const handleDeclineAssignment = (assignmentId: string) => {
    setCurrentAssignment(null);
    setDriverState('online_searching');
  };

  const handleAssignmentExpire = () => {
    setCurrentAssignment(null);
    setDriverState('online_searching');
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
        description: "You won't receive new offers while paused.",
      });
    } catch (error) {
      console.error('Error pausing:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getStatusColor = () => {
    switch (driverState) {
      case 'online_searching':
      case 'on_delivery':
        return 'bg-status-online text-white';
      case 'online_paused':
        return 'bg-status-paused text-white';
      default:
        return 'bg-status-offline text-white';
    }
  };

  const getStatusText = () => {
    switch (driverState) {
      case 'online_searching':
      case 'on_delivery':
        return 'Online';
      case 'online_paused':
        return 'Paused';
      default:
        return 'Offline';
    }
  };

  if (activeTab === 'account') {
    return (
      <>
        <AccountSection />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    );
  }

  if (activeTab === 'ratings') {
    return (
      <>
        <RatingsSection />
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

  if (activeTab !== 'main') {
    return (
      <div className="min-h-screen bg-background pb-16">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)] text-muted-foreground">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 capitalize">{activeTab}</h2>
            <p className="text-sm">Coming soon...</p>
          </div>
        </div>
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Map background - positioned behind content */}
      <div className="absolute inset-0 z-0">
        <LeafletMap 
          orders={[]} 
          activeOrder={null} 
          onOrderClick={() => {}} 
        />
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10 min-h-screen">

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm">
        <Badge className={`${getStatusColor()} px-3 py-1`}>
          {getStatusText()}
        </Badge>
        
        <div className="flex items-center gap-1 text-sm font-medium">
          <MapPin className="h-4 w-4" />
          <span>{currentCity} • {formatTime(currentTime)}</span>
        </div>
        
        <Bell className="h-5 w-5 text-foreground" />
      </div>

      {/* Main Content - only show when offline */}
      {driverState === 'offline' && (
        <div className="absolute inset-0 z-10 flex flex-col justify-end pb-16">
          <div className="bg-gradient-to-t from-background via-background/95 to-transparent px-4 py-6 space-y-6">
            {/* Vehicle Selector */}
            <VehicleSelector
              selectedVehicle={selectedVehicle}
              onVehicleSelect={setSelectedVehicle}
              docsStatus={docsStatus}
            />

            {/* Earning Mode Toggle */}
            <EarningModeToggle
              mode={earningMode}
              onModeChange={setEarningMode}
            />

            {/* Primary CTA */}
            <div className="space-y-3">
              <Button
                onClick={handleSatisfyCraveNow}
                className="w-full h-14 text-lg font-semibold bg-gradient-hero hover:shadow-hover"
              >
                Satisfy Crave'n Now
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Choose when you'll stop before going online
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Online Search Panel */}
      {driverState === 'online_searching' && endTime && (
        <OnlineSearchPanel
          earningMode={earningMode}
          vehicleType={selectedVehicle}
          endTime={endTime}
          onlineTime={onlineTime}
          onPause={handlePause}
        />
      )}

      {/* Order Assignment Modal */}
      {currentAssignment && (
        <OrderAssignmentModal
          assignment={currentAssignment}
          onAccept={handleAcceptAssignment}
          onDecline={handleDeclineAssignment}
          onExpire={handleAssignmentExpire}
        />
      )}

      {/* Offer Card (Legacy) */}
      {currentOffer && driverState === 'offer_presented' && !currentAssignment && (
        <OfferCard
          offer={currentOffer}
          onAccept={(id) => {
            setDriverState('on_delivery');
            setCurrentOffer(null);
          }}
          onDecline={(id) => {
            setCurrentOffer(null);
            setDriverState('online_searching');
          }}
        />
      )}

      {/* End Time Sheet */}
      <EndTimeSheet
        isOpen={showEndTimeSheet}
        onClose={() => setShowEndTimeSheet(false)}
        onGoOnline={handleGoOnline}
      />

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};