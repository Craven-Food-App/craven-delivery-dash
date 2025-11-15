import React, { useState, useEffect, useMemo } from 'react';
import { Power, Check, X, MapPin, Navigation, DollarSign, Clock, Package, Menu, Home, Bell, Phone, Copy, Camera, RotateCcw, Utensils, Zap, Play, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FullscreenCamera from './FullscreenCamera';

// --- CONFIGURATION AND CONSTANTS ---

const DRIVER_STATUS = {
  OFFLINE: 'offline',
  ONLINE_AWAITING: 'online_awaiting',
  NEW_OFFER: 'new_offer',
  TO_STORE: 'to_store',
  AT_STORE: 'at_store',
  AWAITING_PICKUP_PHOTO: 'awaiting_pickup_photo',
  TO_CUSTOMER: 'to_customer',
  AT_CUSTOMER: 'at_customer',
  AWAITING_DELIVERY_PHOTO: 'awaiting_delivery_photo',
  COMPLETE: 'complete',
};

// Crave'n Styles
const styles = {
  appBackground: "bg-gradient-to-br from-orange-600 to-red-600 min-h-screen",
  actionButton: "w-full py-4 mt-6 text-lg font-extrabold rounded-2xl text-white shadow-xl bg-neutral-900 hover:bg-neutral-800 transition-all active:scale-[0.99]",
  secondaryButton: "w-full py-4 text-lg font-extrabold rounded-2xl text-red-700 border-2 border-red-700 bg-white hover:bg-red-50 transition-all active:scale-[0.99]",
  cardBackground: "bg-white p-4 rounded-xl shadow-2xl shadow-orange-900/10 mb-4 border border-neutral-100",
  navButton: "flex items-center gap-1 text-sm font-semibold text-neutral-900 active:opacity-80 p-3 rounded-xl bg-white shadow-lg shadow-black/10 hover:bg-neutral-100 transition-colors",
  iconContainer: "p-3 bg-red-100 rounded-full text-red-700 flex-shrink-0",
};

interface CravenDeliveryFlowProps {
  orderDetails: {
    id?: string;
    order_id?: string;
    order_number?: string;
    restaurant_name?: string;
    pickup_address?: string;
    dropoff_address?: string;
    customer_name?: string;
    customer_phone?: string;
    delivery_notes?: string;
    payout_cents?: number;
    distance_km?: number;
    distance_mi?: number;
    items?: Array<{ name: string; quantity: number; price_cents?: number }>;
    isTestOrder?: boolean;
  };
  onCompleteDelivery: () => void;
  onCameraStateChange?: (isOpen: boolean) => void;
}

// Helper function to copy text to clipboard
const copyToClipboard = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
  document.body.removeChild(textarea);
};

// Simulated Mapbox View Component
const SimulatedMapView = ({ isToStore }: { isToStore: boolean }) => {
  const driverStyle = "absolute z-30 p-1 bg-blue-500 rounded-full ring-4 ring-white/80 animate-pulse transition-all duration-1000";
  const storeStyle = "absolute z-20 text-white bg-red-600 p-1 rounded-full ring-2 ring-red-300 shadow-lg";
  const customerStyle = "absolute z-20 text-white bg-green-600 p-1 rounded-full ring-2 ring-green-300 shadow-lg";

  const driverPos = isToStore ? { top: '75%', left: '15%' } : { top: '20%', left: '70%' };
  const storePos = { top: '35%', left: '40%' };
  const customerPos = { top: '65%', left: '80%' };

  const routePath = isToStore 
    ? "M 20 80 L 45 40 L 85 70"
    : "M 75 25 L 85 70";

  return (
    <div className="absolute inset-0 bg-neutral-900 overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 bottom-0 left-1/2 w-4 bg-neutral-700"></div>
        <div className="absolute top-1/2 left-0 right-0 h-4 bg-neutral-700"></div>
        <div className="absolute top-[10%] right-0 bottom-[60%] w-1/4 bg-blue-900/50"></div>
      </div>

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path 
          d={routePath} 
          fill="none" 
          stroke="#FF3D00" 
          strokeWidth="3" 
          strokeLinecap="round"
          strokeDasharray="8 4"
          className="animate-route-flow"
        />
      </svg>

      <style>{`
        @keyframes routeFlow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -12; }
        }
        .animate-route-flow {
          animation: routeFlow 1s linear infinite;
        }
      `}</style>

      <div style={driverPos} className={driverStyle}>
        <Navigation className="w-4 h-4 text-white -rotate-45" />
      </div>
      
      <div style={storePos} className={storeStyle}>
        <Utensils className="w-4 h-4" />
      </div>

      <div style={customerPos} className={customerStyle}>
        <Home className="w-4 h-4" />
      </div>
    </div>
  );
};

