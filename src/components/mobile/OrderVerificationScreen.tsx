import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  User, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Camera, 
  CheckCircle,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DeliveryCamera } from './DeliveryCamera';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  name: string;
  quantity: number;
  price_cents: number;
  special_instructions?: string;
}

interface OrderVerificationProps {
  orderDetails: {
    id: string;
    order_number: string;
    restaurant_name: string;
    customer_name: string;
    customer_phone?: string;
    pickup_address: any;
    dropoff_address: any;
    items: OrderItem[];
    subtotal_cents: number;
    delivery_notes?: string;
    payout_cents: number;
    isTestOrder?: boolean;
  };
  onPickupConfirmed: (pickupPhotoUrl?: string) => void;
  onCancel: () => void;
}

export const OrderVerificationScreen: React.FC<OrderVerificationProps> = ({
  orderDetails,
  onPickupConfirmed,
  onCancel
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [pickupPhoto, setPickupPhoto] = useState<string | null>(null);
  const [showOrderItems, setShowOrderItems] = useState(false);
  const { toast } = useToast();

  // Calculate payout if not set (70% of delivery fee + base amount)
  const calculatePayout = () => {
    if (orderDetails.payout_cents && orderDetails.payout_cents > 0) {
      return orderDetails.payout_cents;
    }
    // Default calculation: 70% of delivery fee + $3 base
    const deliveryFee = 299; // Default delivery fee in cents
    const baseAmount = 300; // $3 base in cents
    return Math.round((deliveryFee * 0.7) + baseAmount);
  };

  const formatAddress = (address: any, fallbackAddress?: string) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address) {
      return `${address.street || ''} ${address.city || ''} ${address.state || ''} ${address.zip || ''}`.trim();
    }
    // Use fallback address if available
    if (fallbackAddress) return fallbackAddress;
    return 'Address not available';
  };

  const handlePhotoCapture = async (photoBlob: Blob) => {
    setIsUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create a unique filename for pickup photo
      const fileName = `pickup-${orderDetails.order_number}-${Date.now()}.jpg`;
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

      // Update order with pickup photo and confirmation
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          pickup_photo_url: publicUrl,
          pickup_confirmed_at: new Date().toISOString(),
          order_status: 'picked_up'
        })
        .eq('id', orderDetails.id);

      if (updateError) throw updateError;

      setPickupPhoto(publicUrl);
      setShowCamera(false);
      
      toast({
        title: "Pickup Confirmed!",
        description: "Order photo captured and pickup confirmed.",
      });

      // Complete pickup after successful photo upload
      setTimeout(() => {
        onPickupConfirmed(publicUrl);
      }, 1500);

    } catch (error: any) {
      console.error('Error uploading pickup photo:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload pickup photo. Please try again.',
        variant: 'destructive'
      });
    }
    setIsUploadingPhoto(false);
  };

  const handleConfirmWithoutPhoto = async () => {
    try {
      // Update order status to picked up
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          pickup_confirmed_at: new Date().toISOString(),
          order_status: 'picked_up'
        })
        .eq('id', orderDetails.id);

      if (updateError) throw updateError;

      toast({
        title: "Pickup Confirmed!",
        description: orderDetails.isTestOrder ? "Test pickup confirmed" : "Ready to deliver to customer.",
      });

      onPickupConfirmed();
    } catch (error: any) {
      console.error('Error confirming pickup:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to confirm pickup. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (showCamera) {
    return (
      <div className="absolute inset-0 z-10 bg-background">
        <div className="p-4">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-center">Take Pickup Photo</h2>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Capture a photo of the order for verification
            </p>
          </div>
          
          <DeliveryCamera
            onPhotoCapture={handlePhotoCapture}
            onCancel={() => setShowCamera(false)}
            isUploading={isUploadingPhoto}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 bg-background">
      <div className="max-w-md mx-auto p-4 space-y-4">
        
        {/* Test Order Alert */}
        {orderDetails.isTestOrder && (
          <div className="p-4 bg-orange-100 border border-orange-300 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🧪</span>
              <span className="font-bold text-orange-800">Test Order Verification</span>
            </div>
            <p className="text-sm text-orange-700">
              This is a test order verification. You can skip the photo or take one for testing.
            </p>
          </div>
        )}

        {/* Header */}
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="text-3xl">📦</div>
              <h1 className="text-xl font-bold">Verify Pickup</h1>
              <p className="text-orange-100">Order #{orderDetails.order_number}</p>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{orderDetails.customer_name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatAddress(orderDetails.dropoff_address)}
                </p>
              </div>
              <div className="flex gap-2">
                {orderDetails.customer_phone && (
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {orderDetails.delivery_notes && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Delivery Notes:</strong> {orderDetails.delivery_notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowOrderItems(!showOrderItems)}
            >
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({orderDetails.items.length})
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">
                  ${(orderDetails.subtotal_cents / 100).toFixed(2)}
                </Badge>
                {showOrderItems ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardTitle>
          </CardHeader>
          {showOrderItems && (
            <CardContent className="space-y-2">
              {orderDetails.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start p-2 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.quantity}x {item.name}</p>
                    {item.special_instructions && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Note: {item.special_instructions}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold">
                    ${(item.price_cents / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Restaurant Info */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">{orderDetails.restaurant_name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatAddress(orderDetails.pickup_address)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Display */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-semibold text-lg">
                You'll earn ${(calculatePayout() / 100).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Photo Verification Button */}
          <Button
            onClick={() => setShowCamera(true)}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg rounded-xl"
          >
            <Camera className="h-5 w-5 mr-2" />
            Take Pickup Photo & Confirm
          </Button>

          {/* Skip Photo Option */}
          <Button
            onClick={handleConfirmWithoutPhoto}
            variant="outline"
            className="w-full h-12 border-2 border-green-500 text-green-600 hover:bg-green-50"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {orderDetails.isTestOrder ? 'Test: Confirm Pickup' : 'Confirm Pickup (No Photo)'}
          </Button>

          {/* Cancel Button */}
          <Button
            onClick={onCancel}
            variant="secondary"
            className="w-full h-10 text-muted-foreground"
          >
            Back to Navigation
          </Button>
        </div>

        {/* Success State */}
        {pickupPhoto && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                <p className="text-green-800 font-semibold">Pickup Confirmed!</p>
                <p className="text-sm text-green-600">Photo uploaded successfully</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};