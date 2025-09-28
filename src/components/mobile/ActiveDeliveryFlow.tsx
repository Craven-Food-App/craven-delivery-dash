import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Phone, MessageCircle, Camera, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DeliveryCamera } from './DeliveryCamera';
import { OrderVerificationScreen } from './OrderVerificationScreen';
import { supabase } from '@/integrations/supabase/client';
import { useNavigation } from '@/hooks/useNavigation';

type DeliveryStage = 'navigate_to_restaurant' | 'arrived_at_restaurant' | 'verify_pickup' | 'navigate_to_customer' | 'capture_proof' | 'delivered';

interface OrderItem {
  name: string;
  quantity: number;
  price_cents: number;
  special_instructions?: string;
}

interface ActiveDeliveryProps {
  orderDetails: {
    id: string;
    order_number: string;
    restaurant_name: string;
    restaurant_id?: string; // Add restaurant_id for address lookup
    pickup_address: any; // can be string or address object
    dropoff_address: any; // can be string or address object
    customer_name: string;
    customer_phone?: string;
    delivery_notes?: string;
    payout_cents: number;
    subtotal_cents: number;
    estimated_time: number;
    items: OrderItem[];
    isTestOrder?: boolean; // Add test order flag
  };
  onCompleteDelivery: (photoUrl?: string) => void;
}

