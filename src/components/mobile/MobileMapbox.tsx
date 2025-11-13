import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MAPBOX_CONFIG } from '@/config/mapbox';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import {
  DELIVERY_ZONES,
  DeliveryZone,
  getZoneForLocation,
  getZoneStyle,
  randomizeZoneDemand,
  zonesToGeoJSON,
} from '@/data/deliveryZones';

interface MobileMapboxProps {
  className?: string;
  onZoneStatusChange?: (info: { isInZone: boolean; zone: DeliveryZone | null }) => void;
}

const ZONE_SOURCE_ID = 'delivery-zones';
const ZONE_FILL_LAYER_ID = 'delivery-zones-fill';
const ZONE_LINE_LAYER_ID = 'delivery-zones-outline';

export const MobileMapbox: React.FC<MobileMapboxProps> = ({
  className = '',
  onZoneStatusChange,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const { location, startTracking, isTracking } = useDriverLocation();
  const [showRecenter, setShowRecenter] = useState(false);
  const [zones, setZones] = useState<DeliveryZone[]>(() => DELIVERY_ZONES.map((zone) => ({ ...zone })));

  const driverLocation = useMemo<[number, number] | null>(() => {
    if (location) {
      return [location.latitude, location.longitude];
    }
    return null;
  }, [location]);

  const updateZoneLayers = useCallback(
    (zonesData: DeliveryZone[]) => {
      if (!map.current) return;

      const geoJson = zonesToGeoJSON(zonesData);
      const source = map.current.getSource(ZONE_SOURCE_ID);

      if (source) {
        source.setData(geoJson);
        return;
      }

      map.current.addSource(ZONE_SOURCE_ID, {
        type: 'geojson',
        data: geoJson,
      });

      if (!map.current.getLayer(ZONE_FILL_LAYER_ID)) {
        map.current.addLayer({
          id: ZONE_FILL_LAYER_ID,
          type: 'fill',
          source: ZONE_SOURCE_ID,
          paint: {
            'fill-color': ['get', 'fillColor'],
            'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.4],
          },
        });
      }

      if (!map.current.getLayer(ZONE_LINE_LAYER_ID)) {
        map.current.addLayer({
          id: ZONE_LINE_LAYER_ID,
          type: 'line',
          source: ZONE_SOURCE_ID,
          paint: {
            'line-width': 2,
            'line-color': ['get', 'strokeColor'],
          },
        });
      }
    },
    []
  );

  const applyDriverLocation = useCallback(
    (lat: number, lng: number, animate = false) => {
      if (!map.current || !marker.current) return;

      marker.current.setLngLat([lng, lat]);
      if (animate) {
        map.current.flyTo({ center: [lng, lat], zoom: Math.max(map.current.getZoom() || 14, 14), essential: true });
      } else {
        map.current.setCenter([lng, lat]);
      }

      const zone = getZoneForLocation([lat, lng], zones);
      const isInZone = Boolean(zone);

      if (onZoneStatusChange) {
        onZoneStatusChange({ isInZone, zone });
      }

      if (zone) {
        setStatusMessage(`✅ GEOLOCATION SUCCESS: Driver is currently in the ${zone.name}.`);
      } else {
        setStatusMessage('⚠️ STATUS: Driver is outside all defined delivery zones.');
      }
    },
    [onZoneStatusChange, zones]
  );

  // Start location tracking immediately when component mounts
  useEffect(() => {
    if (!isTracking) {
      console.log('Starting location tracking...');
      startTracking();
    }
  }, [startTracking, isTracking]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = () => {
      if (!(window as any).mapboxgl) {
        console.error('Mapbox GL JS not loaded');
        return;
      }

      (window as any).mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

      try {
        // Use driver's actual location if available, otherwise use config default
        const initialCenter = driverLocation 
          ? [driverLocation[1], driverLocation[0]] // Mapbox uses [lng, lat]
          : [MAPBOX_CONFIG.center[0], MAPBOX_CONFIG.center[1]];
        
        console.log('Initializing map with center:', initialCenter, 'driverLocation:', driverLocation);
        
        map.current = new (window as any).mapboxgl.Map({
          container: mapContainer.current,
          style: MAPBOX_CONFIG.style,
          center: initialCenter,
          zoom: MAPBOX_CONFIG.zoom,
        });

        map.current.on('load', () => {
          console.log('Mapbox loaded successfully');
          setIsMapReady(true);
          try {
            const ctrl = new (window as any).mapboxgl.NavigationControl({ visualizePitch: true });
            map.current.addControl(ctrl, 'top-right');
          } catch (error) {
            console.error('Failed to add navigation control', error);
          }
          updateZoneLayers(zones);
          // If we have driver location, center on it
          if (driverLocation) {
            console.log('Centering map on driver location:', driverLocation);
            applyDriverLocation(driverLocation[0], driverLocation[1], true);
          }
        });

        map.current.on('error', (e: any) => {
          console.error('Mapbox error:', e);
        });

        // Initialize marker at driver's location if available, otherwise use config default
        const initialMarkerPos = driverLocation 
          ? [driverLocation[1], driverLocation[0]] // Mapbox uses [lng, lat]
          : [MAPBOX_CONFIG.center[0], MAPBOX_CONFIG.center[1]];
        
        marker.current = new (window as any).mapboxgl.Marker({
          color: '#1d4ed8',
        })
          .setLngLat(initialMarkerPos)
          .addTo(map.current);
      } catch (error) {
        console.error('Error initializing Mapbox:', error);
      }
    };

    if ((window as any).mapboxgl) {
      initMap();
    } else {
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
  }, [applyDriverLocation, updateZoneLayers, zones, driverLocation]);

  useEffect(() => {
    if (!isMapReady) return;
    updateZoneLayers(zones);
  }, [isMapReady, updateZoneLayers, zones]);

  // Update map when driver location changes (real-time updates)
  useEffect(() => {
    if (!isMapReady) return;
    if (!location) return;

    console.log('Updating map with driver location:', location);
    applyDriverLocation(location.latitude, location.longitude, false); // Don't animate on every update to avoid jarring movement
    setShowRecenter(true);
  }, [applyDriverLocation, isMapReady, location]);


  const legendItems = useMemo(() => {
    return zones.map((zone) => {
      const style = getZoneStyle(zone.demand);
      return {
        id: zone.id,
        name: zone.name,
        demand: style.demandLabel,
        textClass: style.textClass,
        badgeClass: style.badgeClass,
        borderColor: style.strokeColor,
      };
    });
  }, [zones]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="w-full h-full" style={{ pointerEvents: 'auto' }} />

      {isMapReady && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Recenter button clicked', { driverLocation, mapReady: !!map.current, markerReady: !!marker.current });
            
            // Try to get location from multiple sources
            let lat: number | null = null;
            let lng: number | null = null;
            
            if (location) {
              lat = location.latitude;
              lng = location.longitude;
              console.log('Using location from hook:', lat, lng);
            } else if (driverLocation) {
              lat = driverLocation[0];
              lng = driverLocation[1];
              console.log('Using driverLocation:', lat, lng);
            } else if (marker.current) {
              // Fallback: get current marker position
              const currentPos = marker.current.getLngLat();
              lat = currentPos.lat;
              lng = currentPos.lng;
              console.log('Using marker position:', lat, lng);
            }
            
            if (lat !== null && lng !== null && map.current && marker.current) {
              console.log('Calling applyDriverLocation with:', lat, lng);
              applyDriverLocation(lat, lng, true);
            } else {
              console.error('Cannot recenter: missing data', { lat, lng, map: !!map.current, marker: !!marker.current });
            }
          }}
          className="absolute z-[100] w-12 h-12 rounded-full bg-white/95 backdrop-blur shadow-xl flex items-center justify-center hover:bg-white active:scale-95 transition-all cursor-pointer"
          style={{ top: '50%', right: '16px', transform: 'translateY(-50%)', pointerEvents: 'auto' }}
          aria-label="Recenter on driver location"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6 text-gray-700">
            <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      )}

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
