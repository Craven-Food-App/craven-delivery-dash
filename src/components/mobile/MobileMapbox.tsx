import React, { useEffect, useRef } from 'react';

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

  const initializeMap = () => {
    if (!mapContainer.current || !window.mapboxgl) return;

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
  };

  const loadMapboxResources = () => {
    if (scriptLoaded.current) {
      initializeMap();
      return;
    }

    // Load Mapbox CSS
    const link = document.createElement('link');
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Load Mapbox JS
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js';
    script.onload = () => {
      scriptLoaded.current = true;
      initializeMap();
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

  return (
    <div 
      ref={mapContainer} 
      className={`w-full h-full ${className}`}
      style={{ minHeight: '100%' }}
    />
  );
};

export default MobileMapbox;