import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Package, ChevronRight, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  onAccept: (assignment: OrderAssignment) => void;
  onDecline: (assignment: OrderAssignment) => void;
}

export const OrderAssignmentModal: React.FC<OrderAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onAccept,
  onDecline
}) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen || !assignment) return;

    // Play notification sound sequence
    const playNotificationSequence = async () => {
      try {
        const audioContext = new AudioContext();
        const duration = 0.3;
        const gap = 0.15;
        
        for (let i = 0; i < 3; i++) {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
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

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, assignment]);

  const handleAccept = () => {
    if (assignment) {
      onAccept(assignment);
      toast({
        title: "Order Accepted!",
        description: "Navigate to the pickup location.",
      });
    }
  };

  const handleDecline = () => {
    if (assignment) {
      onDecline(assignment);
      toast({
        title: "Order Declined",
        description: "Looking for new offers...",
      });
    }
  };

  if (!isOpen || !assignment) return null;

  const estimatedPayout = (assignment.payout_cents / 100).toFixed(2);
  const totalMiles = parseFloat(assignment.distance_mi || '0');
  const totalStops = Math.floor(Math.random() * 3) + 2;
  const dropOffs = totalStops - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={handleDecline} />
      
      {/* Modal Content */}
      <div className="relative w-full bg-card rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out animate-in slide-in-from-bottom-full">
        {/* Timer Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-t-3xl overflow-hidden">
          <div 
            className="h-full bg-orange-500 transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 15) * 100}%` }}
          />
        </div>

        <div className="p-6 pb-8">
          {/* Get offers until section */}
          <div className="text-center mb-6">
            <div className="bg-muted/50 rounded-full px-4 py-2 inline-block">
              <span className="text-sm text-muted-foreground mr-2">Get offers until</span>
              <span className="text-sm font-semibold text-foreground bg-card px-3 py-1 rounded-full border">
                9:00 PM
              </span>
            </div>
          </div>

          {/* Main offer content */}
          <div className="space-y-6">
            {/* Payout and details */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">${estimatedPayout}</span>
                  <span className="text-lg text-muted-foreground">estimate</span>
                </div>
                <div className="text-muted-foreground mt-1">
                  <span className="font-semibold">{totalStops} stops</span>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">{totalMiles} miles</span>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">{assignment.estimated_time} mins</span>
                </div>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Pickup info */}
            <div className="flex items-center gap-4 py-4 border-b border-border/50">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">ASAP</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-semibold text-foreground">Pickup</span>
                </div>
                <p className="text-muted-foreground">{assignment.restaurant_name || assignment.pickup_address}</p>
              </div>
            </div>

            {/* Drop-offs */}
            <div className="flex items-center gap-4 py-2">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{dropOffs} drop-offs</p>
              </div>
            </div>

            {/* Delivery type */}
            <div className="py-2">
              <div className="bg-muted/30 rounded-lg px-4 py-3">
                <span className="text-sm text-muted-foreground">Apartment</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleDecline}
                variant="secondary"
                className="flex-1 h-14 text-lg font-semibold bg-muted hover:bg-muted/80 text-muted-foreground rounded-2xl"
              >
                REJECT
              </Button>
              <Button
                onClick={handleAccept}
                className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl shadow-lg"
              >
                ACCEPT
              </Button>
            </div>

            {/* Timer display */}
            <div className="text-center pt-2">
              <span className="text-sm text-muted-foreground">
                Auto-decline in {timeLeft}s
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};