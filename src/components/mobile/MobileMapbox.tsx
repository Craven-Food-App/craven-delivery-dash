import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    mapboxgl: any;
  }
}

interface MobileMapboxProps {
  className?: string;
}

export const MobileMapbox: React.FC<MobileMapboxProps> = ({ className = "" }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const scriptLoaded = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeMap = () => {
    if (!mapContainer.current || !window.mapboxgl) {
      console.log('MapContainer or mapboxgl not available');
      return;
    }

    try {
      console.log('Initializing Mapbox map...');
      
      // Set the access token
      window.mapboxgl.accessToken = 'pk.eyJ1IjoiY3JhdmUtbiIsImEiOiJjbWZpbXN4NmUwMG0wMmpxNDNkc2lmNWhiIn0._lEfvdpBUJpz-RYDV02ZAA';

      // Create the map instance
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-74.5, 40], // Starting position: [longitude, latitude]
        zoom: 9 // Starting zoom level
      });

      // Add navigation controls
      map.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

      // Handle map load events
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setIsLoading(false);
        setError(null);
      });

      map.current.on('error', (e: any) => {
        console.error('Map error:', e);
        setError('Failed to load map');
        setIsLoading(false);
      });

    } catch (err: any) {
      console.error('Error initializing map:', err);
      setError(err.message || 'Failed to initialize map');
      setIsLoading(false);
    }
  };

  const loadMapboxResources = () => {
    if (scriptLoaded.current) {
      initializeMap();
      return;
    }

    console.log('Loading Mapbox resources...');

    // Load Mapbox CSS
    const link = document.createElement('link');
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Load Mapbox JS
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js';
    script.onload = () => {
      console.log('Mapbox script loaded');
      scriptLoaded.current = true;
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeMap();
      }, 100);
    };
    script.onerror = () => {
      console.error('Failed to load Mapbox script');
      setError('Failed to load Mapbox resources');
      setIsLoading(false);
    };
    document.head.appendChild(script);
  };

  useEffect(() => {
    loadMapboxResources();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg">
        <div className="text-center">
          <p className="text-destructive text-sm">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">Check console for details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapContainer} 
        className={`w-full h-full ${className}`}
        style={{ 
          minHeight: '100%',
          height: '100%',
          width: '100%'
        }}
      />
    </div>
  );
};

export default MobileMapbox;