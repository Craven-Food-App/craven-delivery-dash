import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, DollarSign, Clock, Package, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryPanelProps {
  assignment: any;
  onDeliveryComplete: () => void;
}

export const DeliveryPanel: React.FC<DeliveryPanelProps> = ({ 
  assignment, 
  onDeliveryComplete 
}) => {
  const [orderStatus, setOrderStatus] = useState<'assigned' | 'picked_up' | 'delivered'>('assigned');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handlePickup = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'picked_up' })
        .eq('id', assignment.order_id);

      if (error) {
        console.error('Error updating pickup status:', error);
        throw error;
      }

      setOrderStatus('picked_up');
      toast({
        title: "Order Picked Up! 📦",
        description: "Head to the dropoff location to complete delivery.",
      });
    } catch (error) {
      console.error('Error marking pickup:', error);
      toast({
        title: "Error",
        description: "Failed to mark order as picked up.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelivered = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', assignment.order_id);

      if (error) {
        console.error('Error updating delivery status:', error);
        throw error;
      }

      setOrderStatus('delivered');
      toast({
        title: "Delivery Complete! 🎉",
        description: "Great job! Your earnings have been updated.",
      });
      
      // Call completion handler after short delay
      setTimeout(() => {
        onDeliveryComplete();
      }, 2000);
    } catch (error) {
      console.error('Error marking delivered:', error);
      toast({
        title: "Error",
        description: "Failed to mark order as delivered.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = () => {
    switch (orderStatus) {
      case 'assigned':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Ready for Pickup</Badge>;
      case 'picked_up':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700">In Transit</Badge>;
      case 'delivered':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Delivered</Badge>;
    }
  };

  return (
    <div className="absolute bottom-16 left-4 right-4 z-20">
      <Card className="bg-background/95 backdrop-blur-sm border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Active Delivery
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold">${(assignment.payout_cents / 100).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-blue-600" />
              <span>{assignment.distance_mi} mi</span>
            </div>
          </div>

          {/* Pickup Location */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">{assignment.restaurant_name}</p>
                <p className="text-xs text-muted-foreground">{assignment.pickup_address}</p>
              </div>
            </div>
          </div>

          {/* Dropoff Location */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Customer</p>
                <p className="text-xs text-muted-foreground">{assignment.dropoff_address}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {orderStatus === 'assigned' && (
              <Button 
                onClick={handlePickup}
                disabled={isUpdating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Marking Pickup...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Mark as Picked Up
                  </>
                )}
              </Button>
            )}
            
            {orderStatus === 'picked_up' && (
              <Button 
                onClick={handleDelivered}
                disabled={isUpdating}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Delivered
                  </>
                )}
              </Button>
            )}

            {orderStatus === 'delivered' && (
              <div className="flex items-center justify-center gap-2 text-green-700 py-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Delivery Complete!</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};