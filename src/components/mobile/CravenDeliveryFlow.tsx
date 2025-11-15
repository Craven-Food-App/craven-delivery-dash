import React, { useState, useEffect, useMemo } from 'react';
import { Check, MapPin, Navigation, DollarSign, Clock, Package, Home, Bell, Copy, Camera, RotateCcw, Utensils } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FullscreenCamera from './FullscreenCamera';

// ===== TYPES =====

type DeliveryStage = 'navigate_to_restaurant' | 'arrived_at_restaurant' | 'verify_pickup' | 'pickup_photo_verification' | 'navigate_to_customer' | 'capture_proof' | 'delivered';

interface OrderItem {
  name: string;
  quantity: number;
  special_instructions?: string;
}

interface DeliveryProgress {
  currentStage: DeliveryStage;
  stageNumber: number;
  totalStages: number;
  stageName: string;
  isCompleted: boolean;
  pickupPhotoUrl?: string;
  deliveryPhotoUrl?: string;
}

interface ActiveDeliveryProps {
  orderDetails: any;
  onCompleteDelivery: () => void;
  onProgressChange?: (progress: DeliveryProgress) => void;
  onCameraStateChange?: (isOpen: boolean) => void;
}

// ===== DRIVER STATUS =====

const DRIVER_STATUS = {
  TO_STORE: 'to_store',
  AT_STORE: 'at_store',
  AWAITING_PICKUP_PHOTO: 'awaiting_pickup_photo',
  TO_CUSTOMER: 'to_customer',
  AT_CUSTOMER: 'at_customer',
  AWAITING_DELIVERY_PHOTO: 'awaiting_delivery_photo',
  COMPLETE: 'complete',
};

// Map internal status to DeliveryStage
const STATUS_TO_STAGE_MAP: Record<string, DeliveryStage> = {
  [DRIVER_STATUS.TO_STORE]: 'navigate_to_restaurant',
  [DRIVER_STATUS.AT_STORE]: 'arrived_at_restaurant',
  [DRIVER_STATUS.AWAITING_PICKUP_PHOTO]: 'pickup_photo_verification',
  [DRIVER_STATUS.TO_CUSTOMER]: 'navigate_to_customer',
  [DRIVER_STATUS.AT_CUSTOMER]: 'arrived_at_restaurant',
  [DRIVER_STATUS.AWAITING_DELIVERY_PHOTO]: 'capture_proof',
  [DRIVER_STATUS.COMPLETE]: 'delivered',
};

const STAGE_NAMES: Record<DeliveryStage, string> = {
  navigate_to_restaurant: 'Navigate to Restaurant',
  arrived_at_restaurant: 'Arrived at Restaurant',
  verify_pickup: 'Verify Pickup',
  pickup_photo_verification: 'Pickup Photo Verification',
  navigate_to_customer: 'Navigate to Customer',
  capture_proof: 'Capture Delivery Proof',
  delivered: 'Delivered',
};

// ===== STYLES =====

const styles = {
    appBackground: "bg-gradient-to-br from-orange-600 to-red-600 min-h-screen",
    actionButton: "w-full py-4 mt-6 text-lg font-extrabold rounded-2xl text-white shadow-xl bg-neutral-900 hover:bg-neutral-800 transition-all active:scale-[0.99]",
    cardBackground: "bg-white p-4 rounded-xl shadow-2xl shadow-orange-900/10 mb-4 border border-neutral-100",
    navButton: "flex items-center gap-1 text-sm font-semibold text-neutral-900 active:opacity-80 p-3 rounded-xl bg-white shadow-lg shadow-black/10 hover:bg-neutral-100 transition-colors",
    iconContainer: "p-3 bg-red-100 rounded-full text-red-700 flex-shrink-0",
};

// ===== UTILITY FUNCTIONS =====

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

// ===== PRESENTATIONAL COMPONENTS =====

