import React, { useEffect, useRef, useState } from 'react';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { Crosshair } from 'lucide-react';
import { SpeedLimitSign } from './SpeedLimitSign';
declare global {
  interface Window {
    mapboxgl: any;
  }
}
interface MobileMapboxProps {
  className?: string;
}
export const MobileMapbox: React.FC<MobileMapboxProps> = ({
  className = ""
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const scriptLoaded = useRef(false);
  const driverMarker = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoCentering, setIsAutoCentering] = useState(true);
  const {
    location,
    isTracking,
    error: gpsError,
    startTracking,
    stopTracking
  } = useDriverLocation();

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
      }).setLngLat([lng, lat]).addTo(map.current);
    }
  };

  // Handle location updates with automatic centering
  useEffect(() => {
    if (location && map.current) {
      console.log('Updating driver location on map:', location);
      updateDriverMarker(location.longitude, location.latitude, location.heading);

      // Auto-center on location if enabled
      if (isAutoCentering) {
        map.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom: Math.max(map.current.getZoom(), 15),
          duration: 1000
        });
      }
    }
  }, [location, isAutoCentering]);

  // Auto-start GPS tracking when map loads and center on Toledo initially
  useEffect(() => {
    if (!isLoading && !error) {
      // Set initial view to Toledo, Ohio
      if (map.current && !location) {
        map.current.flyTo({
          center: [-83.5379, 41.6528],
          // Toledo coordinates
          zoom: 11,
          duration: 1000
        });
      }

      // Auto-start GPS tracking
      if (!isTracking) {
        setTimeout(() => {
          startTracking();
        }, 1000);
      }
    }
  }, [isLoading, error, isTracking, location]);
  const initializeMap = () => {
    if (!mapContainer.current || !window.mapboxgl) {
      console.log('MapContainer or mapboxgl not available');
      return;
    }
    try {
      console.log('Initializing Mapbox map...');

      // Set the access token
      window.mapboxgl.accessToken = 'pk.eyJ1IjoiY3JhdmUtbiIsImEiOiJjbWVxb21qbTQyNTRnMm1vaHg5bDZwcmw2In0.aOsYrL2B0cjfcCGW1jHAdw';

      // Create the map instance - Default to Toledo, Ohio
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        // Use stable default style
        center: [-83.5379, 41.6528],
        // Toledo, Ohio coordinates
        zoom: 11,
        interactive: true,
        scrollZoom: true,
        boxZoom: true,
        dragRotate: true,
        dragPan: true,
        keyboard: true,
        doubleClickZoom: true,
        touchZoomRotate: true,
        cooperativeGestures: false,
        pitchWithRotate: true,
        bearingSnap: 7,
        // Add these to prevent rendering issues
        preserveDrawingBuffer: true,
        antialias: true
      });

      // Explicitly enable interactions (safety on some mobile browsers/iframes)
      map.current.dragPan.enable();
      map.current.scrollZoom.enable();
      map.current.keyboard.enable();
      map.current.doubleClickZoom.enable();
      map.current.touchZoomRotate.enable();

      // Add navigation controls
      map.current.addControl(new window.mapboxgl.NavigationControl({
        visualizePitch: true
      }), 'top-right');

      // Handle map load events
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        console.log('Map interactive state:', map.current.dragPan.isEnabled(), map.current.scrollZoom.isEnabled());
        setIsLoading(false);
        setError(null);
      });
      map.current.on('error', (e: any) => {
        console.error('Map error:', e);
        setError('Failed to load map');
        setIsLoading(false);
      });

      // Detect manual map interaction to disable auto-centering
      map.current.on('dragstart', () => {
        console.log('Map drag started - disabling auto-centering');
        setIsAutoCentering(false);
      });
      map.current.on('dragend', () => console.log('Map drag ended'));
      map.current.on('zoomstart', () => console.log('Map zoom started'));
      map.current.on('zoomend', () => console.log('Map zoom ended'));
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
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Load Mapbox JS
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
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
    return <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg">
        <div className="text-center">
          <p className="text-destructive text-sm">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">Check console for details</p>
        </div>
      </div>;
  }
  return <div className="w-full h-full relative">
      {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>}
      
      {/* GPS Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto" style={{
      maxWidth: '200px'
    }}>
        
        
        {gpsError}
        
        {location && <div className="hidden">
            <div>GPS: {isTracking ? 'Active' : 'Inactive'}</div>
            {location.accuracy && <div>±{Math.round(location.accuracy)}m</div>}
            {location.speed && location.speed > 0 && <div>{Math.round(location.speed * 2.237)} mph</div>}
          </div>}
        
        {/* Speed Limit Sign - positioned under GPS controls */}
        <SpeedLimitSign currentSpeed={location?.speed ? location.speed * 2.237 : 0} // Convert m/s to mph
      location={location ? {
        latitude: location.latitude,
        longitude: location.longitude
      } : undefined} />
      </div>

      {/* Map Controls: Recenter button - DoorDash style bottom right */}
      <div className="fixed bottom-[326px] right-4 z-50 pointer-events-auto">
        <button 
          onClick={() => {
            if (location && map.current) {
              const { longitude, latitude } = location;
              map.current.flyTo({
                center: [longitude, latitude],
                zoom: 15,
                duration: 800,
                bearing: 0
              });
              setIsAutoCentering(true);
            }
          }} 
          className={`rounded-full shadow-2xl transition-all duration-200 flex items-center justify-center ${
            isAutoCentering 
              ? 'bg-orange-500 text-white hover:bg-orange-600' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-300'
          }`}
          style={{ 
            padding: '8px',
            backgroundColor: isAutoCentering ? '#f97316' : '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
          aria-label="Center on my location"
        >
          <Crosshair className="h-5 w-5" />
        </button>
      </div>


      <div ref={mapContainer} className={`w-full h-full ${className}`} style={{
      minHeight: '100%',
      height: '100%',
      width: '100%',
      position: 'relative',
      zIndex: 1
    }} onTouchStart={() => console.log('Map container touch start')} onMouseDown={() => console.log('Map container mouse down')} />
    </div>;
};
export default MobileMapbox;