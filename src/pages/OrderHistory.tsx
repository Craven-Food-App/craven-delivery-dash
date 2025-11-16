import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Box,
  Card,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Loader,
  Center,
  Tabs,
  Image,
  ActionIcon,
  TextInput,
} from '@mantine/core';
import {
  IconPackage,
  IconClock,
  IconStar,
  IconHeart,
  IconRefreshCw,
  IconMapPin,
  IconStore,
  IconDollarSign,
  IconChevronRight,
  IconFilter,
  IconSearch,
} from '@tabler/icons-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  pending: { label: 'Pending', color: 'yellow', icon: IconClock },
  confirmed: { label: 'Confirmed', color: 'blue', icon: IconPackage },
  preparing: { label: 'Preparing', color: 'violet', icon: IconClock },
  ready_for_pickup: { label: 'Ready', color: 'green', icon: IconPackage },
  picked_up: { label: 'On the Way', color: 'orange', icon: IconMapPin },
  delivered: { label: 'Delivered', color: 'green', icon: IconPackage },
  cancelled: { label: 'Cancelled', color: 'red', icon: IconPackage },
};

export default function OrderHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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

  if (loading) {
    return (
      <Box style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)' }}>
        <Center style={{ height: '100vh' }}>
          <Stack align="center" gap="md">
            <Loader size="lg" color="#ff7a00" />
            <Text c="dimmed">Loading order history...</Text>
          </Stack>
        </Center>
      </Box>
    );
  }

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)', paddingBottom: '80px' }}>
      {/* Header */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #ff7a00 0%, #ff9f40 100%)',
          color: 'white',
          padding: '24px 16px',
        }}
      >
        <Box style={{ maxWidth: isMobile ? '100%' : '1200px', margin: '0 auto' }}>
          <Text fw={700} size="2xl" mb="xs">
            Order History
          </Text>
          <Text c="rgba(255,255,255,0.9)">
            Your past orders and favorites
          </Text>
        </Box>
      </Box>

      <Box style={{ maxWidth: isMobile ? '100%' : '1200px', margin: '0 auto', padding: '16px' }}>
        <Stack gap="lg">
          {/* Search */}
          <Card p="md">
            <TextInput
              placeholder="Search orders, restaurants, or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconSearch size={16} />}
            />
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'all')}>
            <Tabs.List>
              <Tabs.Tab value="all">
                All ({orders.length})
              </Tabs.Tab>
              <Tabs.Tab value="active">
                Active ({orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status)).length})
              </Tabs.Tab>
              <Tabs.Tab value="delivered">
                Delivered ({orders.filter(o => o.order_status === 'delivered').length})
              </Tabs.Tab>
              <Tabs.Tab value="favorites">
                <Group gap={4}>
                  <IconHeart size={14} />
                  Favorites ({orders.filter(o => o.is_favorite).length})
                </Group>
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value={activeTab} pt="lg">
              {filteredOrders.length === 0 ? (
                <Card p="xl">
                  <Stack align="center" gap="md">
                    <IconPackage size={48} style={{ color: 'var(--mantine-color-gray-4)' }} />
                    <Text fw={600} size="lg">No Orders Found</Text>
                    <Text c="dimmed" ta="center">
                      {searchQuery ? 'Try a different search term' : "You haven't placed any orders yet"}
                    </Text>
                    <Button onClick={() => navigate('/restaurants')} color="#ff7a00">
                      Start Ordering
                    </Button>
                  </Stack>
                </Card>
              ) : (
                <Stack gap="md">
                  {filteredOrders.map((order) => {
                    const statusInfo = STATUS_CONFIG[order.order_status] || STATUS_CONFIG.pending;
                    const StatusIcon = statusInfo.icon;

                    return (
                      <Card key={order.id} withBorder p="lg" style={{ cursor: 'pointer' }}>
                        <Stack gap="md">
                          {/* Header */}
                          <Group justify="space-between" align="flex-start">
                            <Group gap="md" align="flex-start" style={{ flex: 1 }}>
                              {/* Restaurant Image */}
                              {order.restaurant?.image_url ? (
                                <Image
                                  src={order.restaurant.image_url}
                                  alt={order.restaurant.name}
                                  width={80}
                                  height={80}
                                  radius="md"
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                <Box
                                  style={{
                                    width: 80,
                                    height: 80,
                                    backgroundColor: 'var(--mantine-color-gray-2)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <IconStore size={40} style={{ color: 'var(--mantine-color-gray-5)' }} />
                                </Box>
                              )}

                              {/* Order Info */}
                              <Stack gap="xs" style={{ flex: 1 }}>
                                <Group gap="xs">
                                  <Text fw={600} size="lg">
                                    {order.restaurant?.name}
                                  </Text>
                                  <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    size="sm"
                                    onClick={() => handleToggleFavorite(order.restaurant.id, order.is_favorite || false)}
                                  >
                                    <IconHeart
                                      size={18}
                                      style={{
                                        fill: order.is_favorite ? 'currentColor' : 'none',
                                        color: order.is_favorite ? 'var(--mantine-color-red-6)' : 'var(--mantine-color-gray-6)',
                                      }}
                                    />
                                  </ActionIcon>
                                </Group>
                                {order.restaurant?.address && (
                                  <Group gap={4}>
                                    <IconMapPin size={14} style={{ color: 'var(--mantine-color-gray-6)' }} />
                                    <Text size="sm" c="dimmed">
                                      {order.restaurant.address}, {order.restaurant.city}
                                    </Text>
                                  </Group>
                                )}
                                <Group gap="md" wrap="wrap">
                                  <Badge color={statusInfo.color} leftSection={<StatusIcon size={12} />}>
                                    {statusInfo.label}
                                  </Badge>
                                  <Text size="sm" c="dimmed">
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </Text>
                                  <Text size="sm" c="dimmed">
                                    Order #{order.order_number || order.id.substring(0, 8).toUpperCase()}
                                  </Text>
                                </Group>
                              </Stack>
                            </Group>

                            {/* Total */}
                            <Stack align="flex-end" gap={4}>
                              <Text fw={700} size="xl" c="#ff7a00">
                                ${(order.total_amount / 100).toFixed(2)}
                              </Text>
                              <Text size="sm" c="dimmed">
                                {order.order_items?.length || 0} items
                              </Text>
                            </Stack>
                          </Group>

                          {/* Items */}
                          <Card p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                            <Stack gap="xs">
                              {order.order_items?.slice(0, 3).map((item, idx) => (
                                <Group key={idx} justify="space-between">
                                  <Text size="sm">
                                    {item.quantity}x {item.name}
                                  </Text>
                                  <Text size="sm" c="dimmed">
                                    ${(item.price / 100).toFixed(2)}
                                  </Text>
                                </Group>
                              ))}
                              {order.order_items?.length > 3 && (
                                <Text size="sm" c="dimmed">
                                  +{order.order_items.length - 3} more items
                                </Text>
                              )}
                            </Stack>
                          </Card>

                          {/* Actions */}
                          <Group gap="md">
                            <Button
                              onClick={() => handleReorder(order)}
                              variant="outline"
                              leftSection={<IconRefreshCw size={16} />}
                              style={{ flex: 1 }}
                            >
                              Reorder
                            </Button>

                            {!['delivered', 'cancelled'].includes(order.order_status) && (
                              <Button
                                onClick={() => handleTrackOrder(order.id)}
                                leftSection={<IconMapPin size={16} />}
                                style={{ flex: 1 }}
                                color="#ff7a00"
                              >
                                Track Order
                              </Button>
                            )}
                          </Group>
                        </Stack>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Box>
    </Box>
  );
}
