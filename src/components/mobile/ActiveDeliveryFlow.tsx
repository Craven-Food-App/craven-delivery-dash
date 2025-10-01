import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Phone, MessageCircle, Camera, CheckCircle } from 'lucide-react';
// Required Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setLogLevel } from 'firebase/firestore'; // <-- setLogLevel imported

// --- MOCK UI COMPONENTS (Replaces Shadcn/UI imports) ---

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
    {children}
  </div>
);
const CardContent = ({ children, className = 'p-4' }) => (
  <div className={className}>{children}</div>
);

// Updated Button component
const Button = ({ children, onClick, className = '', variant = 'default', size = 'md', disabled = false }) => {
  const baseClasses = "flex items-center justify-center font-medium rounded-xl transition duration-150 active:scale-[0.98]";
  let sizeClasses = '';
  let variantClasses = '';

  switch (size) {
    case 'lg': sizeClasses = 'h-14 px-6 text-base'; break; // Taller for bottom sheet actions
    case 'sm': sizeClasses = 'h-8 px-3 text-sm'; break;
    default: sizeClasses = 'h-10 px-4 text-sm'; break;
  }

  switch (variant) {
    case 'secondary': variantClasses = 'bg-gray-100 text-gray-800 hover:bg-gray-200'; break;
    case 'outline': variantClasses = 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'; break;
    case 'destructive': variantClasses = 'bg-red-500 text-white hover:bg-red-600'; break;
    // Dark red/brown for primary actions (like PICKUP NOTES) - was dark blue
    case 'primary-dark': variantClasses = 'bg-red-700 text-white hover:bg-red-600 shadow-lg'; break; 
    // Orange for NAVIGATE and CONFIRM ARRIVAL - was blue
    default: variantClasses = 'bg-orange-600 text-white hover:bg-orange-700 shadow-md'; break;
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// New AppHeader component
const AppHeader = ({ title, onBack, showHelp = true }: { title: string, onBack: () => void, showHelp?: boolean }) => (
    <div className="flex items-center justify-between p-4 bg-orange-600 text-white shadow-md w-full">
        <button onClick={onBack} className="p-1 rounded-full hover:bg-orange-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <h1 className="text-xl font-bold">{title}</h1>
        {showHelp ? (
            <button onClick={() => console.log('Help clicked')} className="p-1 rounded-full border-2 border-white hover:bg-orange-700 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            </button>
        ) : <div className="w-8"></div>}
    </div>
);


// --- HOOKS & UTILITIES ---

// Mock useToast Hook (kept the same)
const useToast = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toast = ({ title, description, variant, duration = 3000 }: any) => {
    const message = `${title}: ${description}`;
    console.log(`[TOAST] ${message} (${variant || 'default'})`);
    
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), duration);
  };
  
  const ToastDisplay = toastMessage ? (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 p-3 bg-gray-800 text-white rounded-lg shadow-xl z-50 animate-bounce-in">
        {toastMessage}
    </div>
  ) : null;

  return { toast, ToastDisplay };
};

// Mock useNavigation Hook (kept the same)
const useNavigation = () => {
  const { toast } = useToast();
  const openExternalNavigation = ({ address, name }: { address: string; name: string }) => {
    toast({
      title: "Navigation Started",
      description: `Navigating to ${name} at ${address}`,
      duration: 3000,
    });
    console.log(`[NAVIGATE] Starting external navigation to: ${name} (${address})`);
  };
  return { openExternalNavigation };
};

// Placeholder for Firebase Storage Upload (since the Storage SDK is not imported)
const mockStorageUpload = async (userId: string, photoBlob: Blob) => {
    console.log(`[STORAGE MOCK] Simulating upload of ${photoBlob.size} bytes for user ${userId}.`);
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500)); 
    // Return a mock public URL
    const publicUrl = `https://delivery.proof/${userId}/${Date.now()}.jpg`;
    return { data: { publicUrl }, error: null };
};


// --- EXTERNAL COMPONENTS (DeliveryCamera, OrderVerificationScreen) ---

