/**
 * Customer Order History Page
 * Shows past orders with reorder functionality and favorites
 * Competes with DoorDash's order history and reorder features
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Package,
  Clock,
  Star,
  Heart,
  RefreshCw,
  MapPin,
  Store,
  DollarSign,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OrderHistoryItem {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  order_status: string;
  delivery_method: string;
  restaurant: {
    id: string;
    name: string;
    image_url?: string;
    address: string;
    city?: string;
  };
  order_items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  is_favorite?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500', icon: Package },
  preparing: { label: 'Preparing', color: 'bg-purple-500', icon: Clock },
  ready_for_pickup: { label: 'Ready', color: 'bg-green-500', icon: Package },
  picked_up: { label: 'On the Way', color: 'bg-orange-500', icon: MapPin },
  delivered: { label: 'Delivered', color: 'bg-green-600', icon: Package },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: Package },
};

export default function OrderHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, activeTab]);

  const fetchOrderHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants (
            id,
            name,
            image_url,
            address,
            city,
            state
          ),
          order_items (
            id,
            name,
            quantity,
            price
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch favorite restaurants
      const { data: favorites } = await supabase
        .from('favorite_restaurants')
        .select('restaurant_id')
        .eq('user_id', user.id);

      const favoriteIds = new Set(favorites?.map(f => f.restaurant_id) || []);

      const ordersWithFavorites = data.map(order => ({
        ...order,
        is_favorite: favoriteIds.has(order.restaurant_id)
      }));

      setOrders(ordersWithFavorites as any);
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load order history',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.order_items.some(item => 
          item.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter by tab
    if (activeTab === 'favorites') {
      filtered = filtered.filter(order => order.is_favorite);
    } else if (activeTab === 'delivered') {
      filtered = filtered.filter(order => order.order_status === 'delivered');
    } else if (activeTab === 'active') {
      filtered = filtered.filter(order => 
        !['delivered', 'cancelled'].includes(order.order_status)
      );
    }

    setFilteredOrders(filtered);
  };

  const handleReorder = async (order: OrderHistoryItem) => {
    try {
      // Navigate to restaurant page with pre-filled cart
      const cartItems = order.order_items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      // Store cart items in session storage
      sessionStorage.setItem('reorder_cart', JSON.stringify(cartItems));
      sessionStorage.setItem('reorder_restaurant_id', order.restaurant.id);

      toast({
        title: 'Reordering',
        description: 'Adding items to your cart...',
      });

      // Navigate to restaurant
      navigate(`/restaurant/${order.restaurant.id}`);
    } catch (error) {
      console.error('Error reordering:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder',
        variant: 'destructive'
      });
    }
  };

  const handleToggleFavorite = async (restaurantId: string, currentlyFavorite: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (currentlyFavorite) {
        // Remove from favorites
        await supabase
          .from('favorite_restaurants')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', restaurantId);

        toast({
          title: 'Removed from Favorites',
          description: 'Restaurant removed from your favorites',
        });
      } else {
        // Add to favorites
        await supabase
          .from('favorite_restaurants')
          .insert({
            user_id: user.id,
            restaurant_id: restaurantId
          });

        toast({
          title: 'Added to Favorites',
          description: 'Restaurant added to your favorites',
        });
      }

      // Refresh orders
      fetchOrderHistory();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorites',
        variant: 'destructive'
      });
    }
  };

  const handleTrackOrder = (orderId: string) => {
    navigate(`/track-order/${orderId}`);
  };

  const handleViewReceipt = (orderId: string) => {
    navigate(`/receipt/${orderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Order History</h1>
          <p className="text-orange-100">Your past orders and favorites</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4 mt-4">
        {/* Search & Filter */}
        <Card className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search orders, restaurants, or items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
            <TabsTrigger value="active">
              Active ({orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status)).length})
            </TabsTrigger>
            <TabsTrigger value="delivered">
              Delivered ({orders.filter(o => o.order_status === 'delivered').length})
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Heart className="w-4 h-4 mr-1 fill-current" />
              Favorites ({orders.filter(o => o.is_favorite).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {filteredOrders.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="font-bold text-lg mb-2">No Orders Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'Try a different search term' : "You haven't placed any orders yet"}
                </p>
                <Button onClick={() => navigate('/')}>
                  Start Ordering
                </Button>
              </Card>
            ) : (
              filteredOrders.map((order) => {
                const statusInfo = STATUS_CONFIG[order.order_status] || STATUS_CONFIG.pending;
                const StatusIcon = statusInfo.icon;

                return (
                  <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Restaurant Image */}
                          {order.restaurant?.image_url ? (
                            <img 
                              src={order.restaurant.image_url}
                              alt={order.restaurant.name}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                              <Store className="w-10 h-10 text-orange-300" />
                            </div>
                          )}

                          {/* Order Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-xl">{order.restaurant?.name}</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleFavorite(order.restaurant.id, order.is_favorite || false)}
                                className="p-1"
                              >
                                <Heart 
                                  className={`w-5 h-5 ${order.is_favorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                                />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {order.restaurant?.address}, {order.restaurant?.city}
                            </p>
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge className={`${statusInfo.color} text-white`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-sm text-gray-600">
                                Order #{order.order_number || order.id.substring(0, 8).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-600">
                            ${(order.total_amount / 100).toFixed(2)}
                          </div>
                          <p className="text-sm text-gray-600">{order.order_items?.length || 0} items</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="space-y-2">
                          {order.order_items?.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="text-gray-600">${(item.price / 100).toFixed(2)}</span>
                            </div>
                          ))}
                          {order.order_items?.length > 3 && (
                            <p className="text-sm text-gray-500">
                              +{order.order_items.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={() => handleReorder(order)}
                          variant="outline"
                          className="flex-1"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reorder
                        </Button>

                        {!['delivered', 'cancelled'].includes(order.order_status) && (
                          <Button
                            onClick={() => handleTrackOrder(order.id)}
                            className="bg-gradient-to-r from-orange-500 to-red-500 flex-1"
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            Track Order
                          </Button>
                        )}

                        <Button
                          onClick={() => handleViewReceipt(order.id)}
                          variant="ghost"
                        >
                          View Receipt
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

