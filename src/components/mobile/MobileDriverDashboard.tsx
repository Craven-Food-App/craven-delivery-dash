// MobileDriverDashboard.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ActiveDeliveryFlow, { ActiveDeliveryProps } from './ActiveDeliveryFlow';
import { OrderAssignmentModal } from './OrderAssignmentModal';
import { DriveTimeSelector } from './DriveTimeSelector';
import TestCompletionModal from './TestCompletionModal';
import { BottomNavigation } from './BottomNavigation';
import LoadingScreen from './LoadingScreen';
import { IOSNotificationBanner } from './IOSNotificationBanner';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useIOSNotifications } from '@/hooks/useIOSNotifications';

// Types
type DriverState = 'offline' | 'online_searching' | 'online_paused' | 'on_delivery';
type VehicleType = 'car' | 'bike' | 'scooter' | 'walk' | 'motorcycle';
type EarningMode = 'perHour' | 'perOffer';
type TabType = 'home' | 'schedule' | 'earnings' | 'notifications' | 'account';

interface OrderAssignment {
  assignment_id: string;
  order_id: string;
  restaurant_name: string;
  pickup_address: any; 
  dropoff_address: any; 
  payout_cents: number;
  distance_km: number;
  distance_mi: string;
  expires_at: string;
  estimated_time: number;
  isTestOrder?: boolean;
}

export const MobileDriverDashboard: React.FC = () => {
  const [driverState, setDriverState] = useState<DriverState>('offline');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('car');
  const [earningMode, setEarningMode] = useState<EarningMode>('perHour');
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [onlineTime, setOnlineTime] = useState(0);
  const [activeDelivery, setActiveDelivery] = useState<ActiveDeliveryProps['orderDetails'] | null>(null);
  const [currentOrderAssignment, setCurrentOrderAssignment] = useState<OrderAssignment | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTestCompletionModal, setShowTestCompletionModal] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { playNotification } = useNotificationSettings();
  const { showNotification, notifications: iosNotifications, dismissNotification } = useIOSNotifications();

  // Type-safe function to accept an order
  const handleAcceptOrder = (assignment: OrderAssignment) => {
    const delivery: ActiveDeliveryProps['orderDetails'] = {
      id: assignment.order_id,
      order_number: assignment.order_id,
      restaurant_name: assignment.restaurant_name,
      pickup_address: assignment.pickup_address,
      dropoff_address: assignment.dropoff_address,
      payout_cents: assignment.payout_cents,
      subtotal_cents: assignment.payout_cents,
      estimated_time: assignment.estimated_time,
      items: [{ name: 'Order Items', quantity: 1, price_cents: assignment.payout_cents }],
      isTestOrder: assignment.isTestOrder || false,
    };
    setActiveDelivery(delivery);
    setDriverState('on_delivery');
    setShowOrderModal(false);
    setCurrentOrderAssignment(null);
  };

  // Example: Passing types for OrderAssignmentModal
  return (
    <div className="h-screen relative bg-background">
      {/* Loading */}
      <LoadingScreen isLoading={isLoading} />

      {/* iOS notifications */}
      {iosNotifications.map(n => (
        <IOSNotificationBanner
          key={n.id}
          title={n.title}
          message={n.message}
          duration={n.duration}
          onDismiss={() => dismissNotification(n.id)}
        />
      ))}

      {/* Active Delivery */}
      {driverState === 'on_delivery' && activeDelivery && (
        <ActiveDeliveryFlow
          orderDetails={activeDelivery}
          onCompleteDelivery={() => {
            if (activeDelivery.isTestOrder) {
              setShowTestCompletionModal(true);
            }
            setActiveDelivery(null);
            setDriverState('online_searching');
          }}
        />
      )}

      {/* Order Assignment Modal */}
      <OrderAssignmentModal
        isOpen={showOrderModal}
        onClose={() => { setShowOrderModal(false); setCurrentOrderAssignment(null); }}
        assignment={currentOrderAssignment}
        onAccept={handleAcceptOrder}
        onDecline={() => { setShowOrderModal(false); setCurrentOrderAssignment(null); }}
      />

      {/* Drive Time Selector */}
      <DriveTimeSelector
        open={showTimeSelector}
        onClose={() => setShowTimeSelector(false)}
        onSelect={minutes => {
          const selectedEnd = new Date(Date.now() + minutes * 60 * 1000);
          setEndTime(selectedEnd);
          setShowTimeSelector(false);
        }}
      />

      {/* Test Completion Modal */}
      {showTestCompletionModal && (
        <TestCompletionModal
          orderDetails={{
            restaurant_name: 'Test Restaurant',
            pickup_address: 'Test Pickup Address',
            dropoff_address: 'Test Dropoff Address',
            payout_cents: 1500,
            estimated_time: 30,
            isTestOrder: true,
          }}
          onCompleteDelivery={() => setShowTestCompletionModal(false)}
        />
      )}

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};
