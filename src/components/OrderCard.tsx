import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Clock, DollarSign } from 'lucide-react';

// ⚠️ ASSUMPTION: You have a custom component that handles Mapbox rendering.
// You would replace 'MapComponent' with your actual Mapbox wrapper component.
interface MapProps {
  centerLat: number;
  centerLng: number;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}

// 📌 Placeholder for your actual Mapbox wrapper component 
// (which gets the API key from Lovable.dev's global config).
const MapComponent: React.FC<MapProps> = ({ centerLat, centerLng, pickupLat, pickupLng, dropoffLat, dropoffLng }) => {
  // In a real Lovable.dev project, this component handles Mapbox initialization
  // and drawing based on the props, using the globally provided API key.
  
  // The structure below mimics the orange-themed map from the image.
  return (
    <div 
      style={{
        width: '100%', 
        height: '100%', 
        backgroundColor: '#d8e4f1', // Light blue/gray map background
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Visual Placeholder for the Route Line (Orange) */}
      <div 
        style={{
          position: 'absolute', 
          top: '50%', 
          left: '10%', 
          width: '80%', 
          height: '4px', 
          backgroundColor: '#F97316', // Orange-600
          borderRadius: '2px', 
          opacity: 0.6
        }}
      />
      
      {/* Pickup Marker (Green) */}
      <div 
        style={{
          position: 'absolute', 
          top: '45%', 
          left: '20%', 
          width: '16px', 
          height: '16px', 
          borderRadius: '50%', 
          backgroundColor: '#10B981', // Green-500
          border: '3px solid white', 
          boxShadow: '0 0 5px rgba(0,0,0,0.3)'
        }} 
      />
      
      {/* Dropoff Marker (Orange Pin SVG) */}
      <svg 
        viewBox="0 0 24 24" 
        style={{
          position: 'absolute', 
          top: '35%', 
          left: '75%', 
          width: '28px', 
          height: '28px', 
          color: '#F97316', // Orange-600
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
        }}
      >
        <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    </div>
  );
};


interface Order {
  id: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  payout_cents: number;
  delivery_payout_cents: number;
  extra_earnings_cents: number;
  distance_km: number;
  num_stops: number;
  estimated_time_mins: number;
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
}

interface OrderCardProps {
  order: Order;
  variant: 'available';
  onAccept?: (order: Order) => void;
  onReject?: (order: Order) => void;
}

// Helper to format currency
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// Helper to calculate the center for the map view
const calculateCenter = (lat1: number, lng1: number, lat2: number, lng2: number) => ({
  latitude: (lat1 + lat2) / 2,
  longitude: (lng1 + lng2) / 2,
});

// Helper to format time (e.g., 1 hr, 37 mins)
const formatTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let timeString = '';
  if (hours > 0) {
    timeString += `${hours} hr`;
    if (hours > 1) timeString += 's';
  }
  if (minutes > 0) {
    if (hours > 0) timeString += ', ';
    timeString += `${minutes} min`;
  }
  return timeString || '0 mins';
};


const OrderCard: React.FC<OrderCardProps> = ({ order, variant, onAccept, onReject }) => {
  const center = calculateCenter(order.pickup_lat, order.pickup_lng, order.dropoff_lat, order.dropoff_lng);

  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg rounded-xl overflow-hidden bg-white mt-4">

      {/* Map Component integrated here */}
      <div className="w-full h-48 relative">
        <MapComponent
          centerLat={center.latitude}
          centerLng={center.longitude}
          pickupLat={order.pickup_lat}
          pickupLng={order.pickup_lng}
          dropoffLat={order.dropoff_lat}
          dropoffLng={order.dropoff_lng}
        />
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Stops, Miles, Time */}
        <div className="flex justify-between items-center text-gray-700 text-sm font-semibold border-b pb-4">
          <span>
            <span className="font-bold">{order.num_stops}</span> stops
          </span>
          <span className="mx-2">•</span>
          <span>
            <span className="font-bold">{(order.distance_km * 0.621371).toFixed(1)}</span> miles
          </span>
          <span className="mx-2">•</span>
          <span>
            <span className="font-bold">{formatTime(order.estimated_time_mins)}</span>
          </span>
        </div>

        {/* Just for you section (Countdown Timer Area) */}
        <div className="flex items-center justify-between bg-orange-50 px-3 py-2 rounded-lg">
          <span className="font-semibold text-lg text-orange-700">Just for you</span>
          {/* Countdown Timer Circle */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="100, 100"
              />
              <path
                className="text-orange-500" // Orange progress line
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDashoffset="75" 
              />
            </svg>
            <span className="absolute text-xs font-medium text-orange-700">0:25</span>
          </div>
        </div>

        {/* Estimated Total section */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-2xl font-bold text-gray-800">
            <span>Estimated Total</span>
            <span>{formatCurrency(order.payout_cents)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Delivery</span>
            <span>{formatCurrency(order.delivery_payout_cents)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Extra Earnings</span>
            <span>{formatCurrency(order.extra_earnings_cents)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {variant === 'available' && onReject && (
            <Button
              onClick={() => onReject(order)}
              variant="outline"
              // Orange outline styles
              className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
            >
              REJECT
            </Button>
          )}
          {variant === 'available' && onAccept && (
            <Button
              onClick={() => onAccept(order)}
              // Solid orange button
              className="flex-1 bg-orange-500 text-white hover:bg-orange-600"
            >
              ACCEPT
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;