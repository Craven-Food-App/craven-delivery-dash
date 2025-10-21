import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { 
  Home, Package, User, Heart, Clock, Star, ChevronRight, 
  ShoppingCart, MapPin, Plus, Gift, TrendingUp,
  Receipt, RefreshCw, MessageCircle, Phone, ArrowRight, Check, X,
  Menu, Coffee, Store, Shield, Search, ChevronDown
} from "lucide-react";
import { AccountSection } from "@/components/account/AccountSection";
import OrderTrackingBox from "@/components/OrderTrackingBox";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import { LoyaltyDashboard } from "@/components/loyalty/LoyaltyDashboard";
import cravemoreIcon from "@/assets/cravemore-icon.png";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price_cents: number;
}

interface Order {
  id: string;
  restaurant_id: string;
  order_status: string;
  total_cents: number;
  created_at: string;
  estimated_delivery_time: string;
  items?: OrderItem[];
  order_type?: 'personal' | 'business';
}

interface Restaurant {
  id: string;
  name: string;
  image_url?: string;
}

interface FavoriteRestaurant {
  id: string;
  name: string;
  image_url?: string;
  cuisine_type?: string;
  rating: number;
  delivery_fee_cents: number;
}

const CustomerDashboard = () => {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Record<string, Restaurant>>({});
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);
  const [orderTypeFilter, setOrderTypeFilter] = useState<'personal' | 'business'>('personal');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [activeCategory, setActiveCategory] = useState('home');
  const navigate = useNavigate();
  const { toast } = useToast();

  const tabFromUrl = searchParams.get('tab') || 'home';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const getUserFirstName = () => {
    if (!user) return 'Friend';
    if (user.user_metadata?.first_name) return user.user_metadata.first_name;
    if (user.raw_user_meta_data?.first_name) return user.raw_user_meta_data.first_name;
    if (user.user_metadata?.full_name) return user.user_metadata.full_name.split(' ')[0];
    if (user.email) return user.email.split('@')[0].split('.')[0];
    return 'Friend';
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      if (ordersData && ordersData.length > 0) {
        const restaurantIds = [...new Set(ordersData.map(order => order.restaurant_id))];
        const { data: restaurantsData, error: restaurantsError } = await supabase
          .from("restaurants")
          .select("id, name, image_url")
          .in("id", restaurantIds);

        if (restaurantsError) throw restaurantsError;
        
        const restaurantsMap: Record<string, Restaurant> = {};
        restaurantsData?.forEach(restaurant => {
          restaurantsMap[restaurant.id] = restaurant;
        });
        setRestaurants(restaurantsMap);
      }

      const { data: favoritesData, error: favoritesError } = await supabase
        .from("customer_favorites")
        .select(`
          restaurant_id,
          restaurants (
            id,
            name,
            image_url,
            cuisine_type,
            rating,
            delivery_fee_cents
          )
        `)
        .eq("customer_id", user.id);

      if (favoritesError) {
        console.error("Error fetching favorites:", favoritesError);
        setFavorites([]);
      } else if (favoritesData) {
        const formattedFavorites = favoritesData
          .filter(fav => fav.restaurants)
          .map(fav => fav.restaurants as any as FavoriteRestaurant);
        setFavorites(formattedFavorites);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error loading data",
        description: "There was a problem loading your information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const formatOrderItems = (order: Order) => {
    if (order.items && order.items.length > 0) {
      return order.items.map(item => `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`).join(' • ');
    }
    return 'Order details not available';
  };

  const getItemCount = (order: Order) => {
    if (order.items && order.items.length > 0) {
      return order.items.reduce((total, item) => total + item.quantity, 0);
    }
    return 1;
  };

  const handleViewOrderDetails = (orderId: string) => {
    setDetailsOrderId(orderId);
  };

  const handleTrackOrder = (orderId: string) => {
    setTrackingOrderId(orderId);
  };

  const removeFavorite = async (restaurantId: string) => {
    try {
      const { error } = await supabase
        .from("customer_favorites")
        .delete()
        .eq("customer_id", user?.id)
        .eq("restaurant_id", restaurantId);

      if (error) throw error;

      setFavorites(prev => prev.filter(fav => fav.id !== restaurantId));
      toast({
        title: "Removed from favorites",
        description: "Restaurant removed from your favorites"
      });
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive"
      });
    }
  };

  // Mobile Bottom Navigation
  const MobileBottomNav = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'orders', icon: Package, label: 'Orders' },
          { id: 'account', icon: User, label: 'Account' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => navigate(`?tab=${tab.id}`)}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Mobile Header
  const MobileHeader = () => (
    <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === 'home' ? `Good ${getGreeting()}!` : activeTab === 'orders' ? 'Orders' : 'Account'}
            </h1>
            {activeTab === 'home' && <p className="text-sm text-gray-600">{getUserFirstName()}</p>}
          </div>
          <button 
            onClick={() => setShowMobileNav(!showMobileNav)}
            className="p-2 -mr-2 active:bg-gray-100 rounded-full transition-colors"
          >
            {showMobileNav ? <X className="w-6 h-6 text-gray-900" /> : <Menu className="w-6 h-6 text-gray-900" />}
          </button>
        </div>
        
        {activeTab === 'home' && (
          <button 
            className="flex items-center space-x-2 w-full py-2 px-3 bg-gray-50 rounded-lg"
            onClick={() => {/* Handle address change */}}
          >
            <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs text-gray-500">Deliver to</p>
              <p className="text-sm font-semibold text-gray-900 truncate">6759 Nebraska Ave</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        )}
      </div>
    </div>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  // Navigation categories for hamburger menu
  const navCategories = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'restaurants', label: 'Restaurants', icon: Store },
    { id: 'grocery', label: 'Grocery', icon: Store },
    { id: 'convenience', label: 'Convenience', icon: Coffee },
    { id: 'cravenz', label: "Craven'Z", icon: Store },
    { id: 'beauty', label: 'Beauty', icon: Heart },
    { id: 'pets', label: 'Pets', icon: Heart },
    { id: 'health', label: 'Health', icon: Shield },
    { id: 'cravemore', label: 'CraveMore', icon: Gift },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'account', label: 'Account', icon: User }
  ];

  const handleMenuClick = (categoryId: string) => {
    setShowMobileNav(false);
    
    if (categoryId === 'home') {
      navigate('?tab=home');
    } else if (categoryId === 'restaurants') {
      navigate('/restaurants');
    } else if (categoryId === 'cravenz') {
      navigate('/restaurants');
    } else if (categoryId === 'cravemore') {
      navigate('/cravemore');
    } else if (categoryId === 'orders') {
      navigate('?tab=orders');
    } else if (categoryId === 'account') {
      navigate('?tab=account');
    } else if (['grocery', 'convenience', 'beauty', 'pets', 'health'].includes(categoryId)) {
      navigate('/restaurants');
    }
  };

  // Active Order Card
  const ActiveOrderCard = ({ order }: { order: Order }) => {
    const restaurant = restaurants[order.restaurant_id];
    
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-4">
        <div className="bg-primary text-white px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-semibold">Order in progress</span>
          <span className="text-xs">15-25 min</span>
        </div>
        
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {restaurant?.image_url ? (
                <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{restaurant?.name || 'Restaurant'}</h3>
              <p className="text-sm text-gray-600">{formatPrice(order.total_cents)} • {getItemCount(order)} items</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            {['Confirmed', 'Preparing', 'On the way'].map((step, idx) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {idx === 0 ? '✓' : idx + 1}
                </div>
                {idx < 2 && <div className="flex-1 h-1 bg-gray-200" />}
              </React.Fragment>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleTrackOrder(order.id)}
              className="flex-1 py-2.5 bg-black text-white rounded-lg font-semibold text-sm active:bg-gray-800 transition-colors"
            >
              Track Order
            </button>
            <button className="p-2.5 border border-gray-300 rounded-lg active:bg-gray-50 transition-colors">
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2.5 border border-gray-300 rounded-lg active:bg-gray-50 transition-colors">
              <MessageCircle className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Past Order Card
  const PastOrderCard = ({ order }: { order: Order }) => {
    const restaurant = restaurants[order.restaurant_id];
    
    return (
      <div 
        className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3 active:bg-gray-50 transition-colors"
        onClick={() => handleViewOrderDetails(order.id)}
      >
        <div className="flex p-4">
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {restaurant?.image_url ? (
              <img 
                src={restaurant.image_url} 
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 ml-3 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{restaurant?.name || 'Restaurant'}</h3>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
            </div>
            
            <p className="text-sm text-gray-600 mb-2 line-clamp-1">
              {formatOrderItems(order)}
            </p>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">
                {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatPrice(order.total_cents)}
              </span>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast({ title: "Reorder", description: "Adding items to cart..." });
              }}
              className="w-full py-2 bg-gray-100 text-gray-900 rounded-lg font-semibold text-sm flex items-center justify-center space-x-1 active:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Order Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Mobile Home Tab
  const MobileHomeTab = () => {
    const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status));
    const pastOrders = orders.filter(o => o.order_status === 'delivered').slice(0, 3);

    return (
      <div className="pb-20 bg-gray-50">
        {activeOrders.length > 0 && (
          <div className="px-4 pt-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Active Orders</h2>
            {activeOrders.map(order => <ActiveOrderCard key={order.id} order={order} />)}
          </div>
        )}
        
        <div className="px-4 py-4">
          <div className="bg-gradient-to-br from-primary via-primary to-primary-glow rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img src={cravemoreIcon} alt="CraveMore" className="w-10 h-10" />
                <div>
                  <h3 className="text-xl font-bold">CraveMore</h3>
                  <p className="text-white/90 text-sm">Unlimited benefits</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>$0 Delivery on orders $12+</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Exclusive member deals</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Lower service fees</span>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/cravemore')}
              className="w-full bg-white text-primary py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
            >
              Start Free Trial
            </button>
          </div>
        </div>
        
        {pastOrders.length > 0 && (
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Past Orders</h2>
              <button 
                onClick={() => navigate('?tab=orders')}
                className="text-sm text-primary font-semibold"
              >
                See all
              </button>
            </div>
            
            {pastOrders.map(order => <PastOrderCard key={order.id} order={order} />)}
          </div>
        )}
        
        {favorites.length > 0 && (
          <div className="px-4 mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Your Favorites</h2>
            <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
              {favorites.map((restaurant) => (
                <div 
                  key={restaurant.id}
                  onClick={() => navigate(`/restaurant/${restaurant.id}/menu`)}
                  className="flex-shrink-0 w-40 bg-white rounded-xl border border-gray-200 overflow-hidden active:opacity-75 transition-opacity"
                >
                  <div className="h-24 bg-gray-100">
                    {restaurant.image_url && (
                      <img 
                        src={restaurant.image_url} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-2">
                    <h4 className="font-semibold text-sm text-gray-900 truncate">{restaurant.name}</h4>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs text-gray-600">{restaurant.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="px-4 mt-6">
          <button
            onClick={() => navigate('/restaurants')}
            className="w-full py-4 bg-white border border-gray-200 text-gray-900 rounded-xl font-semibold flex items-center justify-center space-x-2 active:bg-gray-50 transition-colors"
          >
            <span>Explore Restaurants</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // Mobile Orders Tab
  const MobileOrdersTab = () => {
    const [orderFilter, setOrderFilter] = useState<'past' | 'in-progress'>('past');
    const filteredOrders = orderFilter === 'in-progress' 
      ? orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status))
      : orders.filter(o => o.order_status === 'delivered');
      
    return (
      <div className="pb-20 bg-gray-50">
        <div className="sticky top-14 bg-white border-b border-gray-200 z-30">
          <div className="px-4 py-3">
            <div className="flex space-x-2">
              <button
                onClick={() => setOrderFilter('past')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  orderFilter === 'past'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Past Orders
              </button>
              <button
                onClick={() => setOrderFilter('in-progress')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  orderFilter === 'in-progress'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                In Progress
              </button>
            </div>
          </div>
        </div>
        
        <div className="px-4 pt-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">Start exploring restaurants</p>
              <button
                onClick={() => navigate('/restaurants')}
                className="px-6 py-3 bg-black text-white rounded-full font-semibold"
              >
                Browse Restaurants
              </button>
            </div>
          ) : (
            filteredOrders.map(order => (
              orderFilter === 'in-progress' ? (
                <ActiveOrderCard key={order.id} order={order} />
              ) : (
                <PastOrderCard key={order.id} order={order} />
              )
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader />
      
      {activeTab === 'home' && <MobileHomeTab />}
      {activeTab === 'orders' && <MobileOrdersTab />}
      {activeTab === 'account' && (
        <div className="px-4 pt-4 pb-20 bg-gray-50">
          <AccountSection />
        </div>
      )}
      
      <MobileBottomNav />
      
      {/* Mobile Navigation Overlay */}
      {showMobileNav && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileNav(false)}>
          <div 
            className="fixed right-0 top-0 h-full w-72 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Browse</h3>
                <button 
                  onClick={() => setShowMobileNav(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <nav className="space-y-1">
                {navCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleMenuClick(category.id)}
                    className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                  >
                    <category.icon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{category.label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {trackingOrderId && (
        <OrderTrackingBox 
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
        />
      )}
      
      <OrderDetailsModal 
        isOpen={detailsOrderId !== null}
        onClose={() => setDetailsOrderId(null)}
        orderId={detailsOrderId || ''}
      />
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
};

export default CustomerDashboard;
