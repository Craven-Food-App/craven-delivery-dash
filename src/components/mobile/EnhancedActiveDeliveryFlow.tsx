import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Navigation, 
  Check, 
  Phone, 
  MessageSquare, 
  MapPin,
  Clock,
  DollarSign,
  Camera,
  CheckCircle,
  ArrowRight,
  Package
} from 'lucide-react';
import { MapNavigationHelper } from './MapNavigationHelper';
import { NavigationMapbox } from './NavigationMapbox';
import { CustomerNavigationStep } from './CustomerNavigationStep';
import { useNavigation } from '@/hooks/useNavigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OrderDetails {
  restaurant_name: string;
  restaurant_id?: string; // Add restaurant_id for address lookup
  pickup_address: string | any;
  dropoff_address: string | any;
  customer_name?: string;
  customer_phone?: string;
  delivery_notes?: string;
  payout_cents: number;
  estimated_time: number;
}

interface EnhancedActiveDeliveryFlowProps {
  orderDetails: OrderDetails;
  onCompleteDelivery: () => void;
}

type DeliveryStep = 'accepted' | 'heading_to_pickup' | 'at_restaurant' | 'picked_up' | 'heading_to_customer' | 'at_customer' | 'delivered';

const DELIVERY_STEPS = [
  { id: 'accepted', label: 'Order Accepted', emoji: '✅' },
  { id: 'heading_to_pickup', label: 'Heading to Restaurant', emoji: '🚗' },
  { id: 'at_restaurant', label: 'At Restaurant', emoji: '🏪' },
  { id: 'picked_up', label: 'Order Picked Up', emoji: '📦' },
  { id: 'heading_to_customer', label: 'Heading to Customer', emoji: '🚚' },
  { id: 'at_customer', label: 'At Customer', emoji: '📍' },
  { id: 'delivered', label: 'Delivered', emoji: '🎉' }
] as const;

