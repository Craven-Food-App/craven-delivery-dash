import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RestaurantGrid from '@/components/RestaurantGrid';
import AccountPopup from '@/components/AccountPopup';
import { 
  Box, 
  Stack, 
  Group, 
  Text, 
  Title, 
  Button, 
  TextInput, 
  Badge, 
  Card, 
  ActionIcon, 
  Image as MantineImage,
  ScrollArea,
  Menu,
  Drawer,
  Loader,
  Divider,
  Container,
  Grid
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  IconSearch, 
  IconMapPin, 
  IconFilter, 
  IconStar, 
  IconClock, 
  IconBolt, 
  IconTrendingUp, 
  IconChevronLeft, 
  IconPlus,
  IconBell,
  IconShoppingCart,
  IconHome,
  IconToolsKitchen2,
  IconCoffee,
  IconBuildingStore,
  IconHeart,
  IconUser,
  IconSettings,
  IconChevronRight,
  IconFlame,
  IconAward,
  IconTruck,
  IconShield,
  IconCurrencyDollar,
  IconAlarm,
  IconNavigation,
  IconMenu2,
  IconX,
  IconSparkles,
  IconCrown,
  IconGift,
  IconTarget,
  IconTrendingDown,
  IconUsers,
  IconWorld,
  IconDeviceMobile,
  IconWifi,
  IconCreditCard,
  IconShieldCheck,
  IconPhone,
  IconMessageCircle,
  IconShare,
  IconBookmark,
  IconEye,
  IconThumbUp,
  IconRefresh,
  IconChevronDown,
  IconAdjustments,
  IconSortAscending,
  IconGrid3x3,
  IconList,
  IconLayersLinked,
  IconCompass,
  IconPackage
} from '@tabler/icons-react';
import { supabase } from '@/integrations/supabase/client';
import cravenLogo from "@/assets/craven-logo.png";

