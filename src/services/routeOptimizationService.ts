/**
 * Route Optimization Service
 * Provides advanced routing capabilities using Mapbox Directions API
 * Supports multi-stop optimization, ETA calculations, and traffic-aware routing
 */

import { supabase } from '@/integrations/supabase/client';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_DIRECTIONS_API = 'https://api.mapbox.com/directions/v5/mapbox';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  maneuver: string;
}

export interface OptimizedRoute {
  distance: number; // meters
  duration: number; // seconds
  durationInTraffic?: number; // seconds (with traffic)
  geometry: any; // GeoJSON geometry
  steps: RouteStep[];
  waypoints: Location[];
  eta: Date;
}

export interface BatchedDelivery {
  orderId: string;
  pickupLocation: Location;
  deliveryLocation: Location;
  priority: number;
}

/**
 * Calculate optimal route between two locations
 */
export async function calculateRoute(
  origin: Location,
  destination: Location,
  options: {
    profile?: 'driving' | 'driving-traffic' | 'walking' | 'cycling';
    alternatives?: boolean;
    steps?: boolean;
  } = {}
): Promise<OptimizedRoute> {
  const {
    profile = 'driving-traffic',
    alternatives = false,
    steps = true
  } = options;

  const coordinates = [
    `${origin.longitude},${origin.latitude}`,
    `${destination.longitude},${destination.latitude}`
  ].join(';');

  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    alternatives: alternatives.toString(),
    steps: steps.toString(),
    geometries: 'geojson',
    overview: 'full',
    annotations: 'duration,distance'
  });

  const url = `${MAPBOX_DIRECTIONS_API}/${profile}/${coordinates}?${params}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }

    const route = data.routes[0];
    
    // Calculate ETA
    const now = new Date();
    const eta = new Date(now.getTime() + (route.duration * 1000));

    return {
      distance: route.distance,
      duration: route.duration,
      durationInTraffic: route.duration_typical || route.duration,
      geometry: route.geometry,
      steps: route.legs[0]?.steps?.map((step: any) => ({
        instruction: step.maneuver.instruction,
        distance: step.distance,
        duration: step.duration,
        maneuver: step.maneuver.type
      })) || [],
      waypoints: [origin, destination],
      eta
    };
  } catch (error) {
    console.error('Route calculation error:', error);
    throw new Error(`Failed to calculate route: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate optimal multi-stop route for batched deliveries
 */
export async function calculateMultiStopRoute(
  driverLocation: Location,
  deliveries: BatchedDelivery[]
): Promise<OptimizedRoute> {
  if (deliveries.length === 0) {
    throw new Error('No deliveries provided');
  }

  // Build waypoints: driver -> pickup1 -> delivery1 -> pickup2 -> delivery2...
  const waypoints: Location[] = [driverLocation];
  
  // Sort deliveries by priority
  const sortedDeliveries = [...deliveries].sort((a, b) => b.priority - a.priority);
  
  // Add pickup and delivery locations in order
  for (const delivery of sortedDeliveries) {
    waypoints.push(delivery.pickupLocation);
    waypoints.push(delivery.deliveryLocation);
  }

  // Mapbox supports up to 25 waypoints
  if (waypoints.length > 25) {
    throw new Error('Too many waypoints (max 25)');
  }

  const coordinates = waypoints
    .map(loc => `${loc.longitude},${loc.latitude}`)
    .join(';');

  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    steps: 'true',
    geometries: 'geojson',
    overview: 'full',
    annotations: 'duration,distance'
  });

  const url = `${MAPBOX_DIRECTIONS_API}/driving-traffic/${coordinates}?${params}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }

    const route = data.routes[0];
    
    // Calculate ETA for final destination
    const now = new Date();
    const eta = new Date(now.getTime() + (route.duration * 1000));

    // Combine all steps from all legs
    const allSteps: RouteStep[] = [];
    route.legs?.forEach((leg: any) => {
      leg.steps?.forEach((step: any) => {
        allSteps.push({
          instruction: step.maneuver.instruction,
          distance: step.distance,
          duration: step.duration,
          maneuver: step.maneuver.type
        });
      });
    });

    return {
      distance: route.distance,
      duration: route.duration,
      durationInTraffic: route.duration_typical || route.duration,
      geometry: route.geometry,
      steps: allSteps,
      waypoints,
      eta
    };
  } catch (error) {
    console.error('Multi-stop route calculation error:', error);
    throw new Error(`Failed to calculate multi-stop route: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate ETA for an order based on driver location
 */
