/**
 * Batched Delivery Manager for Drivers
 * Allows drivers to accept and manage multiple orders simultaneously
 * Optimizes routes for maximum efficiency - competes with DoorDash stacked orders
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDriverRouteOptimization } from '@/hooks/useRouteOptimization';
import { formatDistance, formatDuration, formatETA } from '@/services/routeOptimizationService';
import {
  Package,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  Navigation,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface BatchedOrder {
  id: string;
  restaurant_name: string;
  customer_name: string;
  total_amount: number;
  pickup_address: string;
  delivery_address: string;
  items_count: number;
  estimated_earnings: number;
  order_status: string;
}

interface DriverBatch {
  id: string;
  total_distance: number;
  total_duration: number;
  total_earnings: number;
  orders: BatchedOrder[];
  optimized_sequence: string[];
}

export function BatchedDeliveryManager({ driverId }: { driverId: string }) {
  const { toast } = useToast();
  const [currentBatch, setCurrentBatch] = useState<DriverBatch | null>(null);
  const [availableOrders, setAvailableOrders] = useState<BatchedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [canAddMore, setCanAddMore] = useState(true);

  // Use route optimization hook
  const { route, distance, duration, eta, recalculate, isCalculating } = 
    useDriverRouteOptimization(driverId);

  const MAX_BATCH_SIZE = 4; // Max orders a driver can handle at once

  useEffect(() => {
    fetchCurrentBatch();
    fetchAvailableOrders();
  }, [driverId]);

  const fetchCurrentBatch = async () => {
    try {
      // Get driver's active batch
      const { data: batch, error } = await supabase
        .from('batched_deliveries')
        .select(`
          *,
          batch_orders (
            order_id,
            sequence_number,
            pickup_eta,
            delivery_eta
          )
        `)
        .eq('driver_id', driverId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (batch) {
        // Fetch full order details
        const orderIds = batch.batch_orders.map((bo: any) => bo.order_id);
        
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            restaurants (name, address),
            order_items (id)
          `)
          .in('id', orderIds);

        if (ordersError) throw ordersError;

        const batchData: DriverBatch = {
          id: batch.id,
          total_distance: batch.total_distance_meters || 0,
          total_duration: batch.total_duration_seconds || 0,
          total_earnings: orders.reduce((sum, o) => sum + (o.delivery_fee || 0), 0),
          orders: orders.map(o => ({
            id: o.id,
            restaurant_name: o.restaurants?.name || '',
            customer_name: o.customer_name || 'Customer',
            total_amount: o.delivery_fee_cents || 0,
            pickup_address: o.restaurants?.address || '',
            delivery_address: typeof o.delivery_address === 'string' ? o.delivery_address : JSON.stringify(o.delivery_address),
            items_count: o.order_items?.length || 0,
            estimated_earnings: o.delivery_fee || 0,
            order_status: o.order_status
          })),
          optimized_sequence: batch.order_sequence || []
        };

        setCurrentBatch(batchData);
        setCanAddMore(batchData.orders.length < MAX_BATCH_SIZE);
      } else {
        setCurrentBatch(null);
        setCanAddMore(true);
      }
    } catch (error) {
      console.error('Error fetching batch:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      // Get nearby available orders that aren't in a batch
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants (name, address),
          order_items (id)
        `)
        .eq('order_status', 'ready_for_pickup')
        .is('driver_id', null)
        .limit(10);

      if (error) throw error;

      const available: BatchedOrder[] = orders.map(o => ({
        id: o.id,
        restaurant_name: o.restaurants?.name || '',
        customer_name: o.customer_name || 'Customer',
        total_amount: o.delivery_fee_cents || 0,
        pickup_address: o.restaurants?.address || '',
        delivery_address: typeof o.delivery_address === 'string' ? o.delivery_address : JSON.stringify(o.delivery_address),
        items_count: o.order_items?.length || 0,
        estimated_earnings: o.delivery_fee || 500, // $5 default
        order_status: o.order_status
      }));

      setAvailableOrders(available);
    } catch (error) {
      console.error('Error fetching available orders:', error);
    }
  };

  const handleAddOrderToBatch = async (orderId: string) => {
    try {
      setLoading(true);

      // Create batch if doesn't exist
      let batchId = currentBatch?.id;
      
      if (!batchId) {
        const { data: newBatch, error: batchError } = await supabase
          .from('batched_deliveries')
          .insert({
            driver_id: driverId,
            status: 'active'
          })
          .select()
          .single();

        if (batchError) throw batchError;
        batchId = newBatch.id;
      }

      // Add order to batch
      const sequenceNumber = (currentBatch?.orders.length || 0) + 1;
      
      const { error: orderError } = await supabase
        .from('batch_orders')
        .insert({
          batch_id: batchId,
          order_id: orderId,
          sequence_number: sequenceNumber
        });

      if (orderError) throw orderError;

      // Assign driver to order
      const { error: assignError } = await supabase
        .from('orders')
        .update({ driver_id: driverId })
        .eq('id', orderId);

      if (assignError) throw assignError;

      toast({
        title: 'Order Added',
        description: 'Order added to your batch',
      });

      // Refresh data
      await fetchCurrentBatch();
      await fetchAvailableOrders();
      
      // Recalculate route
      recalculate();
    } catch (error) {
      console.error('Error adding order to batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to add order to batch',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromBatch = async (orderId: string) => {
    if (!confirm('Remove this order from your batch?')) return;

    try {
      setLoading(true);

      // Remove from batch
      const { error } = await supabase
        .from('batch_orders')
        .delete()
        .eq('order_id', orderId);

      if (error) throw error;

      // Unassign driver
      await supabase
        .from('orders')
        .update({ driver_id: null })
        .eq('id', orderId);

      toast({
        title: 'Order Removed',
        description: 'Order removed from your batch',
      });

      await fetchCurrentBatch();
      await fetchAvailableOrders();
      recalculate();
    } catch (error) {
      console.error('Error removing order:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove order',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartBatch = async () => {
    if (!currentBatch || currentBatch.orders.length === 0) return;

    try {
      // Update batch with optimized route data
      const { error } = await supabase
        .from('batched_deliveries')
        .update({
          total_distance_meters: distance || 0,
          total_duration_seconds: duration || 0,
          optimized_route: route as any
        })
        .eq('id', currentBatch.id);

      if (error) throw error;

      toast({
        title: 'Batch Started',
        description: `Navigate to your first pickup: ${currentBatch.orders[0].restaurant_name}`,
      });

      // Navigate or show directions
    } catch (error) {
      console.error('Error starting batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to start batch',
        variant: 'destructive'
      });
    }
  };

  if (loading && !currentBatch) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Batch Overview */}
      {currentBatch && currentBatch.orders.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">Current Batch</h3>
              <p className="text-gray-600">{currentBatch.orders.length} orders</p>
            </div>
            <Badge className="bg-orange-500 text-white text-lg px-4 py-2">
              Active
            </Badge>
          </div>

          {/* Batch Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Earnings</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${(currentBatch.total_earnings / 100).toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Distance</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {distance ? formatDistance(distance) : 'Calculating...'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-600">Duration</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {duration ? formatDuration(duration) : 'Calculating...'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-gray-600">Per Hour</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {duration ? `$${((currentBatch.total_earnings / 100) / (duration / 3600)).toFixed(2)}` : '---'}
              </p>
            </div>
          </div>

          {/* Orders in Batch */}
          <div className="space-y-3 mb-4">
            {currentBatch.orders.map((order, index) => (
              <Card key={order.id} className="p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 flex-1">
                    <div className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-orange-600" />
                        <h4 className="font-bold">{order.restaurant_name}</h4>
                        <Badge variant="outline">{order.items_count} items</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <MapPin className="w-3 h-3" />
                        <span>{order.delivery_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">For: {order.customer_name}</span>
                        <span className="text-sm font-semibold text-green-600">
                          +${(order.estimated_earnings / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFromBatch(order.id)}
                    className="text-red-600"
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Start Batch Button */}
          <Button
            onClick={handleStartBatch}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-lg py-6"
            disabled={isCalculating}
          >
            <Navigation className="w-5 h-5 mr-2" />
            {isCalculating ? 'Optimizing Route...' : 'Start Batch Delivery'}
          </Button>
        </Card>
      )}

      {/* Available Orders to Add */}
      {canAddMore && availableOrders.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-3">
            {currentBatch ? 'Add More Orders' : 'Available Orders'}
          </h3>
          <div className="space-y-3">
            {availableOrders.map((order) => (
              <Card key={order.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-lg">{order.restaurant_name}</h4>
                      <Badge className="bg-green-600 text-white">
                        +${(order.estimated_earnings / 100).toFixed(2)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="w-4 h-4" />
                        <span>{order.items_count} items • ${(order.total_amount / 100).toFixed(2)} total</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{order.delivery_address}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddOrderToBatch(order.id)}
                    variant="outline"
                    className="ml-4"
                    disabled={!canAddMore}
                  >
                    Add to Batch
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Orders Available */}
      {availableOrders.length === 0 && (!currentBatch || currentBatch.orders.length === 0) && (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="font-bold text-lg mb-2">No Orders Available</h3>
          <p className="text-gray-600">Check back soon for new delivery opportunities</p>
        </Card>
      )}

      {/* Batch Full Message */}
      {!canAddMore && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">
              Your batch is full ({MAX_BATCH_SIZE} orders max). Complete current orders to add more.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

