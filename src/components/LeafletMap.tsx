import React, { useEffect, useRef, useState } from 'react';
import { DollarSign } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Order {
  id: string;
  pickup_name: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_name: string;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  payout_cents: number;
  distance_km: number;
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
  assigned_craver_id?: string | null;
}

interface LeafletMapProps {
  orders: Order[];
  activeOrder: Order | null;
  onOrderClick: (order: Order) => void;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ orders, activeOrder, onOrderClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const userLocationMarker = useRef<L.Marker | null>(null);
  const watchId = useRef<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current).setView([37.7749, -122.4194], 12);

    // Add OpenStreetMap tiles (completely free, no API key needed)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current);

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Set map as loaded after a short delay since Leaflet doesn't have a clear 'load' event
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Location tracking effect
  useEffect(() => {
    if (!navigator.geolocation || !map.current) return;

    const createUserLocationMarker = (lat: number, lng: number) => {
      const userIcon = L.divIcon({
        html: `
          <div style="
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #3b82f6;
            border: 3px solid white;
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
            animation: pulse 2s infinite;
          "></div>
          <style>
            @keyframes pulse {
              0% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); }
              50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.8); }
              100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); }
            }
          </style>
        `,
        className: 'user-location-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      return L.marker([lat, lng], { icon: userIcon });
    };

    const updateUserLocation = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });

      if (!map.current) return;

      // Remove existing user location marker
      if (userLocationMarker.current) {
        map.current.removeLayer(userLocationMarker.current);
      }

      // Add new user location marker
      userLocationMarker.current = createUserLocationMarker(latitude, longitude);
      userLocationMarker.current.addTo(map.current);

      // Center on user location only on first load
      if (!userLocation) {
        map.current.setView([latitude, longitude], 15);
      }
    };

    const handleLocationError = (error: GeolocationPositionError) => {
      console.warn('Location tracking error:', error.message);
    };

    // Start watching user location
    watchId.current = navigator.geolocation.watchPosition(
      updateUserLocation,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      if (userLocationMarker.current && map.current) {
        map.current.removeLayer(userLocationMarker.current);
        userLocationMarker.current = null;
      }
    };
  }, [map.current, userLocation]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing order markers (but preserve user location marker)
    map.current.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer !== userLocationMarker.current) {
        map.current?.removeLayer(layer);
      }
    });

    // Add order markers
    const pendingOrders = orders.filter(order => order.status === 'pending');
    
    pendingOrders.forEach(order => {
      if (!map.current) return;

      // Create custom icon based on payout
      const payoutAmount = Math.round(order.payout_cents / 100);
      const color = order.payout_cents >= 1000 ? '#ef4444' : 
                   order.payout_cents >= 700 ? '#f97316' : '#eab308';

      const customIcon = L.divIcon({
        html: `
          <div style="
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: ${color};
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
          ">
            $${payoutAmount}
          </div>
        `,
        className: 'custom-order-marker',
        iconSize: [50, 50],
        iconAnchor: [25, 25]
      });

      const marker = L.marker([order.pickup_lat, order.pickup_lng], { 
        icon: customIcon 
      }).addTo(map.current);

      marker.on('click', () => {
        onOrderClick(order);
      });

      // Add popup with order details
      marker.bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold text-sm">${order.pickup_name}</h3>
          <p class="text-xs text-gray-600">${order.pickup_address}</p>
          <p class="text-sm font-medium text-green-600 mt-1">$${payoutAmount} • ${order.distance_km.toFixed(1)}km</p>
        </div>
      `);
    });
  }, [orders, onOrderClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Order Summary Overlay */}
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-medium">{orders.filter(o => o.status === 'pending').length} orders available</span>
        </div>
      </div>
    </div>
  );
};

export default LeafletMap;