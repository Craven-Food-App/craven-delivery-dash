import React, { useEffect, useState } from 'react';
import { ChevronRight, Users, MapPin, Clock, DollarSign, Navigation2, X, Package, Phone, MessageSquare, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryMap } from './DeliveryMap';
import { 
  DeliveryCard, 
  DeliveryButton, 
  DeliveryHeader, 
  DeliveryInfoCard, 
  DeliveryActionGroup,
  DeliveryDivider,
  DeliveryMapContainer,
  typography 
} from '@/components/delivery/DeliveryDesignSystem';

interface OrderAssignment {
  assignment_id: string;
  order_id: string;
  restaurant_name: string;
  pickup_address: any; 
  dropoff_address: any; 
  payout_cents: number;
  distance_km: number;
  distance_mi: string;
  expires_at: string;
  estimated_time: number;
  isTestOrder?: boolean;
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
  const [timeLeft, setTimeLeft] = useState(45);
  const { toast } = useToast();

  // Earnings + routing state
  const [payoutPercent, setPayoutPercent] = useState<number>(70);
  const [subtotalCents, setSubtotalCents] = useState<number>(0);
  const [tipCents, setTipCents] = useState<number>(0);
  const [routeMiles, setRouteMiles] = useState<number | null>(null);
  const [routeMins, setRouteMins] = useState<number | null>(null);
  const [locationType, setLocationType] = useState<string | null>(null);

  // Load payout settings and order details
  useEffect(() => {
    if (!isOpen || !assignment) return;

    const run = async () => {
      try {
        // Get active payout percentage
        const { data: setting } = await supabase
          .from('driver_payout_settings')
          .select('percentage')
          .eq('is_active', true)
          .maybeSingle();
        if (setting?.percentage != null) setPayoutPercent(Number(setting.percentage));

        // Get order details
        const { data: order } = await supabase
          .from('orders')
          .select('subtotal_cents, tip_cents, dropoff_address, pickup_address')
          .eq('id', assignment.order_id)
          .maybeSingle();

        if (order) {
          setSubtotalCents(Number(order.subtotal_cents || 0));
          setTipCents(Number(order.tip_cents || 0));

          const dAddr: any = order.dropoff_address;
          const type = dAddr?.type || dAddr?.address_type || dAddr?.location_type || null;
          if (type) setLocationType(String(type));
        }
      } catch (e) {
        console.warn('Order detail fetch failed', e);
      }
    };

    run();
  }, [isOpen, assignment]);

