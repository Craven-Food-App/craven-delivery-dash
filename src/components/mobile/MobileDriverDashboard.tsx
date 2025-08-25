import React, { useState, useEffect } from 'react';
import { Bell, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { VehicleSelector } from './VehicleSelector';
import { EarningModeToggle } from './EarningModeToggle';
import { EndTimeSheet } from './EndTimeSheet';
import { BottomNavigation } from './BottomNavigation';
import { OnlineSearchPanel } from './OnlineSearchPanel';
import { OfferCard } from './OfferCard';
import SimpleMap from '@/components/SimpleMap';

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

export const MobileDriverDashboard: React.FC = () => {
  const [driverState, setDriverState] = useState<DriverState>('offline');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('car');
  const [earningMode, setEarningMode] = useState<EarningMode>('perHour');
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [onlineTime, setOnlineTime] = useState(0);
  const [currentOffer, setCurrentOffer] = useState<MockOffer | null>(null);
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

  // Mock offer generation
  useEffect(() => {
    if (driverState === 'online_searching') {
      const offerTimer = setTimeout(() => {
        const mockOffer: MockOffer = {
          id: 'offer-' + Date.now(),
          pickupName: 'Tony Packo\'s Cafe',
          pickupRating: 4.5,
          dropoffDistance: 2.3,
          estimatedTime: 25,
          estimatedPay: 12.50,
          itemCount: 3,
          miles: 4.2,
        };
        setCurrentOffer(mockOffer);
        setDriverState('offer_presented');
      }, Math.random() * 10000 + 5000); // 5-15 seconds

      return () => clearTimeout(offerTimer);
    }
  }, [driverState]);

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

  const handleGoOnline = (endTime: Date, autoExtend: boolean, breakReminder: boolean) => {
    setEndTime(endTime);
    setDriverState('online_searching');
    setShowEndTimeSheet(false);
    setOnlineTime(0);
    
    toast({
      title: "You're now online!",
      description: "Looking for delivery offers in your area.",
    });
  };

  const handleAcceptOffer = (offerId: string) => {
    setDriverState('on_delivery');
    setCurrentOffer(null);
    toast({
      title: "Offer accepted!",
      description: "Navigate to pickup location to start your delivery.",
    });
  };

  const handleDeclineOffer = (offerId: string) => {
    setCurrentOffer(null);
    setDriverState('online_searching');
  };

  const handlePause = () => {
    setDriverState('online_paused');
    toast({
      title: "Paused",
      description: "You won't receive new offers while paused.",
    });
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
      {/* Full-screen map background */}
      <div className="absolute inset-0">
        <SimpleMap 
          orders={[]} 
          activeOrder={null} 
          onOrderClick={() => {}} 
        />
      </div>

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

      {/* Offer Card */}
      {currentOffer && driverState === 'offer_presented' && (
        <OfferCard
          offer={currentOffer}
          onAccept={handleAcceptOffer}
          onDecline={handleDeclineOffer}
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
  );
};