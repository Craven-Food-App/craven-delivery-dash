// src/components/mobile/ActiveDeliveryFlow.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RestaurantRouteMap } from './RestaurantRouteMap';
import { CaptureDeliveryPhoto } from './CaptureDeliveryPhoto';

export interface ActiveDeliveryProps {
  orderDetails: {
    id: string;
    order_number: string;
    restaurant_name: string;
    pickup_address: any;
    dropoff_address: any;
    customer_name?: string;
    customer_phone?: string;
    delivery_notes?: string;
    payout_cents?: number;
    subtotal_cents?: number;
    estimated_time?: number;
    items?: Array<{ name: string; quantity: number; price_cents: number }>;
    isTestOrder?: boolean;
  };
  onCompleteDelivery: () => void;
}

const ActiveDeliveryFlow: React.FC<ActiveDeliveryProps> = ({ orderDetails, onCompleteDelivery }) => {
  const [deliveryStage, setDeliveryStage] = useState<'PICKUP' | 'IN_TRANSIT' | 'DELIVERED'>('PICKUP');
  const [deliveryPhoto, setDeliveryPhoto] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadPhoto = async () => {
    if (!deliveryPhoto) return;
    setIsUploading(true);
    try {
      // Replace with your actual Supabase storage logic
      await supabase.storage.from('deliveries').upload(`delivery-${orderDetails.id}.jpg`, deliveryPhoto);
      setDeliveryPhoto(null);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{orderDetails.restaurant_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Stage: {deliveryStage}</p>
          <Button onClick={() => setDeliveryStage('IN_TRANSIT')} className="mb-2">
            Start Transit
          </Button>
          <Button onClick={() => setDeliveryStage('DELIVERED')} className="mb-2">
            Mark Delivered
          </Button>
        </CardContent>
      </Card>

      <RestaurantRouteMap
        restaurantAddress={orderDetails.pickup_address}
        customerAddress={orderDetails.dropoff_address}
      />

      <CaptureDeliveryPhoto
        deliveryPhoto={deliveryPhoto}
        setDeliveryPhoto={setDeliveryPhoto}
      />

      <Button onClick={handleUploadPhoto} disabled={isUploading || !deliveryPhoto} className="mt-2 w-full">
        {isUploading ? 'Uploading...' : 'Upload Photo'}
      </Button>

      {deliveryStage === 'DELIVERED' && (
        <Button onClick={onCompleteDelivery} className="mt-4 w-full bg-green-600 text-white">
          Complete Delivery
        </Button>
      )}
    </div>
  );
};

export default ActiveDeliveryFlow;
