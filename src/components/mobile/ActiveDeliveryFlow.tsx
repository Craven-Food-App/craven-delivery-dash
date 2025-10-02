import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Clock, Phone, MessageCircle, Camera, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast as showToast } from 'sonner';

// --- MOCK UI COMPONENTS (Replaces Shadcn/UI imports) ---

const Card = ({
  children,
  className = ''
}) => <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
    {children}
  </div>;
const CardContent = ({
  children,
  className = 'p-4'
}) => <div className={className}>{children}</div>;

// Updated Button component
const Button = ({
  children,
  onClick,
  className = '',
  variant = 'default',
  size = 'md',
  disabled = false
}) => {
  const baseClasses = "flex items-center justify-center font-medium rounded-xl transition duration-150 active:scale-[0.98]";
  let sizeClasses = '';
  let variantClasses = '';
  switch (size) {
    case 'lg':
      sizeClasses = 'h-14 px-6 text-base';
      break;
    // Taller for bottom sheet actions
    case 'sm':
      sizeClasses = 'h-8 px-3 text-sm';
      break;
    default:
      sizeClasses = 'h-10 px-4 text-sm';
      break;
  }
  switch (variant) {
    case 'secondary':
      variantClasses = 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      break;
    case 'outline':
      variantClasses = 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';
      break;
    case 'destructive':
      variantClasses = 'bg-red-500 text-white hover:bg-red-600';
      break;
    // Dark red/brown for primary actions (like PICKUP NOTES) - was dark blue
    case 'primary-dark':
      variantClasses = 'bg-red-700 text-white hover:bg-red-600 shadow-lg';
      break;
    // Orange for NAVIGATE and CONFIRM ARRIVAL - was blue
    default:
      variantClasses = 'bg-orange-600 text-white hover:bg-orange-700 shadow-md';
      break;
  }
  return <button onClick={onClick} className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={disabled}>
      {children}
    </button>;
};

// New AppHeader component
const AppHeader = ({
  title,
  onBack,
  showHelp = true
}: {
  title: string;
  onBack: () => void;
  showHelp?: boolean;
}) => <div className="flex items-center justify-between p-4 bg-orange-600 text-white shadow-md w-full py-0">
        <button onClick={onBack} className="p-1 rounded-full hover:bg-orange-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
        <h1 className="text-xl font-bold">{title}</h1>
        {showHelp ? <button onClick={() => console.log('Help clicked')} className="p-1 rounded-full border-2 border-white hover:bg-orange-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
            </button> : <div className="w-8"></div>}
    </div>;

// Restaurant Route Map Component with Mapbox
const RestaurantRouteMap = ({
  restaurantAddress,
  restaurantName
}: {
  restaurantAddress: string;
  restaurantName: string;
}) => {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<any>(null);
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    const initMap = async () => {
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        const mapboxgl = (window as any).mapboxgl;
        if (!mapboxgl) {
          console.error('Mapbox GL not loaded');
          return;
        }
        mapboxgl.accessToken = data.token;

        // Get real current location
        let currentLocation = [-83.5379, 41.6528]; // Toledo, OH as fallback

        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            currentLocation = [position.coords.longitude, position.coords.latitude];
          } catch (error) {
            console.error('Error getting current location:', error);
          }
        }

        // Geocode restaurant address
        let restaurantCoords = currentLocation; // Use current location as fallback
        if (restaurantAddress && restaurantAddress !== 'Address not available') {
          try {
            const geocodeResponse = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(restaurantAddress)}.json?access_token=${data.token}&limit=1`);
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.features && geocodeData.features.length > 0) {
              restaurantCoords = geocodeData.features[0].center;
            }
          } catch (e) {
            console.error('Geocoding error:', e);
          }
        }
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: currentLocation,
          zoom: 12,
          interactive: false
        });
        map.current.on('load', async () => {
          // Add markers
          new mapboxgl.Marker({
            color: '#3b82f6'
          }).setLngLat(currentLocation).addTo(map.current);
          new mapboxgl.Marker({
            color: '#f97316'
          }).setLngLat(restaurantCoords).addTo(map.current);

          // Fetch and draw route
          try {
            const routeResponse = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${currentLocation[0]},${currentLocation[1]};${restaurantCoords[0]},${restaurantCoords[1]}?geometries=geojson&access_token=${data.token}`);
            const routeData = await routeResponse.json();
            if (routeData.routes && routeData.routes.length > 0) {
              const route = routeData.routes[0].geometry;
              map.current.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: route
                }
              });
              map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': '#f97316',
                  'line-width': 5
                }
              });

              // Fit bounds to show full route
              const bounds = new mapboxgl.LngLatBounds();
              bounds.extend(currentLocation);
              bounds.extend(restaurantCoords);
              map.current.fitBounds(bounds, {
                padding: 50
              });
            }
          } catch (e) {
            console.error('Route fetch error:', e);
          }
        });
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    };
    initMap();
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [restaurantAddress]);
  return <div ref={mapContainer} className="w-full h-full" />;
};

