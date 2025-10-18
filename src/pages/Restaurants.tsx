import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RestaurantGrid from '@/components/RestaurantGrid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MapPin, 
  Filter, 
  Star, 
  Clock, 
  Zap, 
  TrendingUp, 
  ChevronLeft, 
  Plus,
  Bell,
  ShoppingCart,
  Home,
  Utensils,
  Coffee,
  Store,
  Heart,
  User,
  Settings,
  ChevronRight,
  Flame,
  Award,
  Truck,
  Shield,
  DollarSign,
  Timer,
  Navigation,
  Menu,
  X
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const Restaurants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [cuisineFilter, setCuisineFilter] = useState(searchParams.get('cuisine') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
  const [weeklyDeals, setWeeklyDeals] = useState<any[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [activeFilter, setActiveFilter] = useState('deals');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const weeklyDealsScrollRef = useRef<HTMLDivElement>(null);
  const featuredScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (location) params.set('location', location);
    if (cuisineFilter && cuisineFilter !== 'all') params.set('cuisine', cuisineFilter);
    if (sortBy !== 'rating') params.set('sort', sortBy);
    setSearchParams(params);
  }, [searchQuery, location, cuisineFilter, sortBy, setSearchParams]);

  const handleSearch = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Scroll functions for horizontal sections
  const scrollWeeklyDealsLeft = () => {
    if (weeklyDealsScrollRef.current) {
      weeklyDealsScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollWeeklyDealsRight = () => {
    if (weeklyDealsScrollRef.current) {
      weeklyDealsScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const scrollFeaturedLeft = () => {
    if (featuredScrollRef.current) {
      featuredScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollFeaturedRight = () => {
    if (featuredScrollRef.current) {
      featuredScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // Fetch promoted restaurants for weekly deals
  const fetchWeeklyDeals = async () => {
    try {
      setLoadingDeals(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          promotion_title,
          promotion_description,
          promotion_discount_percentage,
          promotion_discount_amount_cents,
          promotion_minimum_order_cents,
          promotion_maximum_discount_cents,
          promotion_valid_until,
          promotion_image_url
        `)
        .eq('is_promoted', true)
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(6);

      if (error) throw error;
      setWeeklyDeals(data || []);
    } catch (error) {
      console.error('Error fetching weekly deals:', error);
      setWeeklyDeals([]);
    } finally {
      setLoadingDeals(false);
    }
  };

  // Fetch deals on component mount
  useEffect(() => {
    fetchWeeklyDeals();
  }, []);

  // Navigation categories
  const navCategories = [
    { id: 'home', label: 'Home', icon: Home, active: true },
    { id: 'grocery', label: 'Grocery', icon: Store },
    { id: 'convenience', label: 'Convenience', icon: Coffee },
    { id: 'dashmart', label: 'CraveMart', icon: Store },
    { id: 'beauty', label: 'Beauty', icon: Heart },
    { id: 'pets', label: 'Pets', icon: Heart },
    { id: 'health', label: 'Health', icon: Shield },
    { id: 'browse', label: 'Browse All', icon: Search, active: true },
    { id: 'orders', label: 'Orders', icon: Clock },
    { id: 'account', label: 'Account', icon: User }
  ];

  // Filter options
  const filterOptions = [
    { id: 'deals', label: 'Deals', active: true },
    { id: 'pickup', label: 'Pickup' },
    { id: 'rating', label: 'Over 4.5★' },
    { id: 'time', label: 'Under 30 min' },
    { id: 'price', label: 'Price' },
    { id: 'dashpass', label: 'CravePass' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  {/* CRAVE'N Logo with gradient and special effects */}
                  <div className="text-2xl font-bold uppercase tracking-wider">
                    <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent relative">
                      C
                      {/* Bitten effect particles */}
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full opacity-60"></div>
                      <div className="absolute top-0 -right-2 w-1 h-1 bg-orange-400 rounded-full opacity-40"></div>
                      <div className="absolute top-1 -right-1 w-1.5 h-1.5 bg-orange-600 rounded-full opacity-50"></div>
                    </span>
                    <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">RAVE</span>
                    <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent relative">
                      '
                      {/* Apostrophe dot */}
                      <div className="absolute top-0 left-0 w-1 h-1 bg-orange-500 rounded-full"></div>
                    </span>
                    <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">N</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  placeholder="Search Crave'N" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Right: Location, Delivery/Pickup, Notifications, Cart */}
            <div className="flex items-center space-x-4">
              {/* Location */}
              <div className="flex items-center space-x-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">6759 Nebraska Ave</span>
                <ChevronRight className="w-4 h-4" />
              </div>

              {/* Delivery/Pickup Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeFilter === 'delivery' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}>
                  Delivery
                </button>
                <button className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeFilter === 'pickup' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}>
                  Pickup
                </button>
              </div>

              {/* Notifications */}
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">1</span>
              </div>

              {/* Cart */}
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">1</span>
              </div>

              {/* Mobile Menu */}
              <button 
                onClick={() => setShowMobileNav(!showMobileNav)}
                className="lg:hidden p-2"
              >
                {showMobileNav ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Right Side Navigation */}
        <div className="hidden lg:block w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Browse</h3>
            <nav className="space-y-1">
              {navCategories.map((category) => (
                <button
                  key={category.id}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    category.active 
                      ? 'bg-orange-100 text-orange-600 border-l-4 border-orange-500' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <category.icon className="w-5 h-5" />
                  <span className="font-medium">{category.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Filter Bar */}
          <div className="border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center space-x-4 overflow-x-auto">
                {filterOptions.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      filter.active 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* National Favorites Section */}
          <div className="bg-white py-8">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">National favorites</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">See All</span>
                  <div className="flex space-x-1">
                    <button 
                      onClick={scrollFeaturedLeft}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={scrollFeaturedRight}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Featured Restaurant Cards */}
              <div className="flex space-x-6 overflow-x-auto pb-4" ref={featuredScrollRef}>
                {[
                  {
                    name: "Chick-fil-A",
                    image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=200&fit=crop",
                    rating: 4.7,
                    reviews: "10k+",
                    distance: "2.0 mi",
                    time: "23 min",
                    deliveryFee: "$4.49",
                    freeDelivery: "$0 delivery fee over $12",
                    badge: "Customer favorite"
                  },
                  {
                    name: "Domino's",
                    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
                    rating: 4.4,
                    reviews: "50+",
                    distance: "1.9 mi",
                    time: "40 min",
                    deliveryFee: "$0.99",
                    freeDelivery: "40% off select items",
                    badge: null
                  },
                  {
                    name: "Starbucks",
                    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",
                    rating: 4.6,
                    reviews: "200+",
                    distance: "1.9 mi",
                    time: "31 min",
                    deliveryFee: "$0.49",
                    freeDelivery: "Customer favorite",
                    badge: "Customer favorite"
                  },
                  {
                    name: "McDonald's",
                    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=200&fit=crop",
                    rating: 4.0,
                    reviews: "1k+",
                    distance: "1.9 mi",
                    time: "26 min",
                    deliveryFee: "$3.99",
                    freeDelivery: "$0 delivery fee over $12",
                    badge: "Free item on $15+"
                  }
                ].map((restaurant, index) => (
                  <div key={index} className="flex-shrink-0 w-80 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="h-48 overflow-hidden rounded-t-xl">
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                        <ChevronRight className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                        <span>{restaurant.rating} ★ ({restaurant.reviews}) • {restaurant.distance} • {restaurant.time}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900">{restaurant.deliveryFee}</p>
                        <p className="text-sm text-gray-600">{restaurant.freeDelivery}</p>
                        {restaurant.badge && (
                          <div className="flex items-center text-orange-600 font-semibold text-sm">
                            <Plus className="w-4 h-4 mr-1" />
                            <span>{restaurant.badge}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deals for You Section */}
          <div className="bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Deals for you</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">See All</span>
                  <div className="flex space-x-1">
                    <button 
                      onClick={scrollWeeklyDealsLeft}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={scrollWeeklyDealsRight}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Weekly Deals Cards */}
              {loadingDeals ? (
                <div className="flex space-x-6 overflow-x-auto pb-4">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="flex-shrink-0 w-80 bg-gray-200 rounded-xl animate-pulse">
                      <div className="h-48 bg-gray-300"></div>
                      <div className="p-4">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : weeklyDeals.length > 0 ? (
                <div className="flex space-x-6 overflow-x-auto pb-4" ref={weeklyDealsScrollRef}>
                  {weeklyDeals.map((restaurant) => {
                    const formatPromotionTitle = () => {
                      if (restaurant.promotion_title) return restaurant.promotion_title;
                      
                      if (restaurant.promotion_discount_percentage) {
                        const maxDiscount = restaurant.promotion_maximum_discount_cents 
                          ? `, up to $${(restaurant.promotion_maximum_discount_cents / 100).toFixed(0)}`
                          : '';
                        return `${restaurant.promotion_discount_percentage}% off${maxDiscount}`;
                      }
                      
                      if (restaurant.promotion_discount_amount_cents) {
                        return `$${(restaurant.promotion_discount_amount_cents / 100).toFixed(2)} off`;
                      }
                      
                      return '+ Featured Deal';
                    };

                    const formatPromotionDescription = () => {
                      if (restaurant.promotion_description) return restaurant.promotion_description;
                      
                      if (restaurant.promotion_minimum_order_cents) {
                        return `Valid on orders over $${(restaurant.promotion_minimum_order_cents / 100).toFixed(0)}`;
                      }
                      
                      return 'Special promotion available';
                    };

                    return (
                      <div key={restaurant.id} className="flex-shrink-0 w-80 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="h-48 overflow-hidden rounded-t-xl">
                          <img
                            src={restaurant.promotion_image_url || restaurant.image_url || `https://placehold.co/320x192/FF6B35/ffffff?text=${encodeURIComponent(restaurant.name)}`}
                            alt={restaurant.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `https://placehold.co/320x192/FF6B35/ffffff?text=${encodeURIComponent(restaurant.name)}`;
                            }}
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-1">{restaurant.name}</h3>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                            <span>{restaurant.rating.toFixed(1)} ★ • {restaurant.min_delivery_time}-{restaurant.max_delivery_time} min</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            ${(restaurant.delivery_fee_cents / 100).toFixed(2)} delivery fee
                          </p>
                          <p className="text-xs text-gray-500 mb-2">Sponsored</p>
                          <div className="flex items-center text-orange-600 font-semibold">
                            <Plus className="w-4 h-4 mr-1" />
                            <span>{formatPromotionTitle()}</span>
                          </div>
                          {restaurant.promotion_description && (
                            <p className="text-xs text-gray-600 mt-1">{formatPromotionDescription()}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No weekly deals available at the moment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white py-8" ref={resultsRef}>
            <div className="max-w-7xl mx-auto px-4">
              {/* Results Header */}
              {(searchQuery || location || cuisineFilter !== 'all') && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {searchQuery ? `Results for "${searchQuery}"` : 'Restaurants Near You'}
                  </h2>
                  {location && (
                    <p className="text-gray-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Delivering to: {location}
                    </p>
                  )}
                </div>
              )}

              {/* Restaurant Grid */}
              <RestaurantGrid 
                searchQuery={searchQuery} 
                deliveryAddress={location} 
                cuisineFilter={cuisineFilter}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {showMobileNav && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Browse</h3>
                <button 
                  onClick={() => setShowMobileNav(false)}
                  className="p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {navCategories.map((category) => (
                  <button
                    key={category.id}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      category.active 
                        ? 'bg-orange-100 text-orange-600 border-l-4 border-orange-500' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <category.icon className="w-5 h-5" />
                    <span className="font-medium">{category.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Restaurants;