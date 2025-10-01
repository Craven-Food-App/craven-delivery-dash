// src/components/mobile/ActiveDeliveryFlow.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/integrations/supabase/client';
import { RestaurantRouteMap } from '@/components/mobile/RestaurantRouteMap';
import { CaptureDeliveryPhoto } from '@/components/mobile/CaptureDeliveryPhoto';

// Types
export type DeliveryStage = 'PICKUP' | 'IN_TRANSIT' | 'DELIVERED';

export interface ActiveDeliveryProps {
  deliveryId: string;
  restaurantAddress: string | Record<string, any>;
  customerAddress?: string | Record<string, any>;
  restaurantName?: string;
  customerName?: string;
}

// Placeholder helpers
const showToast = (message: string) => {
  const { toast } = useToast();
  toast({ title: message });
};

const uploadDeliveryPhoto = async (file: Blob, deliveryId: string) => {
  // Replace with your actual Supabase upload logic
  console.log('Uploading photo for delivery', deliveryId);
  return true;
};

// Component
const ActiveDeliveryFlow: React.FC<ActiveDeliveryProps> = ({
  deliveryId,
  restaurantAddress,
  customerAddress,
  restaurantName,
  customerName,
}) => {
  const navigation = useNavigation();
  const [deliveryStage, setDeliveryStage] = useState<DeliveryStage>('PICKUP');
  const [deliveryPhoto, setDeliveryPhoto] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Example effect for fetching delivery data
  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const { data, error } = await supabase
          .from('deliveries')
          .select('*')
          .eq('id', deliveryId)
          .single();
        if (error) throw error;
        console.log('Delivery data', data);
      } catch (err) {
        showToast('Failed to load delivery');
      }
    };

    fetchDelivery();
  }, [deliveryId]);

  // Handle photo upload
  const handleUploadPhoto = async () => {
    if (!deliveryPhoto) return;
    setIsUploading(true);
    try {
      await uploadDeliveryPhoto(deliveryPhoto, deliveryId);
      showToast('Photo uploaded successfully!');
      setDeliveryPhoto(null);
    } catch (err) {
      showToast('Photo upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>{restaurantName || 'Restaurant'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Delivery Stage: {deliveryStage}</p>
          <Button onClick={() => setDeliveryStage('IN_TRANSIT')}>Start Delivery</Button>
        </CardContent>
      </Card>

      <RestaurantRouteMap
        restaurantAddress={restaurantAddress}
        customerAddress={customerAddress}
      />

      <CaptureDeliveryPhoto
        deliveryPhoto={deliveryPhoto}
        setDeliveryPhoto={setDeliveryPhoto}
      />

      <Button onClick={handleUploadPhoto} disabled={isUploading || !deliveryPhoto}>
        {isUploading ? 'Uploading...' : 'Upload Delivery Photo'}
      </Button>
    </div>
  );
};

export default ActiveDeliveryFlow;
