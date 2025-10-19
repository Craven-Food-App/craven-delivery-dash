import React, { useState, useEffect } from 'react';
import { MapPin, Settings, Pause, Play, Square, Clock, Car, DollarSign, Calendar, Bell, User, Star, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { OrderAssignmentModal } from './OrderAssignmentModal';
import ActiveDeliveryFlow from './ActiveDeliveryFlow';
import TestCompletionModal from './TestCompletionModal';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useIOSNotifications } from '@/hooks/useIOSNotifications';
import { IOSNotificationBanner } from './IOSNotificationBanner';
import { MobileMapbox } from './MobileMapbox';
import { DriveTimeSelector } from './DriveTimeSelector';
import LoadingScreen from './LoadingScreen';
import MobileDriverWelcomeScreen from './MobileDriverWelcomeScreen';
type DriverState = 'offline' | 'online_searching' | 'online_paused' | 'on_delivery';
type VehicleType = 'car' | 'bike' | 'scooter' | 'walk' | 'motorcycle';
type EarningMode = 'perHour' | 'perOffer';
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
  // Function to get current time index for highlighting
  const getCurrentTimeIndex = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Map 24-hour time to our time slots (6a = 6, 7a = 7, etc.)
    const timeMap: { [key: number]: number } = {
      6: 0,   // 6a
      7: 1,   // 7a  
      8: 2,   // 8a
      9: 3,   // 9a
      10: 4,  // 10a
      11: 5,  // 11a
      12: 6,  // 12p
      13: 7,  // 1p
      14: 8,  // 2p
      15: 9,  // 3p
      16: 10, // 4p
      17: 11, // 5p
      18: 12, // 6p
      19: 13, // 7p
      20: 14, // 8p
      21: 15, // 9p
      22: 16, // 10p
      23: 17  // 11p
    };
    
    return timeMap[currentHour] ?? -1; // -1 if no match
  };

  const [driverState, setDriverState] = useState<DriverState>('offline');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('car');
  const [earningMode, setEarningMode] = useState<EarningMode>('perHour');
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
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const {
    playNotification
  } = useNotificationSettings();
  const { showNotification, notifications: iosNotifications, dismissNotification } = useIOSNotifications();

  const handleStartFeeding = async () => {
    console.log('handleStartFeeding: Checking authentication status');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        console.log('handleStartFeeding: User is authenticated, proceeding to dashboard');
        setShowWelcomeScreen(false);
        // Initialize session persistence after welcome screen is dismissed
        await checkSessionPersistence();
      } else {
        console.log('handleStartFeeding: No active session, user needs to login');
        // The welcome screen will handle showing the login
        // This shouldn't normally be reached since login is handled in welcome screen
        setShowWelcomeScreen(false);
      }
    } catch (error) {
      console.error('handleStartFeeding: Error checking session:', error);
      setShowWelcomeScreen(false);
    }
  };

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

      // Show iOS notification
      const pickup = typeof payload.payload.pickup_address === 'string'
        ? payload.payload.pickup_address
        : payload.payload.pickup_address && typeof payload.payload.pickup_address === 'object'
          ? [
              (payload.payload.pickup_address as any).address, 
              (payload.payload.pickup_address as any).city, 
              (payload.payload.pickup_address as any).state
            ].filter(Boolean).join(', ')
          : 'restaurant';
      showNotification(
        `New Order: ${payload.payload.restaurant_name || 'Pickup'}`,
        `Pickup at ${pickup}`,
        8000
      );

      // Play notification sound
      playNotification();
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

        // Show iOS notification
        const pickup = typeof order.pickup_address === 'string'
          ? order.pickup_address
          : order.pickup_address && typeof order.pickup_address === 'object' && order.pickup_address !== null
            ? [
                (order.pickup_address as any).address, 
                (order.pickup_address as any).city, 
                (order.pickup_address as any).state
              ].filter(Boolean).join(', ')
            : 'restaurant';
        showNotification(
          'New Order Available',
          `Pickup at ${pickup}`,
          8000
        );

        // Play notification sound
        playNotification();
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(dbChannel);
    };
  };

  // Check session persistence and onboarding on component mount
  useEffect(() => {
    let isMounted = true;
    let loadingTimer: NodeJS.Timeout;
    let failsafeTimer: NodeJS.Timeout;
    
    const initializeDashboard = async () => {
      console.log('MobileDriverDashboard: Starting initialization');
      
      // Failsafe: If loading takes more than 10 seconds, force show welcome screen
      failsafeTimer = setTimeout(() => {
        if (isMounted && isLoading) {
          console.warn('MobileDriverDashboard: Loading timeout reached, forcing welcome screen');
          setIsLoading(false);
          setShowWelcomeScreen(true);
          setLoadingError(true);
        }
      }, 10000);
      
      try {
        await checkOnboardingAndSession();
        console.log('MobileDriverDashboard: Onboarding check complete');
      } catch (error) {
        console.error('MobileDriverDashboard: Error during initialization:', error);
        // Continue anyway - don't block the user
      } finally {
        // Ensure loading screen shows for at least 2.5 seconds for smooth UX
        loadingTimer = setTimeout(() => {
          if (isMounted) {
            console.log('MobileDriverDashboard: Loading complete, showing welcome screen');
            setIsLoading(false);
            setShowWelcomeScreen(true);
          }
        }, 2500);
      }
    };

    initializeDashboard();
    
    return () => {
      isMounted = false;
      if (loadingTimer) clearTimeout(loadingTimer);
      if (failsafeTimer) clearTimeout(failsafeTimer);
    };
  }, []);

  const checkOnboardingAndSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check onboarding completion first
      const { data: application } = await supabase
        .from('craver_applications')
        .select('onboarding_completed_at')
        .eq('user_id', user.id)
        .single();

      // If onboarding not complete, redirect
      if (!application?.onboarding_completed_at) {
        window.location.href = '/onboarding';
        return;
      }

      // If onboarding is complete, the welcome screen will show after loading
      // Then check session persistence after welcome screen is dismissed
    } catch (error) {
      console.error('Error checking onboarding:', error);
    }
  };
  const checkSessionPersistence = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check if driver was previously online
      const {
        data: session
      } = await supabase.from('driver_sessions').select('*').eq('driver_id', user.id).maybeSingle();
      if (session?.is_online && session.session_data) {
        const sessionData = session.session_data as any;

        // Check if session is still valid (end time hasn't passed)
        if (sessionData.end_time) {
          const endTime = new Date(sessionData.end_time);
          const now = new Date();
          if (now >= endTime) {
            // Session expired, clear it
            await supabase.from('driver_sessions').update({
              is_online: false,
              session_data: {}
            }).eq('driver_id', user.id);
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
        await supabase.from('driver_profiles').update({
          status: 'online',
          is_available: true,
          last_location_update: new Date().toISOString()
        }).eq('user_id', user.id);

        // Update last activity
        await supabase.from('driver_sessions').update({
          last_activity: new Date().toISOString()
        }).eq('driver_id', user.id);

        // Setup realtime listener
        setupRealtimeListener(user.id);

        // Show seamless welcome back message
        const timeMessage = sessionData.end_time ? ` until ${new Date(sessionData.end_time).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit'
        })}` : '';
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

  // Listen for schedule status changes to sync CRAVE NOW button
  useEffect(() => {
    const handleStatusChange = (event: CustomEvent) => {
      const { status } = event.detail;
      if (status === 'online' && driverState === 'offline') {
        setDriverState('online_searching');
      } else if (status === 'offline' && driverState !== 'offline') {
        setDriverState('offline');
        setEndTime(null);
      }
    };
    
    window.addEventListener('driverStatusChange', handleStatusChange as EventListener);
    return () => window.removeEventListener('driverStatusChange', handleStatusChange as EventListener);
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
      const {
        error: ensureError
      } = await supabase.rpc('ensure_driver_can_go_online', {
        target_user_id: user.id
      });
      if (ensureError) {
        console.error('Failed to ensure driver can go online:', ensureError);
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
      const {
        error: sessionError
      } = await supabase.from('driver_sessions').upsert({
        driver_id: user.id,
        is_online: true,
        last_activity: new Date().toISOString(),
        session_data: sessionData
      }, {
        onConflict: 'driver_id'
      });
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
      
      // Update schedule availability status to sync with online/offline
      window.dispatchEvent(new CustomEvent('driverStatusChange', { 
        detail: { status: 'online' } 
      }));
      
      setDriverState('online_searching');
      setOnlineTime(0);

      // Only show time selector if no end time is already set
      if (!endTime) {
        setShowTimeSelector(true);
      }
      setupRealtimeListener(user.id);
    } catch (error) {
      console.error('Error going online:', error);
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
        const {
          error: profileError
        } = await supabase.from('driver_profiles').update({
          status: 'offline',
          is_available: false,
          last_location_update: new Date().toISOString()
        }).eq('user_id', user.id);
        if (profileError) {
          console.error('Error updating driver profile:', profileError);
        }

        // Clear session data when going offline
        await supabase.from('driver_sessions').upsert({
          driver_id: user.id,
          is_online: false,
          last_activity: new Date().toISOString(),
          session_data: {} // Clear session data
        }, {
          onConflict: 'driver_id'
        });
      }
      
      // Update schedule availability status to sync with online/offline
      window.dispatchEvent(new CustomEvent('driverStatusChange', { 
        detail: { status: 'offline' } 
      }));
      
      setDriverState('offline');
      setOnlineTime(0);
      setEndTime(null); // Clear end time
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
        const {
          error: profileError
        } = await supabase.from('driver_profiles').update({
          status: 'paused',
          is_available: false,
          last_location_update: new Date().toISOString()
        }).eq('user_id', user.id);
        if (profileError) {
          console.error('Error updating driver profile:', profileError);
        }
      }
      setDriverState('online_paused');
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
        const {
          error: profileError
        } = await supabase.from('driver_profiles').update({
          status: 'online',
          is_available: true,
          last_location_update: new Date().toISOString()
        }).eq('user_id', user.id);
        if (profileError) {
          console.error('Error updating driver profile:', profileError);
        }
      }
      setDriverState('online_searching');
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        const {
          data: currentSession
        } = await supabase.from('driver_sessions').select('session_data').eq('driver_id', user.id).maybeSingle();
        const sessionData: Record<string, any> = {
          ...(currentSession?.session_data as object || {}),
          end_time: selectedEnd.toISOString()
        };
        await supabase.from('driver_sessions').update({
          session_data: sessionData
        }).eq('driver_id', user.id);
      }
    } catch (error) {
      console.error('Error updating session with end time:', error);
    }
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

  return <>
    {/* iOS Notification Banners */}
    {iosNotifications.map((notification) => (
      <IOSNotificationBanner
        key={notification.id}
        title={notification.title}
        message={notification.message}
        duration={notification.duration}
        onDismiss={() => dismissNotification(notification.id)}
      />
    ))}
    
    <LoadingScreen isLoading={isLoading} />
    
    {showWelcomeScreen && (
      <MobileDriverWelcomeScreen onStartFeeding={handleStartFeeding} />
    )}
    
    {/* Debug info */}
    {console.log('Render state - isLoading:', isLoading, 'showWelcomeScreen:', showWelcomeScreen)}
    
    {!isLoading && !showWelcomeScreen && (
    <div className="fixed inset-0 h-screen w-screen bg-background overflow-hidden">
      {/* Full Screen Map Background - Full height */}
      <div className="absolute inset-0 z-0">
        <MobileMapbox />
      </div>
      
      {/* Status Bar - Top */}
      {driverState !== 'offline' && <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20 px-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${driverState === 'online_searching' ? 'bg-green-500 text-white' : driverState === 'online_paused' ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'}`}>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-semibold text-sm">
              {driverState === 'online_searching' ? 'Online' : driverState === 'online_paused' ? 'Paused' : 'On Delivery'}
            </span>
          </div>
        </div>}

      {/* Main Content Overlay - Allow for bottom nav space - Non-interactive overlay */}
      <div style={{
        paddingBottom: '80px'
      }} className="fixed inset-0 z-10 flex flex-col py-0 pointer-events-none">
        
        {/* OFFLINE STATE */}
        {driverState === 'offline' && <>
            {/* Change Zone Button - Top Left */}
            <div className="fixed top-4 left-4 z-20 pointer-events-auto">
              
            </div>

            {/* Content Container */}
            <div className="flex flex-col justify-end h-full px-4 space-y-4 pointer-events-auto">
              {/* Popular Times Chart with CRAVE NOW Button */}
              <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-border/10 overflow-hidden">
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
                
                <div className="flex items-end h-20 gap-0.5 overflow-hidden">
                  {[
                    { time: '6a', value: 90, showLabel: true },   // Early morning peak
                    { time: '7a', value: 95, showLabel: false },  // Early morning peak
                    { time: '8a', value: 85, showLabel: false },  // Early morning peak
                    { time: '9a', value: 80, showLabel: true },   // Early morning peak
                    { time: '10a', value: 60, showLabel: false },
                    { time: '11a', value: 55, showLabel: false },
                    { time: '12p', value: 90, showLabel: true },  // Lunch peak
                    { time: '1p', value: 95, showLabel: false },   // Lunch peak
                    { time: '2p', value: 85, showLabel: false },   // Lunch peak
                    { time: '3p', value: 70, showLabel: true },
                    { time: '4p', value: 30, showLabel: false },  // Low time
                    { time: '5p', value: 25, showLabel: false },   // Low time
                    { time: '6p', value: 35, showLabel: true },   // Low time
                    { time: '7p', value: 50, showLabel: false },
                    { time: '8p', value: 60, showLabel: false },
                    { time: '9p', value: 70, showLabel: true },
                    { time: '10p', value: 75, showLabel: false },
                    { time: '11p', value: 85, showLabel: false }  // Night peak
                  ].map((data, index) => (
                    <div key={data.time} className="flex flex-col items-center justify-end flex-1 min-w-0">
                      <div className="w-full mb-1" style={{ height: `${(data.value / 95) * 64}px`, minHeight: '2px' }}>
                         <div className={`w-full h-full rounded-t-sm transition-all duration-300 ${index === getCurrentTimeIndex() ? 'bg-red-500' : 'bg-orange-500'}`} />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium whitespace-nowrap" style={{ 
                        visibility: data.showLabel ? 'visible' : 'hidden',
                        height: '16px'
                      }}>
                        {data.time}
                      </span>
                    </div>
                  ))}
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
            <div className="absolute top-4 right-7 z-20 pointer-events-auto px-0 mx-[28px]">
              <Button onClick={handlePause} variant="ghost" size="sm" className="bg-card/80 backdrop-blur-sm border border-border/20 rounded-full p-2 shadow-sm hover:bg-card/90 mx-[41px]">
                <Pause className="h-4 w-4" />
              </Button>
            </div>

            {/* Get Offers Until Section - Top */}
            {/* Bottom Content - Still Searching + Popular Times */}
            <div className="absolute bottom-7 left-4 right-4 z-20 space-y-3 pointer-events-auto">
              {/* Still Searching Section with Get offers until */}
              <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-border/20 overflow-hidden">
                <div className="flex items-center justify-between">
                  {/* Left: Still searching text */}
                  <span className="text-base text-foreground font-medium">Still searching...</span>
                  
                  {/* Right: "Get offers until" + Time + Rotating circle grouped together */}
                  <div className="flex items-center gap-2">
                    {/* "Get offers until" text */}
                    <span className="text-xs text-muted-foreground">Get offers until</span>
                    {/* Time badge */}
                    <span className="text-xs font-semibold text-foreground bg-muted/50 px-2 py-1 rounded-full">
                      {endTime ? endTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '11:00 PM'}
                    </span>
                    {/* Rotating C logo */}
                    <div className="w-6 h-6">
                      <img 
                        src="/crave-c-logo.png" 
                        alt="Crave'n C logo" 
                        className="animate-spin w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Popular Times Chart */}
              <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-border/10 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Popular offer times: Today</h3>
                    <p className="text-xs text-muted-foreground">Explore additional days to drive this week.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="flex items-end h-20 gap-0.5 overflow-hidden">
                  {[
                    { time: '6a', value: 90, showLabel: true },   // Early morning peak
                    { time: '7a', value: 95, showLabel: false },  // Early morning peak
                    { time: '8a', value: 85, showLabel: false },  // Early morning peak
                    { time: '9a', value: 80, showLabel: true },   // Early morning peak
                    { time: '10a', value: 60, showLabel: false },
                    { time: '11a', value: 55, showLabel: false },
                    { time: '12p', value: 90, showLabel: true },  // Lunch peak
                    { time: '1p', value: 95, showLabel: false },   // Lunch peak
                    { time: '2p', value: 85, showLabel: false },   // Lunch peak
                    { time: '3p', value: 70, showLabel: true },
                    { time: '4p', value: 30, showLabel: false },  // Low time
                    { time: '5p', value: 25, showLabel: false },   // Low time
                    { time: '6p', value: 35, showLabel: true },   // Low time
                    { time: '7p', value: 50, showLabel: false },
                    { time: '8p', value: 60, showLabel: false },
                    { time: '9p', value: 70, showLabel: true },
                    { time: '10p', value: 75, showLabel: false },
                    { time: '11p', value: 85, showLabel: false }  // Night peak
                  ].map((data, index) => (
                    <div key={data.time} className="flex flex-col items-center justify-end flex-1 min-w-0">
                      <div className="w-full mb-1" style={{ height: `${(data.value / 95) * 64}px`, minHeight: '2px' }}>
                        <div className={`w-full h-full rounded-t-sm transition-all duration-300 border border-gray-400 ${index === 13 ? 'bg-orange-500' : 'bg-gray-500'}`} />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium whitespace-nowrap" style={{ 
                        visibility: data.showLabel ? 'visible' : 'hidden',
                        height: '16px'
                      }}>
                        {data.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>}

        {/* PAUSED STATE */}
        {driverState === 'online_paused' && <>
            {/* Paused Message - Center */}
            <div className="flex flex-col justify-center items-center h-full px-4 pointer-events-auto">
              <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-border/20 text-center max-w-sm w-full overflow-hidden">
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
              <div className="flex gap-3 mt-6 w-full max-w-sm overflow-hidden">
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
        {driverState === 'on_delivery' && activeDelivery && <div className="pointer-events-auto">
          <ActiveDeliveryFlow orderDetails={{
            id: activeDelivery.id || activeDelivery.order_id || 'missing-order-id',
            order_number: activeDelivery.order_number || 'MISSING-ORDER',
            restaurant_name: activeDelivery.restaurant_name || 'Restaurant',
            pickup_address: activeDelivery.pickup_address || 'Pickup Address',
            dropoff_address: activeDelivery.dropoff_address || 'Delivery Address',
            customer_name: activeDelivery.customer_name || 'Customer',
            customer_phone: activeDelivery.customer_phone,
            delivery_notes: activeDelivery.delivery_notes,
            payout_cents: activeDelivery.payout_cents || 0,
            subtotal_cents: activeDelivery.subtotal_cents || activeDelivery.payout_cents || 1200,
            estimated_time: activeDelivery.estimated_time || 30,
            items: activeDelivery.items && activeDelivery.items.length > 0 ? activeDelivery.items : [{
              name: 'Order Items',
              quantity: 1,
              price_cents: activeDelivery.subtotal_cents || 1200
            }],
            isTestOrder: activeDelivery.isTestOrder || false // Only true if explicitly marked as test
          }} onCompleteDelivery={() => {
            // Check if this was a test order
            if (activeDelivery?.isTestOrder) {
              setShowTestCompletionModal(true);
            } else {
              // Record final driver earnings for real orders
              (async () => {
                try {
                  const {
                    data: {
                      user
                    }
                  } = await supabase.auth.getUser();
                  await supabase.functions.invoke('finalize-delivery', {
                    body: {
                      orderId: activeDelivery.order_id,
                      driverId: user?.id
                    }
                  });
                } catch (e) {
                  console.error('finalize-delivery failed', e);
                }
              })();
            }
            setActiveDelivery(null);
            setDriverState('online_searching');
          }} />
        </div>}

      </div>

      {/* Order Assignment Modal */}
      <OrderAssignmentModal isOpen={showOrderModal} onClose={() => {
        setShowOrderModal(false);
        setCurrentOrderAssignment(null);
      }} assignment={currentOrderAssignment} onAccept={assignment => {
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
      }} onDecline={() => {
        setShowOrderModal(false);
        setCurrentOrderAssignment(null);
      }} />

      {/* Drive Time Selector */}
      <DriveTimeSelector open={showTimeSelector} onClose={() => setShowTimeSelector(false)} onSelect={handleSelectDriveTime} />


      {/* Test Completion Modal */}
      {showTestCompletionModal && <TestCompletionModal 
        orderDetails={{
          restaurant_name: 'Test Restaurant',
          pickup_address: 'Test Pickup Address',
          dropoff_address: 'Test Dropoff Address',
          payout_cents: 1500,
          estimated_time: 30,
          isTestOrder: true
        }}
        onCompleteDelivery={() => setShowTestCompletionModal(false)}
      />}
    </div>
    )}
  </>;
};