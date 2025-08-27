import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, DollarSign, Route } from 'lucide-react';
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
  isOpen: boolean;
  onClose: () => void;
  assignment: OrderAssignment | null;
  onAccept?: (assignment: OrderAssignment) => void;
  onDecline?: (assignment: OrderAssignment) => void;
}

export const OrderAssignmentModal: React.FC<OrderAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onAccept,
  onDecline
}) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  // Play notification sound when modal opens
  useEffect(() => {
    if (isOpen && assignment) {
      // Play a longer notification sound with multiple beeps
      const playNotificationSequence = async () => {
        try {
          // Create multiple beep tones for a longer notification
          const audioContext = new AudioContext();
          const duration = 0.3; // Each beep duration
          const gap = 0.15; // Gap between beeps
          
          for (let i = 0; i < 3; i++) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Alternating high and low tones for urgency
            oscillator.frequency.setValueAtTime(i % 2 === 0 ? 800 : 600, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
            
            const startTime = audioContext.currentTime + (i * (duration + gap));
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
          }
        } catch (e) {
          console.log('Could not play notification sound:', e);
        }
      };
      
      playNotificationSequence();
    }
  }, [isOpen, assignment]);

  useEffect(() => {
    if (!isOpen || !assignment) return;

    const calculateTimeLeft = () => {
      const expiresAt = new Date(assignment.expires_at);
      const now = new Date();
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      return diff;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        handleDecline(); // Auto-decline when time expires
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, assignment]);

  const handleAccept = async () => {
    if (!assignment) return;
    
    setIsAccepting(true);
    try {
      // Update assignment status to accepted
      const { error: assignmentError } = await supabase
        .from('order_assignments')
        .update({ 
          status: 'accepted',
          response_time_seconds: 30 - timeLeft
        })
        .eq('id', assignment.assignment_id);

      if (assignmentError) throw assignmentError;

      // Update order status and assign to driver
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'assigned',
          assigned_craver_id: user.id
        })
        .eq('id', assignment.order_id);

      if (orderError) throw orderError;

      console.log('✅ Order accepted successfully');
      
      // Notify parent component
      if (onAccept && assignment) {
        onAccept(assignment);
      }
      
      onClose();
      
    } catch (error) {
      console.error('Error accepting order:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!assignment) return;
    
    setIsDeclining(true);
    try {
      // Update assignment status to declined
      const { error } = await supabase
        .from('order_assignments')
        .update({ 
          status: 'declined',
          response_time_seconds: 30 - timeLeft
        })
        .eq('id', assignment.assignment_id);

      if (error) throw error;

      console.log('❌ Order declined');
      
      // Notify parent component
      if (onDecline && assignment) {
        onDecline(assignment);
      }
      
      onClose();
      
    } catch (error) {
      console.error('Error declining order:', error);
    } finally {
      setIsDeclining(false);
    }
  };

  if (!assignment) return null;

  const payout = (assignment.payout_cents / 100).toFixed(2);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-lg">
        <div className="p-4">
          {/* Header with timer */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">New Delivery Offer</h2>
            <div className="flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full">
              <Clock className="h-4 w-4" />
              <span className="font-bold">{timeLeft}s</span>
            </div>
          </div>

          {/* Restaurant Info */}
          <div className="mb-4">
            <h3 className="font-semibold text-lg">{assignment.restaurant_name}</h3>
          </div>

          {/* Pickup & Dropoff */}
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 bg-primary rounded-full mt-2" />
              <div>
                <p className="text-sm text-muted-foreground">Pickup</p>
                <p className="font-medium">{assignment.pickup_address}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-destructive mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Dropoff</p>
                <p className="font-medium">{assignment.dropoff_address}</p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-3 bg-accent rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="h-4 w-4 text-success" />
                <span className="font-bold text-lg text-success">${payout}</span>
              </div>
              <p className="text-xs text-muted-foreground">Payout</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Route className="h-4 w-4" />
                <span className="font-bold">{assignment.distance_mi} mi</span>
              </div>
              <p className="text-xs text-muted-foreground">Distance</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-bold">{assignment.estimated_time} min</span>
              </div>
              <p className="text-xs text-muted-foreground">Est. Time</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleDecline}
              disabled={isDeclining || isAccepting}
            >
              {isDeclining ? 'Declining...' : 'Decline'}
            </Button>
            <Button 
              className="flex-1 bg-success hover:bg-success/90" 
              onClick={handleAccept}
              disabled={isAccepting || isDeclining}
            >
              {isAccepting ? 'Accepting...' : 'Accept'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};