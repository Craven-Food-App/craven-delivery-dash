import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface MapProps {
  orders: Order[];
  activeOrder: Order | null;
  onOrderClick: (order: Order) => void;
}

const Map: React.FC<MapProps> = ({ orders, activeOrder, onOrderClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [tokenSet, setTokenSet] = useState(false);
  const { toast } = useToast();

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-122.4194, 37.7749], // San Francisco
      zoom: 12,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          new mapboxgl.Marker({ color: '#3b82f6' })
            .setLngLat([longitude, latitude])
            .setPopup(
              new mapboxgl.Popup().setHTML('<div>Your Location</div>')
            )
            .addTo(map.current!);

          map.current!.setCenter([longitude, latitude]);
        },
        (error) => {
          console.warn('Location access denied', error);
        }
      );
    }
  };

  useEffect(() => {
    if (tokenSet) {
      initializeMap();
    }

    return () => {
      map.current?.remove();
    };
  }, [tokenSet, mapboxToken]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.order-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add order markers
    orders.forEach(order => {
      if (order.status === 'pending') {
        const el = document.createElement('div');
        el.className = 'order-marker';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#ef4444';
        el.style.cursor = 'pointer';
        el.style.border = '2px solid white';

        el.addEventListener('click', () => onOrderClick(order));

        new mapboxgl.Marker(el)
          .setLngLat([order.pickup_lng, order.pickup_lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">${order.pickup_name}</h3>
                <p class="text-sm">${order.pickup_address}</p>
                <p class="text-sm font-medium">$${(order.payout_cents / 100).toFixed(2)}</p>
              </div>
            `)
          )
          .addTo(map.current!);
      }
    });

    // Add active order markers
    if (activeOrder) {
      // Pickup marker
      new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat([activeOrder.pickup_lng, activeOrder.pickup_lat])
        .setPopup(
          new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">Pickup: ${activeOrder.pickup_name}</h3>
              <p class="text-sm">${activeOrder.pickup_address}</p>
            </div>
          `)
        )
        .addTo(map.current);

      // Dropoff marker
      new mapboxgl.Marker({ color: '#8b5cf6' })
        .setLngLat([activeOrder.dropoff_lng, activeOrder.dropoff_lat])
        .setPopup(
          new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">Dropoff: ${activeOrder.dropoff_name}</h3>
              <p class="text-sm">${activeOrder.dropoff_address}</p>
            </div>
          `)
        )
        .addTo(map.current);
    }
  }, [orders, activeOrder, onOrderClick]);

  const handleTokenSubmit = () => {
    if (!mapboxToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Mapbox token",
        variant: "destructive",
      });
      return;
    }
    
    setTokenSet(true);
    toast({
      title: "Success",
      description: "Map loaded successfully",
    });
  };

  if (!tokenSet) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/20 rounded-lg">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Mapbox Token Required</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
          Please enter your Mapbox public token to load the map. 
          Get your token from <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
        </p>
        <div className="flex gap-2 w-full max-w-md">
          <Input
            placeholder="Enter Mapbox public token"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTokenSubmit()}
          />
          <Button onClick={handleTokenSubmit}>Load Map</Button>
        </div>
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full h-full rounded-lg" />;
};

export default Map;