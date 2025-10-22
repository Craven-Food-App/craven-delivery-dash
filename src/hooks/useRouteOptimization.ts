/**
 * React Hook for Route Optimization
 * Provides easy-to-use interface for route calculations and ETA updates
 */

import { useState, useEffect, useCallback } from 'react';
import {
  calculateRoute,
  calculateOrderETA,
  optimizeDriverRoute,
  updateOrderETA,
  Location,
  OptimizedRoute
} from '@/services/routeOptimizationService';

export interface UseRouteOptimizationOptions {
  orderId?: string;
  driverId?: string;
  origin?: Location;
  destination?: Location;
  autoUpdate?: boolean;
  updateInterval?: number; // milliseconds
}

export interface UseRouteOptimizationReturn {
  route: OptimizedRoute | null;
  isCalculating: boolean;
  error: string | null;
  eta: Date | null;
  distance: number | null;
  duration: number | null;
  recalculate: () => Promise<void>;
  calculateRouteNow: (from: Location, to: Location) => Promise<void>;
}

/**
 * Hook for route optimization and ETA calculations
 */
export function useRouteOptimization(
  options: UseRouteOptimizationOptions = {}
): UseRouteOptimizationReturn {
  const {
    orderId,
    driverId,
    origin,
    destination,
    autoUpdate = false,
    updateInterval = 60000 // 1 minute default
  } = options;

  const [route, setRoute] = useState<OptimizedRoute | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eta, setEta] = useState<Date | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  /**
   * Calculate route between two locations
   */
  const calculateRouteNow = useCallback(async (from: Location, to: Location) => {
    setIsCalculating(true);
    setError(null);

    try {
      const calculatedRoute = await calculateRoute(from, to, {
        profile: 'driving-traffic',
        steps: true
      });

      setRoute(calculatedRoute);
      setEta(calculatedRoute.eta);
      setDistance(calculatedRoute.distance);
      setDuration(calculatedRoute.duration);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate route';
      setError(errorMessage);
      console.error('Route calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  /**
   * Recalculate route with current parameters
   */
  const recalculate = useCallback(async () => {
    if (orderId) {
      // Calculate ETA for specific order
      setIsCalculating(true);
      setError(null);

      try {
        const result = await calculateOrderETA(orderId);
        setEta(result.eta);
        setDistance(result.distance);
        setDuration(result.duration);

        // Update in database
        await updateOrderETA(orderId, result.eta);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to calculate ETA';
        setError(errorMessage);
        console.error('ETA calculation error:', err);
      } finally {
        setIsCalculating(false);
      }
    } else if (driverId) {
      // Optimize route for driver with multiple orders
      setIsCalculating(true);
      setError(null);

      try {
        const result = await optimizeDriverRoute(driverId);
        setRoute(result.route);
        setEta(result.route.eta);
        setDistance(result.totalDistance);
        setDuration(result.totalDuration);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to optimize route';
        setError(errorMessage);
        console.error('Route optimization error:', err);
      } finally {
        setIsCalculating(false);
      }
    } else if (origin && destination) {
      // Calculate simple route
      await calculateRouteNow(origin, destination);
    }
  }, [orderId, driverId, origin, destination, calculateRouteNow]);

  /**
   * Auto-calculate on mount and when parameters change
   */
  useEffect(() => {
    if (orderId || driverId || (origin && destination)) {
      recalculate();
    }
  }, [orderId, driverId, origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude]);

  /**
   * Auto-update at intervals
   */
  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(() => {
      recalculate();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [autoUpdate, updateInterval, recalculate]);

  return {
    route,
    isCalculating,
    error,
    eta,
    distance,
    duration,
    recalculate,
    calculateRouteNow
  };
}

/**
 * Hook specifically for driver route optimization
 */
export function useDriverRouteOptimization(driverId: string | null) {
  return useRouteOptimization({
    driverId: driverId || undefined,
    autoUpdate: true,
    updateInterval: 120000 // Update every 2 minutes
  });
}

/**
 * Hook specifically for order ETA tracking
 */
export function useOrderETA(orderId: string | null) {
  return useRouteOptimization({
    orderId: orderId || undefined,
    autoUpdate: true,
    updateInterval: 60000 // Update every minute
  });
}

