import React, { useState, useEffect } from 'react';
import { Bell, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VehicleSelector } from './VehicleSelector';
import { EarningModeToggle } from './EarningModeToggle';
import { EndTimeSheet } from './EndTimeSheet';
import { BottomNavigation } from './BottomNavigation';
import { OnlineSearchPanel } from './OnlineSearchPanel';
import { OrderAssignmentModal } from './OrderAssignmentModal';
import { AccountSection } from './AccountSection';
import { RatingsSection } from './RatingsSection';
import { EarningsSection } from './EarningsSection';

type DriverState = 'offline' | 'setEndTime' | 'online_searching' | 'online_paused' | 'offer_presented' | 'on_delivery';
type VehicleType = 'car' | 'bike' | 'scooter' | 'walk' | 'motorcycle';
type EarningMode = 'perHour' | 'perOffer';
type TabType = 'main' | 'schedule' | 'account' | 'ratings' | 'earnings';

export const MobileApp: React.FC = () => {
  const [driverState, setDriverState] = useState<DriverState>('offline');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('car');
  const [earningMode, setEarningMode] = useState<EarningMode>('perHour');
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [onlineTime, setOnlineTime] = useState(0);
  const [currentCity] = useState('Toledo');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEndTimeSheet, setShowEndTimeSheet] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentOrderAssignment, setCurrentOrderAssignment] = useState<any>(null);
  const [craverApplication, setCraverApplication] = useState<any>(null);
  const [docsStatus, setDocsStatus] = useState<Record<VehicleType, boolean>>({
    car: false,
    bike: false,
    scooter: false,
    walk: false,
    motorcycle: false,
  });

  const { toast } = useToast();

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

  // Fetch craver application data
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

        if (application) {
          setCraverApplication(application);
          
          const vehicleTypeMapping: Record<string, VehicleType> = {
            'car': 'car',
            'bike': 'bike', 
            'scooter': 'scooter',
            'motorcycle': 'motorcycle',
            'walking': 'walk'
          };
          
          const mappedVehicleType = vehicleTypeMapping[application.vehicle_type] || 'car';
          setSelectedVehicle(mappedVehicleType);
          
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
        console.error('Error fetching craver data:', error);
      }
    };

    fetchCraverData();
  }, []);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: profileError } = await supabase
        .from('driver_profiles')
        .update({
          status: 'online',
          is_available: true
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      setEndTime(endTime);
      setDriverState('online_searching');
      setShowEndTimeSheet(false);
      setOnlineTime(0);
      
      toast({
        title: "You're now online!",
        description: "Looking for delivery offers in your area.",
      });
    } catch (error) {
      console.error('Error going online:', error);
      toast({
        title: "Error",
        description: "Failed to go online. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePause = async () => {
    setDriverState(driverState === 'online_paused' ? 'online_searching' : 'online_paused');
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

      setDriverState('offline');
      setOnlineTime(0);
      setEndTime(null);
      
      toast({
        title: "You're now offline",
        description: "Great work today! Thanks for delivering.",
      });
    } catch (error) {
      console.error('Error going offline:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden mobile-app">
      {/* Mobile Status Bar */}
      <div className="h-12 bg-card border-b border-border/30 flex items-center justify-between px-4 text-sm safe-top">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-foreground rounded-full"></div>
            <div className="w-1 h-1 bg-foreground rounded-full"></div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
          </div>
          <span className="text-foreground font-medium">Craven</span>
        </div>
        <div className="text-foreground font-mono">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-5 h-3 border border-foreground rounded-sm relative">
            <div className="absolute inset-1 bg-green-500 rounded-[1px]"></div>
          </div>
          <span className="text-xs">100%</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-background pb-20 overflow-hidden">
        
        {/* Content based on active tab */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {activeTab === 'main' && (
            <>
              {/* Header when offline */}
              {driverState === 'offline' && (
                <div className="p-4 bg-card border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-lg font-semibold text-foreground">Ready to drive?</h1>
                      <p className="text-sm text-muted-foreground">{currentCity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs">
                        {driverState === 'offline' ? 'Offline' : 'Online'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Offline State */}
              {driverState === 'offline' && (
                <div className="p-4 space-y-6">
                  {/* Vehicle Selection */}
                  <div className="bg-card rounded-2xl p-4 border border-border/30">
                    <h3 className="text-sm font-medium text-foreground mb-3">Vehicle</h3>
                    <VehicleSelector
                      selectedVehicle={selectedVehicle}
                      onVehicleSelect={setSelectedVehicle}
                      docsStatus={docsStatus}
                    />
                  </div>

                  {/* Earning Mode */}
                  <div className="bg-card rounded-2xl p-4 border border-border/30">
                    <h3 className="text-sm font-medium text-foreground mb-3">Earning Mode</h3>
                    <EarningModeToggle
                      mode={earningMode}
                      onModeChange={setEarningMode}
                    />
                  </div>

                  {/* Go Online Button */}
                  <div className="px-2">
                    <Button
                      onClick={handleSatisfyCraveNow}
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg rounded-xl"
                    >
                      Go Online
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      Set your end time before going online
                    </p>
                  </div>
                </div>
              )}

              {/* Online Search Panel */}
              {(driverState === 'online_searching' || driverState === 'online_paused') && endTime && (
                <OnlineSearchPanel
                  earningMode={earningMode}
                  vehicleType={selectedVehicle}
                  endTime={endTime}
                  onlineTime={onlineTime}
                  onPause={handlePause}
                  onEndNow={handleEndNow}
                  isPaused={driverState === 'online_paused'}
                />
              )}
            </>
          )}

          {activeTab === 'schedule' && (
            <div className="p-4">
              <div className="bg-card rounded-2xl p-6 border border-border/30 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Plan your driving schedule and set recurring availability.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="flex-1">
              <AccountSection />
            </div>
          )}

          {activeTab === 'ratings' && (
            <div className="flex-1">
              <RatingsSection />
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="flex-1">
              <EarningsSection />
            </div>
          )}
        </div>
      </div>

      {/* Modals and Overlays */}
      <OrderAssignmentModal
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setCurrentOrderAssignment(null);
        }}
        assignment={currentOrderAssignment}
      />

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