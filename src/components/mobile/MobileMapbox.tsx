import React, { useEffect, useRef, useState } from 'react';
import { useDriverLocation } from '@/hooks/useDriverLocation';

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
  const driverMarker = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { location, isTracking, startTracking, stopTracking } = useDriverLocation();

  // Update driver marker on map
  const updateDriverMarker = (lng: number, lat: number, heading?: number) => {
    if (!map.current) return;

    if (driverMarker.current) {
      driverMarker.current.setLngLat([lng, lat]);
      if (heading !== undefined) {
        driverMarker.current.setRotation(heading);
      }
    } else {
      // Create a new marker for the driver
      const markerElement = document.createElement('div');
      markerElement.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          background: #ff6600;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255, 102, 0, 0.5);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-bottom: 8px solid #ff6600;
            display: ${heading !== undefined ? 'block' : 'none'};
          "></div>
        </div>
      `;

      driverMarker.current = new window.mapboxgl.Marker({
        element: markerElement,
        rotation: heading || 0
      })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }

    // Center the map on driver location
    map.current.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 1000
    });
  };

  // Handle location updates
  useEffect(() => {
    if (location && map.current) {
      console.log('Updating driver location on map:', location);
      updateDriverMarker(location.longitude, location.latitude, location.heading);
    }
  }, [location]);

  // Auto-start GPS tracking when map loads
  useEffect(() => {
    if (!isLoading && !error && !isTracking) {
      // Auto-start tracking when map is ready
      setTimeout(() => {
        startTracking();
      }, 1000);
    }
  }, [isLoading, error, isTracking]);

  const initializeMap = () => {
    if (!mapContainer.current || !window.mapboxgl) {
      console.log('MapContainer or mapboxgl not available');
      return;
    }

    try {
      console.log('Initializing Mapbox map...');
      
      // Set the access token
      window.mapboxgl.accessToken = 'pk.eyJ1IjoiY3JhdmUtbiIsImEiOiJjbWVxb21qbTQyNTRnMm1vaHg5bDZwcmw2In0.aOsYrL2B0cjfcCGW1jHAdw';

      // Create the map instance
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/crave-n/cmfinp8y2004m01qvb7kwbqol',
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
      
      {/* GPS Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <button
          onClick={isTracking ? stopTracking : startTracking}
          className={`p-3 rounded-full shadow-lg border-2 ${
            isTracking 
              ? 'bg-green-500 border-green-400 text-white' 
              : 'bg-white border-gray-300 text-gray-700'
          }`}
          disabled={isLoading}
        >
          {isTracking ? (
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        {location && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs shadow-lg">
            <div className="text-gray-600">GPS: {isTracking ? 'Active' : 'Inactive'}</div>
            {location.accuracy && (
              <div className="text-gray-500">±{Math.round(location.accuracy)}m</div>
            )}
            {location.speed && location.speed > 0 && (
              <div className="text-gray-500">{Math.round(location.speed * 2.237)} mph</div>
            )}
          </div>
        )}
      </div>

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