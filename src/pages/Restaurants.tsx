import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RestaurantGrid from '@/components/RestaurantGrid';
import AccountPopup from '@/components/AccountPopup';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
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
  X,
  Sparkles,
  Crown,
  Gift,
  Target,
  TrendingDown,
  Users,
  Globe,
  Smartphone,
  Wifi,
  CreditCard,
  ShieldCheck,
  TruckIcon,
  MapIcon,
  Phone,
  MessageCircle,
  Share2,
  Bookmark,
  Eye,
  ThumbsUp,
  RefreshCw,
  ChevronDown,
  SlidersHorizontal,
  SortAsc,
  Grid3X3,
  List,
  Layers,
  Compass,
  Zap as Lightning,
  Star as StarIcon,
  Clock as ClockIcon,
  DollarSign as DollarIcon,
  Truck as TruckIconAlt,
  Navigation as NavigationIcon,
  MapPin as MapPinIcon,
  Phone as PhoneIcon,
  MessageCircle as MessageIcon,
  Share2 as ShareIcon,
  Bookmark as BookmarkIcon,
  Eye as EyeIcon,
  ThumbsUp as ThumbsUpIcon,
  RefreshCw as RefreshIcon,
  ChevronDown as ChevronDownIcon,
  SlidersHorizontal as SlidersIcon,
  SortAsc as SortIcon,
  Grid3X3 as GridIcon,
  List as ListIcon,
  Layers as LayersIcon,
  Compass as CompassIcon,
  Package
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import cravenLogo from "@/assets/craven-logo.png";

// Professional Rating Icon Component
const RatingPill = ({ rating }: { rating: number }) => (
  <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full shadow-md">
    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
    <span className="text-xs font-semibold text-neutral-900">{rating}</span>
  </span>
);