export const ActiveDeliveryFlow: React.FC<ActiveDeliveryProps> = ({
  orderDetails,
  onCompleteDelivery
}) => {
  const [currentStage, setCurrentStage] = useState<DeliveryStage>('navigate_to_restaurant');
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [restaurantAddress, setRestaurantAddress] = useState<string>('');
  const { toast } = useToast();
  const { openExternalNavigation } = useNavigation();

  // Fetch restaurant address if pickup_address is null
  useEffect(() => {
    const fetchRestaurantAddress = async () => {
      if (!orderDetails.pickup_address && orderDetails.restaurant_id) {
        try {
          const { data, error } = await supabase
            .from('restaurants')
            .select('address')
            .eq('id', orderDetails.restaurant_id)
            .single();
          
          if (data && !error) {
            setRestaurantAddress(data.address || '');
          }
        } catch (error) {
          console.error('Error fetching restaurant address:', error);
        }
      }
    };

    fetchRestaurantAddress();
  }, [orderDetails.pickup_address, orderDetails.restaurant_id]);

  // Helper function to format address with restaurant fallback
  const formatAddress = (address: any, fallbackAddress?: string) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address) {
      return `${address.street || ''} ${address.city || ''} ${address.state || ''} ${address.zip || ''}`.trim();
    }
    // Use restaurant address as fallback if available
    if (fallbackAddress || restaurantAddress) return fallbackAddress || restaurantAddress;
    return 'Address not available';
  };

  const handleStageComplete = () => {
    console.log('handleStageComplete called, current stage:', currentStage);
    
    // Add GPS skip logic for testing
    if (orderDetails.isTestOrder) {
      toast({
        title: "GPS Skipped",
        description: "Test mode: Skipping GPS requirements",
        duration: 2000
      });
    }
    
    switch (currentStage) {
      case 'navigate_to_restaurant':
        console.log('Transitioning to arrived_at_restaurant');
        setCurrentStage('arrived_at_restaurant');
        toast({
          title: "Arrived at Restaurant!",
          description: orderDetails.isTestOrder ? "Test: Simulated arrival at pickup location" : "Ready to pick up the order.",
        });
        break;
      case 'arrived_at_restaurant':
        console.log('Transitioning to verify_pickup');
        setCurrentStage('verify_pickup');
        toast({
          title: "Verify Order!",
          description: orderDetails.isTestOrder ? "Test: Verify order details" : "Please verify order details and customer information.",
        });
        break;
      case 'verify_pickup':
        console.log('Transitioning to navigate_to_customer');
        setCurrentStage('navigate_to_customer');
        toast({
          title: "Order Picked Up!",
          description: orderDetails.isTestOrder ? "Test: Simulated order pickup" : "Navigate to customer for delivery.",
        });
        break;
      case 'navigate_to_customer':
        console.log('Transitioning to capture_proof');
        setCurrentStage('capture_proof');
        toast({
          title: "Arrived at Customer!",
          description: orderDetails.isTestOrder ? "Test: Simulated arrival at customer" : "Take a photo to complete delivery.",
        });
        break;
      case 'capture_proof':
      case 'delivered':
        console.log('Completing delivery');
        if (orderDetails.isTestOrder) {
          toast({
            title: "Test Complete!",
            description: "Thank you for testing the delivery flow",
            duration: 3000
          });
        }
        onCompleteDelivery();
        break;
    }
  };

  // Add GPS skip function for testing
  const handleSkipGPS = () => {
    if (orderDetails.isTestOrder) {
      toast({
        title: "GPS Skipped",
        description: "Proceeding to next step for testing",
        duration: 2000
      });
      handleStageComplete();
    }
  };

  const handlePhotoCapture = async (photoBlob: Blob) => {
    setIsUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create a unique filename
      const fileName = `delivery-proof-${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('delivery-photos')
        .upload(filePath, photoBlob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(filePath);

      setDeliveryPhoto(publicUrl);
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
        description: 'Failed to upload delivery photo. Please try again.',
        variant: 'destructive'
      });
    }
    setIsUploadingPhoto(false);
  };

  const renderNavigateToRestaurant = () => (
    <div className="space-y-4">
      {/* Test Order Alert */}
      {orderDetails.isTestOrder && (
        <div className="p-4 bg-orange-100 border border-orange-300 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🧪</span>
            <span className="font-bold text-orange-800">Test Delivery</span>
          </div>
          <p className="text-sm text-orange-700">
            This is a simulated delivery for testing purposes. Go through the normal flow to complete the test.
          </p>
        </div>
      )}

      {/* Stage Header */}
      <div className="bg-blue-500 text-white p-4 rounded-2xl text-center">
        <h2 className="text-xl font-bold">Navigate to Restaurant</h2>
        <p className="opacity-90">Pick up your order</p>
      </div>

      {/* Restaurant Details */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div>
              <h3 className="font-bold text-lg">{orderDetails.restaurant_name}</h3>
              <p className="text-muted-foreground">{formatAddress(orderDetails.pickup_address, restaurantAddress)}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button 
              className="flex-1" 
              size="lg" 
              onClick={() => {
                const addr = formatAddress(orderDetails.pickup_address, restaurantAddress);
                if (!orderDetails.isTestOrder && addr && addr !== 'Address not available') {
                  openExternalNavigation({ 
                    address: addr, 
                    name: orderDetails.restaurant_name 
                  });
                }
                handleStageComplete();
              }}
            >
              <Navigation className="h-5 w-5 mr-2" />
              {orderDetails.isTestOrder ? 'Simulate Navigation' : 'Start Navigation'}
            </Button>
            {orderDetails.isTestOrder && (
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={handleSkipGPS}
                className="px-3"
              >
                ⚡ Skip
              </Button>
            )}
            <Button variant="outline" size="lg">
              <Phone className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Mode GPS Skip */}
      {orderDetails.isTestOrder && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-orange-800">Test Mode Active</p>
                <p className="text-sm text-orange-600">GPS requirements are skippable</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSkipGPS}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Skip to Arrival
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETA */}
      <div className="text-center">
        <Badge variant="secondary" className="px-4 py-2">
          <Clock className="h-4 w-4 mr-1" />
          ETA: {Math.ceil(orderDetails.estimated_time / 2)} min
        </Badge>
      </div>
    </div>
  );

  const renderArrivedAtRestaurant = () => (
    <div className="space-y-4">
      {/* Stage Header */}
      <div className="bg-orange-500 text-white p-4 rounded-2xl text-center">
        <h2 className="text-xl font-bold">At Restaurant</h2>
        <p className="opacity-90">Ready to verify order</p>
      </div>

      {/* Restaurant Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <div>
              <h3 className="font-bold text-lg">{orderDetails.restaurant_name}</h3>
              <p className="text-muted-foreground">{formatAddress(orderDetails.pickup_address)}</p>
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-muted-foreground">Ready to verify order details</p>
          </div>

          <Button
            onClick={handleStageComplete}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Verify Order Details
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderVerifyPickup = () => (
    <OrderVerificationScreen
      orderDetails={orderDetails}
      onPickupConfirmed={(pickupPhotoUrl) => {
        setCurrentStage('navigate_to_customer');
        toast({
          title: "Order Picked Up!",
          description: orderDetails.isTestOrder ? "Test: Order pickup confirmed" : "Navigate to customer for delivery.",
        });
      }}
      onCancel={() => setCurrentStage('arrived_at_restaurant')}
    />
  );

  const renderNavigateToCustomer = () => (
    <div className="space-y-4">
      {/* Stage Header */}
      <div className="bg-green-500 text-white p-4 rounded-2xl text-center">
        <h2 className="text-xl font-bold">Navigate to Customer</h2>
        <p className="opacity-90">Deliver the order</p>
      </div>

      {/* Customer Details - Enhanced */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">
                {orderDetails.customer_name}
              </h3>
              <p className="text-muted-foreground">{formatAddress(orderDetails.dropoff_address)}</p>
              {orderDetails.customer_phone && (
                <p className="text-sm text-green-600 font-medium">
                  📞 {orderDetails.customer_phone}
                </p>
              )}
            </div>
          </div>

          {/* Order Summary for Driver Reference */}
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">
              Order #{orderDetails.order_number}
            </p>
            <p className="text-sm text-blue-700">
              {orderDetails.items.length} item(s) • ${(orderDetails.subtotal_cents / 100).toFixed(2)}
            </p>
          </div>

          {orderDetails.delivery_notes && (
            <div className="bg-yellow-50 p-3 rounded-lg mb-4">
              <p className="text-sm">
                <span className="font-semibold text-yellow-800">Delivery Notes:</span> {orderDetails.delivery_notes}
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button 
              className="flex-1" 
              size="lg" 
              onClick={() => {
                const customerAddress = formatAddress(orderDetails.dropoff_address);
                if (!orderDetails.isTestOrder && customerAddress && customerAddress !== 'Address not available') {
                  openExternalNavigation({ 
                    address: customerAddress, 
                    name: orderDetails.customer_name 
                  });
                }
                handleStageComplete();
              }}
            >
              <Navigation className="h-5 w-5 mr-2" />
              {orderDetails.isTestOrder ? 'Simulate Arrival' : 'Start Navigation'}
            </Button>
            {orderDetails.isTestOrder && (
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={handleSkipGPS}
                className="px-3"
              >
                ⚡ Skip
              </Button>
            )}
            {orderDetails.customer_phone && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => {
                  if (orderDetails.isTestOrder) {
                    toast({
                      title: "Test Mode",
                      description: "Would call customer: " + orderDetails.customer_phone,
                    });
                  } else {
                    window.open(`tel:${orderDetails.customer_phone}`);
                  }
                }}
              >
                <Phone className="h-5 w-5" />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                toast({
                  title: "Chat Feature",
                  description: "Customer chat coming soon!",
                });
              }}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Arrival Button - Enhanced for Testing */}
      <Button
        onClick={handleStageComplete}
        variant="outline"
        className="w-full h-12 border-2 border-green-500 text-green-600 hover:bg-green-50"
      >
        {orderDetails.isTestOrder ? '🧪 Test: I\'ve Arrived at Customer' : 'I\'ve Arrived at Customer'}
      </Button>

      {/* Additional Test Controls */}
      {orderDetails.isTestOrder && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">Test Navigation</p>
                <p className="text-sm text-green-600">Skip GPS tracking for testing</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSkipGPS}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Skip to Customer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCaptureProof = () => (
    <div className="space-y-4">
      {/* Test Order Skip Option */}
      {orderDetails.isTestOrder && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <div className="text-2xl">🧪</div>
              <h3 className="font-bold text-purple-800">Test Mode: Photo Capture</h3>
              <p className="text-sm text-purple-600">
                You can skip photo capture for testing or proceed normally
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    toast({
                      title: "Photo Skipped",
                      description: "Test completed without photo capture",
                      duration: 2000
                    });
                    onCompleteDelivery();
                  }}
                  className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  Skip Photo & Complete
                </Button>
                <Button 
                  onClick={() => setCurrentStage('delivered')}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Take Photo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <DeliveryCamera
        onPhotoCapture={handlePhotoCapture}
        onCancel={() => setCurrentStage('navigate_to_customer')}
        isUploading={isUploadingPhoto}
      />
    </div>
  );

  const renderDeliveredOrder = () => (
    <div className="space-y-4">
      {/* Stage Header */}
      <div className="bg-purple-500 text-white p-4 rounded-2xl text-center">
        <h2 className="text-xl font-bold">Delivery Complete!</h2>
        <p className="opacity-90">{orderDetails.isTestOrder ? 'Test completed' : 'Great job!'}</p>
      </div>

      {/* Completion Status */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
            <h3 className="font-bold text-lg mb-2">
              {orderDetails.isTestOrder ? 'Test Delivery Complete!' : 'Order Delivered!'}
            </h3>
            <p className="text-muted-foreground">
              {orderDetails.isTestOrder 
                ? 'Thank you for participating in our test!'
                : 'Delivery photo captured successfully'
              }
            </p>
          </div>

          {deliveryPhoto && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-green-700">Proof of delivery uploaded</p>
            </div>
          )}

          {/* Earnings Display */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <p className="text-sm text-green-700 mb-1">You've Earned</p>
            <p className="text-2xl font-bold text-green-600">
              ${(orderDetails.payout_cents / 100).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const getCurrentStageComponent = () => {
    switch (currentStage) {
      case 'navigate_to_restaurant':
        return renderNavigateToRestaurant();
      case 'arrived_at_restaurant':
        return renderArrivedAtRestaurant();
      case 'verify_pickup':
        return renderVerifyPickup();
      case 'navigate_to_customer':
        return renderNavigateToCustomer();
      case 'capture_proof':
        return renderCaptureProof();
      case 'delivered':
        return renderDeliveredOrder();
      default:
        return renderNavigateToRestaurant();
    }
  };

  return (
    <div className="absolute inset-0 z-10 bg-background">
      {/* Progress Indicator */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
        <div className="bg-background/95 backdrop-blur-sm p-3 rounded-xl shadow-lg pointer-events-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Delivery Progress</span>
            <span className="text-xs text-muted-foreground">
              Step {['navigate_to_restaurant', 'arrived_at_restaurant', 'navigate_to_customer', 'capture_proof', 'delivered'].indexOf(currentStage) + 1} of 5
            </span>
          </div>
          <div className="flex gap-1">
            {['navigate_to_restaurant', 'arrived_at_restaurant', 'navigate_to_customer', 'capture_proof', 'delivered'].map((stage, index) => (
              <div
                key={stage}
                className={`flex-1 h-2 rounded-full ${
                  ['navigate_to_restaurant', 'arrived_at_restaurant', 'navigate_to_customer', 'capture_proof', 'delivered'].indexOf(currentStage) >= index
                    ? 'bg-orange-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-6 px-4 h-full overflow-y-auto">
        <div className="relative z-0">
          {getCurrentStageComponent()}
        </div>
      </div>
    </div>
  );
};