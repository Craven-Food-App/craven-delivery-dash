import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, DollarSign } from 'lucide-react';

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

interface SimpleMapProps {
  orders: Order[];
  activeOrder: Order | null;
  onOrderClick: (order: Order) => void;
}

const SimpleMap: React.FC<SimpleMapProps> = ({ orders, activeOrder, onOrderClick }) => {
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const loadMapboxScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.mapboxgl) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Mapbox'));
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    });
  };

  const initializeMap = async () => {
    if (!mapContainer.current || !mapboxToken.trim()) return;

    try {
      await loadMapboxScript();
      
      (window as any).mapboxgl.accessToken = mapboxToken;
      
      const map = new (window as any).mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-122.4194, 37.7749],
        zoom: 12,
      });

      map.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);

        // Add order markers
        const pendingOrders = orders.filter(order => order.status === 'pending');
        
        pendingOrders.forEach(order => {
          const markerEl = document.createElement('div');
          markerEl.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 50%;
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            background: ${order.payout_cents >= 1000 ? '#ef4444' : order.payout_cents >= 700 ? '#f97316' : '#eab308'};
          `;
          
          markerEl.textContent = `$${Math.round(order.payout_cents / 100)}`;
          
          markerEl.addEventListener('click', () => {
            onOrderClick(order);
          });

          new (window as any).mapboxgl.Marker(markerEl)
            .setLngLat([order.pickup_lng, order.pickup_lat])
            .addTo(map);
        });

        // Add user location if available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const userEl = document.createElement('div');
            userEl.style.cssText = `
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #3b82f6;
              border: 3px solid white;
              box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
            `;

            new (window as any).mapboxgl.Marker(userEl)
              .setLngLat([position.coords.longitude, position.coords.latitude])
              .addTo(map);

            map.easeTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 13
            });
          });
        }
      });

    } catch (error) {
      console.error('Map initialization failed:', error);
    }
  };

  const handleLoadMap = () => {
    if (!mapboxToken.trim()) return;
    setShowTokenInput(false);
    initializeMap();
  };

  if (showTokenInput) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Setup Your Map</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your Mapbox token to see orders on the map
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Get a free token at{' '}
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
          
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="pk.eyJ1Ijoi..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLoadMap()}
              className="bg-card"
            />
            <Button 
              onClick={handleLoadMap} 
              className="w-full"
              disabled={!mapboxToken.trim()}
            >
              Load Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

export default SimpleMap;