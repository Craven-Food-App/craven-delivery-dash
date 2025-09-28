import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { MapPin, Navigation, Clock } from 'lucide-react';

interface OrderMapPreviewProps {
  pickupAddress: any;
  dropoffAddress: any;
  routeInfo?: {
    miles: number;
    minutes: number;
  };
  className?: string;
}

export const OrderMapPreview: React.FC<OrderMapPreviewProps> = ({
  pickupAddress,
  dropoffAddress,
  routeInfo,
  className
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [routeData, setRouteData] = useState<any>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const initializeMap = async () => {
      try {
        // Get Mapbox token
        const { data } = await supabase.functions.invoke('get-mapbox-token');
        if (!data?.token) {
          console.error('Mapbox token not available');
          return;
        }

        mapboxgl.accessToken = data.token;

        // Helpers
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
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?limit=1&access_token=${data.token}`);
          const j = await res.json();
          const c = j?.features?.[0]?.center;
          return Array.isArray(c) && c.length === 2 ? [Number(c[0]), Number(c[1])] : null;
        };

        // Extract or geocode coordinates
        let pickupLat = Number(pickupAddress?.lat ?? pickupAddress?.latitude);
        let pickupLng = Number(pickupAddress?.lng ?? pickupAddress?.longitude);
        let dropoffLat = Number(dropoffAddress?.lat ?? dropoffAddress?.latitude);
        let dropoffLng = Number(dropoffAddress?.lng ?? dropoffAddress?.longitude);

        if ([pickupLat, pickupLng].some(isNaN)) {
          const g = await geocode(pickupAddress);
          if (g) { pickupLng = g[0]; pickupLat = g[1]; }
        }
        if ([dropoffLat, dropoffLng].some(isNaN)) {
          const g = await geocode(dropoffAddress);
          if (g) { dropoffLng = g[0]; dropoffLat = g[1]; }
        }

        if ([pickupLat, pickupLng, dropoffLat, dropoffLng].some(isNaN)) {
          console.error('Invalid or ungeocodable coordinates');
          return;
        }

        // Initialize map
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [pickupLng, pickupLat],
          zoom: 13,
          attributionControl: false,
          interactive: false // Make it non-interactive for preview
        });

        map.current.on('load', async () => {
          if (!map.current) return;

          // Add pickup marker
          new mapboxgl.Marker({ color: '#f97316' })
            .setLngLat([pickupLng, pickupLat])
            .addTo(map.current);

          // Add dropoff marker
          new mapboxgl.Marker({ color: '#22c55e' })
            .setLngLat([dropoffLng, dropoffLat])
            .addTo(map.current);

          // Fetch and display route
          try {
            const routeResponse = await fetch(
              `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupLng},${pickupLat};${dropoffLng},${dropoffLat}?geometries=geojson&access_token=${data.token}`
            );
            const routeResult = await routeResponse.json();

            if (routeResult.routes && routeResult.routes.length > 0) {
              const route = routeResult.routes[0];
              setRouteData({
                distance: (route.distance / 1609.34).toFixed(1), // Convert to miles
                duration: Math.round(route.duration / 60) // Convert to minutes
              });

              // Add route line
              map.current.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: route.geometry
                }
              });

              map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': '#3b82f6',
                  'line-width': 4,
                  'line-opacity': 0.8
                }
              });

              // Fit map to show both markers and route
              const bounds = new mapboxgl.LngLatBounds();
              bounds.extend([pickupLng, pickupLat]);
              bounds.extend([dropoffLng, dropoffLat]);
              
              map.current.fitBounds(bounds, {
                padding: 40,
                maxZoom: 15
              });
            }
          } catch (error) {
            console.error('Failed to fetch route:', error);
          }
        });

      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [pickupAddress, dropoffAddress]);

  const displayRouteInfo = routeInfo || routeData;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-48 bg-muted/20 relative"
      />
      
      {displayRouteInfo && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between text-sm mb-3">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{displayRouteInfo.miles} miles</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{displayRouteInfo.minutes} mins</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 mb-3">
            <div className="text-xs text-muted-foreground mb-1">Total Trip Distance</div>
            <div className="font-semibold text-lg text-foreground">
              {parseFloat(displayRouteInfo.miles).toFixed(1)} miles
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Includes commute to restaurant + delivery distance
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Pickup</span>
            </div>
            <div className="flex-1 mx-3 border-t border-dashed border-muted-foreground/30"></div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Dropoff</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};