// Map View Header Component
const MapHeader = ({ title, status, locationIcon, distance, pay }: { 
  title: string; 
  status: string; 
  locationIcon: React.ReactNode; 
  distance: number; 
  pay: number;
}) => {
  const payAmount = typeof pay === 'number' ? pay.toFixed(2) : '0.00';
  
  return (
    <div className="p-4 pt-10 text-white flex flex-col justify-between h-full relative z-40 bg-gradient-to-br from-orange-600/80 to-red-600/80">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black italic tracking-wider">Crave'n</h1>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">ON FIRE</span>
          <Clock className="w-5 h-5" />
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-red-800 rounded-full border-2 border-white/50">
            {locationIcon}
          </span>
          <div>
            <p className="text-sm opacity-80 font-medium">{status}</p>
            <h2 className="text-2xl font-extrabold truncate">{title}</h2>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-black leading-none">{typeof distance === 'number' ? distance.toFixed(1) : '0.0'} mi</p>
          <p className="text-sm opacity-80 font-medium">to destination</p>
        </div>
      </div>

      <div className="absolute left-4 right-4 -bottom-6 bg-white p-4 rounded-xl shadow-2xl shadow-black/30">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-neutral-500 flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-green-600"/> Estimated Pay
          </span>
          <p className="text-3xl font-black text-green-700 leading-none">${payAmount}</p>
        </div>
      </div>
    </div>
  );
};

// Detail Card Component
const DetailCard = ({ title, content, icon, actionButton, linkHref }: {
  title: string;
  content: string;
  icon: React.ReactNode;
  actionButton?: React.ReactNode;
  linkHref?: string;
}) => (
  <div className={styles.cardBackground}>
    <div className="flex items-start gap-4">
      <div className={styles.iconContainer}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-neutral-500 mb-1">{title}</h3>
        {linkHref ? (
          <a 
            href={linkHref} 
            className="text-base font-medium text-blue-600 hover:text-blue-700 leading-tight block truncate"
            onClick={(e) => { e.preventDefault(); }}
          >
            {content}
          </a>
        ) : (
          <p className="text-base font-medium text-neutral-900 leading-tight">{content}</p>
        )}
      </div>
      {actionButton && <div className="flex-shrink-0">{actionButton}</div>}
    </div>
  </div>
);

/**
 * Main Delivery Flow Manager Component
 */
