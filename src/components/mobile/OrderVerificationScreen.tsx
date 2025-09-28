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
import cravenLogo from '@/assets/craven-c.png';

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
    // Skip database update for test orders since they use non-UUID IDs
    if (!orderDetails.isTestOrder) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          pickup_photo_url: publicUrl,
          pickup_confirmed_at: new Date().toISOString(),
          order_status: 'picked_up'
        })
        .eq('id', orderDetails.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Failed to update order: ${updateError.message}`);
      }
    }

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
      // Skip database update for test orders since they use non-UUID IDs
      if (!orderDetails.isTestOrder) {
        // Update order status to picked up
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            pickup_confirmed_at: new Date().toISOString(),
            order_status: 'picked_up'
          })
          .eq('id', orderDetails.id);

        if (updateError) {
          console.error('Database update error:', updateError);
          throw new Error(`Failed to update order: ${updateError.message}`);
        }
      }

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
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Header with pickup time */}
        <div className="bg-black text-white rounded-b-3xl px-4 py-6">
          <div className="text-center">
            <Clock className="h-5 w-5 mx-auto mb-2 text-orange-400" />
            <h1 className="text-lg font-semibold">Pick up by 12:27 PM</h1>
          </div>
        </div>

        <div className="px-4 space-y-4">
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

          {/* Order for section with Crave'N logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={cravenLogo} alt="Crave'N" className="w-8 h-8 object-contain" />
              <div>
                <p className="text-gray-600 text-sm">Order for</p>
                <h2 className="text-2xl font-bold text-gray-900">{orderDetails.customer_name || "Customer"}</h2>
              </div>
              <div className="ml-auto flex gap-2">
                {orderDetails.customer_phone && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-10 h-10 rounded-full bg-gray-200 p-0"
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
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-10 h-10 rounded-full bg-gray-200 p-0"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Delivery encouragement message */}
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm">💚</span>
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">Make this delivery count</h3>
                  <p className="text-sm text-green-700">
                    This customer tends to leave higher tips and ratings for great service. Take a moment to check the order.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-4">
          {/* Order Summary */}
          <div className="bg-white">
            <div 
              className="flex items-center justify-between cursor-pointer py-3"
              onClick={() => setShowOrderItems(!showOrderItems)}
            >
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span className="font-semibold">{orderDetails.items.length} items</span>
              </div>
              {showOrderItems ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            
            {showOrderItems && (
              <div className="space-y-3 pb-4">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="border-l-2 border-orange-200 pl-4">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium">{item.quantity}×</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        {item.special_instructions && (
                          <div className="mt-1 space-y-1">
                            {item.special_instructions.split(',').map((instruction, idx) => (
                              <p key={idx} className="text-sm text-gray-600">{instruction.trim()}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verify Order Button */}
          <Button
            onClick={() => setShowCamera(true)}
            className="w-full h-14 text-lg font-semibold bg-red-500 hover:bg-red-600 text-white shadow-lg rounded-xl"
          >
            Verify order
          </Button>

          {/* Skip Photo Option */}
          <Button
            onClick={handleConfirmWithoutPhoto}
            variant="outline"
            className="w-full h-12 border-2 border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {orderDetails.isTestOrder ? 'Test: Confirm Pickup' : 'Confirm Pickup (No Photo)'}
          </Button>

          {/* Cancel Button */}
          <Button
            onClick={onCancel}
            variant="ghost"
            className="w-full h-10 text-gray-500"
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