// Professional Rating Icon Component
const RatingPill = ({ rating }: { rating: number }) => (
  <Group gap={4} style={{ backgroundColor: 'white', padding: '4px 8px', borderRadius: '9999px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
    <IconStar size={12} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
    <Text size="xs" fw={600} c="gray.9">{rating}</Text>
  </Group>
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
  <Card
    style={{ 
      minWidth: '280px', 
      cursor: 'pointer',
      transition: 'all 0.3s',
      border: '1px solid #e5e7eb'
    }}
    shadow="md"
    radius="md"
    onClick={() => {}}
  >
    <Box style={{ position: 'relative', height: '160px', backgroundColor: '#f5f5f5', overflow: 'hidden' }}>
      <MantineImage
        src={restaurant.image || restaurant.image_url || `https://placehold.co/600x400/f5f5f5/333?text=Craven`}
        alt={restaurant.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => { 
          e.currentTarget.src = "https://placehold.co/600x400/f5f5f5/333?text=Craven"; 
        }}
      />

      <Box style={{ position: 'absolute', top: 12, right: 12 }}>
        <ActionIcon
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(restaurant.id);
          }}
          variant="filled"
          color="white"
          size="md"
          radius="xl"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <IconHeart 
            size={16} 
            style={{ 
              color: likedItems.has(restaurant.id) ? '#b91c1c' : '#737373',
              fill: likedItems.has(restaurant.id) ? '#b91c1c' : 'none'
            }} 
          />
        </ActionIcon>
      </Box>

      <Box style={{ position: 'absolute', bottom: 12, left: 12 }}>
        <RatingPill rating={restaurant.rating || 4.5} />
      </Box>

      {restaurant.time && (
        <Box style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'white', padding: '4px 12px', borderRadius: '9999px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Group gap={4}>
            <IconClock size={16} style={{ color: '#737373' }} />
            <Text size="sm" fw={600} c="gray.8">{restaurant.time}</Text>
          </Group>
        </Box>
      )}
    </Box>

    <Stack gap="xs" p="md">
      <Text size="lg" fw={800} c="gray.9" lineClamp={1}>
        {restaurant.name}
      </Text>
      <Group gap="xs">
        <Text size="sm" c="gray.6">{restaurant.distance || '0.5 mi'}</Text>
        <Text size="sm" c="gray.4">•</Text>
        <Text size="sm" c="gray.6">{restaurant.reviews || '0'} reviews</Text>
      </Group>
      {restaurant.promo && (
        <Text size="sm" fw={600} c="red.7" mt="xs">{restaurant.promo}</Text>
      )}
    </Stack>
  </Card>
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
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<any[]>([]);
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const [accountPopupPosition, setAccountPopupPosition] = useState({ top: 0, left: 0 });
  
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
    notifications.show({
      title: "Location Updated",
      message: `Delivery address set to ${address}`,
      color: 'orange',
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
    setNotificationsList(mockNotifications);
  };

  // Cart functionality
  const addToCart = (item: any) => {
    setCartItems(prev => [...prev, item]);
    notifications.show({
      title: "Added to Cart",
      message: `${item.name} has been added to your cart`,
      color: 'orange',
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
    // For now, we'll just show a notification
    notifications.show({
      title: "Filters Applied",
      message: `Showing ${activeFilter} restaurants`,
      color: 'orange',
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
    { id: 'all', label: 'All', icon: IconHome, active: activeCategory === 'all' },
    { id: 'grocery', label: 'Grocery', icon: IconBuildingStore, active: activeCategory === 'grocery' },
    { id: 'convenience', label: 'Convenience', icon: IconCoffee, active: activeCategory === 'convenience' },
    { id: 'dashmart', label: "Craven'Z", icon: IconBuildingStore, active: activeCategory === 'dashmart' },
    { id: 'beauty', label: 'Beauty', icon: IconHeart, active: activeCategory === 'beauty' },
    { id: 'pets', label: 'Pets', icon: IconHeart, active: activeCategory === 'pets' },
    { id: 'health', label: 'Health', icon: IconShield, active: activeCategory === 'health' },
    { id: 'browse', label: 'Browse All', icon: IconSearch, active: activeCategory === 'browse' },
    { id: 'orders', label: 'Orders', icon: IconClock, active: activeCategory === 'orders' },
    { id: 'account', label: 'Account', icon: IconUser, active: activeCategory === 'account' }
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
      { name: 'Home', icon: IconHome, current: isHome, path: '/restaurants' },
      { name: 'Favorites', icon: IconHeart, current: isFavorites, path: '/customer-dashboard?tab=favorites' },
      { name: 'Orders', icon: IconPackage, current: isOrders, path: '/customer-dashboard?tab=orders' },
      { name: 'Account', icon: IconUser, current: isAccount, path: '/customer-dashboard?tab=account' },
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
      <Box style={{ width: '100%', maxWidth: '430px', margin: '0 auto', minHeight: '100vh', background: 'linear-gradient(to bottom right, #fef2f2, white, #fafafa)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Status Bar */}
        <Group justify="space-between" p="md" style={{ height: '44px', backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)' }}>
          <Text size="sm" fw={600} c="gray.9">9:41</Text>
          <Group gap={4}>
            <Text size="xs" style={{ fontFamily: 'monospace' }}>LTE</Text>
          </Group>
        </Group>

        {/* Hero Section - Light, Premium */}
        <Box style={{ padding: '24px', paddingTop: '64px', paddingBottom: '48px', position: 'relative', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Logo and Tagline */}
          <Box style={{ position: 'relative', zIndex: 10 }}>
            <Title order={1} style={{ fontSize: '72px', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.05em', color: '#171717' }}>Craven.</Title>
            <Text size="xl" fw={300} c="gray.7" style={{ maxWidth: '320px' }}>
              Your premium choice for food delivery.
            </Text>
          </Box>
          
          {/* Decorative background image (Subtle) */}
          <Box style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.05 }}>
            <MantineImage 
              src="https://images.unsplash.com/photo-1542456578-1a52c34c568f?w=600&h=800&fit=crop&q=80" 
              alt="Background texture" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>

          {/* Action Area */}
          <Box style={{ position: 'relative', zIndex: 10, paddingTop: '64px' }}>
            <Text size="sm" c="gray.6" mb="md">Enter your corporate or residential address to begin.</Text>
            <Box style={{ position: 'relative', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(127, 29, 29, 0.25)', border: '1px solid #fee2e2' }}>
              <IconMapPin size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#b91c1c' }} />
              <TextInput
                value={location}
                onChange={(e) => setLocation(e.currentTarget.value)}
                placeholder="Enter delivery address"
                style={{ paddingLeft: '48px', paddingRight: '64px' }}
                styles={{ input: { border: '2px solid transparent', fontSize: '16px', fontWeight: 500, padding: '16px', borderRadius: '12px' } }}
              />
              <ActionIcon
                onClick={() => setShowMain(true)}
                color="red"
                variant="filled"
                size="lg"
                radius="md"
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', backgroundColor: '#b91c1c', boxShadow: '0 10px 15px -3px rgba(185, 28, 28, 0.5)' }}
              >
                <IconChevronRight size={20} />
              </ActionIcon>
            </Box>

            <Group justify="space-between" mt="lg">
              <Button
                onClick={() => setShowMain(true)}
                variant="subtle"
                leftSection={<IconUser size={16} />}
                style={{ color: '#737373', fontWeight: 500 }}
              >
                Sign In / Sign Up
              </Button>
              <Button
                onClick={() => setShowMain(true)}
                variant="subtle"
                leftSection={<IconNavigation size={16} />}
                style={{ color: '#b91c1c', fontWeight: 500 }}
              >
                Use My Location
              </Button>
            </Group>
          </Box>
        </Box>

        {/* Footer Links */}
        <Group justify="center" p="md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)', borderTop: '1px solid #e5e7eb' }}>
          <Text size="xs" c="gray.6" component="a" href="#" style={{ textDecoration: 'none', cursor: 'pointer' }}>Deliver</Text>
          <Text size="xs" c="gray.6" component="a" href="#" style={{ textDecoration: 'none', cursor: 'pointer' }}>Partner</Text>
          <Text size="xs" c="gray.6" component="a" href="#" style={{ textDecoration: 'none', cursor: 'pointer' }}>Help</Text>
        </Group>
      </Box>
    );
  }

  // Mobile App Main Interface
  if (isMobile && showMain) {
    return (
      <Box style={{ width: '100%', maxWidth: '430px', margin: '0 auto', minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Status Bar */}
        <Group justify="space-between" p="md" style={{ height: '44px', backgroundColor: 'white' }}>
          <Text size="sm" fw={600}>9:41</Text>
          <Group gap={4}>
            <Text size="xs">LTE</Text>
          </Group>
        </Group>
        
        {/* Search & Address Bar (Sticky Header) */}
        <Box component="header" style={{ backgroundColor: 'white', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e5e7eb', padding: '8px 16px 12px' }}>
          {/* Address and Account */}
          <Group justify="space-between" mb="md">
            <Button
              variant="subtle"
              leftSection={<IconMapPin size={20} style={{ color: '#b91c1c' }} />}
              rightSection={<IconChevronRight size={16} style={{ color: '#a3a3a3' }} />}
              onClick={() => setShowMain(false)}
              style={{ padding: '8px', borderRadius: '12px' }}
            >
              <Stack gap={0} align="flex-start">
                <Text size="xs" c="gray.5" fw={500} style={{ lineHeight: 1 }}>Deliver to</Text>
                <Text size="sm" fw={700} c="gray.9" lineClamp={1} style={{ maxWidth: '150px' }}>{location.split(',')[0]}...</Text>
              </Stack>
            </Button>

            <Group gap="xs">
              <ActionIcon
                onClick={() => navigate('/customer-dashboard?tab=notifications')}
                variant="subtle"
                size="lg"
                radius="xl"
                style={{ position: 'relative' }}
              >
                <IconBell size={24} style={{ color: '#737373' }} />
                {notificationsList.filter(n => !n.read).length > 0 && (
                  <Box style={{ position: 'absolute', top: 4, right: 4, width: '10px', height: '10px', backgroundColor: '#b91c1c', borderRadius: '50%', border: '2px solid white' }} />
                )}
              </ActionIcon>
              <ActionIcon
                onClick={() => navigate('/customer-dashboard?tab=account')}
                variant="subtle"
                size="lg"
                radius="xl"
              >
                <IconUser size={24} style={{ color: '#171717' }} />
              </ActionIcon>
            </Group>
          </Group>

          {/* Search Bar */}
          <Box style={{ position: 'relative' }}>
            <IconSearch size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', zIndex: 1 }} />
            <TextInput
              placeholder="Search Craven, Restaurants, or Food"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              styles={{ 
                input: { 
                  paddingLeft: '44px', 
                  paddingRight: '16px', 
                  paddingTop: '12px', 
                  paddingBottom: '12px', 
                  fontSize: '16px', 
                  backgroundColor: '#fafafa', 
                  border: 'none', 
                  borderRadius: '12px',
                  fontWeight: 500
                }
              }}
            />
          </Box>
        </Box>

        {/* Scrollable Content */}
        <ScrollArea style={{ flex: 1, backgroundColor: '#fafafa' }}>
          <Box component="main">
            {/* Quick Filters/Categories */}
            <Group gap="xs" p="md" style={{ overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white' }}>
              {['Fast Delivery', 'High Rated', 'Breakfast', 'Deals', 'Grocery', 'Dessert'].map((item) => (
                <Button
                  key={item}
                  variant="outline"
                  size="sm"
                  radius="xl"
                  style={{ 
                    backgroundColor: 'white', 
                    borderColor: '#e5e7eb',
                    color: '#404040',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {item}
                </Button>
              ))}
            </Group>

            {/* Promo Carousel */}
            <Box py="xl" px="md">
              <Group gap="md" style={{ overflowX: 'auto', paddingBottom: '12px' }}>
                {PROMOS_DATA.map((promo) => {
                  const gradientMap: Record<string, string> = {
                    'from-slate-800 to-red-900': 'linear-gradient(to bottom right, #1e293b, #7f1d1d)',
                    'from-red-700 to-amber-600': 'linear-gradient(to bottom right, #b91c1c, #d97706)',
                  };
                  const gradient = gradientMap[promo.color] || 'linear-gradient(to bottom right, #1e293b, #7f1d1d)';
                  
                  return (
                    <Card
                      key={promo.id}
                      style={{ 
                        minWidth: '320px', 
                        maxWidth: '90vw',
                        background: gradient,
                        cursor: 'pointer',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                      }}
                      radius="lg"
                      p="lg"
                    >
                      <Group justify="space-between" align="flex-start">
                        <Stack gap="xs" style={{ flex: 1, paddingRight: '16px' }}>
                          <Title order={3} c="white" fw={700} style={{ fontSize: '20px', lineHeight: '1.3' }}>
                            {promo.title}
                          </Title>
                          <Text size="sm" c="gray.3" mb="md">{promo.subtitle}</Text>
                          <Button
                            variant="filled"
                            color="white"
                            size="sm"
                            radius="md"
                            style={{ color: '#b91c1c', fontWeight: 800, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                          >
                            View Details
                          </Button>
                        </Stack>
                        <Box style={{ width: '80px', height: '80px', flexShrink: 0, opacity: 0.8 }}>
                          <MantineImage src={promo.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                        </Box>
                      </Group>
                    </Card>
                  );
                })}
              </Group>
            </Box>

            {/* Fastest near you */}
            <Box px="md" py="xl" style={{ backgroundColor: 'white', borderTop: '1px solid #e5e7eb' }}>
              <Group justify="space-between" mb="md">
                <Title order={2} fw={800} c="gray.9" style={{ fontSize: '24px' }}>Craven Quick Picks</Title>
                <ActionIcon variant="subtle" color="red" radius="xl">
                  <IconChevronRight size={24} />
                </ActionIcon>
              </Group>
              
              <Group gap="md" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
                {RESTAURANTS_DATA.fastest.map((restaurant) => (
                  <RestaurantCard 
                    key={restaurant.id} 
                    restaurant={restaurant} 
                    likedItems={likedItems} 
                    toggleLike={toggleLike} 
                  />
                ))}
              </Group>
            </Box>

            {/* Premium Selections */}
            <Box px="md" py="xl" mt="md" style={{ backgroundColor: 'white', borderTop: '1px solid #e5e7eb' }}>
              <Group justify="space-between" mb="md">
                <Title order={2} fw={800} c="gray.9" style={{ fontSize: '24px' }}>Premium Selections</Title>
                <ActionIcon variant="subtle" color="red" radius="xl">
                  <IconChevronRight size={24} />
                </ActionIcon>
              </Group>
              
              <Stack gap="md">
                {RESTAURANTS_DATA.premium.map((restaurant) => (
                  <RestaurantCard 
                    key={restaurant.id} 
                    restaurant={restaurant} 
                    likedItems={likedItems} 
                    toggleLike={toggleLike} 
                  />
                ))}
              </Stack>
            </Box>

            {/* Spacing for Nav */}
            <Box style={{ height: '96px' }} />
          </Box>
        </ScrollArea>

        {/* Bottom Navigation: Floating and Robust */}
        <Box component="nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: '430px', margin: '0 auto', backgroundColor: 'white', borderTop: '1px solid #e5e7eb', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', zIndex: 30 }}>
          <Group justify="space-around" pt="md" pb="xl">
            {NAV_ITEMS.map(item => {
              const IconComponent = item.icon;
              return (
                <Button
                  key={item.name}
                  onClick={() => handleNavClick(item.path)}
                  variant="subtle"
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '4px', 
                    padding: '4px',
                    color: item.current ? '#b91c1c' : '#737373',
                    position: 'relative'
                  }}
                >
                  <IconComponent size={24} style={{ color: item.current ? '#b91c1c' : '#737373' }} />
                  <Text size="xs" fw={600} c={item.current ? 'red.7' : 'gray.6'}>{item.name}</Text>
                  
                  {item.name === 'Favorites' && likedItems.size > 0 && (
                    <Badge size="xs" color="red" style={{ position: 'absolute', top: 0, right: 4, minWidth: '16px', height: '16px', padding: '0 4px' }}>
                      {likedItems.size}
                    </Badge>
                  )}

                  {item.name === 'Orders' && (
                    <Box style={{ position: 'absolute', top: 0, right: 4, width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%', border: '2px solid white' }} />
                  )}
                </Button>
              );
            })}
            
            {/* Dedicated Cart Button */}
            <Button
              onClick={() => navigate('/cart')}
              variant="subtle"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '4px',
                color: '#b91c1c',
                position: 'relative'
              }}
            >
              <IconShoppingCart size={24} style={{ color: '#b91c1c', fill: 'rgba(185, 28, 28, 0.1)' }} />
              <Text size="xs" fw={700} c="red.7">Cart</Text>
              {cartCount > 0 && (
                <Badge size="sm" color="red" style={{ position: 'absolute', top: -4, right: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Group>
        </Box>
      </Box>
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
                <IconBell className="w-5 h-5 text-gray-600" />
                {notificationsList.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                )}
              </button>
            </div>
            <button 
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="p-2 -mr-2 active:bg-gray-100 rounded-full transition-colors"
            >
              {showMobileNav ? <IconX className="w-6 h-6 text-gray-900" /> : <IconMenu2 className="w-6 h-6 text-gray-900" />}
            </button>
          </div>
          
          {/* Location & Delivery Mode */}
          <div className="flex items-center space-x-2 mb-3">
            <button 
              onClick={() => setShowAddressSelector(!showAddressSelector)}
              className="flex-1 flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2 min-w-0"
            >
              <IconMapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 truncate flex-1">{location}</span>
              <IconChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
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
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <TextInput 
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
                  <IconMapPin className="w-4 h-4" />
                  <span className="text-sm font-medium max-w-32 truncate">{location}</span>
                  <IconChevronRight className="w-4 h-4" />
                </button>
                
                {/* Address Selector Dropdown */}
                {showAddressSelector && (
                  <div data-dropdown className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Select delivery address</h3>
                      <div className="space-y-2">
                        <TextInput
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