export async function calculateOrderETA(
  orderId: string,
  driverLocation?: Location
): Promise<{ eta: Date; distance: number; duration: number }> {
  try {
    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        delivery_latitude,
        delivery_longitude,
        restaurant_id,
        restaurants (
          latitude,
          longitude
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    const restaurant = order.restaurants as any;
    
    if (!restaurant || !order.delivery_latitude || !order.delivery_longitude) {
      throw new Error('Missing location data');
    }

    const pickupLocation: Location = {
      latitude: restaurant.latitude,
      longitude: restaurant.longitude
    };

    const deliveryLocation: Location = {
      latitude: order.delivery_latitude,
      longitude: order.delivery_longitude
    };

    // If driver location provided, calculate from driver -> restaurant -> customer
    if (driverLocation) {
      const route = await calculateMultiStopRoute(driverLocation, [{
        orderId,
        pickupLocation,
        deliveryLocation,
        priority: 1
      }]);

      return {
        eta: route.eta,
        distance: route.distance,
        duration: route.duration
      };
    }

    // Otherwise, just calculate restaurant -> customer
    const route = await calculateRoute(pickupLocation, deliveryLocation);

    // Add average restaurant prep time (15 minutes)
    const prepTime = 15 * 60; // seconds
    const totalDuration = route.duration + prepTime;
    const eta = new Date(Date.now() + (totalDuration * 1000));

    return {
      eta,
      distance: route.distance,
      duration: totalDuration
    };
  } catch (error) {
    console.error('ETA calculation error:', error);
    throw error;
  }
}

/**
 * Update order ETA in database
 */
export async function updateOrderETA(orderId: string, eta: Date): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ estimated_delivery_time: eta.toISOString() })
    .eq('id', orderId);

  if (error) {
    console.error('Failed to update order ETA:', error);
    throw error;
  }
}

/**
 * Get optimized delivery sequence for driver with multiple orders
 */
export async function optimizeDriverRoute(
  driverId: string
): Promise<{
  route: OptimizedRoute;
  orderSequence: string[];
  totalDistance: number;
  totalDuration: number;
}> {
  try {
    // Get driver's current location
    const { data: driverProfile, error: driverError } = await supabase
      .from('driver_profiles')
      .select('current_latitude, current_longitude')
      .eq('user_id', driverId)
      .single();

    if (driverError || !driverProfile) {
      throw new Error('Driver not found');
    }

    const driverLocation: Location = {
      latitude: driverProfile.current_latitude,
      longitude: driverProfile.current_longitude
    };

    // Get all assigned orders for this driver
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        delivery_latitude,
        delivery_longitude,
        created_at,
        restaurants (
          latitude,
          longitude
        )
      `)
      .eq('driver_id', driverId)
      .in('order_status', ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up']);

    if (ordersError || !orders || orders.length === 0) {
      throw new Error('No active orders for driver');
    }

    // Build batched deliveries
    const batchedDeliveries: BatchedDelivery[] = orders.map((order, index) => {
      const restaurant = order.restaurants as any;
      return {
        orderId: order.id,
        pickupLocation: {
          latitude: restaurant.latitude,
          longitude: restaurant.longitude
        },
        deliveryLocation: {
          latitude: order.delivery_latitude,
          longitude: order.delivery_longitude
        },
        // Priority based on order age (older = higher priority)
        priority: 1000 - index
      };
    });

    // Calculate optimized route
    const route = await calculateMultiStopRoute(driverLocation, batchedDeliveries);

    // Extract order sequence
    const orderSequence = batchedDeliveries.map(d => d.orderId);

    return {
      route,
      orderSequence,
      totalDistance: route.distance,
      totalDuration: route.duration
    };
  } catch (error) {
    console.error('Driver route optimization error:', error);
    throw error;
  }
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format ETA for display
 */
export function formatETA(eta: Date): string {
  const now = new Date();
  const diffMinutes = Math.round((eta.getTime() - now.getTime()) / (1000 * 60));
  
  if (diffMinutes < 0) {
    return 'Arriving now';
  }
  
  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }
  
  return eta.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

