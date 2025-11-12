import { Feature, FeatureCollection, Polygon } from 'geojson';

export type DeliveryZone = {
  id: number;
  name: string;
  demand: number; // 0.0 (low) to 1.0 (high)
  coordinates: [number, number][]; // [latitude, longitude]
};

export type ZoneDemandLevel = 'high' | 'moderate' | 'low';

export interface ZoneStyle {
  fillColor: string;
  strokeColor: string;
  demandLabel: string;
  demandLevel: ZoneDemandLevel;
  badgeClass: string;
  textClass: string;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 1,
    name: 'North Lake Zone',
    demand: 0.8,
    coordinates: [
      [41.98, -87.63],
      [41.98, -87.69],
      [41.94, -87.72],
      [41.9, -87.69],
      [41.9, -87.62],
    ],
  },
  {
    id: 2,
    name: 'West Loop/Downtown',
    demand: 0.4,
    coordinates: [
      [41.9, -87.75],
      [41.87, -87.75],
      [41.85, -87.69],
      [41.88, -87.64],
      [41.91, -87.68],
    ],
  },
  {
    id: 3,
    name: 'South Side Suburbs',
    demand: 0.1,
    coordinates: [
      [41.8, -87.69],
      [41.8, -87.75],
      [41.74, -87.75],
      [41.74, -87.69],
      [41.77, -87.65],
    ],
  },
];

export function getZoneStyle(demand: number): ZoneStyle {
  if (demand > 0.7) {
    return {
      fillColor: '#ef4444',
      strokeColor: '#b91c1c',
      demandLabel: 'HIGH (BUSY)',
      demandLevel: 'high',
      badgeClass: 'bg-red-500',
      textClass: 'text-red-600',
    };
  }
  if (demand > 0.3) {
    return {
      fillColor: '#f59e0b',
      strokeColor: '#d97706',
      demandLabel: 'MODERATE',
      demandLevel: 'moderate',
      badgeClass: 'bg-amber-500',
      textClass: 'text-amber-600',
    };
  }
  return {
    fillColor: '#10b981',
    strokeColor: '#059669',
    demandLabel: 'LOW (OPEN)',
    demandLevel: 'low',
    badgeClass: 'bg-emerald-500',
    textClass: 'text-emerald-600',
  };
}

export function zonesToGeoJSON(zones: DeliveryZone[]): FeatureCollection<Polygon> {
  const features: Feature<Polygon>[] = zones.map((zone) => {
    const style = getZoneStyle(zone.demand);
    const coordinates = zone.coordinates.map(([lat, lng]) => [lng, lat]);

    return {
      type: 'Feature',
      properties: {
        id: zone.id,
        name: zone.name,
        demand: zone.demand,
        ...style,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
    } as Feature<Polygon>;
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

export function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [lat, lng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];

    const intersect = (lngI > lng) !== (lngJ > lng) &&
      lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI;

    if (intersect) inside = !inside;
  }

  return inside;
}

export function getZoneForLocation(point: [number, number], zones: DeliveryZone[] = DELIVERY_ZONES): DeliveryZone | null {
  for (const zone of zones) {
    if (isPointInPolygon(point, zone.coordinates)) {
      return zone;
    }
  }
  return null;
}

export function randomizeZoneDemand(zones: DeliveryZone[]): DeliveryZone[] {
  return zones.map((zone) => ({
    ...zone,
    demand: Math.random(),
  }));
}