  // Mapbox route fetch
  useEffect(() => {
    if (!isOpen || !assignment) return;
    let canceled = false;

    const fetchRoute = async () => {
      try {
        const pAddr: any = assignment.pickup_address;
        const dAddr: any = assignment.dropoff_address;

        const tokRes = await supabase.functions.invoke('get-mapbox-token');
        const token = (tokRes.data as any)?.token;
        if (!token) return;

        const buildAddress = (addr: any) => {
          if (!addr) return '';
          if (typeof addr === 'string') return addr;
          if (addr.address) return addr.address;
          const parts = [addr.street, addr.city, addr.state, addr.zip_code].filter(Boolean);
          return parts.join(', ');
        };

        const geocode = async (addr: any): Promise<[number, number] | null> => {
          const q = buildAddress(addr);
          if (!q) return null;
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?limit=1&access_token=${token}`);
          const j = await res.json();
          const c = j?.features?.[0]?.center;
          return Array.isArray(c) && c.length === 2 ? [Number(c[0]), Number(c[1])] : null;
        };

        let pLat = Number(pAddr?.lat ?? pAddr?.latitude);
        let pLng = Number(pAddr?.lng ?? pAddr?.longitude);
        let dLat = Number(dAddr?.lat ?? dAddr?.latitude);
        let dLng = Number(dAddr?.lng ?? dAddr?.longitude);

        if ([pLat, pLng].some(isNaN)) {
          const g = await geocode(pAddr);
          if (g) { pLng = g[0]; pLat = g[1]; }
        }
        if ([dLat, dLng].some(isNaN)) {
          const g = await geocode(dAddr);
          if (g) { dLng = g[0]; dLat = g[1]; }
        }

        if ([pLat, pLng, dLat, dLng].some(isNaN)) return;

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

        if (!canceled && route) {
          setRouteMiles(Number((route.distance / 1609.34).toFixed(1)));
          setRouteMins(Math.round(route.duration / 60));
        }
      } catch (e) {
        console.warn('Route fetch failed', e);
      }
    };

    fetchRoute();
    return () => { canceled = true; };
  }, [isOpen, assignment]);

  // Countdown timer and notification sound
  useEffect(() => {
    if (!isOpen || !assignment) return;

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
        console.log('Notification sound failed:', e);
      }
    };

    playNotificationSequence();
    setTimeLeft(45);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
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
      toast({ title: "Order Accepted!", description: "Navigate to the pickup location." });
    }
  };

  const handleDecline = () => {
    if (assignment) {
      onDecline(assignment);
      toast({ title: "Order Declined", description: "Looking for new offers..." });
    }
  };

  if (!isOpen || !assignment) return null;

  const estimatedPayout = (((payoutPercent / 100) * subtotalCents + tipCents) / 100).toFixed(2);
  const milesParsed = parseFloat(assignment.distance_mi || '0') || 0;
  const miles = routeMiles ?? milesParsed;
  const mins = routeMins ?? (assignment.estimated_time || 0);

  const formatAddress = (addr: any): string => {
    if (typeof addr === 'string') return addr;
    if (addr?.address) return addr.address;
    const parts = [addr?.street, addr?.city, addr?.state].filter(Boolean);
    return parts.join(', ') || 'Address unavailable';
  };

  const getCustomerName = () => {
    if (typeof assignment.dropoff_address === 'object' && assignment.dropoff_address?.name) {
      return assignment.dropoff_address.name;
    }
    return 'Customer';
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-md mx-4 mb-4 max-h-[90vh] overflow-y-auto">
        {/* Professional Header */}
        <DeliveryHeader
          title="New Delivery Request"
          subtitle={`Order #${assignment.order_id.slice(-6)}`}
          onBack={handleDecline}
          rightAction={
            <button
              onClick={handleDecline}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          }
        />

        {/* Timer Alert */}
        <div className="px-4 py-3 bg-red-50 border-b border-red-100">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="h-5 w-5 text-red-600" />
            <span className="text-red-700 font-semibold">
              {timeLeft}s remaining to accept
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Test Order Badge */}
          {assignment.isTestOrder && (
            <DeliveryCard className="bg-yellow-50 border-yellow-200">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🧪</span>
                <div>
                  <h3 className="font-semibold text-yellow-900">Test Order</h3>
                  <p className="text-sm text-yellow-700">This is a test order for training purposes.</p>
                </div>
              </div>
            </DeliveryCard>
          )}

          {/* Map Section */}
          <DeliveryCard variant="elevated" padding="none" className="overflow-hidden">
            <DeliveryMapContainer>
              <DeliveryMap 
                pickupAddress={assignment.pickup_address}
                dropoffAddress={assignment.dropoff_address}
                showRoute={true}
                className="w-full h-full"
              />
            </DeliveryMapContainer>
          </DeliveryCard>

          {/* Pickup Information */}
          <DeliveryInfoCard
            title="Pickup Location"
            subtitle={assignment.restaurant_name}
            icon={Package}
          >
            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600 leading-relaxed">
                {formatAddress(assignment.pickup_address)}
              </p>
            </div>
          </DeliveryInfoCard>

          {/* Delivery Information */}
          <DeliveryInfoCard
            title="Delivery Location"
            subtitle={getCustomerName()}
            icon={Users}
          >
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600 leading-relaxed">
                  {formatAddress(assignment.dropoff_address)}
                </p>
              </div>
              
              {/* Location Type Badge */}
              {locationType && (
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded-full">
                    {locationType}
                  </span>
                </div>
              )}
            </div>
          </DeliveryInfoCard>

          {/* Route Information */}
          <DeliveryCard variant="filled">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{miles}</div>
                <div className="text-sm text-gray-500 font-medium">Distance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{mins}</div>
                <div className="text-sm text-gray-500 font-medium">Est. Time</div>
              </div>
            </div>
            
            {/* Route Details */}
            {routeMiles && routeMins && (
              <DeliveryDivider />
            )}
            {routeMiles && routeMins && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Actual route: {routeMiles.toFixed(1)} mi • {routeMins} min
                </p>
              </div>
            )}
          </DeliveryCard>

          {/* Earnings Section */}
          <DeliveryCard variant="elevated" className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-orange-900">Your Earnings</h3>
                <p className="text-sm text-orange-600">Base pay + tips</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-900">
                  ${estimatedPayout}
                </div>
                <div className="text-sm text-orange-600">
                  {payoutPercent}% of delivery fee
                </div>
              </div>
            </div>
            
            {/* Earnings Breakdown */}
            <DeliveryDivider />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Subtotal:</span>
                <span className="float-right font-medium">${(subtotalCents / 100).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Tips:</span>
                <span className="float-right font-medium">${(tipCents / 100).toFixed(2)}</span>
              </div>
            </div>
          </DeliveryCard>

          {/* Action Buttons */}
          <DeliveryActionGroup
            primaryAction={{
              children: "Accept Delivery",
              onClick: handleAccept,
              icon: <Package className="w-5 h-5" />,
              className: "shadow-lg"
            }}
            secondaryAction={{
              children: "Decline",
              onClick: handleDecline,
              icon: <X className="w-5 h-5" />
            }}
          />
        </div>
      </div>
    </div>
  );
};
