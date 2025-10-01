// --- TYPES ---
interface AddressJSONB {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

// --- FORMAT JSONB ADDRESS ---
const formatJsonbAddress = (address: string | AddressJSONB | null | undefined, fallback?: string) => {
  if (!address) return fallback || 'Address not available';
  if (typeof address === 'string') return address;
  return `${address.street || ''} ${address.city || ''} ${address.state || ''} ${address.zip || ''}`.replace(/\s+/g, ' ').trim() || fallback || 'Address not available';
};

// --- ACTIVE DELIVERY FLOW COMPONENT ---
const ActiveDeliveryFlow: React.FC<ActiveDeliveryProps> = ({ orderDetails, onCompleteDelivery }) => {
  const [currentStage, setCurrentStage] = useState<DeliveryStage>('navigate_to_restaurant');
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [restaurantAddress, setRestaurantAddress] = useState<AddressJSONB | string>('');
  const { toast } = useToast();
  const { openExternalNavigation } = useNavigation();

  // Fetch restaurant address from Supabase (JSONB)
  useEffect(() => {
    const fetchRestaurantAddress = async () => {
      if (!orderDetails.restaurant_id || typeof orderDetails.pickup_address === 'string') {
        if (typeof orderDetails.pickup_address === 'string') setRestaurantAddress(orderDetails.pickup_address);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('address')
          .eq('id', orderDetails.restaurant_id)
          .single();

        if (data && !error) setRestaurantAddress(data.address || '');
      } catch (e) {
        console.error('Error fetching restaurant address:', e);
        setRestaurantAddress('Restaurant address unavailable');
      }
    };
    fetchRestaurantAddress();
  }, [orderDetails.pickup_address, orderDetails.restaurant_id]);

  // Handle stage completion
  const handleStageComplete = () => {
    switch (currentStage) {
      case 'navigate_to_restaurant':
        setCurrentStage('arrived_at_restaurant');
        toast({ title: "Arrived at Restaurant!", description: "Ready to pick up the order." });
        break;
      case 'navigate_to_customer':
        setCurrentStage('capture_proof');
        toast({ title: "Arrived at Customer!", description: "Take a photo to complete delivery." });
        break;
      case 'capture_proof':
      case 'delivered':
        onCompleteDelivery(deliveryPhoto || undefined);
        break;
    }
  };

  // Photo capture handler
  const handlePhotoCapture = async (photoBlob: Blob) => {
    setIsUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await uploadDeliveryPhoto(user.id, photoBlob);
      if (error || !data) throw error;

      setDeliveryPhoto(data.publicUrl);
      setCurrentStage('delivered');
      showToast.success("Photo uploaded successfully!");
      setTimeout(() => onCompleteDelivery(data.publicUrl), 1500);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      showToast.error('Failed to upload delivery photo');
    }
    setIsUploadingPhoto(false);
  };

