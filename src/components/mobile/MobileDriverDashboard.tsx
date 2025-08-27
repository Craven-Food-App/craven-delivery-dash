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
  const [craverApplication, setCraverApplication] = useState<any>(null);
  const [docsStatus, setDocsStatus] = useState<Record<VehicleType, boolean>>({
    car: false,
    bike: false,
    scooter: false,
    walk: false,
    motorcycle: false,
  });
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentOrderAssignment, setCurrentOrderAssignment] = useState<any>(null);
  
  const { toast } = useToast();

  // Restore driver state from localStorage and database on mount
  useEffect(() => {
    const restoreDriverState = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check database for current driver status
        const { data: driverProfile } = await supabase
          .from('driver_profiles')
          .select('status, is_available')
          .eq('user_id', user.id)
          .single();

        // Check localStorage for session data
        const savedState = localStorage.getItem('driver_session');
        if (savedState) {
          const sessionData = JSON.parse(savedState);
          
          // Check if session is still valid (not expired)
          const sessionEndTime = new Date(sessionData.endTime);
          const now = new Date();
          const isSessionValid = sessionEndTime > now;
          
          // Restore session if driver is still online in database AND session is valid
          if (driverProfile?.status === 'online' && driverProfile?.is_available && isSessionValid) {
            setDriverState('online_searching');
            setEndTime(sessionEndTime);
            setSelectedVehicle(sessionData.selectedVehicle || 'car');
            setEarningMode(sessionData.earningMode || 'perHour');
            
            // Calculate online time from session start
            const sessionStart = new Date(sessionData.sessionStart);
            const timeDiff = Math.floor((now.getTime() - sessionStart.getTime()) / 1000);
            setOnlineTime(Math.max(0, timeDiff));

            console.log('🔄 Restored driver session - staying online');
            
            // Re-establish real-time listener
            setupRealtimeListener(user.id);
            
            // Update database to ensure consistency
            await supabase
              .from('driver_profiles')
              .update({ 
                status: 'online',
                is_available: true 
              })
              .eq('user_id', user.id);
              
          } else {
            // Clear saved session if driver is offline in database or session expired
            localStorage.removeItem('driver_session');
            setDriverState('offline');
            
            // Ensure database is updated to offline
            if (driverProfile?.status !== 'offline') {
              await supabase
                .from('driver_profiles')
                .update({ 
                  status: 'offline',
                  is_available: false 
                })
                .eq('user_id', user.id);
            }
          }
        } else if (driverProfile?.status === 'online') {
          // Driver is online in database but no local session - they may have refreshed
          // Keep them online with a default 8-hour session
          setDriverState('online_searching');
          const now = new Date();
          const defaultEndTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours from now
          setEndTime(defaultEndTime);
          setOnlineTime(0);
          
          // Save new session
          saveDriverSession('online_searching', defaultEndTime, selectedVehicle, earningMode);
          setupRealtimeListener(user.id);
          
          console.log('🔄 Recreated driver session from database state');
        } else {
          // Driver is offline or no profile exists
          setDriverState('offline');
        }
      } catch (error) {
        console.error('Error restoring driver state:', error);
        // Fallback to offline state on error
        setDriverState('offline');
        localStorage.removeItem('driver_session');
      }
    };

    restoreDriverState();
  }, []);

  // Save driver session to localStorage
  const saveDriverSession = (state: DriverState, endTime: Date, vehicle: VehicleType, mode: EarningMode) => {
    if (state === 'online_searching') {
      const sessionData = {
        sessionStart: new Date().toISOString(),
        endTime: endTime.toISOString(),
        selectedVehicle: vehicle,
        earningMode: mode,
        driverState: state
      };
      localStorage.setItem('driver_session', JSON.stringify(sessionData));
      console.log('💾 Saved driver session to localStorage');
    } else {
      localStorage.removeItem('driver_session');
      console.log('🗑️ Removed driver session from localStorage');
    }
  };

  // Setup real-time listener for order assignments
  const setupRealtimeListener = (userId: string) => {
    console.log('🔔 Setting up real-time listener for user:', userId);
    
    const channel = supabase
      .channel(`driver_${userId}`)
      .on('broadcast', { event: 'order_assignment' }, (payload) => {
        console.log('📨 Received order assignment via broadcast:', payload);
        
        // Show order assignment modal
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
        setDriverState('offer_presented');
      })
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time listener');
      supabase.removeChannel(channel);
    };
  };

  // Fetch real craver application data
  useEffect(() => {
    const fetchCraverData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: application, error } = await supabase
          .from('craver_applications')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .single();

        if (error) {
          console.error('Error fetching craver application:', error);
          return;
        }

        if (application) {
          setCraverApplication(application);
          
          // Map database vehicle types to frontend types
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
            walk: true, // Walking doesn't require documents
            motorcycle: false,
          };

          // Check if documents are uploaded for the selected vehicle type
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
        console.error('Error in fetchCraverData:', error);
      }
    };

    fetchCraverData();
  }, []);

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

  // Continuous location tracking when online
  useEffect(() => {
    if (driverState !== 'online_searching' && driverState !== 'on_delivery') return;

    const trackLocation = async () => {
      if (!navigator.geolocation) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateLocation = async (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Update database with new location
        await supabase
          .from('craver_locations')
          .upsert({
            user_id: user.id,
            lat: latitude,
            lng: longitude
          });
      };

      // Get initial location
      navigator.geolocation.getCurrentPosition(updateLocation, 
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );

      // Watch location changes
      const watchId = navigator.geolocation.watchPosition(updateLocation,
        (error) => console.error('Location tracking error:', error),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    };

    trackLocation();
  }, [driverState]);

  // Listen for real-time order assignments when online - consolidated with setupRealtimeListener above
  // This useEffect is now handled by the setupRealtimeListener function called from other places

  const handleSatisfyCraveNow = () => {
    if (!craverApplication) {
      toast({
        title: "Application Required",
        description: "You need an approved craver application to go online.",
        variant: "destructive",
      });
      return;
    }

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
      console.log('🟢 Going online...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // First update database status to online
      const { error: profileError } = await supabase
        .from('driver_profiles')
        .update({ 
          status: 'online',
          is_available: true 
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('❌ Profile update error:', profileError);
        throw profileError;
      }

      console.log('✅ Driver profile updated to online');

      // Update location
      if (navigator.geolocation) {
        console.log('📍 Getting location...');
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          const { error: locationError } = await supabase
            .from('craver_locations')
            .upsert({
              user_id: user.id,
              lat: latitude,
              lng: longitude
            });

          if (locationError) {
            console.error('❌ Location update error:', locationError);
          } else {
            console.log('✅ Location updated successfully');
            toast({
              title: "Location Set",
              description: "Using your current location for order assignments.",
            });
          }
        }, async (error) => {
          console.error('❌ Geolocation error:', error);
          // Fallback to Toledo coordinates
          const { error: locationError } = await supabase
            .from('craver_locations')
            .upsert({
              user_id: user.id,
              lat: 41.6528, // Toledo coordinates
              lng: -83.6982
            });

          if (locationError) {
            console.error('❌ Fallback location update error:', locationError);
          } else {
            console.log('✅ Fallback location set successfully');
            toast({
              title: "Location Set",
              description: "Using Toledo location for order assignments.",
            });
          }
        }, {
          enableHighAccuracy: false, // Relaxed accuracy for better reliability
          timeout: 5000,
          maximumAge: 300000
        });
      } else {
        console.log('❌ Geolocation not available, using Toledo fallback');
        // Fallback location when geolocation is not available
        const { error: locationError } = await supabase
          .from('craver_locations')
          .upsert({
            user_id: user.id,
            lat: 41.6528, // Toledo coordinates
            lng: -83.6982
          });

        if (locationError) {
          console.error('❌ Fallback location update error:', locationError);
        } else {
          console.log('✅ Fallback location set successfully');
        }
      }

      setEndTime(endTime);
      setDriverState('online_searching');
      setShowEndTimeSheet(false);
      setOnlineTime(0);
      
      // Save session to localStorage for persistence
      saveDriverSession('online_searching', endTime, selectedVehicle, earningMode);
      
      toast({
        title: "You're now online!",
        description: "Looking for delivery offers in your area.",
      });

      // Set up real-time order assignment listener
      setupRealtimeListener(user.id);

      console.log('✅ Successfully went online!');

      // Keep driver online by periodically updating database status
      const keepAliveInterval = setInterval(async () => {
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser && (driverState === 'online_searching' || driverState === 'on_delivery')) {
            await supabase
              .from('driver_profiles')
              .update({ 
                status: 'online',
                is_available: true 
              })
              .eq('user_id', currentUser.id);
            console.log('💓 Keep-alive ping sent');
          } else {
            clearInterval(keepAliveInterval);
          }
        } catch (error) {
          console.error('Keep-alive error:', error);
        }
      }, 30000); // Ping every 30 seconds

      // Store interval ID to clear later
      (window as any).driverKeepAlive = keepAliveInterval;

    } catch (error) {
      console.error('❌ Error going online:', error);
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
      // Keep session saved but update state
      if (endTime) {
        saveDriverSession('online_paused', endTime, selectedVehicle, earningMode);
      }
      
      toast({
        title: "Paused",
        description: "You won't receive new offers while paused.",
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
      // Restore session
      if (endTime) {
        saveDriverSession('online_searching', endTime, selectedVehicle, earningMode);
        setupRealtimeListener(user.id);
      }
      
      toast({
        title: "Back Online",
        description: "You're now receiving offers again.",
      });
    } catch (error) {
      console.error('Error unpausing:', error);
    }
  };

  const handleEndNow = async () => {
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
      
      // Clear keep-alive interval
      if ((window as any).driverKeepAlive) {
        clearInterval((window as any).driverKeepAlive);
        delete (window as any).driverKeepAlive;
      }
      
      setDriverState('offline');
      setEndTime(null);
      setOnlineTime(0);
      setCurrentAssignment(null);
      
      // Clear saved session
      saveDriverSession('offline', new Date(), selectedVehicle, earningMode);
      
      toast({
        title: "You're now offline",
        description: "Your driving session has ended.",
      });
    } catch (error) {
      console.error('Error going offline:', error);
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
          orders={driverState === 'online_searching' ? availableOrders : []} 
          activeOrder={null} 
          onOrderClick={(order) => {
            toast({
              title: `Order from ${order.pickup_name}`,
              description: `$${(order.payout_cents / 100).toFixed(2)} • ${(order.distance_km * 0.621371).toFixed(1)}mi`,
            });
          }} 
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
          onEndNow={handleEndNow}
        />
      )}

      {/* Paused Panel */}
      {driverState === 'online_paused' && endTime && (
        <OnlineSearchPanel
          earningMode={earningMode}
          vehicleType={selectedVehicle}
          endTime={endTime}
          onlineTime={onlineTime}
          onPause={handleUnpause}
          onEndNow={handleEndNow}
          isPaused={true}
        />
      )}

      {/* Order Assignment Modal */}
      <OrderAssignmentModal
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setCurrentOrderAssignment(null);
        }}
        assignment={currentOrderAssignment}
      />

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