// --- HOOKS & UTILITIES ---

// Mock useToast Hook (kept the same)
const useToast = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toast = ({
    title,
    description,
    variant,
    duration = 3000
  }: any) => {
    const message = `${title}: ${description}`;
    console.log(`[TOAST] ${message} (${variant || 'default'})`);
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), duration);
  };
  const ToastDisplay = toastMessage ? <div className="fixed bottom-4 left-1/2 -translate-x-1/2 p-3 bg-gray-800 text-white rounded-lg shadow-xl z-50 animate-bounce-in">
        {toastMessage}
    </div> : null;
  return {
    toast,
    ToastDisplay
  };
};

// Helper functions for map preferences
const getUserMapPreference = (): string => {
  return localStorage.getItem('preferred_map_app') || 'google_maps';
};

const getMapAppName = (appId: string): string => {
  const names: { [key: string]: string } = {
    'google_maps': 'Google Maps',
    'apple_maps': 'Apple Maps',
    'waze': 'Waze',
    'mapbox': 'Mapbox'
  };
  return names[appId] || 'Maps';
};

// Updated useNavigation Hook with real external navigation
const useNavigation = () => {
  const openExternalNavigation = ({ address, name }: { address: string; name: string }) => {
    // Get user's preferred map app from settings
    const preferredMapApp = getUserMapPreference();
    
    const encodedAddress = encodeURIComponent(address);
    const encodedName = encodeURIComponent(name);
    
    let navigationUrl = '';
    
    switch (preferredMapApp) {
      case 'google_maps':
        navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
        break;
      case 'apple_maps':
        navigationUrl = `http://maps.apple.com/?daddr=${encodedAddress}`;
        break;
      case 'waze':
        navigationUrl = `https://waze.com/ul?q=${encodedAddress}`;
        break;
      case 'mapbox':
        navigationUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/?destination=${encodedAddress}`;
        break;
      default:
        // Fallback to Google Maps
        navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
        break;
    }
    
    try {
      // For mobile apps, use deep links
      if (window.navigator.userAgent.includes('Mobile')) {
        window.location.href = navigationUrl;
      } else {
        // For web, open in new tab
        window.open(navigationUrl, '_blank');
      }
      
      showToast.success(`Opening ${getMapAppName(preferredMapApp)} for navigation`);
      console.log(`[NAVIGATE] Starting external navigation to: ${name} (${address}) via ${preferredMapApp}`);
    } catch (error) {
      console.error('Error opening external navigation:', error);
      showToast.error('Failed to open navigation app');
    }
  };

  return { openExternalNavigation };
};

// Upload delivery photo to Supabase Storage
const uploadDeliveryPhoto = async (userId: string, photoBlob: Blob) => {
  try {
    const fileName = `${userId}/${Date.now()}.jpg`;
    const {
      data,
      error
    } = await supabase.storage.from('delivery-photos').upload(fileName, photoBlob, {
      contentType: 'image/jpeg',
      upsert: false
    });
    if (error) throw error;
    const {
      data: {
        publicUrl
      }
    } = supabase.storage.from('delivery-photos').getPublicUrl(fileName);
    return {
      data: {
        publicUrl
      },
      error: null
    };
  } catch (error: any) {
    console.error('Error uploading delivery photo:', error);
    return {
      data: null,
      error
    };
  }
};

// --- EXTERNAL COMPONENTS (DeliveryCamera, OrderVerificationScreen) ---

// Enhanced DeliveryCamera with retake/submit options
const DeliveryCamera = ({
  onPhotoCapture,
  onCancel,
  isUploading,
  title = "Capture Proof of Delivery"
}: any) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  useEffect(() => {
    // Start camera
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment'
          }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };
    startCamera();
    return () => {
      // Cleanup camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPhotoPreview(url);
          setCapturedBlob(blob);

          // Stop camera after capture
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleRetake = () => {
    setPhotoPreview(null);
    setCapturedBlob(null);
    // Restart camera
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment'
          }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };
    startCamera();
  };

  const handleSubmit = () => {
    if (capturedBlob) {
      onPhotoCapture(capturedBlob);
    }
  };

  if (photoPreview) {
    return <Card>
              <CardContent className="p-4 text-center space-y-4">
                  <h3 className="text-xl font-bold text-green-700">Photo Captured!</h3>
                  <img src={photoPreview} alt="Delivery Proof Preview" className="rounded-lg w-full h-auto object-cover border" />
                  <div className="flex gap-2">
                    <Button onClick={handleRetake} variant="outline" className="flex-1">
                        Retake
                    </Button>
                    <Button onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700" disabled={isUploading}>
                        {isUploading ? 'Uploading...' : 'Submit'}
                    </Button>
                  </div>
                  <Button onClick={onCancel} variant="secondary" className="w-full">
                      Cancel
                  </Button>
              </CardContent>
          </Card>;
  }

  return <Card className="p-6">
      <CardContent className="p-0 space-y-4 text-center">
        <h3 className="text-xl font-bold text-red-700">{title}</h3>
        <p className="text-sm text-gray-500">
          Ensure the delivery location and order are clearly visible.
        </p>
        <div className="bg-gray-900 h-64 rounded-lg overflow-hidden relative">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        </div>
        <Button onClick={capturePhoto} className="w-full bg-red-700 hover:bg-red-800">
          TAKE PHOTO
        </Button>
        <Button onClick={onCancel} variant="outline" className="w-full">
          Cancel
        </Button>
      </CardContent>
    </Card>;
};

// Enhanced OrderVerificationScreen
const OrderVerificationScreen = ({
  orderDetails,
  onPickupConfirmed,
  onCancel
}: any) => {
  const handleConfirm = () => {
    onPickupConfirmed();
  };
  
  return <div className="space-y-4">
      <div className="bg-red-600 text-white p-4 rounded-2xl text-center">
        <h2 className="text-xl font-bold">Verify Pickup</h2>
        <p className="opacity-90">Confirm all items match the receipt</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Order Number */}
          <div className="text-center p-3 bg-gray-100 rounded-lg">
            <h3 className="font-bold text-lg text-red-800">Order #{orderDetails.order_number}</h3>
          </div>
          
          {/* Customer Name */}
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Customer</p>
            <p className="font-bold text-lg">{orderDetails.customer_name}</p>
          </div>

          {/* Order Items */}
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold mb-2">Order Items:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {orderDetails.items.map((item: OrderItem, index: number) => (
                <div key={index} className="flex justify-between items-center text-sm py-1 border-b last:border-b-0">
                  <span className="font-medium">{item.quantity}x {item.name}</span>
                  <span className="text-gray-600">${(item.price_cents / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t font-semibold">
              Total: ${(orderDetails.subtotal_cents / 100).toFixed(2)}
            </div>
          </div>

          <Button onClick={handleConfirm} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white">
            <CheckCircle className="h-5 w-5 mr-2" />
            CONFIRM PICKUP & START DELIVERY
          </Button>
          <Button onClick={onCancel} variant="outline" className="w-full h-12">
            Cancel / Back
          </Button>
        </CardContent>
      </Card>
    </div>;
};

// --- TYPES ---

type DeliveryStage = 'navigate_to_restaurant' | 'arrived_at_restaurant' | 'verify_pickup' | 'pickup_photo_verification' | 'navigate_to_customer' | 'capture_proof' | 'delivered';

interface OrderItem {
  name: string;
  quantity: number;
  price_cents: number;
  special_instructions?: string;
}

interface OrderDetails {
  id: string;
  order_number: string;
  restaurant_name: string;
  restaurant_id?: string;
  pickup_address: any;
  dropoff_address: any;
  customer_name: string;
  customer_phone?: string;
  delivery_notes?: string;
  payout_cents: number;
  subtotal_cents: number;
  estimated_time: number;
  items: OrderItem[];
  isTestOrder?: boolean;
}

interface ActiveDeliveryProps {
  orderDetails: OrderDetails;
  onCompleteDelivery: (photoUrl?: string) => void;
  onProgressChange?: (progress: DeliveryProgress) => void; // NEW: Progress callback
}

// NEW: Progress interface for external tracking
interface DeliveryProgress {
  currentStage: DeliveryStage;
  stageNumber: number;
  totalStages: number;
  stageName: string;
  isCompleted: boolean;
  pickupPhotoUrl?: string;
  deliveryPhotoUrl?: string;
}

// NEW: Helper function to get stage info
const getStageInfo = (stage: DeliveryStage): { stageNumber: number; stageName: string } => {
  const stageMap = {
    'navigate_to_restaurant': { stageNumber: 1, stageName: 'Navigate to Restaurant' },
    'arrived_at_restaurant': { stageNumber: 2, stageName: 'Arrived at Restaurant' },
    'verify_pickup': { stageNumber: 3, stageName: 'Verify Order' },
    'pickup_photo_verification': { stageNumber: 4, stageName: 'Pickup Photo' },
    'navigate_to_customer': { stageNumber: 5, stageName: 'Navigate to Customer' },
    'capture_proof': { stageNumber: 6, stageName: 'Delivery Photo' },
    'delivered': { stageNumber: 7, stageName: 'Delivered' }
  };
  return stageMap[stage] || { stageNumber: 1, stageName: 'Unknown' };
};

// --- ACTIVE DELIVERY FLOW ---

const ActiveDeliveryFlow: React.FC<ActiveDeliveryProps> = ({
  orderDetails,
  onCompleteDelivery,
  onProgressChange // NEW: Progress callback
}) => {
  const [currentStage, setCurrentStage] = useState<DeliveryStage>('navigate_to_restaurant');
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [pickupPhoto, setPickupPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [restaurantAddress, setRestaurantAddress] = useState<string>('');
  const {
    toast
  } = useToast();
  const {
    openExternalNavigation
  } = useNavigation();

  // NEW: Update progress whenever stage changes
  useEffect(() => {
    if (onProgressChange) {
      const stageInfo = getStageInfo(currentStage);
      const progress: DeliveryProgress = {
        currentStage,
        stageNumber: stageInfo.stageNumber,
        totalStages: 7,
        stageName: stageInfo.stageName,
        isCompleted: currentStage === 'delivered',
        pickupPhotoUrl: pickupPhoto || undefined,
        deliveryPhotoUrl: deliveryPhoto || undefined
      };
      onProgressChange(progress);
    }
  }, [currentStage, pickupPhoto, deliveryPhoto, onProgressChange]);

  // Fetch restaurant address from Supabase
  useEffect(() => {
    const fetchRestaurantAddress = async () => {
      if (!orderDetails.restaurant_id || typeof orderDetails.pickup_address === 'string') {
        if (typeof orderDetails.pickup_address === 'string') {
          setRestaurantAddress(orderDetails.pickup_address);
        }
        return;
      }
      try {
        const {
          data,
          error
        } = await supabase.from('restaurants').select('address').eq('id', orderDetails.restaurant_id).single();
        if (data && !error) {
          setRestaurantAddress(data.address || '');
        }
      } catch (error) {
        console.error('Error fetching restaurant address:', error);
        setRestaurantAddress('Restaurant address unavailable');
      }
    };
    fetchRestaurantAddress();
  }, [orderDetails.pickup_address, orderDetails.restaurant_id]);

  // Helper function to format address
  const formatAddress = (address: any, fallbackAddress?: string) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address) {
      return `${address.street || ''} ${address.city || ''} ${address.state || ''} ${address.zip || ''}`.trim();
    }
    if (fallbackAddress || restaurantAddress) return fallbackAddress || restaurantAddress;
    return 'Address not available';
  };

  // Format customer name (First name + Last initial)
  const formatCustomerName = (fullName: string) => {
    const nameParts = fullName.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0]} ${nameParts[1].charAt(0)}.`;
    }
    return fullName;
  };

  // Enhanced handleStageComplete
  const handleStageComplete = () => {
    switch (currentStage) {
      case 'navigate_to_restaurant':
        setCurrentStage('arrived_at_restaurant');
        toast({
          title: "Arrived at Restaurant!",
          description: "Ready to pick up the order."
        });
        break;
      case 'navigate_to_customer':
        setCurrentStage('capture_proof');
        toast({
          title: "Arrived at Customer!",
          description: "Take a photo to complete delivery."
        });
        break;
      case 'capture_proof':
      case 'delivered':
        onCompleteDelivery(deliveryPhoto || undefined);
        break;
    }
  };

  // Handle pickup photo capture
  const handlePickupPhotoCapture = async (photoBlob: Blob) => {
    setIsUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await uploadDeliveryPhoto(user.id, photoBlob);
      if (error || !data) throw error;
      
      const publicUrl = data.publicUrl;
      setPickupPhoto(publicUrl);
      setCurrentStage('navigate_to_customer');
      showToast.success("Pickup photo uploaded successfully!");
      
      toast({
        title: 'Pickup Confirmed!',
        description: 'Starting navigation to customer.'
      });
    } catch (error: any) {
      console.error('Error uploading pickup photo:', error);
      showToast.error('Failed to upload pickup photo');
    }
    setIsUploadingPhoto(false);
  };

  // Handle delivery photo capture
  const handleDeliveryPhotoCapture = async (photoBlob: Blob) => {
    setIsUploadingPhoto(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const {
        data,
        error
      } = await uploadDeliveryPhoto(user.id, photoBlob);
      if (error || !data) throw error;
      const publicUrl = data.publicUrl;
      setDeliveryPhoto(publicUrl);
      setCurrentStage('delivered');
      showToast.success("Delivery photo uploaded successfully!");

      // Complete delivery after successful photo upload
      setTimeout(() => {
        onCompleteDelivery(publicUrl);
      }, 1500);
    } catch (error: any) {
      console.error('Error uploading delivery photo:', error);
      showToast.error('Failed to upload delivery photo');
    }
    setIsUploadingPhoto(false);
  };

  // Render verify pickup
  const renderVerifyPickup = () => (
    <div className="p-4">
      <OrderVerificationScreen 
        orderDetails={orderDetails} 
        onPickupConfirmed={() => {
          setCurrentStage('pickup_photo_verification');
          toast({
            title: 'Order Verified!',
            description: 'Now take a photo to confirm pickup.'
          });
        }} 
        onCancel={() => setCurrentStage('arrived_at_restaurant')} 
      />
    </div>
  );

  // Render pickup photo verification
  const renderPickupPhotoVerification = () => (
    <div className="p-4 space-y-4">
      <div className="bg-orange-600 text-white p-4 rounded-2xl text-center">
        <h2 className="text-xl font-bold">Pickup Photo Verification</h2>
        <p className="opacity-90">Take a photo to confirm pickup</p>
      </div>
      
      <DeliveryCamera 
        title="Capture Pickup Verification"
        onPhotoCapture={handlePickupPhotoCapture} 
        onCancel={() => setCurrentStage('verify_pickup')} 
        isUploading={isUploadingPhoto}
      />
    </div>
  );

  // --- RENDER FUNCTION FOR THE UNIFIED PICKUP SCREEN (Colors changed to orange/red) ---
  const renderPickupScreen = () => {
    const isArrived = currentStage === 'arrived_at_restaurant';
    const isNavigating = currentStage === 'navigate_to_restaurant';
    const mainActionText = isNavigating ? 'CONFIRM ARRIVAL' : 'VERIFY ORDER & START DELIVERY';
    const storeAddress = formatAddress(orderDetails.pickup_address, restaurantAddress);
    const orderStatusText = isNavigating ? 'Ready' : 'Ready to Pick Up';
    const orderStatusColor = isNavigating ? 'text-orange-600' : 'text-amber-600';
    const handleMainAction = () => {
      if (isNavigating) {
        handleStageComplete();
      } else if (isArrived) {
        setCurrentStage('verify_pickup');
        toast({
          title: "Verify Order!",
          description: "Please verify order details before proceeding."
        });
      }
    };
    return <div className="flex flex-col h-full bg-white">
            {/* Mapbox Route Section */}
            <div className="relative h-64 bg-gray-100 overflow-hidden">
                <RestaurantRouteMap restaurantAddress={storeAddress} restaurantName={orderDetails.restaurant_name} />
            </div>

            {/* Main Content Area */}
            <div className="p-4 flex-1 overflow-y-auto px-[41px] mx-[7px] py-px my-0">
                {/* Restaurant Details */}
                <div className="relative pt-2">
                    <p className="text-sm text-gray-500 mb-1">Restaurant</p>
                    <h2 className="text-xl font-bold text-orange-600 mb-1">
                        {orderDetails.restaurant_name}
                    </h2>
                    <p className="text-gray-600 text-sm mb-4">
                        {storeAddress || 'Address not available'}
                    </p>

                    {/* Navigation Button (Orange Circle) */}
                    <button className="absolute top-0 right-0 w-16 h-16 bg-orange-500 text-white rounded-full flex flex-col items-center justify-center shadow-lg transition duration-200 hover:bg-orange-600 active:scale-95" onClick={() => {
            const addr = storeAddress;
            if (addr && addr !== 'Address not available') {
              openExternalNavigation({
                address: addr,
                name: orderDetails.restaurant_name
              });
            }
          }}>
                        <Navigation className="h-6 w-6" />
                        <span className="text-[10px] font-semibold mt-0.5">NAVIGATE</span>
                    </button>
                </div>

                {/* Pickup Time and Status */}
                <div className="flex justify-between items-start pr-20 mt-4 pb-4 py-0 mx-0 px-[16px] my-0">
                    <div className="space-y-1">
                        <p className="text-sm text-gray-500">Pickup Time</p>
                        <p className="text-xl font-bold text-orange-600 py-0">
                            {orderDetails.estimated_time || '4:00 PM'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            Order Status 
                            <svg className="h-4 w-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </p>
                        <p className={`text-xl font-bold ${orderStatusColor}`}>
                            {orderStatusText}
                        </p>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Action Sheet */}
            <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pt-2 z-20 py-[90px] my-px">
                <div className="flex justify-center mb-3">
                    
                </div>
                
                {/* Pickup Notes Button (Dark Blue/Navy) */}
                <button className="w-full h-14 bg-blue-900 text-white rounded-full font-semibold text-base mb-3 transition hover:bg-blue-800 active:scale-98" onClick={() => toast({
          title: "Pickup Notes",
          description: "Notes feature invoked.",
          duration: 2000
        })}>
                    PICKUP NOTES
                </button>

                {/* Confirm Arrival Slider (Orange) */}
                <button className="w-full h-16 bg-orange-500 text-white rounded-full font-semibold text-base shadow-lg transition hover:bg-orange-600 active:scale-98 flex items-center justify-center" onClick={handleMainAction}>
                    <div className="relative flex items-center justify-center w-full">
                        {/* Double Arrow Icon on the left */}
                        <div className="absolute left-6 p-1 bg-white/20 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 17 5-5-5-5" /><path d="m13 17 5-5-5-5" />
                            </svg>
                        </div>
                        {mainActionText}
                    </div>
                </button>
            </div>
        </div>;
  };

  // Enhanced renderNavigateToCustomer
  const renderNavigateToCustomer = () => (
    <div className="p-4 space-y-4">
      {/* Stage Header (Amber) */}
      <Card className="bg-amber-50 border-amber-200 text-center">
        <CardContent className="p-4">
            <h2 className="text-xl font-bold text-amber-700">Deliver to Customer</h2>
            <p className="opacity-90 text-sm text-amber-600">Final leg of the journey</p>
        </CardContent>
      </Card>

      {/* Customer Details - Enhanced */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <MapPin className="h-6 w-6 text-amber-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-lg text-amber-700">
                {formatCustomerName(orderDetails.customer_name)}
              </h3>
              <p className="text-gray-600">{formatAddress(orderDetails.dropoff_address)}</p>
              {orderDetails.customer_phone && (
                <p className="text-sm text-amber-600 font-medium mt-1">
                  📞 {orderDetails.customer_phone}
                </p>
              )}
            </div>
          </div>

          {/* Special Delivery Notes */}
          {orderDetails.delivery_notes && (
            <div className="bg-yellow-50 p-3 rounded-lg mt-4 mb-4 border border-yellow-200">
              <p className="text-sm">
                <span className="font-semibold text-yellow-800">Special Notes:</span> {orderDetails.delivery_notes}
              </p>
            </div>
          )}
          
          <Button 
            className="w-full bg-amber-600 hover:bg-amber-700 mb-3" 
            size="lg" 
            onClick={() => {
              const customerAddress = formatAddress(orderDetails.dropoff_address);
              if (customerAddress && customerAddress !== 'Address not available') {
                openExternalNavigation({
                  address: customerAddress,
                  name: formatCustomerName(orderDetails.customer_name)
                });
              }
            }}
          >
            <Navigation className="h-5 w-5 mr-2" />
            START NAVIGATION
          </Button>

          {/* I AM HERE Button */}
          <Button 
            onClick={handleStageComplete} 
            variant="outline" 
            className="w-full h-12 border-2 border-green-500 text-green-600 hover:bg-green-50"
          >
            <MapPin className="h-5 w-5 mr-2" />
            I AM HERE
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // renderCaptureProof (Enhanced with delivery-specific camera)
  const renderCaptureProof = () => (
    <div className="p-4 space-y-4">
      <DeliveryCamera 
        title="Capture Proof of Delivery"
        onPhotoCapture={handleDeliveryPhotoCapture} 
        onCancel={() => setCurrentStage('navigate_to_customer')} 
        isUploading={isUploadingPhoto}
      />
    </div>
  );

  // renderDeliveredOrder (Colors changed from green to amber/red)
  const renderDeliveredOrder = () => <div className="p-4 space-y-4">
      {/* Stage Header (Amber) */}
      <div className="bg-amber-600 text-white p-4 rounded-2xl text-center">
        <h2 className="text-xl font-bold">Delivery Complete!</h2>
        <p className="opacity-90">Great job!</p>
      </div>

      {/* Completion Status */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-amber-600" />
            <h3 className="font-bold text-lg mb-2">
              Order Delivered!
            </h3>
            <p className="text-muted-foreground">
              {deliveryPhoto ? 'Delivery photo captured successfully.' : 'Delivery completed (No photo captured).'}
            </p>
          </div>

          {deliveryPhoto && <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-amber-600" />
              <p className="text-sm text-amber-700">Proof of delivery uploaded</p>
            </div>}

          {/* Earnings Display (Amber) */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
            <p className="text-sm text-amber-700 mb-1">You've Earned</p>
            <p className="text-2xl font-bold text-amber-600">
              ${(orderDetails.payout_cents / 100).toFixed(2)}
            </p>
          </div>
          <Button onClick={() => onCompleteDelivery(deliveryPhoto || undefined)} className="w-full bg-red-600 hover:bg-red-700">
            Complete and Finish Order
          </Button>
        </CardContent>
      </Card>
    </div>;

  const getCurrentStageComponent = () => {
    switch (currentStage) {
      case 'navigate_to_restaurant':
      case 'arrived_at_restaurant':
        return renderPickupScreen();
      case 'verify_pickup':
        return renderVerifyPickup();
      case 'pickup_photo_verification':
        return renderPickupPhotoVerification();
      case 'navigate_to_customer':
        return renderNavigateToCustomer();
      case 'capture_proof':
        return renderCaptureProof();
      case 'delivered':
        return renderDeliveredOrder();
      default:
        return renderPickupScreen();
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const stageMap = {
      'navigate_to_restaurant': 14,
      'arrived_at_restaurant': 28,
      'verify_pickup': 42,
      'pickup_photo_verification': 57,
      'navigate_to_customer': 71,
      'capture_proof': 85,
      'delivered': 100
    };
    return stageMap[currentStage] || 14;
  };

  // Calculate ETA
  const getETA = () => {
    const now = new Date();
    const etaMinutes = currentStage.includes('restaurant') || currentStage.includes('pickup') ? 12 : 18;
    now.setMinutes(now.getMinutes() + etaMinutes);
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Format elapsed time
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsedTime = () => {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${minutes}m ${seconds}s elapsed`;
  };

  return <div className="absolute inset-0 z-10 bg-gray-50 flex flex-col">
        {/* Progress Header with Payout and ETA */}
        <div className="bg-white shadow-md">
          {/* Progress Bar */}
          <div className="h-2 bg-gray-200">
            <div 
              className="h-full bg-orange-500 transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          
          {/* Header Info */}
          <div className="p-4 bg-orange-600 text-white">
            <div className="flex justify-between items-center mb-2">
              <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
                {getStageInfo(currentStage).stageName}
              </span>
              <span className="text-sm font-light">
                {formatElapsedTime()}
              </span>
            </div>
          </div>

          {/* Payout and ETA Strip */}
          <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-2xl font-bold">
                ${(orderDetails.payout_cents / 100).toFixed(2)}
              </span>
              <span className="text-xs text-gray-400 uppercase">PAYOUT</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-semibold text-blue-400">
                ETA: {getETA()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Main Content Area: Fills the space below the fixed header */}
        <div className="flex-1 overflow-y-auto">
            {getCurrentStageComponent()}
        </div>
    </div>;
};

// Export the types for external use
export type { DeliveryStage, DeliveryProgress };
export default ActiveDeliveryFlow;