// DeliveryCamera (Colors changed from purple to red)
const DeliveryCamera = ({ onPhotoCapture, onCancel, isUploading }: any) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const simulateCapture = () => {
    const mockPhotoBlob = new Blob(['mock image data'], { type: 'image/jpeg' });
    const mockUrl = 'https://placehold.co/400x300/a855f7/ffffff?text=Proof+Mock';
    setPhotoPreview(mockUrl);
    onPhotoCapture(mockPhotoBlob);
  };

  if (photoPreview) {
      return (
          <Card>
              <CardContent className="p-4 text-center space-y-4">
                  <h3 className="text-xl font-bold text-red-700">Proof Captured!</h3>
                  <img src={photoPreview} alt="Delivery Proof Preview" className="rounded-lg w-full h-auto object-cover border" />
                  <Button onClick={onCancel} variant="secondary" className="w-full">
                      Cancel (Go Back)
                  </Button>
              </CardContent>
          </Card>
      );
  }

  return (
    <Card className="p-6">
      <CardContent className="p-0 space-y-4 text-center">
        <h3 className="text-xl font-bold text-red-700">Capture Proof of Delivery</h3>
        <p className="text-sm text-gray-500">
          Ensure the delivery location and order are clearly visible.
        </p>
        <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center text-gray-500">
            <Camera className="h-8 w-8 mr-2" />
            [Webcam Feed Mock]
        </div>
        <Button onClick={simulateCapture} className="w-full bg-red-700 hover:bg-red-800" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Take Photo'}
        </Button>
        <Button onClick={onCancel} variant="outline" className="w-full">
          Cancel
        </Button>
      </CardContent>
    </Card>
  );
};

