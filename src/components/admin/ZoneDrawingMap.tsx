import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { MAPBOX_CONFIG, ZONE_STYLES } from '@/config/mapbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, MapPin, Save, X, Edit3, AlertCircle } from 'lucide-react';

interface ZoneDrawingMapProps {
  onZoneCreated: (zone: {
    name: string;
    city: string;
    state: string;
    zip_code: string;
    geojson: any;
  }) => void;
  onCancel: () => void;
  initialZone?: any;
}

const ZoneDrawingMap: React.FC<ZoneDrawingMapProps> = ({
  onZoneCreated,
  onCancel,
  initialZone
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapError, setMapError] = useState<string | null>(null);
  const [zoneData, setZoneData] = useState({
    name: initialZone?.name || '',
    city: initialZone?.city || '',
    state: initialZone?.state || '',
    zip_code: initialZone?.zip_code || ''
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if Mapbox token is available
    if (!MAPBOX_CONFIG.accessToken || MAPBOX_CONFIG.accessToken === 'pk.your_token_here') {
      setMapError('Mapbox access token not configured. Please add VITE_MAPBOX_ACCESS_TOKEN to your environment variables.');
      return;
    }

    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        accessToken: MAPBOX_CONFIG.accessToken,
        style: MAPBOX_CONFIG.style,
        center: MAPBOX_CONFIG.center,
        zoom: MAPBOX_CONFIG.zoom
      });

      // Initialize draw
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true
        },
        defaultMode: 'draw_polygon',
        styles: [
          {
            id: 'gl-draw-polygon-fill-inactive',
            type: 'fill',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
            paint: ZONE_STYLES.drawing
          },
          {
            id: 'gl-draw-polygon-stroke-inactive',
            type: 'line',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
            paint: {
              'line-color': ZONE_STYLES.drawing.stroke,
              'line-width': ZONE_STYLES.drawing.strokeWidth,
              'line-dasharray': ZONE_STYLES.drawing.strokeDasharray
            }
          }
        ]
      });

      map.current.addControl(draw.current);

      // Handle drawing events
      map.current.on('draw.create', () => {
        setIsDrawing(true);
      });

      map.current.on('draw.update', () => {
        setIsDrawing(true);
      });

      map.current.on('draw.delete', () => {
        setIsDrawing(false);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Failed to load map. Please check your Mapbox configuration.');
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map. Please check your Mapbox configuration.');
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  const searchLocation = async () => {
    if (!searchQuery || !map.current || mapError) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_CONFIG.accessToken}&country=US&limit=1`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        map.current.flyTo({
          center: [lng, lat],
          zoom: 12
        });

        // Extract location data
        const context = feature.context || [];
        const city = context.find(c => c.id.startsWith('place'))?.text || '';
        const state = context.find(c => c.id.startsWith('region'))?.text || '';
        const zip = context.find(c => c.id.startsWith('postcode'))?.text || '';

        setZoneData(prev => ({
          ...prev,
          city: city || prev.city,
          state: state || prev.state,
          zip_code: zip || prev.zip_code
        }));
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const saveZone = () => {
    if (!draw.current || !isDrawing || mapError) return;

    const features = draw.current.getAll();
    if (features.features.length === 0) return;

    const polygon = features.features[0];
    
    // Validate polygon
    if (polygon.geometry.type !== 'Polygon') return;
    if (polygon.geometry.coordinates[0].length < 4) return;

    // Ensure polygon is closed
    const coords = polygon.geometry.coordinates[0];
    if (coords[0][0] !== coords[coords.length - 1][0] || 
        coords[0][1] !== coords[coords.length - 1][1]) {
      coords.push(coords[0]);
    }

    onZoneCreated({
      ...zoneData,
      geojson: polygon.geometry
    });
  };

  // If there's a map error, show a simple form instead
  if (mapError) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Map Not Available</h3>
              <p className="text-sm text-red-700 mt-1">{mapError}</p>
            </div>
          </div>
        </div>

        {/* Fallback form for manual zone creation */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Zone Name</Label>
              <Input
                id="name"
                value={zoneData.name}
                onChange={(e) => setZoneData({ ...zoneData, name: e.target.value })}
                placeholder="e.g., Downtown Toledo"
              />
            </div>
            <div>
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                value={zoneData.zip_code}
                onChange={(e) => setZoneData({ ...zoneData, zip_code: e.target.value })}
                placeholder="e.g., 43604"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={zoneData.city}
                onChange={(e) => setZoneData({ ...zoneData, city: e.target.value })}
                placeholder="e.g., Toledo"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={zoneData.state}
                onChange={(e) => setZoneData({ ...zoneData, state: e.target.value })}
                placeholder="e.g., OH"
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Manual Zone Creation</h4>
            <p className="text-sm text-yellow-800">
              Since the map is not available, this will create a zone with default coordinates. 
              You can edit the zone later when the map is properly configured.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Create a default polygon for Toledo area
                const defaultPolygon = {
                  type: 'Polygon',
                  coordinates: [[
                    [-83.6, 41.6],
                    [-83.5, 41.6],
                    [-83.5, 41.7],
                    [-83.6, 41.7],
                    [-83.6, 41.6]
                  ]]
                };
                
                onZoneCreated({
                  ...zoneData,
                  geojson: defaultPolygon
                });
              }}
              disabled={!zoneData.name}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Save className="h-4 w-4 mr-2" />
              Create Zone (Default Area)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex space-x-2">
        <div className="flex-1">
          <Label htmlFor="search">Search Location</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="search"
              placeholder="Enter ZIP code, city, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={searchLocation} className="mt-6">
          <MapPin className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Zone Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Zone Name</Label>
          <Input
            id="name"
            value={zoneData.name}
            onChange={(e) => setZoneData({ ...zoneData, name: e.target.value })}
            placeholder="e.g., Downtown Toledo"
          />
        </div>
        <div>
          <Label htmlFor="zip_code">ZIP Code</Label>
          <Input
            id="zip_code"
            value={zoneData.zip_code}
            onChange={(e) => setZoneData({ ...zoneData, zip_code: e.target.value })}
            placeholder="e.g., 43604"
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={zoneData.city}
            onChange={(e) => setZoneData({ ...zoneData, city: e.target.value })}
            placeholder="e.g., Toledo"
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={zoneData.state}
            onChange={(e) => setZoneData({ ...zoneData, state: e.target.value })}
            placeholder="e.g., OH"
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapContainer} 
          className="w-full h-96 rounded-lg border"
        />
        <div className="absolute top-4 right-4 bg-white p-2 rounded shadow">
          <p className="text-sm text-gray-600">
            Click to draw polygon points
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">How to draw a delivery zone:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Search for your location or enter ZIP code</li>
          <li>2. Click on the map to start drawing polygon points</li>
          <li>3. Click each corner of your delivery area</li>
          <li>4. Double-click to finish the polygon</li>
          <li>5. Fill in zone details and save</li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button 
          onClick={saveZone} 
          disabled={!isDrawing || !zoneData.name}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Zone
        </Button>
      </div>
    </div>
  );
};

export default ZoneDrawingMap;
