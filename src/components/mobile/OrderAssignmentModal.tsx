import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OrderAssignment {
  assignment_id: string;
  order_id: string;
  restaurant_name: string;
  pickup_address: string;
  dropoff_address: string;
  payout_cents: number;
  distance_km: number;
  distance_mi: string;
  expires_at: string;
  estimated_time: number;
}

interface OrderAssignmentModalProps {
  assignment: OrderAssignment | null;
  onAccept: (assignmentId: string) => void;
  onDecline: (assignmentId: string) => void;
  onExpire: () => void;
}

export const OrderAssignmentModal: React.FC<OrderAssignmentModalProps> = ({
  assignment,
  onAccept,
  onDecline,
  onExpire
}) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Play notification sound
  useEffect(() => {
    if (assignment) {
      playNotificationSound();
    }
  }, [assignment]);

  // Countdown timer
  useEffect(() => {
    if (!assignment) return;

    const expiresAt = new Date(assignment.expires_at);
    
    const timer = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(timer);
        onExpire();
        toast({
          title: "Order Expired",
          description: "You didn't respond in time. The order has been reassigned.",
          variant: "destructive",
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [assignment, onExpire, toast]);

  const playNotificationSound = () => {
    // Create multiple tones for a more attention-grabbing sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First tone
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    
    oscillator1.frequency.value = 800;
    gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.3);
    
    // Second tone
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.frequency.value = 1000;
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 0.3);
    }, 400);
  };

  const handleAccept = async () => {
    if (!assignment || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('order_assignments')
        .update({ 
          status: 'accepted',
          response_time_seconds: 30 - timeLeft
        })
        .eq('id', assignment.assignment_id);

      if (error) throw error;

      // Update order status
      await supabase
        .from('orders')
        .update({ 
          status: 'assigned',
          assigned_craver_id: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', assignment.order_id);

      onAccept(assignment.assignment_id);
      
      toast({
        title: "Order Accepted!",
        description: "Navigate to the pickup location to start your delivery.",
      });
    } catch (error) {
      console.error('Error accepting order:', error);
      toast({
        title: "Error",
        description: "Failed to accept order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!assignment || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('order_assignments')
        .update({ 
          status: 'declined',
          response_time_seconds: 30 - timeLeft
        })
        .eq('id', assignment.assignment_id);

      if (error) throw error;

      onDecline(assignment.assignment_id);
      
      toast({
        title: "Order Declined",
        description: "Looking for your next delivery opportunity.",
      });
    } catch (error) {
      console.error('Error declining order:', error);
      toast({
        title: "Error",
        description: "Failed to decline order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!assignment) return null;

  const formattedPayout = (assignment.payout_cents / 100).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">New Delivery Offer</CardTitle>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 text-destructive" />
            <Badge variant="destructive" className="animate-pulse">
              {timeLeft}s to respond
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Payout - Most prominent */}
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
              <DollarSign className="h-6 w-6" />
              {formattedPayout}
            </div>
            <p className="text-sm text-muted-foreground">Guaranteed earnings</p>
          </div>

          {/* Restaurant */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">Pickup from</span>
            </div>
            <div className="pl-6">
              <p className="font-semibold">{assignment.restaurant_name}</p>
              <p className="text-sm text-muted-foreground">{assignment.pickup_address}</p>
            </div>
          </div>

          {/* Delivery Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Drop off at</span>
            </div>
            <div className="pl-6">
              <p className="text-sm text-muted-foreground">{assignment.dropoff_address}</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Distance</p>
              <p className="font-semibold">{assignment.distance_mi} mi</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Est. Time</p>
              <p className="font-semibold">{assignment.estimated_time} min</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={isProcessing}
              className="w-full"
            >
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isProcessing}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isProcessing ? 'Accepting...' : 'Accept'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};