// OrderVerificationScreen (Colors changed to red for attention and amber for confirm)
const OrderVerificationScreen = ({ orderDetails, onPickupConfirmed, onCancel }: any) => {
  const handleConfirm = () => {
    // Simulate photo URL or just confirm
    const pickupPhotoUrl = 'mock-pickup-verification-url';
    onPickupConfirmed(pickupPhotoUrl);
  };

  return (
    <div className="space-y-4">
      <div className="bg-red-600 text-white p-4 rounded-2xl text-center">
        <h2 className="text-xl font-bold">Verify Pickup</h2>
        <p className="opacity-90">Confirm all items are collected.</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-bold text-lg text-red-800">Order #{orderDetails.order_number}</h3>
          
          <div className="max-h-48 overflow-y-auto border-b pb-2">
            {orderDetails.items.map((item: OrderItem, index: number) => (
              <div key={index} className="flex justify-between items-center text-sm py-1">
                <span className="font-medium">{item.quantity}x {item.name}</span>
                <span className="text-gray-600">${(item.price_cents / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <p className="text-sm font-semibold">Customer: {orderDetails.customer_name}</p>
            <p className="text-sm text-gray-500">Total: ${(orderDetails.subtotal_cents / 100).toFixed(2)}</p>
          </div>

          <Button
            onClick={handleConfirm}
            className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white mt-4"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Confirm Pickup & Start Delivery
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full h-12"
          >
            Cancel / Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};


// --- TYPES ---

type DeliveryStage = 'navigate_to_restaurant' | 'arrived_at_restaurant' | 'verify_pickup' | 'navigate_to_customer' | 'capture_proof' | 'delivered';

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
}

interface ActiveDeliveryProps {
  orderDetails: OrderDetails;
  onCompleteDelivery: (photoUrl?: string) => void;
  db: any; // Firestore instance
  userId: string; // Authenticated user ID
  isAuthReady: boolean; // <-- NEW: Authentication readiness flag
}

// --- ACTIVE DELIVERY FLOW ---

const ActiveDeliveryFlow: React.FC<ActiveDeliveryProps> = ({
  orderDetails,
  onCompleteDelivery,
  db,
  userId,
  isAuthReady,
}) => {
  const [currentStage, setCurrentStage] = useState<DeliveryStage>('navigate_to_restaurant');
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [restaurantAddress, setRestaurantAddress] = useState<string>('');
  const { toast } = useToast();
  const { openExternalNavigation } = useNavigation();

  // Define fetchRestaurantAddress helper function (Refactored for clarity and robustness)
  const fetchRestaurantAddress = async (attempt = 1) => {
    const restaurantId = orderDetails.restaurant_id;

    // Path: /artifacts/{appId}/public/data/restaurants/{restaurantId}
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // Guard against missing dependencies.
    if (!db || !userId || !restaurantId) {
        console.log("[FIRESTORE] Pre-check failed. DB, UserId, or Restaurant ID missing.");
        return;
    }

    try {
      console.log(`[FIRESTORE] Attempting to fetch public restaurant data (Attempt ${attempt}/7) for user ${userId} on ID: ${restaurantId}`); 

      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'restaurants', restaurantId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRestaurantAddress(data.address || '');
        console.log(`[FIRESTORE] Successfully loaded restaurant address: ${data.address}`);
      } else {
         console.log(`[FIRESTORE] No address document found for restaurant ID: ${restaurantId}`);
      }
    } catch (error: any) {
      
      // *** FIX: Use console.warn for the initial permission-denied error (race condition) ***
      if (error.code === 'permission-denied' && attempt === 1) {
          console.warn(`[FIRESTORE WARNING] Permission denied on first attempt. This is likely a temporary auth race condition. Retrying...`);
      } else {
          // Use console.error for critical or subsequent failures
          console.error(`Error fetching restaurant address (Attempt ${attempt}):`, error);
      }
      
      // FIX: The core issue is the auth race condition. We retry on permission failure.
      if (error.code === 'permission-denied' && attempt < 7) { 
         const delay = Math.min(5000, attempt * 1000); 
         console.log(`[FIRESTORE RETRY] Permission denied (Auth Race). Retrying in ${delay}ms... (Max 7 attempts)`);
         await new Promise(resolve => setTimeout(resolve, delay));
         return fetchRestaurantAddress(attempt + 1); // Recursive call
      }
      
      // If all retries fail, fall back
      setRestaurantAddress('1234 Mock Restaurant St, Test Town, USA'); 
      toast({
          title: "Data Error",
          description: "Could not load restaurant address from live data. Using fallback.",
          variant: 'destructive'
      });
    }
  };


  // Fetch restaurant address using Firestore - Triggered only when auth is ready
  useEffect(() => {
    // Initial Guard: Only start the process if all dependencies (including the crucial isAuthReady) are met, 
    // AND if we actually need to fetch an address (i.e., we have a restaurant_id but no address yet, AND we haven't already fetched it).
    if (db && userId && isAuthReady && !orderDetails.pickup_address && orderDetails.restaurant_id && !restaurantAddress) {
        fetchRestaurantAddress(); // Start the process
    }
    // Added restaurantAddress to dependency array to prevent repeated fetch attempts after success
  }, [db, userId, isAuthReady, orderDetails.pickup_address, orderDetails.restaurant_id, restaurantAddress]);


  // Helper function to format address
  const formatAddress = (address: any, fallbackAddress?: string) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address) {
      return `${address.street || ''} ${address.city || ''} ${address.state || ''} ${address.zip || ''}`.trim();
    }
    if (fallbackAddress || restaurantAddress) return fallbackAddress || restaurantAddress;
    return 'Address not available';
  };

  // Simplified handleStageComplete (removed test logic)
  const handleStageComplete = () => {
    switch (currentStage) {
      case 'navigate_to_restaurant':
        setCurrentStage('arrived_at_restaurant');
        toast({
          title: "Arrived at Restaurant!",
          description: "Ready to pick up the order.",
        });
        break;
      case 'navigate_to_customer':
        setCurrentStage('capture_proof');
        toast({
          title: "Arrived at Customer!",
          description: "Take a photo to complete delivery.",
        });
        break;
      case 'capture_proof':
      case 'delivered':
        onCompleteDelivery(deliveryPhoto || undefined);
        break;
    }
  };

  // handlePhotoCapture: Updated to use mockStorageUpload
  const handlePhotoCapture = async (photoBlob: Blob) => {
    setIsUploadingPhoto(true);
    try {
      // NOTE: This uses the mockStorageUpload since the Firebase Storage SDK is not explicitly imported.
      const { data: uploadData, error: uploadError } = await mockStorageUpload(userId, photoBlob);

      if (uploadError) throw uploadError;

      const publicUrl = uploadData.publicUrl;
      setDeliveryPhoto(publicUrl);
      
      // Real-world: Update the delivery document in Firestore here with the publicUrl

      setCurrentStage('delivered');
      
      toast({
        title: "Photo Uploaded!",
        description: "Delivery proof captured successfully.",
      });

      // Complete delivery after successful photo upload
      setTimeout(() => {
        onCompleteDelivery(publicUrl);
      }, 1500);

    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload delivery photo. Check console for details.',
        variant: 'destructive'
      });
    }
    setIsUploadingPhoto(false);
  };
  
  // Re-added the missing renderVerifyPickup for completeness
  const renderVerifyPickup = () => (
    <div className="p-4">
      <OrderVerificationScreen
        orderDetails={orderDetails}
        onPickupConfirmed={() => {
          setCurrentStage('navigate_to_customer');
          toast({ title: 'Pickup Verified', description: 'Starting navigation to customer.' });
        }}
        onCancel={() => setCurrentStage('arrived_at_restaurant')}
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
    const orderStatusColor = isNavigating ? 'text-orange-600' : 'text-amber-600'; // Orange for navigating, Amber for arrived/ready

    const handleMainAction = () => {
        if (isNavigating) {
            handleStageComplete();
        } else if (isArrived) {
            setCurrentStage('verify_pickup');
            toast({
                title: "Verify Order!",
                description: "Please verify order details before proceeding.",
            });
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Top Banner/Illustration Section - Curbside Pickup Theme (Orange) */}
            <div className="relative h-48 bg-orange-50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-orange-50/50 to-orange-100/50"></div>
                
                <div className="absolute bottom-4 left-4 text-2xl font-bold text-gray-800 z-10">
                    Curbside Pickup
                </div>
                {/* Mock Car Illustration */}
                <div className="absolute right-0 bottom-0 w-48 h-48 opacity-75">
                    {/* Person */}
                    <div className="absolute bottom-4 right-4 w-1 h-12 bg-gray-600"></div>
                    <div className="absolute bottom-16 right-4 w-4 h-4 rounded-full bg-gray-600"></div>
                    {/* Box */}
                    <div className="absolute bottom-12 right-1 w-6 h-6 bg-yellow-400 border border-yellow-500 rounded-sm"></div>

                    {/* Car Body (Simplified) */}
                    <div className="absolute bottom-0 right-10 w-40 h-16 bg-white border-2 border-gray-300 rounded-t-lg"></div>
                    {/* Trunk open */}
                    <div className="absolute bottom-16 right-10 w-40 h-2 bg-gray-300"></div>
                    {/* Bags in Trunk */}
                    <div className="absolute bottom-4 right-20 w-8 h-8 bg-orange-200 rounded-full"></div>
                    <div className="absolute bottom-4 right-30 w-8 h-8 bg-orange-200 rounded-full"></div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-4 flex-1 overflow-y-auto">
                {/* Pickup Store Details */}
                <div className="relative pt-2">
                    <p className="text-sm text-gray-500 mb-1">Pickup Store</p>
                    <h2 className="text-2xl font-bold text-orange-800 mb-1">
                        {orderDetails.restaurant_name}
                    </h2>
                    <p className="text-gray-600 text-sm mb-4">
                        {storeAddress || 'Address not available'}
                    </p>

                    {/* Navigation Button (Orange) */}
                    <Button
                        className="absolute top-4 right-0 w-16 h-16 bg-white text-orange-600 border border-orange-200 rounded-full flex flex-col items-center justify-center shadow-lg transition duration-200 hover:bg-orange-50 active:scale-[0.95] p-0"
                        onClick={() => {
                            const addr = storeAddress;
                            if (addr && addr !== 'Address not available') {
                                openExternalNavigation({ address: addr, name: orderDetails.restaurant_name });
                            }
                        }}
                    >
                        <Navigation className="h-6 w-6" />
                        <span className="text-xs font-medium mt-0.5">NAVIGATE</span>
                    </Button>
                </div>

                {/* Pickup Time and Status */}
                <div className="flex justify-between items-center pr-20 mt-4 border-b pb-4 mb-4">
                    <div className="space-y-1">
                        <p className="text-sm text-gray-500">Pickup Time</p>
                        <p className="text-xl font-bold text-orange-600">4:00 PM</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-500">Order Status</p>
                        <div className="flex items-center">
                            <p className={`text-xl font-bold ${orderStatusColor}`}>{orderStatusText}</p>
                            {isNavigating && (
                                <svg className="animate-spin h-5 w-5 text-gray-400 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                        </div>
                    </div>
                </div>

                {/* No Test Mode Alert in the final version */}
            </div>

            {/* Sticky Bottom Action Sheet */}
            <div className="sticky bottom-0 left-0 right-0 bg-white shadow-2xl p-4 pt-2 rounded-t-3xl z-20">
                <div className="flex justify-center mb-3">
                    <span className="text-xs text-gray-400">Hide options</span>
                </div>
                
                {/* Pickup Notes Button (Red/Dark Orange) */}
                <Button variant="primary-dark" size="lg" className="w-full mb-3 shadow-none" onClick={() => toast({ title: "Pickup Notes", description: "Notes feature invoked.", duration: 2000 })}>
                    PICKUP NOTES
                </Button>

                {/* Main Action Button (Orange) */}
                <Button
                    variant="default"
                    size="lg"
                    className="w-full mb-0 shadow-lg"
                    onClick={handleMainAction}
                >
                    <div className="relative flex items-center justify-center w-full">
                        {/* Double Arrow Icon on the left */}
                        <div className="absolute left-4 p-0.5 bg-white/20 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevrons-right"><path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/></svg>
                        </div>
                        {mainActionText}
                    </div>
                </Button>
            </div>
        </div>
    );
  };
  
  // renderNavigateToCustomer (Colors changed from green to amber)
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
                {orderDetails.customer_name}
              </h3>
              <p className="text-gray-600">{formatAddress(orderDetails.dropoff_address)}</p>
              {orderDetails.customer_phone && (
                <p className="text-sm text-amber-600 font-medium mt-1">
                  📞 {orderDetails.customer_phone}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Notes */}
          {orderDetails.delivery_notes && (
            <div className="bg-yellow-50 p-3 rounded-lg mt-4 mb-4">
              <p className="text-sm">
                <span className="font-semibold text-yellow-800">Delivery Notes:</span> {orderDetails.delivery_notes}
              </p>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button  
              className="flex-1 bg-amber-600 hover:bg-amber-700"  // Amber for Nav button
              size="lg"  
              onClick={() => {
                const customerAddress = formatAddress(orderDetails.dropoff_address);
                if (customerAddress && customerAddress !== 'Address not available') {
                  openExternalNavigation({  
                    address: customerAddress,  
                    name: orderDetails.customer_name  
                  });
                }
                handleStageComplete();
              }}
            >
              <Navigation className="h-5 w-5 mr-2" />
              Start Navigation
            </Button>
            
            {orderDetails.customer_phone && (
              <Button  
                variant="outline"  
                size="lg"
                onClick={() => {
                  toast({
                    title: "Action Mocked",
                    description: "Phone/Chat feature invoked.",
                  });
                }}
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manual Arrival Button (Amber) */}
      <Button
        onClick={handleStageComplete}
        variant="outline"
        className="w-full h-12 border-2 border-amber-500 text-amber-600 hover:bg-amber-50"
      >
        I've Arrived at Customer
      </Button>
      
    </div>
  );

  // renderCaptureProof (No change, uses the updated DeliveryCamera)
  const renderCaptureProof = () => (
    <div className="p-4 space-y-4">
      <DeliveryCamera
        onPhotoCapture={handlePhotoCapture}
        onCancel={() => setCurrentStage('navigate_to_customer')}
        isUploading={isUploadingPhoto}
      />

      {/* No Test Mode Skip Option */}
    </div>
  );

  // renderDeliveredOrder (Colors changed from green to amber/red)
  const renderDeliveredOrder = () => (
    <div className="p-4 space-y-4">
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
              {deliveryPhoto
                ? 'Delivery photo captured successfully.'
                : 'Delivery completed (No photo captured).'
              }
            </p>
          </div>

          {deliveryPhoto && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-amber-600" />
              <p className="text-sm text-amber-700">Proof of delivery uploaded (Mock URL)</p>
            </div>
          )}

          {/* Earnings Display (Amber) */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
            <p className="text-sm text-amber-700 mb-1">You've Earned</p>
            <p className="text-2xl font-bold text-amber-600">
              {(orderDetails.payout_cents / 100).toFixed(2)}
            </p>
          </div>
          <Button 
            onClick={() => onCompleteDelivery(deliveryPhoto || undefined)} 
            className="w-full bg-red-600 hover:bg-red-700" // Red for the final button
          >
            Complete and Finish Order
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const getCurrentStageComponent = () => {
    switch (currentStage) {
      case 'navigate_to_restaurant':
      case 'arrived_at_restaurant':
        return renderPickupScreen();
      case 'verify_pickup':
        return renderVerifyPickup();
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

  return (
    <div className="absolute inset-0 z-10 bg-gray-50 flex flex-col">
        
        {/* New Fixed Header (Orange) */}
        <AppHeader 
            title={currentStage.includes('restaurant') || currentStage.includes('pickup') ? 'Pickup' : currentStage.includes('customer') ? 'Delivery' : 'Complete'} 
            onBack={() => console.log("Back/Cancel flow")} 
            showHelp={currentStage !== 'delivered'} 
        />
        
        {/* Main Content Area: Fills the space below the fixed header */}
        <div className="flex-1 overflow-y-auto">
            {getCurrentStageComponent()}
        </div>
        
    </div>
  );
};


// --- MAIN APP COMPONENT (Handles Firebase Initialization and Data Provision) ---

const App = () => {
    const { toast, ToastDisplay } = useToast();
    const [isDeliveryComplete, setIsDeliveryComplete] = useState(false);
    const [finalPhotoUrl, setFinalPhotoUrl] = useState<string | null>(null);

    // Firebase State
    const [db, setDb] = useState<any>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false); // <-- Auth readiness state
    
    // Placeholder for actual data fetch
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

    // 1. Firebase Initialization and Auth Setup
    useEffect(() => {
        try {
            // Set debug level for better logging
            setLogLevel('debug'); // <-- Added setLogLevel call
            
            // Use provided global variables
            const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const authInstance = getAuth(app);

            setDb(firestoreDb);

            const signInUser = async () => {
                try {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(authInstance, __initial_auth_token);
                    } else {
                        await signInAnonymously(authInstance);
                    }
                } catch (e) {
                    console.error("Authentication failed during sign-in:", e);
                }
            };

            const unsubscribe = onAuthStateChanged(authInstance, (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    // Fallback should use an ephemeral ID if all else fails
                    setUserId(crypto.randomUUID()); 
                }
                setIsAuthReady(true); // <-- Set ready state after user ID is determined
            });

            signInUser();
            return () => unsubscribe();

        } catch (e) {
            console.error("Firebase initialization failed:", e);
            setIsAuthReady(true);
        }
    }, []); 

    // 2. Mock Order Details until real fetch is implemented
    useEffect(() => {
        // Only load order details once auth is ready
        if (isAuthReady && !orderDetails) {
             // Simulate fetching the single active order for the current driver.
             // This structure is preserved to keep the UI functional.
            const fetchedOrderDetails: OrderDetails = {
                id: 'ORD-12345',
                order_number: '12345',
                restaurant_name: "Walmart Franklin #272",
                restaurant_id: 'rest_272_id', // This ID is now used to fetch the address via Firestore
                pickup_address: null, 
                dropoff_address: "1000 Mockingbird Lane, Test City, CA 90210",
                customer_name: "Jane Doe",
                customer_phone: "555-0101",
                delivery_notes: "Leave package at the door and text when arrived. Doorbell is broken!",
                payout_cents: 1050, 
                subtotal_cents: 3500,
                estimated_time: 20, 
                items: [
                    { name: "Giant Burger Combo", quantity: 1, price_cents: 1500 },
                    { name: "Fries (Large)", quantity: 2, price_cents: 500 },
                    { name: "Diet Soda", quantity: 2, price_cents: 500, special_instructions: "No ice" },
                ],
            };
            setOrderDetails(fetchedOrderDetails);
        }
    }, [isAuthReady, orderDetails]);


    const handleCompleteDelivery = (photoUrl?: string) => {
        setFinalPhotoUrl(photoUrl || null);
        setIsDeliveryComplete(true);
    };

    if (!isAuthReady || !orderDetails) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex items-center space-x-3 p-6 rounded-xl bg-white shadow-xl">
                    <svg className="animate-spin h-6 w-6 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-lg font-medium text-gray-700">Connecting to Live Data...</span>
                </div>
            </div>
        );
    }

    if (isDeliveryComplete) {
        return (
            <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4 font-sans">
                <Card className="max-w-md w-full p-6 text-center shadow-2xl border-amber-300">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
                    <h1 className="text-3xl font-bold text-amber-700 mb-2">
                        Delivery Cycle Finished!
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Order #{orderDetails.order_number} successfully completed.
                    </p>
                    <p className="text-lg font-semibold text-amber-600 mb-4">
                        Payout: ${(orderDetails.payout_cents / 100).toFixed(2)}
                    </p>
                    {finalPhotoUrl && (
                        <p className="text-sm text-gray-500">Proof uploaded successfully.</p>
                    )}
                    <Button onClick={() => setIsDeliveryComplete(false)} variant="secondary" className="mt-4 w-full">
                        Start New Delivery (Reset)
                    </Button>
                </Card>
                {ToastDisplay}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <ActiveDeliveryFlow 
                orderDetails={orderDetails} 
                onCompleteDelivery={handleCompleteDelivery} 
                db={db}
                userId={userId}
                isAuthReady={isAuthReady} 
            />
            {ToastDisplay}
        </div>
    );
};

// CRITICAL: This line ensures the component is the default export and accessible by the React renderer.
export default App;