const SimulatedMapView: React.FC<{ isToStore: boolean }> = ({ isToStore }) => {
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

interface MapHeaderProps {
    title: string;
    status: string;
    locationIcon: React.ReactNode;
    distance: number;
    pay: number;
}

const MapHeader: React.FC<MapHeaderProps> = ({ title, status, locationIcon, distance, pay }) => {
    const payAmount = typeof pay === 'number' ? pay.toFixed(2) : '0.00';
    
    return (
        <div className="p-4 pt-10 text-white flex flex-col justify-between h-full relative z-40 bg-gradient-to-br from-orange-600/80 to-red-600/80">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-black italic tracking-wider">CRAVEN</h1>
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
                    <span className="text-sm font-semibold text-neutral-500 flex items-center gap-1"><DollarSign className="w-4 h-4 text-green-600"/> Estimated Pay</span>
                    <p className="text-3xl font-black text-green-700 leading-none">${payAmount}</p>
                </div>
            </div>
        </div>
    );
};

interface DetailCardProps {
    title: string;
    content: string;
    icon: React.ReactNode;
    actionButton?: React.ReactNode;
    linkHref?: string;
}

const DetailCard: React.FC<DetailCardProps> = ({ title, content, icon, actionButton, linkHref }) => (
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

// ===== MAIN COMPONENT =====

const CravenDeliveryFlow: React.FC<ActiveDeliveryProps> = ({ 
    orderDetails, 
    onCompleteDelivery, 
    onProgressChange,
    onCameraStateChange 
}) => {
  // Early validation
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

  // Start directly at TO_STORE since order is already accepted
  const [status, setStatus] = useState(DRIVER_STATUS.TO_STORE);
  const [pickupCode, setPickupCode] = useState<string | null>(null);
  const [pickupPhotoUrl, setPickupPhotoUrl] = useState<string>();
  const [deliveryPhotoUrl, setDeliveryPhotoUrl] = useState<string>();
  const [showCamera, setShowCamera] = useState(false);
  const [photoType, setPhotoType] = useState<'pickup' | 'delivery'>('pickup');
  const { toast } = useToast();

  const isTestOrder = orderDetails.isTestOrder || false;

  // Parse orderDetails into expected format
  const currentOrder = useMemo(() => {
    return {
      id: orderDetails?.id || orderDetails?.order_id || 'CRAVEN-' + Math.floor(Math.random() * 9000 + 1000),
      pay: orderDetails?.payout_cents ? (orderDetails.payout_cents / 100) : (orderDetails?.pay || orderDetails?.total || 16.25),
      distanceToStore: orderDetails?.distance_mi || (orderDetails?.distance_km ? orderDetails.distance_km * 0.621371 : 0.8),
      distanceToCustomer: orderDetails?.distance_mi || (orderDetails?.distance_km ? orderDetails.distance_km * 0.621371 : 5.1),
      totalDistance: orderDetails?.distance_mi || (orderDetails?.distance_km ? orderDetails.distance_km * 0.621371 : 5.9),
      timeEstimate: orderDetails?.estimated_time || 30,
      store: {
        name: orderDetails?.restaurant_name || 'Craven Restaurant',
        address: orderDetails?.pickup_address || '123 Main St',
        pickupCode: pickupCode || 'LOADING...',
        phone: orderDetails?.customer_phone || '(555) 555-5555',
      },
      customer: {
        name: orderDetails?.customer_name || 'Customer',
        address: orderDetails?.dropoff_address || '456 Oak Ave',
        deliveryNotes: orderDetails?.delivery_notes || 'Ring doorbell',
        phone: orderDetails?.customer_phone || '(555) 555-1234',
      },
      items: orderDetails?.items || [],
    };
  }, [orderDetails, pickupCode]);

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

  // Update progress when status changes
  useEffect(() => {
    if (onProgressChange) {
      const stage = STATUS_TO_STAGE_MAP[status];
      if (stage) {
        const stageNumber = Object.keys(STATUS_TO_STAGE_MAP).indexOf(status) + 1;
        const progress: DeliveryProgress = {
          currentStage: stage,
          stageNumber,
          totalStages: 7,
          stageName: STAGE_NAMES[stage],
          isCompleted: status === DRIVER_STATUS.COMPLETE,
          pickupPhotoUrl,
          deliveryPhotoUrl,
        };
        onProgressChange(progress);
      }
    }
  }, [status, onProgressChange, pickupPhotoUrl, deliveryPhotoUrl]);

  // Notify camera state changes
  useEffect(() => {
    if (onCameraStateChange) {
      const isCameraOpen = status === DRIVER_STATUS.AWAITING_PICKUP_PHOTO || status === DRIVER_STATUS.AWAITING_DELIVERY_PHOTO;
      onCameraStateChange(isCameraOpen);
    }
  }, [status, onCameraStateChange]);

  // ===== FLOW HANDLERS =====

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
      setPickupPhotoUrl(uploadedUrl);
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
      setDeliveryPhotoUrl(uploadedUrl);
      
      // Finalize delivery
      if (!isTestOrder && orderDetails.order_id) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.functions.invoke('finalize-delivery', {
            body: {
              orderId: orderDetails.order_id,
              driverId: user?.id,
              pickupPhotoUrl: pickupPhotoUrl,
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

  // ===== MEMOIZED FLOW DATA =====

  const currentFlow = useMemo(() => {
    switch (status) {
      case DRIVER_STATUS.TO_STORE:
      case DRIVER_STATUS.AT_STORE:
      case DRIVER_STATUS.AWAITING_PICKUP_PHOTO:
        return {
          title: currentOrder.store.name,
          statusText: status === DRIVER_STATUS.TO_STORE ? 'Routing to Kitchen' 
                      : status === DRIVER_STATUS.AT_STORE ? 'Awaiting Hand-off'
                      : 'Verify Pickup',
          address: currentOrder.store.address,
          distance: currentOrder.distanceToStore,
          icon: <Utensils className="w-5 h-5" />,
          isPickup: true,
        };
      case DRIVER_STATUS.TO_CUSTOMER:
      case DRIVER_STATUS.AT_CUSTOMER:
      case DRIVER_STATUS.AWAITING_DELIVERY_PHOTO:
        return {
          title: currentOrder.customer.name,
          statusText: status === DRIVER_STATUS.TO_CUSTOMER ? 'En Route to Customer' 
                      : status === DRIVER_STATUS.AT_CUSTOMER ? 'At Drop-off Location'
                      : 'Verify Drop-off',
          address: currentOrder.customer.address,
          distance: currentOrder.distanceToCustomer,
          icon: <Home className="w-5 h-5" />,
          isPickup: false,
        };
      default:
        return {
          title: currentOrder.store.name,
          statusText: 'Preparing for pickup',
          address: currentOrder.store.address,
          distance: currentOrder.distanceToStore,
          icon: <Utensils className="w-5 h-5" />,
          isPickup: true,
        };
    }
  }, [status, currentOrder]);

  // ===== RENDER FUNCTIONS =====

  // Photo Capture Screen
  if (showCamera) {
    return (
      <FullscreenCamera
        isOpen={showCamera}
        onClose={handleCancelPhoto}
        onCapture={photoType === 'pickup' ? handleConfirmPickupPhoto : handleConfirmDeliveryPhoto}
        title={photoType === 'pickup' ? "Kitchen Hand-off Check" : "Customer Drop-off Proof"}
        description={photoType === 'pickup' ? 
          "Snap a photo of the sealed Craven bag with the order ID sticker clearly visible." : 
          "Take a photo showing the delivered bag at the customer's preferred drop-off location."}
        type={photoType}
        onVisibilityChange={onCameraStateChange}
      />
    );
  }

  const renderActiveFlow = () => {
    const payAmount = typeof currentOrder.pay === 'number' ? currentOrder.pay : parseFloat(String(currentOrder.pay || 0));
    const isToStore = currentFlow?.isPickup ?? true;

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

          <div className="flex-1 px-4 pb-4 overflow-y-auto bg-white rounded-t-3xl shadow-inner shadow-black/10 -mt-6">
            
            <div className="pt-4">
                <h3 className="text-xl font-extrabold text-neutral-900 mb-4">
                  ORDER DETAILS #{currentOrder.id.split('-')[1] || currentOrder.id.slice(-8)}
                  {isTestOrder && <span className="ml-2 text-sm font-normal text-orange-600">(Test Order)</span>}
                </h3>
            
                {currentFlow.isPickup ? (
                    <>
                        <DetailCard 
                            title="PICKUP ADDRESS"
                            content={currentOrder.store.address}
                            icon={<MapPin className="w-5 h-5"/>}
                            actionButton={
                                <button 
                                  className={styles.navButton} 
                                  title="Start Navigation"
                                  onClick={() => {
                                    const address = encodeURIComponent(currentOrder.store.address);
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
                                  ><Copy className="w-4 h-4" /></button>
                              }
                          />
                        )}
                        
                        {currentOrder.items && currentOrder.items.length > 0 && (
                          <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200 shadow-inner">
                              <h4 className="text-sm font-bold text-red-600 mb-2">CRAVEN ITEMS ({currentOrder.items.length})</h4>
                              <ul className="space-y-2 text-sm text-neutral-800">
                                  {currentOrder.items.map((item: any, index: number) => (
                                      <li key={index} className="flex justify-between border-b border-orange-100 pb-1 last:border-b-0">
                                          <span>{item.name}</span>
                                          <span className="font-bold text-neutral-900">x{item.qty || item.quantity}</span>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                        )}
                        <div className="h-6"></div> 

                        {status === DRIVER_STATUS.TO_STORE && (
                            <button onClick={handleConfirmArrivalAtStore}
                                className={styles.actionButton}
                            >Arrived at Craven Kitchen</button>
                        )}
                        
                        {status === DRIVER_STATUS.AT_STORE && (
                             <button onClick={handleStartPickupVerification}
                                className={styles.actionButton}
                            >Order Ready? Start Hand-off Check</button>
                        )}
                    </>
                ) : (
                    <>
                        <DetailCard 
                            title="CUSTOMER ADDRESS"
                            content={currentOrder.customer.address}
                            icon={<Home className="w-5 h-5"/>}
                            actionButton={
                                <button 
                                  className={styles.navButton} 
                                  title="Start Navigation"
                                  onClick={() => {
                                    const address = encodeURIComponent(currentOrder.customer.address);
                                    window.open(`https://maps.apple.com/?daddr=${address}`, '_blank');
                                  }}
                                >
                                    <Navigation className="w-4 h-4" /> Navigate
                                </button>
                            }
                        />
                        {currentOrder.customer.deliveryNotes && (
                          <DetailCard 
                              title="SPECIAL INSTRUCTIONS"
                              content={currentOrder.customer.deliveryNotes}
                              icon={<Bell className="w-5 h-5"/>}
                              actionButton={
                                  <button 
                                    onClick={() => {
                                      copyToClipboard(currentOrder.customer.deliveryNotes);
                                      toast({
                                        title: "Copied!",
                                        description: "Delivery notes copied to clipboard",
                                      });
                                    }} 
                                      className="p-3 bg-neutral-100 rounded-xl text-neutral-700 active:bg-neutral-200 transition-colors shadow-md"
                                      title="Copy Instructions"
                                  ><Copy className="w-4 h-4" /></button>
                              }
                          />
                        )}
                        <div className="h-6"></div> 

                        {status === DRIVER_STATUS.TO_CUSTOMER && (
                            <button onClick={handleConfirmArrivalAtCustomer}
                                className={styles.actionButton}
                            >Arrived at Customer's Location</button>
                        )}
                        
                        {status === DRIVER_STATUS.AT_CUSTOMER && (
                            <button onClick={handleStartDeliveryVerification}
                                className={styles.actionButton}
                            >Drop-off & Complete Delivery</button>
                        )}
                    </>
                )}
            </div>
          </div>
        </div>
    );
  };

  const renderComplete = () => {
    return (
        <div className={`flex flex-col items-center justify-center flex-1 p-6 text-center ${styles.appBackground}`}>
          <Check className={`w-24 h-24 text-white mb-6 border-4 border-white rounded-full p-2 bg-green-500/80`} />
          <h2 className="text-4xl font-black text-white mb-4">DELIVERY COMPLETE!</h2>
          <p className="text-white/90 mb-1 font-semibold text-lg">Great job! You earned:</p>
          <p className="text-6xl font-black text-white mb-8 drop-shadow-lg">${typeof currentOrder.pay === 'number' ? currentOrder.pay.toFixed(2) : parseFloat(String(currentOrder.pay || 0)).toFixed(2)}</p>

          <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-black/30 w-full max-w-sm mb-8">
            <h3 className="text-sm font-bold text-neutral-500 mb-3 uppercase tracking-wider">ORDER SUMMARY</h3>
            <div className='flex justify-between items-center py-1'>
                <p className="text-base font-medium text-neutral-700">Order ID:</p>
                <p className='text-base font-black text-neutral-900'>{currentOrder.id.split('-')[1] || currentOrder.id.slice(-8)}</p>
            </div>
            <div className='flex justify-between items-center py-1'>
                <p className="text-base font-medium text-neutral-700">Total Distance:</p>
                <p className='text-base font-black text-neutral-900'>{currentOrder.totalDistance.toFixed(1)} mi</p>
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
  };

  // ===== MAIN RENDER =====

  if (status === DRIVER_STATUS.COMPLETE) {
    return renderComplete();
  }
  
  return renderActiveFlow();
}

export default CravenDeliveryFlow;