export default function CravenDeliveryFlow({ 
  orderDetails, 
  onCompleteDelivery,
  onCameraStateChange 
}: CravenDeliveryFlowProps) {
  // Early validation - must be before hooks
  if (!orderDetails) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Missing Order Details</p>
          <p className="text-sm text-gray-600">Order information is not available.</p>
        </div>
      </div>
    );
  }

  const [status, setStatus] = useState(DRIVER_STATUS.TO_STORE);
  const [pickupPhoto, setPickupPhoto] = useState<string | null>(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [photoType, setPhotoType] = useState<'pickup' | 'delivery'>('pickup');
  const [pickupCode, setPickupCode] = useState<string | null>(null);
  const { toast } = useToast();

  const isTestOrder = orderDetails.isTestOrder || false;

  // Fetch pickup code
  useEffect(() => {
    if (isTestOrder || !orderDetails.order_id) return;
    
    const fetchPickupCode = async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('pickup_code')
          .eq('id', orderDetails.order_id)
          .maybeSingle();
        if (data?.pickup_code) {
          setPickupCode(data.pickup_code);
        }
      } catch (error) {
        console.error('Error fetching pickup code:', error);
      }
    };
    fetchPickupCode();
  }, [orderDetails.order_id, isTestOrder]);

  // Update order status in Supabase
  const updateOrderStatus = async (newStatus: string) => {
    if (isTestOrder || !orderDetails.order_id) return;
    
    try {
      // Map delivery flow statuses to database statuses
      const statusMap: Record<string, string> = {
        'at_restaurant': 'assigned',
        'picked_up': 'picked_up',
        'at_customer': 'picked_up',
      };
      
      const dbStatus = statusMap[newStatus] || newStatus;
      
      const { error } = await supabase
        .from('orders')
        .update({ status: dbStatus })
        .eq('id', orderDetails.order_id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Upload photo to Supabase Storage
  const uploadPhoto = async (photoDataUrl: string, type: 'pickup' | 'delivery'): Promise<string | null> => {
    if (isTestOrder) {
      // Return mock URL for test orders
      return `https://mock-storage.com/${type}-${Date.now()}.jpg`;
    }

    if (!orderDetails.order_id) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const fileName = `${orderDetails.order_id}/${type}-${Date.now()}.jpg`;
      const response = await fetch(photoDataUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      const { data, error } = await supabase.storage
        .from('delivery-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Flow Handlers
  const handleConfirmArrivalAtStore = async () => {
    setStatus(DRIVER_STATUS.AT_STORE);
    await updateOrderStatus('at_restaurant');
  };

  const handleStartPickupVerification = () => {
    setPhotoType('pickup');
    setShowCamera(true);
    onCameraStateChange?.(true);
  };

  const handleConfirmPickupPhoto = async (photoUrl: string) => {
    const uploadedUrl = await uploadPhoto(photoUrl, 'pickup');
    if (uploadedUrl) {
      setPickupPhoto(uploadedUrl);
      setStatus(DRIVER_STATUS.TO_CUSTOMER);
      await updateOrderStatus('picked_up');
    }
    setShowCamera(false);
    onCameraStateChange?.(false);
  };

  const handleConfirmArrivalAtCustomer = async () => {
    setStatus(DRIVER_STATUS.AT_CUSTOMER);
    await updateOrderStatus('at_customer');
  };

  const handleStartDeliveryVerification = () => {
    setPhotoType('delivery');
    setShowCamera(true);
    onCameraStateChange?.(true);
  };

  const handleConfirmDeliveryPhoto = async (photoUrl: string) => {
    const uploadedUrl = await uploadPhoto(photoUrl, 'delivery');
    if (uploadedUrl) {
      setDeliveryPhoto(uploadedUrl);
      
      // Finalize delivery
      if (!isTestOrder && orderDetails.order_id) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.functions.invoke('finalize-delivery', {
            body: {
              orderId: orderDetails.order_id,
              driverId: user?.id,
              pickupPhotoUrl: pickupPhoto,
              deliveryPhotoUrl: uploadedUrl,
            }
          });
        } catch (error) {
          console.error('Error finalizing delivery:', error);
        }
      }
      
      setStatus(DRIVER_STATUS.COMPLETE);
    }
    setShowCamera(false);
    onCameraStateChange?.(false);
  };

  const handleCancelPhoto = () => {
    if (status === DRIVER_STATUS.AWAITING_PICKUP_PHOTO) {
      setStatus(DRIVER_STATUS.AT_STORE);
    } else if (status === DRIVER_STATUS.AWAITING_DELIVERY_PHOTO) {
      setStatus(DRIVER_STATUS.AT_CUSTOMER);
    }
    setShowCamera(false);
    onCameraStateChange?.(false);
  };

  // Memoized Flow Data
  const currentFlow = useMemo(() => {
    switch (status) {
      case DRIVER_STATUS.TO_STORE:
      case DRIVER_STATUS.AT_STORE:
      case DRIVER_STATUS.AWAITING_PICKUP_PHOTO:
        return {
          title: orderDetails.restaurant_name || 'Restaurant',
          statusText: status === DRIVER_STATUS.TO_STORE ? 'Routing to Kitchen' 
                      : status === DRIVER_STATUS.AT_STORE ? 'Awaiting Hand-off'
                      : 'Verify Pickup',
          address: orderDetails.pickup_address || 'Pickup Address',
          distance: typeof orderDetails.distance_mi === 'number' ? orderDetails.distance_mi : (typeof orderDetails.distance_km === 'number' ? orderDetails.distance_km * 0.621371 : 0),
          icon: <Utensils className="w-5 h-5" />,
          isPickup: true,
        };
      case DRIVER_STATUS.TO_CUSTOMER:
      case DRIVER_STATUS.AT_CUSTOMER:
      case DRIVER_STATUS.AWAITING_DELIVERY_PHOTO:
        return {
          title: orderDetails.customer_name || 'Customer',
          statusText: status === DRIVER_STATUS.TO_CUSTOMER ? 'En Route to Craver' 
                      : status === DRIVER_STATUS.AT_CUSTOMER ? 'At Drop-off Location'
                      : 'Verify Drop-off',
          address: orderDetails.dropoff_address || 'Delivery Address',
          distance: typeof orderDetails.distance_mi === 'number' ? orderDetails.distance_mi : (typeof orderDetails.distance_km === 'number' ? orderDetails.distance_km * 0.621371 : 0),
          icon: <Home className="w-5 h-5" />,
          isPickup: false,
        };
      default:
        // Default to pickup flow if status is unexpected
        return {
          title: orderDetails.restaurant_name || 'Restaurant',
          statusText: 'Preparing for pickup',
          address: orderDetails.pickup_address || 'Pickup Address',
          distance: typeof orderDetails.distance_mi === 'number' ? orderDetails.distance_mi : (typeof orderDetails.distance_km === 'number' ? orderDetails.distance_km * 0.621371 : 0),
          icon: <Utensils className="w-5 h-5" />,
          isPickup: true,
        };
    }
  }, [status, orderDetails]);

  // Photo Capture Screen
  if (showCamera) {
    return (
      <FullscreenCamera
        isOpen={showCamera}
        onClose={handleCancelPhoto}
        onCapture={photoType === 'pickup' ? handleConfirmPickupPhoto : handleConfirmDeliveryPhoto}
        title={photoType === 'pickup' ? "Kitchen Hand-off Check" : "Craver Drop-off Proof"}
        description={photoType === 'pickup' ? 
          "Snap a photo of the sealed Crave'n bag with the order ID sticker clearly visible." : 
          "Take a photo showing the delivered bag at the customer's preferred drop-off location."}
        type={photoType}
        onVisibilityChange={onCameraStateChange}
      />
    );
  }

  // Completion Screen
  if (status === DRIVER_STATUS.COMPLETE) {
    const payAmount = orderDetails.payout_cents ? (orderDetails.payout_cents / 100).toFixed(2) : '0.00';
    const orderIdSuffix = orderDetails.order_number?.split('-')[1] || orderDetails.order_id?.slice(-8) || '';

    return (
      <div className={`flex flex-col items-center justify-center flex-1 p-6 text-center ${styles.appBackground}`}>
        <Check className={`w-24 h-24 text-white mb-6 border-4 border-white rounded-full p-2 bg-green-500/80`} />
        <h2 className="text-4xl font-black text-white mb-4">CASH IN!</h2>
        <p className="text-white/90 mb-1 font-semibold text-lg">You just earned:</p>
        <p className="text-6xl font-black text-white mb-8 drop-shadow-lg">${payAmount}</p>

        <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-black/30 w-full max-w-sm mb-8">
          <h3 className="text-sm font-bold text-neutral-500 mb-3 uppercase tracking-wider">SUMMARY</h3>
          <div className='flex justify-between items-center py-1'>
            <p className="text-base font-medium text-neutral-700">Order ID:</p>
            <p className='text-base font-black text-neutral-900'>{orderIdSuffix}</p>
          </div>
          <div className='flex justify-between items-center py-1'>
            <p className="text-base font-medium text-neutral-700">Distance Traveled:</p>
            <p className='text-base font-black text-neutral-900'>
              {orderDetails.distance_mi?.toFixed(1) || (orderDetails.distance_km ? (orderDetails.distance_km * 0.621371).toFixed(1) : '0')} mi
            </p>
          </div>
        </div>

        <button
          onClick={onCompleteDelivery}
          className="w-4/5 h-16 bg-white hover:bg-neutral-100 text-red-600 text-xl font-bold rounded-full shadow-2xl shadow-black/40 transition-all active:scale-[0.98]"
        >
          Continue Accepting Orders
        </button>
      </div>
    );
  }

  // Active Flow Render
  const payAmount = orderDetails.payout_cents ? (orderDetails.payout_cents / 100) : 0;
  const isToStore = currentFlow?.isPickup ?? true;
  const orderIdSuffix = orderDetails.order_number?.split('-')[1] || orderDetails.order_id?.slice(-8) || '';

  // Safety check - if currentFlow is empty, show loading or error state
  if (!currentFlow || !currentFlow.title) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Loading delivery details...</p>
          <p className="text-sm text-gray-600">Please wait while we load your order information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col flex-1 font-sans`}>
      {/* Map View Simulation */}
      <div className="h-[40%] w-full relative flex-shrink-0">
        <SimulatedMapView isToStore={isToStore} />
        <MapHeader
          title={currentFlow.title}
          status={currentFlow.statusText || ''}
          locationIcon={currentFlow.icon}
          distance={currentFlow.distance || 0}
          pay={payAmount}
        />
      </div>
      <div className="h-6"></div>

      {/* Details and Actions */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto bg-white rounded-t-3xl shadow-inner shadow-black/10 -mt-6">
        <div className="pt-4">
          <h3 className="text-xl font-extrabold text-neutral-900 mb-4">
            ORDER DETAILS #{orderIdSuffix}
            {isTestOrder && <span className="ml-2 text-sm font-normal text-orange-600">(Test Order)</span>}
          </h3>

          {currentFlow?.isPickup ? (
            <>
              <DetailCard 
                title="PICKUP ADDRESS"
                content={orderDetails.pickup_address || 'Pickup Address'}
                icon={<MapPin className="w-5 h-5"/>}
                actionButton={
                  <button 
                    className={styles.navButton} 
                    title="Start Navigation"
                    onClick={() => {
                      const address = encodeURIComponent(orderDetails.pickup_address || '');
                      window.open(`https://maps.apple.com/?daddr=${address}`, '_blank');
                    }}
                  >
                    <Navigation className="w-4 h-4" /> Navigate
                  </button>
                }
              />
              
              {pickupCode && (
                <DetailCard 
                  title="ORDER CODE (FOR KITCHEN)"
                  content={pickupCode}
                  icon={<Package className="w-5 h-5"/>}
                  actionButton={
                    <button 
                      onClick={() => {
                        copyToClipboard(pickupCode);
                        toast({
                          title: "Copied!",
                          description: `Pickup code ${pickupCode} copied to clipboard`,
                        });
                      }} 
                      className="p-3 bg-neutral-100 rounded-xl text-neutral-700 active:bg-neutral-200 transition-colors shadow-md"
                      title="Copy Code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  }
                />
              )}

              {orderDetails.items && orderDetails.items.length > 0 && (
                <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200 shadow-inner">
                  <h4 className="text-sm font-bold text-red-600 mb-2">
                    CRAVE'N ITEMS ({orderDetails.items.length})
                  </h4>
                  <ul className="space-y-2 text-sm text-neutral-800">
                    {orderDetails.items.map((item, index) => (
                      <li key={index} className="flex justify-between border-b border-orange-100 pb-1 last:border-b-0">
                        <span>{item.name}</span>
                        <span className="font-bold text-neutral-900">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="h-6"></div>

              {status === DRIVER_STATUS.TO_STORE && (
                <button onClick={handleConfirmArrivalAtStore} className={styles.actionButton}>
                  Arrived at Crave'n Kitchen
                </button>
              )}

              {status === DRIVER_STATUS.AT_STORE && (
                <button onClick={handleStartPickupVerification} className={styles.actionButton}>
                  Order Ready? Start Hand-off Check
                </button>
              )}
            </>
          ) : (
            <>
              <DetailCard 
                title="CRAVER ADDRESS"
                content={orderDetails.dropoff_address || 'Delivery Address'}
                icon={<Home className="w-5 h-5"/>}
                actionButton={
                  <button 
                    className={styles.navButton} 
                    title="Start Navigation"
                    onClick={() => {
                      const address = encodeURIComponent(orderDetails.dropoff_address || '');
                      window.open(`https://maps.apple.com/?daddr=${address}`, '_blank');
                    }}
                  >
                    <Navigation className="w-4 h-4" /> Navigate
                  </button>
                }
              />
              
              {orderDetails.delivery_notes && (
                <DetailCard 
                  title="SPECIAL INSTRUCTIONS"
                  content={orderDetails.delivery_notes}
                  icon={<Bell className="w-5 h-5"/>}
                  actionButton={
                    <button 
                      onClick={() => {
                        copyToClipboard(orderDetails.delivery_notes || '');
                        toast({
                          title: "Copied!",
                          description: "Delivery notes copied to clipboard",
                        });
                      }} 
                      className="p-3 bg-neutral-100 rounded-xl text-neutral-700 active:bg-neutral-200 transition-colors shadow-md"
                      title="Copy Instructions"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  }
                />
              )}

              <div className="h-6"></div>

              {status === DRIVER_STATUS.TO_CUSTOMER && (
                <button onClick={handleConfirmArrivalAtCustomer} className={styles.actionButton}>
                  Arrived at Craver's Location
                </button>
              )}

              {status === DRIVER_STATUS.AT_CUSTOMER && (
                <button onClick={handleStartDeliveryVerification} className={styles.actionButton}>
                  Drop-off & Complete Delivery
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

