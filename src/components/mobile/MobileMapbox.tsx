import React, { useEffect, useRef, useState } from 'react';
import { MAPBOX_CONFIG } from '@/config/mapbox';
import { useDriverLocation } from '@/hooks/useDriverLocation';

interface MobileMapboxProps {
  className?: string;
}

export const MobileMapbox: React.FC<MobileMapboxProps> = ({
  className = ""
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const { location } = useDriverLocation();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = () => {
      if (!(window as any).mapboxgl) {
        console.error('Mapbox GL JS not loaded');
        return;
      }

      // Set access token globally (required by Mapbox GL JS)
      (window as any).mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

      try {
        // Initialize map
        map.current = new (window as any).mapboxgl.Map({
          container: mapContainer.current,
          style: MAPBOX_CONFIG.style,
          center: [MAPBOX_CONFIG.center[0], MAPBOX_CONFIG.center[1]],
          zoom: MAPBOX_CONFIG.zoom
        });

        map.current.on('load', () => {
          console.log('Mapbox loaded successfully');
          setIsMapReady(true);
        });

        map.current.on('error', (e: any) => {
          console.error('Mapbox error:', e);
        });

        // Add driver marker
        marker.current = new (window as any).mapboxgl.Marker({
          color: '#ff6b35'
        })
          .setLngLat([MAPBOX_CONFIG.center[0], MAPBOX_CONFIG.center[1]])
          .addTo(map.current);
      } catch (error) {
        console.error('Error initializing Mapbox:', error);
      }
    };

    // Check if Mapbox GL JS is already loaded
    if ((window as any).mapboxgl) {
      initMap();
    } else {
      // Load Mapbox GL JS
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => {
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        initMap();
      };
      script.onerror = () => {
        console.error('Failed to load Mapbox GL JS');
      };
      document.head.appendChild(script);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update marker position when location changes
  useEffect(() => {
    if (marker.current && location) {
      marker.current.setLngLat([location.longitude, location.latitude]);
      if (map.current) {
        map.current.setCenter([location.longitude, location.latitude]);
      }
    }
  }, [location]);

  return (
    <div className={`w-full h-full ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMapbox;
