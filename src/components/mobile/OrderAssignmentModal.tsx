import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronRight, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import cravenC from '@/assets/craven-c.png';
interface OrderAssignment {
  assignment_id: string;
  order_id: string;
  restaurant_name: string;
  pickup_address: any; // JSON address object or string
  dropoff_address: any; // JSON address object or string
  payout_cents: number;
  distance_km: number;
  distance_mi: string;
  expires_at: string;
  estimated_time: number;
  isTestOrder?: boolean; // Add test order flag
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

  // Earnings + routing state
  const [payoutPercent, setPayoutPercent] = useState<number>(70);
  const [subtotalCents, setSubtotalCents] = useState<number>(0);
  const [tipCents, setTipCents] = useState<number>(0);
  const [routeMiles, setRouteMiles] = useState<number | null>(null);
  const [routeMins, setRouteMins] = useState<number | null>(null);
  const [locationType, setLocationType] = useState<string | null>(null);

  // Load payout setting + order fields + real distance via Mapbox
  useEffect(() => {
    const run = async () => {
      if (!assignment) return;
      try {
        // Payout percent
        const { data: setting } = await supabase
          .from('driver_payout_settings')
          .select('percentage')
          .eq('is_active', true)
          .maybeSingle();
        if (setting?.percentage != null) setPayoutPercent(Number(setting.percentage));

        // Order details for tip/subtotal + dropoff type
        const { data: order } = await supabase
          .from('orders')
          .select('subtotal_cents, tip_cents, dropoff_address, pickup_address')
          .eq('id', assignment.order_id)
          .maybeSingle();
        if (order) {
          setSubtotalCents(Number(order.subtotal_cents || 0));
          setTipCents(Number(order.tip_cents || 0));
          const dAddr: any = order.dropoff_address as any;
          const pAddr: any = order.pickup_address as any;
          const type = dAddr?.type || dAddr?.address_type || dAddr?.location_type || null;
          if (type) setLocationType(String(type));

          // Compute real route using Mapbox if we have coords
          const p = pAddr;
          const d = dAddr;
          const pLat = Number(p?.lat ?? p?.latitude);
          const pLng = Number(p?.lng ?? p?.longitude);
          const dLat = Number(d?.lat ?? d?.latitude);
          const dLng = Number(d?.lng ?? d?.longitude);

          if (!isNaN(pLat) && !isNaN(pLng) && !isNaN(dLat) && !isNaN(dLng)) {
            // Fetch token
            const tokRes = await supabase.functions.invoke('get-mapbox-token');
            const token = (tokRes.data as any)?.token;

            // Try to include driver current position first
            let originLat: number | null = null;
            let originLng: number | null = null;
            try {
              const position = await new Promise<GeolocationPosition>((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
              );
              originLat = position.coords.latitude;
              originLng = position.coords.longitude;
            } catch (_) {}

            const coords = originLat && originLng
              ? `${originLng},${originLat};${pLng},${pLat};${dLng},${dLat}`
              : `${pLng},${pLat};${dLng},${dLat}`;

            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}.json?overview=false&access_token=${token}`;
            const res = await fetch(url);
            const json = await res.json();
            const route = json?.routes?.[0];
            if (route) {
              const miles = (route.distance / 1609.34);
              const mins = (route.duration / 60);
              setRouteMiles(Number(miles.toFixed(1)));
              setRouteMins(Math.round(mins));
            }
          }
        }
      } catch (e) {
        console.warn('Estimate prep failed', e);
      }
    };
    if (isOpen) run();
  }, [isOpen, assignment]);

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

  // Estimated payout: percentage of subtotal + projected tip
  const estimatedPayout = (((payoutPercent / 100) * subtotalCents + tipCents) / 100).toFixed(2);
  const miles = routeMiles ?? (parseFloat(assignment.distance_mi || '0') || 0);
  const mins = routeMins ?? assignment.estimated_time;
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
          {/* Test Order Alert */}
          {assignment.isTestOrder && (
            <div className="mb-4 p-4 bg-orange-100 border border-orange-300 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🧪</span>
                <span className="font-bold text-orange-800">Test Order</span>
              </div>
              <p className="text-sm text-orange-700">
                This is a test order from Crave'N for testing purposes. 
                Thank you for helping us improve our service!
              </p>
            </div>
          )}

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
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/60 overflow-hidden">
                <img src={cravenC} alt="Crave'N" className="w-6 h-6 object-contain" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">ASAP</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-semibold text-foreground">Pickup</span>
                </div>
                <p className="text-muted-foreground">
                  {typeof assignment.pickup_address === 'string' 
                    ? assignment.pickup_address 
                    : `${assignment.pickup_address?.street || ''} ${assignment.pickup_address?.city || ''}`.trim()
                  }
                </p>
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
                className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-2xl shadow-lg"
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
