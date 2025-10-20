import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Package,
  CheckCircle,
  Printer,
  Send,
  Building2,
  MapPin,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateShippingLabel } from '@/utils/generateShippingLabel';

interface ShippingQueueProps {
  onRefresh: () => void;
}

export function ShippingQueue({ onRefresh }: ShippingQueueProps) {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchReadyRestaurants();
  }, []);

  const fetchReadyRestaurants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurant_onboarding_progress')
        .select(`
          *,
          restaurant:restaurants!inner(
            id,
            name,
            address,
            city,
            state,
            zip_code,
            email,
            phone
          )
        `)
        .eq('business_info_verified', true)
        .eq('tablet_shipped', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformed = (data || []).map(item => ({
        ...item,
        restaurant: Array.isArray(item.restaurant) ? item.restaurant[0] : item.restaurant
      })).filter(item => item.restaurant);

      setRestaurants(transformed);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load shipping queue');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRestaurant = (restaurantId: string, selected: boolean) => {
    if (selected) {
      setSelectedRestaurants(prev => [...prev, restaurantId]);
    } else {
      setSelectedRestaurants(prev => prev.filter(id => id !== restaurantId));
    }
  };

  const handleSelectAll = () => {
    if (selectedRestaurants.length === restaurants.length) {
      setSelectedRestaurants([]);
    } else {
      setSelectedRestaurants(restaurants.map(r => r.restaurant_id));
    }
  };

  const handleBulkGenerateLabels = async () => {
    if (selectedRestaurants.length === 0) {
      toast.error('Please select restaurants first');
      return;
    }

    setIsProcessing(true);
    try {
      let successCount = 0;

      for (const restaurantId of selectedRestaurants) {
        const restaurant = restaurants.find(r => r.restaurant_id === restaurantId);
        if (!restaurant) continue;

        try {
          const labelUrl = await generateShippingLabel({
            recipient: {
              name: restaurant.restaurant.name,
              address: restaurant.restaurant.address,
              city: restaurant.restaurant.city,
              state: restaurant.restaurant.state,
              zip: restaurant.restaurant.zip_code,
              phone: restaurant.restaurant.phone,
            },
          });

          // Update database
          await supabase
            .from('restaurant_onboarding_progress')
            .update({
              tablet_preparing_shipment: true,
              tablet_preparing_at: new Date().toISOString(),
              tablet_shipping_label_url: labelUrl,
            })
            .eq('restaurant_id', restaurantId);

          successCount++;
        } catch (error) {
          console.error(`Error processing ${restaurant.restaurant.name}:`, error);
        }
      }

      toast.success(`Generated ${successCount} shipping labels!`);
      setSelectedRestaurants([]);
      onRefresh();
    } catch (error) {
      console.error('Error generating labels:', error);
      toast.error('Failed to generate labels');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkMarkShipped = async () => {
    if (selectedRestaurants.length === 0) {
      toast.error('Please select restaurants first');
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('restaurant_onboarding_progress')
        .update({
          tablet_shipped: true,
          tablet_shipped_at: new Date().toISOString(),
        })
        .in('restaurant_id', selectedRestaurants);

      if (error) throw error;

      toast.success(`Marked ${selectedRestaurants.length} tablets as shipped!`);
      setSelectedRestaurants([]);
      onRefresh();
    } catch (error) {
      console.error('Error marking as shipped:', error);
      toast.error('Failed to update shipment status');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 animate-pulse mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Loading shipping queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Batch Actions Toolbar */}
      {selectedRestaurants.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-sm">
                {selectedRestaurants.length} restaurants selected
              </Badge>
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkGenerateLabels}
                  disabled={isProcessing}
                  variant="outline"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Generate Labels ({selectedRestaurants.length})
                </Button>
                <Button
                  onClick={handleBulkMarkShipped}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Mark as Shipped ({selectedRestaurants.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ready to Ship ({restaurants.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedRestaurants.length === restaurants.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {restaurants.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">All Caught Up!</p>
              <p className="text-sm text-muted-foreground mt-1">
                No restaurants waiting for tablet shipment
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                    selectedRestaurants.includes(restaurant.restaurant_id)
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Checkbox
                    checked={selectedRestaurants.includes(restaurant.restaurant_id)}
                    onCheckedChange={(checked) =>
                      handleSelectRestaurant(restaurant.restaurant_id, checked as boolean)
                    }
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold">{restaurant.restaurant.name}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {restaurant.restaurant.address}, {restaurant.restaurant.city}, {restaurant.restaurant.state} {restaurant.restaurant.zip_code}
                        </p>
                      </div>
                      {restaurant.tablet_preparing_shipment && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          Label Generated
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Verified {new Date(restaurant.business_verified_at).toLocaleDateString()}
                      </span>
                      {restaurant.tablet_preparing_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Prepared {new Date(restaurant.tablet_preparing_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