// Professional Restaurant Card
const RestaurantCard = ({ 
  restaurant, 
  likedItems, 
  toggleLike 
}: { 
  restaurant: any; 
  likedItems: Set<string>; 
  toggleLike: (id: string) => void;
}) => (
  <article
    className="min-w-[280px] bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer active:scale-[0.98] border border-neutral-100"
  >
    <div className="relative h-40 bg-neutral-100">
      <img
        src={restaurant.image || restaurant.image_url || `https://placehold.co/600x400/f5f5f5/333?text=Craven`}
        alt={restaurant.name}
        onError={(e) => { 
          const target = e.target as HTMLImageElement;
          target.onerror = null; 
          target.src = "https://placehold.co/600x400/f5f5f5/333?text=Craven"; 
        }}
        className="w-full h-full object-cover transition-opacity duration-500"
      />

      <div className="absolute top-0 right-0 p-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(restaurant.id);
          }}
          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-transform active:scale-90 shadow"
          aria-label={`Favorite ${restaurant.name}`}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              likedItems.has(restaurant.id)
                ? 'fill-red-700 text-red-700'
                : 'text-neutral-500'
            }`}
          />
        </button>
      </div>

      <div className="absolute bottom-3 left-3">
        <RatingPill rating={restaurant.rating || 4.5} />
      </div>

      {restaurant.time && (
        <div className="absolute bottom-3 right-3 bg-white px-3 py-1 rounded-full shadow-md">
          <div className="flex items-center gap-1 text-sm font-semibold text-neutral-800">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span>{restaurant.time}</span>
          </div>
        </div>
      )}
    </div>

    <div className="p-4">
      <h3 className="text-lg font-extrabold text-neutral-900 mb-0.5 truncate">
        {restaurant.name}
      </h3>
      <div className="flex items-center gap-2 text-sm text-neutral-600 mb-1">
        <span>{restaurant.distance || '0.5 mi'}</span>
        <span className="text-neutral-400">•</span>
        <span>{restaurant.reviews || '0'} reviews</span>
      </div>
      {restaurant.promo && (
        <p className="text-sm font-semibold text-red-700 mt-2">{restaurant.promo}</p>
      )}
    </div>
  </article>
);

const Restaurants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '6759 Nebraska Ave');
  const [cuisineFilter, setCuisineFilter] = useState(searchParams.get('cuisine') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
  const [weeklyDeals, setWeeklyDeals] = useState<any[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [activeFilter, setActiveFilter] = useState('deals');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Mobile app states
  const [showMain, setShowMain] = useState(false);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [cartCount] = useState(3);
  
  // New state for enhanced functionality
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<any[]>([]);
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const [accountPopupPosition, setAccountPopupPosition] = useState({ top: 0, left: 0 });
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const currentLocation = useLocation();
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const weeklyDealsScrollRef = useRef<HTMLDivElement>(null);
  const featuredScrollRef = useRef<HTMLDivElement>(null);

  const toggleLike = useCallback((id: string) => {
    setLikedItems(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(id)) {
        newLiked.delete(id);
      } else {
        newLiked.add(id);
      }
      return newLiked;
    });
  }, []);

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

  // Address selector functionality
  const handleAddressSearch = async (query: string) => {
    if (query.length < 3) return;
    
    // Mock address suggestions - in real app, this would call a geocoding API
    const mockSuggestions = [
      `${query} Street, Toledo, OH`,
      `${query} Avenue, Toledo, OH`,
      `${query} Boulevard, Toledo, OH`,
      `${query} Drive, Toledo, OH`,
      `${query} Lane, Toledo, OH`
    ];
    setAddressSuggestions(mockSuggestions);
  };

  const selectAddress = (address: string) => {
    setLocation(address);
    setShowAddressSelector(false);
    toast({
      title: "Location Updated",
      description: `Delivery address set to ${address}`,
    });
  };

  // Notifications functionality
  const fetchNotifications = async () => {
    // Mock notifications - in real app, this would fetch from database
    const mockNotifications = [
      {
        id: 1,
        title: "Order Update",
        message: "Your order from CMIH Kitchen is being prepared",
        time: "2 min ago",
        read: false,
        type: "order"
      },
      {
        id: 2,
        title: "New Deal Available",
        message: "20% off your next order at McDonald's",
        time: "1 hour ago",
        read: false,
        type: "promotion"
      },
      {
        id: 3,
        title: "Delivery Complete",
        message: "Your order has been delivered successfully",
        time: "3 hours ago",
        read: true,
        type: "delivery"
      }
    ];
    setNotifications(mockNotifications);
  };

  // Cart functionality
  const addToCart = (item: any) => {
    setCartItems(prev => [...prev, item]);
    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0), 0);
  };

  // Filter functionality
  const applyFilters = () => {
    // This would filter restaurants based on active filters
    // For now, we'll just show a toast
    toast({
      title: "Filters Applied",
      description: `Showing ${activeFilter} restaurants`,
    });
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
    fetchNotifications();
  }, []);

  // Update filter options based on delivery mode
  useEffect(() => {
    const updatedFilters = filterOptions.map(filter => ({
      ...filter,
      active: filter.id === activeFilter
    }));
    // This would update the filter options in real implementation
  }, [activeFilter, deliveryMode]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowAddressSelector(false);
        setShowNotifications(false);
        setShowCart(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation categories
  const navCategories = [
    { id: 'all', label: 'All', icon: Home, active: activeCategory === 'all' },
    { id: 'grocery', label: 'Grocery', icon: Store, active: activeCategory === 'grocery' },
    { id: 'convenience', label: 'Convenience', icon: Coffee, active: activeCategory === 'convenience' },
    { id: 'dashmart', label: "Craven'Z", icon: Store, active: activeCategory === 'dashmart' },
    { id: 'beauty', label: 'Beauty', icon: Heart, active: activeCategory === 'beauty' },
    { id: 'pets', label: 'Pets', icon: Heart, active: activeCategory === 'pets' },
    { id: 'health', label: 'Health', icon: Shield, active: activeCategory === 'health' },
    { id: 'browse', label: 'Browse All', icon: Search, active: activeCategory === 'browse' },
    { id: 'orders', label: 'Orders', icon: Clock, active: activeCategory === 'orders' },
    { id: 'account', label: 'Account', icon: User, active: activeCategory === 'account' }
  ];

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    
    // Handle different category types
    if (categoryId === 'all' || categoryId === 'browse') {
      setCuisineFilter('all');
    } else if (['grocery', 'convenience', 'dashmart', 'beauty', 'pets', 'health'].includes(categoryId)) {
      setCuisineFilter(categoryId);
    } else if (categoryId === 'orders') {
      // Navigate to orders page
      window.location.href = '/customer-dashboard?tab=orders';
      return;
    } else if (categoryId === 'account') {
      // Navigate to customer dashboard account tab
      window.location.href = '/customer-dashboard?tab=account';
      return;
    }
    
    // Scroll to results section for restaurant categories
    if (['all', 'browse', 'grocery', 'convenience', 'dashmart', 'beauty', 'pets', 'health'].includes(categoryId)) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filter options
  const filterOptions = [
    { id: 'deals', label: 'Deals', active: true },
    { id: 'pickup', label: 'Pickup' },
    { id: 'rating', label: 'Over 4.5★' },
    { id: 'time', label: 'Under 30 min' },
    { id: 'price', label: 'Price' },
    { id: 'dashpass', label: 'CravePass' }
  ];

  // Promo data
  const PROMOS_DATA = [
    {
      id: 1,
      title: "Exclusive: 20% Off All Sushi Orders",
      subtitle: "Limited to the first 500 customers. Code: LUXURY20",
      color: "from-slate-800 to-red-900",
      image: "https://images.unsplash.com/photo-1545624773-a261c6b12d7f?w=400&h=300&fit=crop&q=80"
    },
    {
      id: 2,
      title: "Free Premium Delivery on $30+ orders",
      subtitle: "Valid today only. Elevate your weekend plans.",
      color: "from-red-700 to-amber-600",
      image: "https://images.unsplash.com/photo-1577219549323-5e98218991f8?w=400&h=300&fit=crop&q=80"
    }
  ];

  // Restaurant data - transform from database
  const getRestaurantData = () => {
    const fastest = weeklyDeals.slice(0, 3).map((r) => ({
      id: r.id,
      name: r.name,
      image: r.promotion_image_url || r.image_url || r.header_image_url || `https://placehold.co/600x400/f5f5f5/333?text=${encodeURIComponent(r.name)}`,
      rating: r.rating || 4.5,
      reviews: "1.2K",
      distance: "0.8 mi",
      time: `${r.min_delivery_time || 20} min`,
      promo: r.promotion_title || "Premium Selection Partner"
    }));

    const premium = weeklyDeals.slice(3, 5).map((r) => ({
      id: r.id,
      name: r.name,
      image: r.promotion_image_url || r.image_url || r.header_image_url || `https://placehold.co/600x400/f5f5f5/333?text=${encodeURIComponent(r.name)}`,
      rating: r.rating || 4.5,
      reviews: "800",
      distance: "2.1 mi",
      time: `${r.min_delivery_time || 30} min`,
      featured: true
    }));

    return { fastest, premium };
  };

  const RESTAURANTS_DATA = getRestaurantData();

  // Determine active nav item based on current location
  const getNavItems = () => {
    const isHome = currentLocation.pathname === '/restaurants' || currentLocation.pathname === '/';
    const isOrders = currentLocation.pathname === '/customer-dashboard' && currentLocation.search.includes('tab=orders');
    const isAccount = currentLocation.pathname === '/customer-dashboard' && currentLocation.search.includes('tab=account');
    const isFavorites = currentLocation.pathname === '/customer-dashboard' && currentLocation.search.includes('tab=favorites');

    return [
      { name: 'Home', icon: Home, current: isHome, path: '/restaurants' },
      { name: 'Favorites', icon: Heart, current: isFavorites, path: '/customer-dashboard?tab=favorites' },
      { name: 'Orders', icon: Package, current: isOrders, path: '/customer-dashboard?tab=orders' },
      { name: 'Account', icon: User, current: isAccount, path: '/customer-dashboard?tab=account' },
    ];
  };

  const NAV_ITEMS = getNavItems();

  const handleNavClick = (path: string) => {
    if (path === '/restaurants') {
      setShowMain(true);
      navigate('/restaurants');
    } else {
      navigate(path);
    }
  };

  // Mobile App Landing Page
  if (isMobile && !showMain) {
    return (
      <div className="w-full max-w-[430px] mx-auto h-screen bg-gradient-to-br from-red-50 via-white to-neutral-50 flex flex-col overflow-y-auto font-sans">
        {/* Status Bar */}
        <div className="h-11 flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm text-neutral-900">
          <div className="text-sm font-semibold">9:41</div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono">LTE</span>
          </div>
        </div>

        {/* Hero Section - Light, Premium */}
        <div className="px-6 pt-16 pb-12 relative overflow-hidden flex flex-col justify-between flex-1">
          {/* Logo and Tagline */}
          <div className="relative z-10">
            <h1 className="text-7xl font-black text-neutral-900 mb-2 tracking-tighter">Craven.</h1>
            <p className="text-2xl font-light text-neutral-700 max-w-xs">
              Your premium choice for food delivery.
            </p>
          </div>
          
          {/* Decorative background image (Subtle) */}
          <div className="absolute inset-0 z-0 opacity-5">
            <img 
              src="https://images.unsplash.com/photo-1542456578-1a52c34c568f?w=600&h=800&fit=crop&q=80" 
              alt="Background texture" 
              className="w-full h-full object-cover" 
            />
          </div>

          {/* Action Area */}
          <div className="relative z-10 pt-16">
            <p className="text-neutral-600 text-sm mb-4">Enter your corporate or residential address to begin.</p>
            <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl shadow-red-900/20 border border-red-100">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-700" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter delivery address"
                className="w-full pl-12 pr-16 py-4 text-base font-medium text-neutral-900 placeholder-neutral-500 border-2 border-transparent focus:border-red-600 focus:outline-none transition-colors rounded-xl"
              />
              <button
                onClick={() => setShowMain(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-red-700 rounded-lg flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-red-700/50"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setShowMain(true)}
                className="flex items-center gap-2 px-4 py-2 text-neutral-600 text-sm font-medium hover:text-neutral-900 transition-colors"
              >
                <User className="w-4 h-4" />
                Sign In / Sign Up
              </button>
              <button
                onClick={() => setShowMain(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-700 text-sm font-medium hover:text-red-800 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Use My Location
              </button>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="bg-white/80 backdrop-blur-sm px-6 py-4 border-t border-neutral-200">
          <div className="grid grid-cols-3 text-center text-xs text-neutral-600">
            <a href="#" className="hover:text-red-700 transition-colors">Deliver</a>
            <a href="#" className="hover:text-red-700 transition-colors">Partner</a>
            <a href="#" className="hover:text-red-700 transition-colors">Help</a>
          </div>
        </div>
      </div>
    );
  }

  // Mobile App Main Interface
  if (isMobile && showMain) {
    return (
      <div className="w-full max-w-[430px] mx-auto h-screen bg-white flex flex-col overflow-hidden font-sans">
        {/* Status Bar */}
        <div className="h-11 bg-white flex items-center justify-between px-4">
          <div className="text-sm font-semibold">9:41</div>
          <div className="flex items-center gap-1 text-xs">LTE</div>
        </div>
        
        {/* Search & Address Bar (Sticky Header) */}
        <header className="bg-white sticky top-0 z-20 shadow-sm border-b border-neutral-100 px-4 pt-2 pb-3">
          {/* Address and Account */}
          <div className="flex items-center justify-between mb-3">
            <button 
              className="flex items-center p-2 rounded-xl active:bg-neutral-100 transition-colors"
              onClick={() => setShowMain(false)}
            >
              <MapPin className="w-5 h-5 text-red-700" />
              <div className="text-left ml-2">
                <p className="text-xs text-neutral-500 font-medium leading-none">Deliver to</p>
                <p className="text-sm font-bold text-neutral-900 truncate max-w-[150px]">{location.split(',')[0]}...</p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 ml-1" />
            </button>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/customer-dashboard?tab=notifications')}
                className="p-2 active:bg-neutral-100 rounded-full transition-colors relative"
              >
                <Bell className="w-6 h-6 text-neutral-600" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-700 rounded-full border-2 border-white"></span>
                )}
              </button>
              <button 
                onClick={() => navigate('/customer-dashboard?tab=account')}
                className="p-2 active:bg-neutral-100 rounded-full transition-colors"
              >
                <User className="w-6 h-6 text-neutral-900" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search Craven, Restaurants, or Food"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-base bg-neutral-50 border-0 rounded-xl focus:ring-2 focus:ring-red-200 focus:bg-white focus:outline-none transition-all font-medium"
            />
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-50">
          {/* Quick Filters/Categories */}
          <div className="px-4 py-3 flex gap-2 overflow-x-auto whitespace-nowrap border-b border-neutral-100 bg-white">
            {['Fast Delivery', 'High Rated', 'Breakfast', 'Deals', 'Grocery', 'Dessert'].map((item) => (
              <button 
                key={item}
                className="flex items-center bg-white border border-neutral-200 text-neutral-700 text-sm font-medium px-4 py-2 rounded-full shadow-sm active:bg-red-50 active:border-red-200 transition-all hover:bg-neutral-100"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Promo Carousel */}
          <section className="py-5">
            <div className="flex gap-4 px-4 overflow-x-auto pb-3 -mx-4 px-4">
              {PROMOS_DATA.map((promo) => (
                <div
                  key={promo.id}
                  className={`min-w-[320px] max-w-[90vw] bg-gradient-to-br ${promo.color} rounded-2xl p-5 flex items-center justify-between shadow-xl cursor-pointer active:scale-[0.99] transition-transform`}
                >
                  <div className="flex-1 pr-4">
                    <h3 className="text-xl font-bold text-white mb-1 leading-snug">
                      {promo.title}
                    </h3>
                    <p className="text-sm text-neutral-300 mb-4">{promo.subtitle}</p>
                    <button className="px-5 py-2.5 bg-white text-red-700 text-sm font-extrabold rounded-lg shadow-md hover:bg-neutral-100 active:scale-95 transition-transform">
                      View Details
                    </button>
                  </div>
                  <div className="w-20 h-20 flex-shrink-0 opacity-80">
                    <img src={promo.image} alt="" className="w-full h-full object-cover rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Fastest near you */}
          <section className="px-4 py-5 bg-white border-t border-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-extrabold text-neutral-900">Craven Quick Picks</h2>
              <button className="p-1 active:bg-neutral-100 rounded-full transition-colors text-red-700">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
              {RESTAURANTS_DATA.fastest.map((restaurant) => (
                <RestaurantCard 
                  key={restaurant.id} 
                  restaurant={restaurant} 
                  likedItems={likedItems} 
                  toggleLike={toggleLike} 
                />
              ))}
            </div>
          </section>

          {/* Premium Selections */}
          <section className="px-4 py-5 mt-3 bg-white border-t border-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-extrabold text-neutral-900">Premium Selections</h2>
              <button className="p-1 active:bg-neutral-100 rounded-full transition-colors text-red-700">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {RESTAURANTS_DATA.premium.map((restaurant) => (
                <RestaurantCard 
                  key={restaurant.id} 
                  restaurant={restaurant} 
                  likedItems={likedItems} 
                  toggleLike={toggleLike} 
                />
              ))}
            </div>
          </section>

          {/* Spacing for Nav */}
          <div className="h-24"></div> 
        </main>

        {/* Bottom Navigation: Floating and Robust */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white border-t border-neutral-100 shadow-2xl shadow-neutral-300/50 z-30">
          <div className="flex justify-around pt-3 pb-6">
            {NAV_ITEMS.map(item => (
              <button 
                key={item.name}
                onClick={() => handleNavClick(item.path)}
                className="flex flex-col items-center gap-1 py-1 text-neutral-500 hover:text-red-700 active:scale-95 transition-all relative"
              >
                <item.icon className={`w-6 h-6 transition-colors ${item.current ? 'text-red-700' : 'text-neutral-500'}`} />
                <span className={`text-[11px] font-semibold transition-colors ${item.current ? 'text-red-700' : 'text-neutral-600'}`}>{item.name}</span>
                
                {item.name === 'Favorites' && likedItems.size > 0 && (
                  <span className="absolute top-0 right-1 bg-red-700 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center pointer-events-none">
                    {likedItems.size}
                  </span>
                )}

                {item.name === 'Orders' && <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>}
              </button>
            ))}
            
            {/* Dedicated Cart Button */}
            <button 
              onClick={() => navigate('/cart')}
              className="flex flex-col items-center gap-1 py-1 text-red-700 relative"
            >
              <ShoppingCart className="w-6 h-6 fill-red-700/10" />
              <span className="text-[11px] font-bold text-red-700">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 right-2 bg-red-700 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg pointer-events-none">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </nav>
      </div>
    );
  }

  // Desktop Layout (existing code - keep as is)
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header - DoorDash Style */}
      <div className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <img src={cravenLogo} alt="CRAVE'N" className="h-8" />
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                )}
              </button>
            </div>
            <button 
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="p-2 -mr-2 active:bg-gray-100 rounded-full transition-colors"
            >
              {showMobileNav ? <X className="w-6 h-6 text-gray-900" /> : <Menu className="w-6 h-6 text-gray-900" />}
            </button>
          </div>
          
          {/* Location & Delivery Mode */}
          <div className="flex items-center space-x-2 mb-3">
            <button 
              onClick={() => setShowAddressSelector(!showAddressSelector)}
              className="flex-1 flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2 min-w-0"
            >
              <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 truncate flex-1">{location}</span>
              <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </button>
            
            <div className="flex bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
              <button 
                onClick={() => setDeliveryMode('delivery')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  deliveryMode === 'delivery' 
                    ? 'bg-black text-white' 
                    : 'text-gray-600'
                }`}
              >
                Delivery
              </button>
              <button 
                onClick={() => setDeliveryMode('pickup')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  deliveryMode === 'pickup' 
                    ? 'bg-black text-white' 
                    : 'text-gray-600'
                }`}
              >
                Pickup
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search restaurants or dishes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Desktop Header - Hidden on Mobile */}
      <div className="hidden lg:block sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <div className="flex items-center space-x-4">
              <img src={cravenLogo} alt="CRAVE'N" className="h-10" />
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
              {/* Location Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowAddressSelector(!showAddressSelector)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium max-w-32 truncate">{location}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {/* Address Selector Dropdown */}
                {showAddressSelector && (
                  <div data-dropdown className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Select delivery address</h3>
                      <div className="space-y-2">
                        <Input
                          placeholder="Search for an address"
                          onChange={(e) => handleAddressSearch(e.target.value)}
                          className="w-full"
                        />
                        {addressSuggestions.length > 0 && (
                          <div className="space-y-1">
                            {addressSuggestions.map((address, index) => (
                              <button
                                key={index}
                                onClick={() => selectAddress(address)}
                                className="w-full text-left p-2 hover:bg-gray-100 rounded-md text-sm"
                              >
                                {address}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="pt-2 border-t">
                          <button className="text-orange-600 text-sm font-medium">
                            Add new address
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery/Pickup Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setDeliveryMode('delivery')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    deliveryMode === 'delivery' 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Delivery
                </button>
                <button 
                  onClick={() => setDeliveryMode('pickup')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    deliveryMode === 'pickup' 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pickup
                </button>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="w-6 h-6 text-gray-600 hover:text-gray-900 transition-colors" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div data-dropdown className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <button className="text-sm text-orange-600">Mark all as read</button>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            className={`p-3 rounded-lg border ${
                              notification.read ? 'bg-gray-50' : 'bg-orange-50 border-orange-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart */}
              <div className="relative">
                <button 
                  onClick={() => setShowCart(!showCart)}
                  className="relative"
                >
                  <ShoppingCart className="w-6 h-6 text-gray-600 hover:text-gray-900 transition-colors" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  )}
                </button>
                
                {/* Cart Dropdown */}
                {showCart && (
                  <div data-dropdown className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Your Cart</h3>
                        <button className="text-sm text-orange-600">Clear all</button>
                      </div>
                      {cartItems.length > 0 ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {cartItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-gray-900">{item.name}</h4>
                                <p className="text-xs text-gray-600">${item.price?.toFixed(2) || '0.00'}</p>
                              </div>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-primary hover:text-primary"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <div className="pt-3 border-t">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold">Total: ${getCartTotal().toFixed(2)}</span>
                            </div>
                            <Button className="w-full bg-orange-500 hover:bg-orange-600">
                              Checkout
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">Your cart is empty</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

      {/* Mobile Filter Pills */}
      <div className="lg:hidden sticky top-[140px] z-40 bg-white border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2 px-4 py-3">
          {filterOptions.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                setActiveFilter(filter.id);
                applyFilters();
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Right Side Navigation - Desktop Only */}
        <div className="hidden lg:block w-64 bg-gray-50 border-r border-gray-200 min-h-screen side-menu-container">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Browse</h3>
            <nav className="space-y-1">
              {navCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
          {/* Filter Bar - Desktop Only */}
          <div className="hidden lg:block border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center space-x-4 overflow-x-auto">
                {filterOptions.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setActiveFilter(filter.id);
                      applyFilters();
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === filter.id
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
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">National favorites</h2>
                <div className="hidden lg:flex items-center space-x-2">
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
                <button className="lg:hidden text-sm text-primary font-semibold">
                  See All
                </button>
              </div>

              {/* Featured Restaurant Cards */}
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4" ref={featuredScrollRef}>
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
                  <div key={index} className="flex-shrink-0 w-56 sm:w-64 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="h-48 overflow-hidden rounded-t-xl">
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{restaurant.name}</h3>
                        <ChevronRight className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex items-center text-xs text-gray-600 mb-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
                        <span>{restaurant.rating} ★ ({restaurant.reviews}) • {restaurant.distance} • {restaurant.time}</span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-gray-900">{restaurant.deliveryFee}</p>
                        <p className="text-xs text-gray-600">{restaurant.freeDelivery}</p>
                        {restaurant.badge && (
                          <div className="flex items-center text-orange-600 font-semibold text-xs">
                            <Plus className="w-3 h-3 mr-1" />
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
                <div className="hidden lg:flex items-center space-x-2">
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
                <button className="lg:hidden text-sm text-primary font-semibold">
                  See All
                </button>
              </div>

              {/* Weekly Deals Cards */}
              {loadingDeals ? (
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="flex-shrink-0 w-64 bg-gray-200 rounded-xl animate-pulse">
                      <div className="h-48 bg-gray-300"></div>
                      <div className="p-3">
                        <div className="h-3 bg-gray-300 rounded mb-1"></div>
                        <div className="h-2 bg-gray-300 rounded mb-1"></div>
                        <div className="h-2 bg-gray-300 rounded mb-1"></div>
                        <div className="h-2 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : weeklyDeals.length > 0 ? (
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4" ref={weeklyDealsScrollRef}>
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
                      <div key={restaurant.id} className="flex-shrink-0 w-64 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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
                        <div className="p-3">
                          <h3 className="font-semibold text-gray-900 mb-1 text-sm">{restaurant.name}</h3>
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
                            <span>{restaurant.rating.toFixed(1)} ★ • {restaurant.min_delivery_time}-{restaurant.max_delivery_time} min</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-900 mb-1">
                            ${(restaurant.delivery_fee_cents / 100).toFixed(2)} delivery fee
                          </p>
                          <p className="text-xs text-gray-500 mb-1">Sponsored</p>
                          <div className="flex items-center text-orange-600 font-semibold text-xs">
                            <Plus className="w-3 h-3 mr-1" />
                            <span>{formatPromotionTitle()}</span>
                          </div>
                          {restaurant.promotion_description && (
                            <p className="text-xs text-gray-600 mt-0.5">{formatPromotionDescription()}</p>
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
                    onClick={() => {
                      handleCategoryClick(category.id);
                      setShowMobileNav(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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

      {/* Account Popup */}
      <AccountPopup 
        isOpen={showAccountPopup}
        onClose={() => setShowAccountPopup(false)}
        position={accountPopupPosition}
      />

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Restaurants;