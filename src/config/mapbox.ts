export const MAPBOX_CONFIG = {
  accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiY3JhdmUtbiIsImEiOiJjbWZpbXN4NmUwMG0wMmpxNDNkc2lmNWhiIn0._lEfvdpBUJpz-RYDV02ZAA',
  // Use Mapbox streets style
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-83.5555, 41.6528], // Toledo, OH default
  zoom: 10
};

export const ZONE_STYLES = {
  active: {
    fill: '#ff6600',
    fillOpacity: 0.3,
    stroke: '#ff6600',
    strokeWidth: 2
  },
  inactive: {
    fill: '#6b7280',
    fillOpacity: 0.2,
    stroke: '#6b7280',
    strokeWidth: 1
  },
  drawing: {
    fill: '#ff6600',
    fillOpacity: 0.1,
    stroke: '#ff6600',
    strokeWidth: 2,
    strokeDasharray: [5, 5]
  }
};
