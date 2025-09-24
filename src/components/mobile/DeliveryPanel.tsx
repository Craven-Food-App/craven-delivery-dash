import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, Package, CheckCircle } from 'lucide-react';
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
        .update({ order_status: 'picked_up' })
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
        .update({ order_status: 'delivered' })
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
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">Ready for Pickup</Badge>;
      case 'picked_up':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">In Transit</Badge>;
      case 'delivered':
        return <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">Delivered</Badge>;
    }
  };

  return (
    <>
      {/* Compact Delivery Info - Top */}
      <div className="absolute top-20 left-4 right-4 z-20">
        <Card className="bg-background/95 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">Active Delivery</span>
              </div>
              {getStatusBadge()}
            </div>
            
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-green-600">
                ${(assignment.payout_cents / 100).toFixed(2)}
              </span>
              <span className="text-muted-foreground">
                {assignment.distance_mi} mi
              </span>
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-red-500" />
                <span className="font-medium">{assignment.restaurant_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-green-500" />
                <span className="truncate">Drop: {assignment.dropoff_address.split(',')[0]}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Button - Fixed Position */}
      <div className="absolute bottom-20 left-4 right-4 z-20">
        {orderStatus === 'assigned' && (
          <Button 
            onClick={handlePickup}
            disabled={isUpdating}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            size="lg"
          >
            {isUpdating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
            className="w-full bg-green-600 hover:bg-green-700 h-12"
            size="lg"
          >
            {isUpdating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Delivered
              </>
            )}
          </Button>
        )}

        {orderStatus === 'delivered' && (
          <div className="flex items-center justify-center gap-2 text-green-700 py-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Delivery Complete!</span>
          </div>
        )}
      </div>
    </>
  );
};