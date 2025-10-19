import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Store, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface RestaurantOnboarding {
  id: string;
  restaurant_id: string;
  menu_preparation_status: string;
  business_info_verified: boolean;
  go_live_ready: boolean;
  restaurant: {
    name: string;
    owner_id: string;
    email: string;
    phone: string;
    onboarding_status: string;
    created_at: string;
    banking_complete: boolean;
    readiness_score: number;
  };
}

const RestaurantOnboardingDashboard = () => {
  const [restaurants, setRestaurants] = useState<RestaurantOnboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_onboarding_progress')
        .select(`
          *,
          restaurant:restaurants!inner(
            name,
            owner_id,
            email,
            phone,
            onboarding_status,
            created_at,
            banking_complete,
            readiness_score
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const updateMenuStatus = async (restaurantId: string, status: string) => {
    try {
      const { error } = await supabase.functions.invoke('update-menu-preparation-status', {
        body: { restaurant_id: restaurantId, status }
      });

      if (error) throw error;
      toast.success('Menu status updated');
      fetchRestaurants();
    } catch (error) {
      console.error('Error updating menu status:', error);
      toast.error('Failed to update menu status');
    }
  };

  const getStatusBadge = (restaurant: RestaurantOnboarding) => {
    if (restaurant.business_info_verified && restaurant.restaurant.banking_complete && restaurant.menu_preparation_status === 'ready') {
      return <Badge className="bg-green-500">Ready to Go Live</Badge>;
    }
    if (restaurant.business_info_verified) {
      return <Badge className="bg-blue-500">In Progress</Badge>;
    }
    return <Badge className="bg-yellow-500">Pending Verification</Badge>;
  };

  const filteredRestaurants = restaurants.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !r.business_info_verified;
    if (filter === 'in_progress') return r.business_info_verified && r.menu_preparation_status !== 'ready';
    if (filter === 'ready') return r.business_info_verified && r.restaurant.banking_complete && r.menu_preparation_status === 'ready';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Restaurant Onboarding</h2>
          <p className="text-muted-foreground">Manage merchant onboarding and verification</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {restaurants.filter(r => !r.business_info_verified).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {restaurants.filter(r => r.business_info_verified && r.menu_preparation_status !== 'ready').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ready to Launch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {restaurants.filter(r => r.business_info_verified && r.restaurant.banking_complete && r.menu_preparation_status === 'ready').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
          All
        </Button>
        <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>
          Pending
        </Button>
        <Button variant={filter === 'in_progress' ? 'default' : 'outline'} onClick={() => setFilter('in_progress')}>
          In Progress
        </Button>
        <Button variant={filter === 'ready' ? 'default' : 'outline'} onClick={() => setFilter('ready')}>
          Ready
        </Button>
      </div>

      {/* Restaurant List */}
      <div className="space-y-4">
        {filteredRestaurants.map((restaurant) => (
          <Card key={restaurant.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>{restaurant.restaurant.name}</CardTitle>
                    <CardDescription>{restaurant.restaurant.email}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(restaurant)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  {restaurant.business_info_verified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">Business Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  {restaurant.restaurant.banking_complete ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">Banking Complete</span>
                </div>
                <div className="flex items-center gap-2">
                  {restaurant.menu_preparation_status === 'ready' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : restaurant.menu_preparation_status === 'in_progress' ? (
                    <Clock className="h-4 w-4 text-blue-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">Menu: {restaurant.menu_preparation_status}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${restaurant.restaurant.readiness_score || 0}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">{restaurant.restaurant.readiness_score || 0}%</span>
              </div>

              <div className="flex gap-2">
                {restaurant.menu_preparation_status === 'not_started' && (
                  <Button 
                    size="sm"
                    onClick={() => updateMenuStatus(restaurant.restaurant_id, 'in_progress')}
                  >
                    Start Menu Preparation
                  </Button>
                )}
                {restaurant.menu_preparation_status === 'in_progress' && (
                  <Button 
                    size="sm"
                    onClick={() => updateMenuStatus(restaurant.restaurant_id, 'ready')}
                  >
                    Mark Menu Ready
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RestaurantOnboardingDashboard;
