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

const SIMULATED_LOCATIONS: [number, number][] = [
  [41.95, -87.65],
  [41.86, -87.72],
  [41.76, -87.71],
  [41.99, -87.8],
];

export const MobileMapbox: React.FC<MobileMapboxProps> = ({
  className = '',
  onZoneStatusChange,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const { location } = useDriverLocation();
  const [showRecenter, setShowRecenter] = useState(false);
  const [zones, setZones] = useState<DeliveryZone[]>(() => DELIVERY_ZONES.map((zone) => ({ ...zone })));
  const [statusMessage, setStatusMessage] = useState('Map loaded. Move the driver to check their current zone.');
  const [manualLocationIndex, setManualLocationIndex] = useState<number | null>(null);

  const driverLocation = useMemo<[number, number] | null>(() => {
    if (manualLocationIndex !== null) {
      return SIMULATED_LOCATIONS[manualLocationIndex];
    }
    if (location) {
      return [location.latitude, location.longitude];
    }
    return null;
  }, [location, manualLocationIndex]);

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

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = () => {
      if (!(window as any).mapboxgl) {
        console.error('Mapbox GL JS not loaded');
        return;
      }

      (window as any).mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

      try {
        map.current = new (window as any).mapboxgl.Map({
          container: mapContainer.current,
          style: MAPBOX_CONFIG.style,
          center: [MAPBOX_CONFIG.center[0], MAPBOX_CONFIG.center[1]],
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
          if (driverLocation) {
            applyDriverLocation(driverLocation[0], driverLocation[1], true);
          }
        });

        map.current.on('error', (e: any) => {
          console.error('Mapbox error:', e);
        });

        marker.current = new (window as any).mapboxgl.Marker({
          color: '#1d4ed8',
        })
          .setLngLat([MAPBOX_CONFIG.center[0], MAPBOX_CONFIG.center[1]])
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

  useEffect(() => {
    if (!isMapReady) return;
    if (manualLocationIndex !== null) return;
    if (!location) return;

    applyDriverLocation(location.latitude, location.longitude, true);
    setShowRecenter(true);
  }, [applyDriverLocation, isMapReady, location, manualLocationIndex]);

  useEffect(() => {
    if (!isMapReady) return;
    if (manualLocationIndex === null) return;

    const coords = SIMULATED_LOCATIONS[manualLocationIndex];
    applyDriverLocation(coords[0], coords[1], true);
    setShowRecenter(true);
  }, [applyDriverLocation, isMapReady, manualLocationIndex]);

  const handleUpdateDemand = useCallback(() => {
    setZones((prev) => randomizeZoneDemand(prev));
    setStatusMessage('✅ Zone demand levels have been randomly updated!');
  }, []);

  const handleMoveDriver = useCallback(() => {
    setManualLocationIndex((prev) => {
      const nextIndex = prev === null ? 0 : (prev + 1) % SIMULATED_LOCATIONS.length;
      return nextIndex;
    });
  }, []);

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
      <div ref={mapContainer} className="w-full h-full" />


      {isMapReady && (
        <button
          onClick={() => {
            if (driverLocation && map.current) {
              applyDriverLocation(driverLocation[0], driverLocation[1], true);
            }
          }}
          className="fixed z-50 w-12 h-12 rounded-full bg-white/95 backdrop-blur shadow-xl flex items-center justify-center hover:bg-white active:scale-95 transition-all pointer-events-auto"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          aria-label="Recenter on driver location"
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