  // --- RENDER COMPONENTS ---
  const renderPickupScreen = () => {
    const isArrived = currentStage === 'arrived_at_restaurant';
    const isNavigating = currentStage === 'navigate_to_restaurant';
    const mainActionText = isNavigating ? 'CONFIRM ARRIVAL' : 'VERIFY ORDER & START DELIVERY';
    const storeAddress = formatJsonbAddress(orderDetails.pickup_address, restaurantAddress);
    const orderStatusText = isNavigating ? 'Ready' : 'Ready to Pick Up';
    const orderStatusColor = isNavigating ? 'text-orange-600' : 'text-amber-600';

    const handleMainAction = () => {
      if (isNavigating) handleStageComplete();
      else if (isArrived) {
        setCurrentStage('verify_pickup');
        toast({ title: "Verify Order!", description: "Please verify order details before proceeding." });
      }
    };

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="relative h-64 bg-gray-100 overflow-hidden">
          <RestaurantRouteMap 
            restaurantAddress={storeAddress} 
            restaurantName={orderDetails.restaurant_name} 
          />
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="relative pt-2">
            <p className="text-sm text-gray-500 mb-1">Restaurant</p>
            <h2 className="text-xl font-bold text-orange-600 mb-1">{orderDetails.restaurant_name}</h2>
            <p className="text-gray-600 text-sm mb-4">{storeAddress || 'Address not available'}</p>

            <button
              className="absolute top-0 right-0 w-16 h-16 bg-orange-500 text-white rounded-full flex flex-col items-center justify-center shadow-lg transition duration-200 hover:bg-orange-600 active:scale-95"
              onClick={() => {
                if (storeAddress && storeAddress !== 'Address not available') {
                  openExternalNavigation({ address: storeAddress, name: orderDetails.restaurant_name });
                }
              }}
            >
              <Navigation className="h-6 w-6" />
              <span className="text-[10px] font-semibold mt-0.5">NAVIGATE</span>
            </button>
          </div>

          <div className="flex justify-between items-start pr-20 mt-4 pb-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Pickup Time</p>
              <p className="text-xl font-bold text-orange-600">{orderDetails.estimated_time || '4:00 PM'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 flex items-center gap-1">Order Status</p>
              <p className={`text-xl font-bold ${orderStatusColor}`}>{orderStatusText}</p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pt-2 z-20">
          <button 
            className="w-full h-14 bg-blue-900 text-white rounded-full font-semibold text-base mb-3 transition hover:bg-blue-800 active:scale-98"
            onClick={() => toast({ title: "Pickup Notes", description: "Notes feature invoked.", duration: 2000 })}
          >
            PICKUP NOTES
          </button>

          <button
            className="w-full h-16 bg-orange-500 text-white rounded-full font-semibold text-base shadow-lg transition hover:bg-orange-600 active:scale-98 flex items-center justify-center"
            onClick={handleMainAction}
          >
            <div className="relative flex items-center justify-center w-full">
              <div className="absolute left-6 p-1 bg-white/20 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>
                </svg>
              </div>
              {mainActionText}
            </div>
          </button>
        </div>
      </div>
    );
  };

  const renderNavigateToCustomer = () => {
    const customerAddress = formatJsonbAddress(orderDetails.dropoff_address);

    return (
      <div className="p-4 space-y-4">
        <Card className="bg-amber-50 border-amber-200 text-center">
          <CardContent className="p-4">
            <h2 className="text-xl font-bold text-amber-700">Deliver to Customer</h2>
            <p className="opacity-90 text-sm text-amber-600">Final leg of the journey</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <MapPin className="h-6 w-6 text-amber-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-amber-700">{orderDetails.customer_name}</h3>
                <p className="text-gray-600">{customerAddress}</p>
                {orderDetails.customer_phone && <p className="text-sm text-amber-600 font-medium mt-1">📞 {orderDetails.customer_phone}</p>}
              </div>
            </div>

            {orderDetails.delivery_notes && (
              <div className="bg-yellow-50 p-3 rounded-lg mt-4 mb-4">
                <p className="text-sm"><span className="font-semibold text-yellow-800">Delivery Notes:</span> {orderDetails.delivery_notes}</p>
              </div>
            )}

            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-4 mt-3"
              onClick={() => openExternalNavigation({ address: customerAddress, name: orderDetails.customer_name })}
            >
              NAVIGATE
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCaptureProof = () => (
    <CaptureDeliveryPhoto
      onCapture={handlePhotoCapture}
      isUploading={isUploadingPhoto}
    />
  );

  // --- MAIN RENDER SWITCH ---
  switch (currentStage) {
    case 'navigate_to_restaurant':
    case 'arrived_at_restaurant':
      return renderPickupScreen();
    case 'navigate_to_customer':
      return renderNavigateToCustomer();
    case 'capture_proof':
    case 'delivered':
      return renderCaptureProof();
    default:
      return <div>Loading...</div>;
  }
};