export const EnhancedActiveDeliveryFlow: React.FC<EnhancedActiveDeliveryFlowProps> = ({
  orderDetails,
  onCompleteDelivery
}) => {
  const [currentStep, setCurrentStep] = useState<DeliveryStep>('accepted');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedArrival, setEstimatedArrival] = useState<Date | null>(null);
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [restaurantAddress, setRestaurantAddress] = useState<string>('');

  const { toast } = useToast();
  const { navigationSettings } = useNavigation();

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

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-advance to next step after certain actions
  useEffect(() => {
    if (currentStep === 'accepted') {
      // Auto-advance to heading to pickup after 3 seconds
      const timer = setTimeout(() => {
        setCurrentStep('heading_to_pickup');
        calculateETA('pickup');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const calculateETA = (destination: 'pickup' | 'customer') => {
    // Simulate ETA calculation based on distance/traffic
    const baseTime = destination === 'pickup' ? 10 : 15; // minutes
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + baseTime);
    setEstimatedArrival(eta);
  };

  const getCurrentStepIndex = () => {
    return DELIVERY_STEPS.findIndex(step => step.id === currentStep);
  };

  const getStepProgress = () => {
    const currentIndex = getCurrentStepIndex();
    return ((currentIndex + 1) / DELIVERY_STEPS.length) * 100;
  };

  const handleNextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < DELIVERY_STEPS.length - 1) {
      const nextStep = DELIVERY_STEPS[currentIndex + 1].id as DeliveryStep;
      setCurrentStep(nextStep);
      
      // Update ETA for relevant steps
      if (nextStep === 'picked_up') {
        calculateETA('customer');
      }
      
      // Show photo capture for final step
      if (nextStep === 'delivered') {
        setShowPhotoCapture(true);
      }

      toast({
        title: "Status Updated",
        description: `Marked as ${DELIVERY_STEPS[currentIndex + 1].label}`,
      });
    }
  };

  const handleCompleteDelivery = () => {
    if (currentStep === 'delivered') {
      onCompleteDelivery();
    } else {
      setCurrentStep('delivered');
      setTimeout(() => {
        onCompleteDelivery();
      }, 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatETA = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatAddress = (addressData: string | any, fallbackAddress?: string): string => {
    if (typeof addressData === 'string') return addressData;
    if (addressData?.address) return addressData.address;
    const formatted = `${addressData?.street || ''} ${addressData?.city || ''} ${addressData?.state || ''} ${addressData?.zip_code || ''}`.trim();
    if (formatted) return formatted;
    // Use restaurant address as fallback if available
    if (fallbackAddress || restaurantAddress) return fallbackAddress || restaurantAddress;
    return 'Address not available';
  };

  const getCurrentDestination = () => {
    if (['accepted', 'heading_to_pickup', 'at_restaurant'].includes(currentStep)) {
      return {
        address: formatAddress(orderDetails.pickup_address),
        name: orderDetails.restaurant_name,
        type: 'pickup' as const
      };
    } else {
      return {
        address: formatAddress(orderDetails.dropoff_address),
        name: orderDetails.customer_name,
        type: 'delivery' as const
      };
    }
  };

  const getActionButton = () => {
    switch (currentStep) {
      case 'heading_to_pickup':
        return {
          text: "I've Arrived at Restaurant",
          action: () => setCurrentStep('at_restaurant'),
          icon: <MapPin className="h-4 w-4" />
        };
      case 'at_restaurant':
        return {
          text: "Order Picked Up",
          action: () => setCurrentStep('picked_up'),
          icon: <Package className="h-4 w-4" />
        };
      case 'picked_up':
        return {
          text: "Start Delivery",
          action: () => setCurrentStep('heading_to_customer'),
          icon: <ArrowRight className="h-4 w-4" />
        };
      case 'heading_to_customer':
        return {
          text: "I've Arrived",
          action: () => setCurrentStep('at_customer'),
          icon: <MapPin className="h-4 w-4" />
        };
      case 'at_customer':
        return {
          text: "Mark as Delivered",
          action: handleCompleteDelivery,
          icon: <CheckCircle className="h-4 w-4" />
        };
      default:
        return null;
    }
  };

  const destination = getCurrentDestination();
  const actionButton = getActionButton();
  const currentStepData = DELIVERY_STEPS[getCurrentStepIndex()];

  // Show specialized customer navigation view for customer delivery steps
  if (currentStep === 'heading_to_customer' || currentStep === 'at_customer') {
    return (
      <CustomerNavigationStep
        customerName={orderDetails.customer_name}
        deliveryTime={estimatedArrival ? formatETA(estimatedArrival) : '12:44 PM'}
        customerPhone={orderDetails.customer_phone}
        dropoffAddress={orderDetails.dropoff_address}
        apartmentInfo="lot 34"
        deliveryInstructions={orderDetails.delivery_notes}
        onCall={() => toast({ title: "Calling customer...", description: "Feature coming soon!" })}
        onMessage={() => toast({ title: "Messaging customer...", description: "Feature coming soon!" })}
        onDirections={() => {
          // Open external navigation or use built-in navigation
          const address = formatAddress(orderDetails.dropoff_address);
          window.open(`https://maps.google.com/maps?q=${encodeURIComponent(address)}`, '_blank');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="max-w-md mx-auto p-4 space-y-4">
        
        {/* Progress Header */}
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Current Step */}
              <div className="text-center">
                <div className="text-3xl mb-2">{currentStepData.emoji}</div>
                <h1 className="text-xl font-bold">{currentStepData.label}</h1>
                <p className="text-orange-100 text-sm">Order #{orderDetails.restaurant_name.slice(0, 8)}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={getStepProgress()} className="h-2 bg-orange-300" />
                <div className="flex justify-between text-xs text-orange-100">
                  <span>Step {getCurrentStepIndex() + 1} of {DELIVERY_STEPS.length}</span>
                  <span>{formatTime(elapsedTime)} elapsed</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order Details</span>
              <Badge className="bg-green-100 text-green-800">
                ${(orderDetails.payout_cents / 100).toFixed(2)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">{orderDetails.restaurant_name}</p>
                <p className="text-sm text-muted-foreground">{formatAddress(orderDetails.pickup_address)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">{orderDetails.customer_name || 'Customer'}</p>
                <p className="text-sm text-muted-foreground">{formatAddress(orderDetails.dropoff_address)}</p>
              </div>
            </div>

            {orderDetails.delivery_notes && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Notes:</strong> {orderDetails.delivery_notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        {navigationSettings.provider === 'mapbox' ? (
          <NavigationMapbox
            destination={{
              address: destination.address,
              name: destination.name
            }}
          />
        ) : (
          <MapNavigationHelper 
            destination={{
              address: destination.address,
              name: destination.name
            }}
            type={destination.type}
          />
        )}

        {/* ETA Display */}
        {estimatedArrival && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 font-semibold">
                  ETA: {formatETA(estimatedArrival)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Button */}
        {actionButton && (
          <Button
            onClick={actionButton.action}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg rounded-xl"
          >
            {actionButton.icon}
            <span className="ml-2">{actionButton.text}</span>
          </Button>
        )}

        {/* Communication Buttons */}
        {currentStep !== 'delivered' && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2 h-12"
              onClick={() => toast({ title: "Calling...", description: "Feature coming soon!" })}
            >
              <Phone className="h-4 w-4" />
              Call {destination.type === 'pickup' ? 'Restaurant' : 'Customer'}
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-12"
              onClick={() => toast({ title: "Messaging...", description: "Feature coming soon!" })}
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </Button>
          </div>
        )}

        {/* Photo Capture for Delivery */}
        {showPhotoCapture && currentStep === 'delivered' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Camera className="h-5 w-5" />
                Delivery Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-green-700">
                Take a photo to confirm delivery (optional)
              </p>
              <Button
                variant="outline"
                className="w-full h-12 border-green-300 text-green-700 hover:bg-green-100"
                onClick={() => {
                  // In a real app, this would open the camera
                  setProofPhoto("photo_taken");
                  toast({
                    title: "Photo Captured",
                    description: "Delivery proof photo saved successfully.",
                  });
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                {proofPhoto ? 'Retake Photo' : 'Take Photo'}
              </Button>
              
              {proofPhoto && (
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-700 font-medium">Photo saved!</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Completion Message */}
        {currentStep === 'delivered' && (
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="text-4xl">🎉</div>
                <h2 className="text-2xl font-bold">Delivery Complete!</h2>
                <p className="text-green-100">
                  Great job! You earned ${(orderDetails.payout_cents / 100).toFixed(2)}
                </p>
                <Button
                  onClick={onCompleteDelivery}
                  className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-8 py-2 rounded-lg"
                >
                  Continue to Next Offer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};