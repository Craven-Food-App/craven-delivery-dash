import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Phone, MessageCircle, Camera, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type DeliveryStage = 'navigate_to_restaurant' | 'arrived_at_restaurant' | 'navigate_to_customer' | 'delivered';

interface ActiveDeliveryProps {
  orderDetails: {
    restaurant_name: string;
    pickup_address: any; // can be string or address object
    dropoff_address: any; // can be string or address object
    customer_name?: string;
    customer_phone?: string;
    delivery_notes?: string;
    payout_cents: number;
    estimated_time: number;
    isTestOrder?: boolean; // Add test order flag
  };
  onCompleteDelivery: () => void;
}

export const ActiveDeliveryFlow: React.FC<ActiveDeliveryProps> = ({
  orderDetails,
  onCompleteDelivery
}) => {
  const [currentStage, setCurrentStage] = useState<DeliveryStage>('navigate_to_restaurant');
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const { toast } = useToast();

  // Helper function to format address
  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address) {
      return `${address.street || ''} ${address.city || ''} ${address.state || ''} ${address.zip || ''}`.trim();
    }
    return 'Address not available';
  };

  const handleStageComplete = () => {
    console.log('handleStageComplete called, current stage:', currentStage);
    switch (currentStage) {
      case 'navigate_to_restaurant':
        console.log('Transitioning to arrived_at_restaurant');
        setCurrentStage('arrived_at_restaurant');
        toast({
          title: "Arrived at Restaurant!",
          description: "Ready to pick up the order.",
        });
        break;
      case 'arrived_at_restaurant':
        console.log('Transitioning to navigate_to_customer');
        setCurrentStage('navigate_to_customer');
        toast({
          title: "Order Picked Up!",
          description: "Navigate to customer for delivery.",
        });
        break;
      case 'navigate_to_customer':
        console.log('Transitioning to delivered');
        setCurrentStage('delivered');
        toast({
          title: "Arrived at Customer!",
          description: "Complete the delivery.",
        });
        break;
      case 'delivered':
        console.log('Completing delivery');
        onCompleteDelivery();
        break;
    }
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
              <p className="text-muted-foreground">{formatAddress(orderDetails.pickup_address)}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button className="flex-1" size="lg" onClick={handleStageComplete}>
              <Navigation className="h-5 w-5 mr-2" />
              {orderDetails.isTestOrder ? 'Simulate Navigation' : 'Start Navigation'}
            </Button>
            <Button variant="outline" size="lg">
              <Phone className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

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
        <p className="opacity-90">Confirm pickup</p>
      </div>

      {/* Restaurant Info */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center mb-4">
            <h3 className="font-bold text-xl">{orderDetails.restaurant_name}</h3>
            <p className="text-muted-foreground">{orderDetails.pickup_address}</p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                📋 Show this screen to restaurant staff to confirm pickup
              </p>
            </div>
            
            <Button 
              onClick={handleStageComplete}
              className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-bold text-lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Confirm Pickup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNavigateToCustomer = () => (
    <div className="space-y-4">
      {/* Stage Header */}
      <div className="bg-green-500 text-white p-4 rounded-2xl text-center">
        <h2 className="text-xl font-bold">Navigate to Customer</h2>
        <p className="opacity-90">Deliver your order</p>
      </div>

      {/* Customer Details */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-bold text-lg">{orderDetails.customer_name || 'Customer'}</h3>
              <p className="text-muted-foreground">{orderDetails.dropoff_address}</p>
            </div>
          </div>
          
          {orderDetails.delivery_notes && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Delivery Notes:</strong> {orderDetails.delivery_notes}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button className="flex-1" size="lg">
              <Navigation className="h-5 w-5 mr-2" />
              Start Navigation
            </Button>
            {orderDetails.customer_phone && (
              <Button variant="outline" size="lg">
                <Phone className="h-5 w-5" />
              </Button>
            )}
            <Button variant="outline" size="lg">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Arrival Button */}
      <Button 
        onClick={handleStageComplete}
        variant="outline"
        className="w-full h-12 border-2 border-green-500 text-green-600 hover:bg-green-50"
      >
        I've Arrived at Customer
      </Button>
    </div>
  );

  const renderDeliveredOrder = () => (
    <div className="space-y-4">
      {/* Stage Header */}
      <div className="bg-purple-500 text-white p-4 rounded-2xl text-center">
        <h2 className="text-xl font-bold">Complete Delivery</h2>
        <p className="opacity-90">Confirm delivery completion</p>
      </div>

      {/* Completion Options */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="text-center">
            <h3 className="font-bold text-lg mb-2">Order Delivered!</h3>
            <p className="text-muted-foreground">Confirm delivery completion</p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => setShowPhotoUpload(!showPhotoUpload)}
              variant="outline" 
              className="w-full h-12"
            >
              <Camera className="h-5 w-5 mr-2" />
              Take Photo (Optional)
            </Button>
            
            {showPhotoUpload && (
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Tap to take delivery photo</p>
              </div>
            )}
            
            <Button 
              onClick={handleStageComplete}
              className="w-full h-14 bg-green-500 hover:bg-green-600 text-white font-bold text-lg"
            >
              <CheckCircle className="h-6 w-6 mr-2" />
              Complete Delivery
            </Button>
          </div>

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
      case 'navigate_to_customer':
        return renderNavigateToCustomer();
      case 'delivered':
        return renderDeliveredOrder();
      default:
        return renderNavigateToRestaurant();
    }
  };

  return (
    <div className="absolute inset-0 z-10 bg-background">
      {/* Progress Indicator */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="bg-background/95 backdrop-blur-sm p-3 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Delivery Progress</span>
            <span className="text-xs text-muted-foreground">
              Step {['navigate_to_restaurant', 'arrived_at_restaurant', 'navigate_to_customer', 'delivered'].indexOf(currentStage) + 1} of 4
            </span>
          </div>
          <div className="flex gap-1">
            {['navigate_to_restaurant', 'arrived_at_restaurant', 'navigate_to_customer', 'delivered'].map((stage, index) => (
              <div
                key={stage}
                className={`flex-1 h-2 rounded-full ${
                  ['navigate_to_restaurant', 'arrived_at_restaurant', 'navigate_to_customer', 'delivered'].indexOf(currentStage) >= index
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-6 px-4 h-full overflow-y-auto">
        {getCurrentStageComponent()}
      </div>
    </div>
  );
};