// @ts-nocheck
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
      <DialogContent className="sm:max-w-md mx-4 rounded-3xl p-0 border-4 border-orange-400 bg-gradient-to-b from-orange-50 to-white shadow-2xl animate-pulse">
        {/* Urgent Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
              <h2 className="text-xl font-bold">🚨 NEW DELIVERY OFFER</h2>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full">
              <span className="font-bold text-lg">{timeLeft}s</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Prominent Earnings Display */}
          <div className="text-center bg-green-500 text-white p-6 rounded-2xl shadow-lg">
            <div className="text-sm opacity-90 mb-1">Total Estimated Earnings</div>
            <div className="text-5xl font-bold">${payout}</div>
            <div className="text-sm opacity-90">Including tip estimate</div>
          </div>

          {/* Restaurant Info */}
          <div className="text-center border-b pb-4">
            <h3 className="text-2xl font-bold text-gray-800">{assignment.restaurant_name}</h3>
            <p className="text-gray-600 font-medium">{assignment.pickup_address}</p>
          </div>

          {/* Delivery Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl text-center border-2 border-blue-200">
              <div className="text-blue-600 font-bold text-xl">{assignment.distance_mi} mi</div>
              <div className="text-sm text-blue-700">Distance</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl text-center border-2 border-purple-200">
              <div className="text-purple-600 font-bold text-xl">{assignment.estimated_time} min</div>
              <div className="text-sm text-purple-700">Est. Time</div>
            </div>
          </div>

          {/* Dropoff Location */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-gray-700">Drop-off Location:</span>
            </div>
            <p className="text-gray-800 font-medium">{assignment.dropoff_address}</p>
          </div>

          {/* Large Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1 h-16 text-lg font-bold border-2 border-red-300 text-red-600 hover:bg-red-50" 
              onClick={handleDecline}
              disabled={isDeclining || isAccepting}
            >
              {isDeclining ? 'Declining...' : '❌ DECLINE'}
            </Button>
            <Button 
              className="flex-1 h-16 text-lg font-bold bg-green-500 hover:bg-green-600 text-white shadow-lg" 
              onClick={handleAccept}
              disabled={isAccepting || isDeclining}
            >
              {isAccepting ? 'Accepting...' : '✅ ACCEPT OFFER'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};