import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, Clock, Truck, Plus, Minus, ShoppingCart, X, 
  ChevronLeft, Utensils, Heart, Share2, MapPin, Phone,
  Navigation, MessageCircle, CheckCircle, Filter, Search, ChefHat, Leaf,
    Info, ArrowUp, Timer, Flame, Car, Home, Store, Coffee, Calendar, 
    User, Bell, Menu, Banana, Pill, PawPrint, Receipt
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast as showToast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import cravenLogo from "@/assets/craven-logo.png";

// --- Type Definitions (matching your database) ---
interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  delivery_fee_cents: number;
  min_delivery_time: number;
  max_delivery_time: number;
  rating: number;
  total_reviews: number;
  image_url: string;
  header_image_url?: string;
  logo_url?: string;
  latitude?: number;
  longitude?: number;
  is_open?: boolean;
  opens_at?: string;
  closes_at?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  display_order: number;
  restaurant_id: string;
  icon?: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url: string;
  is_available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  category_id: string;
  preparation_time: number;
  restaurant_id: string;
  is_featured?: boolean;
  order_count?: number;
  spice_level?: number;
  calories?: number;
  chef_recommended?: boolean;
}

interface PromoCode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  discount_percentage: number | null;
  discount_amount_cents: number | null;
  minimum_order_cents: number | null;
  is_active: boolean;
}

interface CartItem extends MenuItem {
  key: string;
  quantity: number;
  special_instructions?: string;
}

// --- Mobile Header Component (DoorDash Style) ---
const MobileHeader = ({ restaurant, onBack, onShare }: { restaurant: Restaurant | null; onBack: () => void; onShare: () => void }) => (
  <div className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
    <div className="flex items-center justify-between px-4 py-3">
      <button onClick={onBack} className="p-2 -ml-2 active:bg-gray-100 rounded-full transition-colors">
        <ChevronLeft className="w-6 h-6 text-gray-900" />
      </button>
      <div className="flex-1 text-center">
        <h1 className="font-semibold text-gray-900 text-sm truncate">{restaurant?.name || 'Restaurant'}</h1>
      </div>
      <button onClick={onShare} className="p-2 -mr-2 active:bg-gray-100 rounded-full transition-colors">
        <Share2 className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  </div>
);

// --- Main Component ---
const RestaurantMenuPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
    const tabsRef = useRef<HTMLDivElement>(null);
    
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [promos, setPromos] = useState<PromoCode[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New state for header and side menu
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('6759 Nebraska Ave');
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isMenuCompressed, setIsMenuCompressed] = useState(true);
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showCartButton, setShowCartButton] = useState(false);
  const cartButtonTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
    const [activeSection, setActiveSection] = useState('featured');
    const [isMenuFixed, setIsMenuFixed] = useState(false);
    const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
           const [pickupInfo, setPickupInfo] = useState({
               address: '',
               driveTime: 0,
               readyTime: 0
           });
           const [showItemModal, setShowItemModal] = useState(false);
           const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
           const [modalQuantity, setModalQuantity] = useState(1);
           const reviewsScrollRef = useRef<HTMLDivElement>(null);

    // Reviews scroll functions
    const scrollReviewsLeft = () => {
        if (reviewsScrollRef.current) {
            reviewsScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
        }
    };

    const scrollReviewsRight = () => {
        if (reviewsScrollRef.current) {
            reviewsScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
    };

    // Navigation categories for side menu
    const navCategories = [
        { id: 'all', label: 'All', icon: Home, active: activeCategory === 'all' },
        { id: 'grocery', label: 'Grocery', icon: Banana, active: activeCategory === 'grocery' },
        { id: 'convenience', label: 'Convenience', icon: Coffee, active: activeCategory === 'convenience' },
        { id: 'dashmart', label: "Craven'Z", icon: Store, active: activeCategory === 'dashmart' },
        { id: 'beauty', label: 'Beauty', icon: Heart, active: activeCategory === 'beauty' },
        { id: 'pets', label: 'Pets', icon: PawPrint, active: activeCategory === 'pets' },
        { id: 'health', label: 'Health', icon: Pill, active: activeCategory === 'health' },
        { id: 'browse', label: 'Browse All', icon: Search, active: activeCategory === 'browse' },
        { id: 'orders', label: 'Orders', icon: Receipt, active: activeCategory === 'orders' },
        { id: 'account', label: 'Account', icon: User, active: activeCategory === 'account' }
    ];

    // Helper functions for header functionality
    const handleAddressSearch = async (query: string) => {
        if (query.length < 3) return;
        
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

    const fetchNotifications = async () => {
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

    const handleCategoryClick = (categoryId: string) => {
        setActiveCategory(categoryId);
        
        if (categoryId === 'orders') {
            navigate('/customer-dashboard?tab=orders');
            return;
        } else if (categoryId === 'account') {
            navigate('/customer-dashboard?tab=account');
            return;
        }
        
        // For restaurant categories, navigate back to restaurants page
        if (['all', 'browse', 'grocery', 'convenience', 'dashmart', 'beauty', 'pets', 'health'].includes(categoryId)) {
            navigate('/restaurants');
        }
    };

    const toggleMenuCompression = () => {
        setIsMenuCompressed(!isMenuCompressed);
    };

    // Fetch all data
  useEffect(() => {
    if (id) {
      fetchRestaurantData();
    }
    fetchNotifications();
    
    // Auto-hide side menu when entering restaurant page
    setIsMenuCompressed(true);
  }, [id]);

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

  // Cleanup cart button timer on unmount
  useEffect(() => {
    return () => {
      if (cartButtonTimerRef.current) {
        clearTimeout(cartButtonTimerRef.current);
      }
    };
  }, []);

    // Set pickup info when restaurant data is loaded
  useEffect(() => {
        if (restaurant && deliveryMethod === 'pickup') {
            setPickupInfo({
                address: restaurant.address,
                driveTime: Math.floor(Math.random() * 10) + 5, // Random 5-15 min drive time
                readyTime: restaurant.min_delivery_time || 15
            });
        }
    }, [restaurant, deliveryMethod]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      
            // Fetch restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

            // Fetch menu categories
      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', id)
        .order('display_order');

            setCategories(categoriesData || []);

            // Fetch menu items
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', id)
        .eq('is_available', true);

      setMenuItems(
        (menuData || []).map((item: any) => ({
          ...item,
          spice_level: item.spice_level !== undefined && item.spice_level !== null
            ? Number(item.spice_level)
            : undefined
        }))
      );
      
            // Fetch active promo codes (you might want to filter by restaurant if needed)
            const { data: promosData } = await supabase
                .from('promo_codes')
                .select('*')
                .eq('is_active', true)
                .gte('valid_until', new Date().toISOString())
                .limit(3);

            setPromos(promosData || []);

    } catch (error: any) {
      console.error('Error fetching restaurant data:', error);
      showToast.error("Failed to load restaurant details");
    } finally {
      setLoading(false);
    }
  };

    // Scroll observer for active section highlighting
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.boundingClientRect.top < 250) {
                    setActiveSection(entry.target.id);
                }
            });
        }, {
            rootMargin: '-100px 0px -50% 0px',
            threshold: 0.1
        });

        const sections = ['featured', 'most-ordered', 'reviews', ...categories.map(c => c.id)];
        sections.forEach(sectionId => {
            const el = document.getElementById(sectionId);
            if (el) observer.observe(el);
        });

        return () => {
            sections.forEach(sectionId => {
                const el = document.getElementById(sectionId);
                if (el) observer.unobserve(el);
            });
        };
    }, [categories]);

    // Fixed sidebar on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (tabsRef.current) {
                const rightColumn = document.querySelector('.lg\\:col-span-9');
                if (rightColumn) {
                    setIsMenuFixed(window.scrollY > (rightColumn.getBoundingClientRect().top + window.scrollY - 100));
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = useCallback((sectionId: string) => {
        const section = document.getElementById(sectionId);
        if (section) {
            const offset = tabsRef.current ? tabsRef.current.offsetHeight + 16 : 100;
            window.scrollTo({
                top: section.offsetTop - offset,
                behavior: 'smooth'
            });
        }
    }, []);

           // Cart functions
           const addToCart = useCallback((item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
                           ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
                   setCart([...cart, { ...item, quantity: 1, key: item.id }]);
    }
    showToast.success(`${item.name} added to cart!`);
    
    // Show cart button and set timer to hide after 3 seconds
    setShowCartButton(true);
    if (cartButtonTimerRef.current) {
      clearTimeout(cartButtonTimerRef.current);
    }
    cartButtonTimerRef.current = setTimeout(() => {
      setShowCartButton(false);
    }, 3000);
  }, [cart]);

           const openItemModal = useCallback((item: MenuItem) => {
               setSelectedItem(item);
               setShowItemModal(true);
               setModalQuantity(1);
           }, []);

           const closeItemModal = useCallback(() => {
               setShowItemModal(false);
               setSelectedItem(null);
               setModalQuantity(1);
           }, []);

           const addToCartFromModal = useCallback(() => {
               if (selectedItem) {
                   const itemToAdd = { ...selectedItem, quantity: modalQuantity, key: selectedItem.id };
                   const existingItem = cart.find(cartItem => cartItem.id === selectedItem.id);
                   if (existingItem) {
                       setCart(cart.map(cartItem =>
                           cartItem.id === selectedItem.id
                               ? { ...cartItem, quantity: cartItem.quantity + modalQuantity }
                               : cartItem
                       ));
                   } else {
                       setCart([...cart, itemToAdd]);
                   }
                   showToast.success(`${selectedItem.name} added to cart!`);
                   
                   // Show cart button and set timer to hide after 3 seconds
                   setShowCartButton(true);
                   if (cartButtonTimerRef.current) {
                     clearTimeout(cartButtonTimerRef.current);
                   }
                   cartButtonTimerRef.current = setTimeout(() => {
                     setShowCartButton(false);
                   }, 3000);
                   
                   closeItemModal();
               }
           }, [selectedItem, modalQuantity, cart, closeItemModal]);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  }, [cart]);

  const updateCartQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));
  }, [cart, removeFromCart]);

    // Get items by category or filter
    const featuredItems = menuItems.filter(item => item.is_featured);
    const mostOrderedItems = menuItems
        .filter(item => item.order_count && item.order_count > 0)
        .sort((a, b) => (b.order_count || 0) - (a.order_count || 0))
        .slice(0, 8);

  const getItemsByCategory = (categoryId: string) => {
    return menuItems.filter(item => item.category_id === categoryId);
  };

    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`;
    };

    // Sidebar links
    const sidebarLinks = [
        { id: 'featured', label: 'Featured Items', href: '#featured' },
        { id: 'most-ordered', label: 'Most Ordered', href: '#most-ordered' },
        ...categories.map(cat => ({
            id: cat.id,
            label: cat.name,
            href: `#${cat.id}`
        })),
        { id: 'reviews', label: 'Reviews', href: '#reviews' }
    ];

    // --- UI Components ---
    const MenuItemCard = ({ item }: { item: MenuItem }) => {
        const rating = item.order_count ? Math.min(95, 75 + Math.floor(item.order_count / 10)) : 85;
        const reviews = item.order_count || Math.floor(Math.random() * 200) + 50;

    return (
                   <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden cursor-pointer group transition duration-200 hover:shadow-lg relative">
                   <div className="h-32 overflow-hidden">
                       <img
                           src={item.image_url || 'https://placehold.co/100x100/CCCCCC/666666?text=Item'}
                           alt={item.name}
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                           style={{
                               imageRendering: 'crisp-edges'
                           }}
                           onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100/CCCCCC/666666?text=Item"; }}
                       />
      </div>

                   <div className="p-3">
                       <h4 className="text-sm font-extrabold text-gray-800 line-clamp-2 leading-tight mb-1" style={{
                           lineHeight: '1.3'
                       }}>{item.name}</h4>

                       <div className="text-sm font-semibold">
                           <span className="text-gray-700">{formatPrice(item.price_cents)}</span>
                           <span className="text-xs text-gray-400 block mt-1">{rating}% ({reviews})</span>
                       </div>
                </div>

                       <button
                           onClick={() => openItemModal(item)}
                           className="absolute bottom-2 right-2 bg-primary text-white w-7 h-7 rounded-md flex items-center justify-center hover:bg-primary/90 transition duration-200 shadow-md"
                       >
                           <Plus className='w-3 h-3' />
                       </button>
      </div>
    );
    };

    const PickupInterface = () => {
        const mapContainer = useRef<HTMLDivElement>(null);
        const map = useRef<any>(null);
        const [mapLoaded, setMapLoaded] = useState(false);

        useEffect(() => {
            if (deliveryMethod === 'pickup' && restaurant && mapContainer.current && !mapLoaded) {
                initializePickupMap();
            }
        }, [deliveryMethod, restaurant, mapLoaded]);

        const initializePickupMap = async () => {
            if (!mapContainer.current || !restaurant.latitude || !restaurant.longitude) return;

            try {
                // Load Mapbox script if not already loaded
                if (!window.mapboxgl) {
                    const script = document.createElement('script');
                    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
                    script.onload = () => {
                        window.mapboxgl.accessToken = 'pk.eyJ1IjoiY3JhdmUtbiIsImEiOiJjbWVxb21qbTQyNTRnMm1vaHg5bDZwcmw2In0.aOsYrL2B0cjfcCGW1jHAdw';
                        createMap();
                    };
                    document.head.appendChild(script);
                } else {
                    window.mapboxgl.accessToken = 'pk.eyJ1IjoiY3JhdmUtbiIsImEiOiJjbWVxb21qbTQyNTRnMm1vaHg5bDZwcmw2In0.aOsYrL2B0cjfcCGW1jHAdw';
                    createMap();
                }
            } catch (error) {
                console.error('Error initializing pickup map:', error);
            }
        };

        const createMap = () => {
            if (!mapContainer.current || !window.mapboxgl) return;

            map.current = new window.mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [restaurant.longitude, restaurant.latitude],
                zoom: 15,
                interactive: true
            });

            // Add restaurant marker
            new window.mapboxgl.Marker({ color: '#dc2626' })
                .setLngLat([restaurant.longitude, restaurant.latitude])
                .addTo(map.current);

            map.current.on('load', () => {
                setMapLoaded(true);
            });
        };

  return (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2 mb-6">
                {/* Top Row - Delivery/Pickup Buttons and Price/Time */}
                <div className="flex justify-between items-center space-x-6 mb-4">
                    {/* Delivery/Pickup Tabs */}
                    <div className="flex border border-gray-300 rounded-lg p-0.5 bg-gray-100 text-sm font-semibold transition duration-300">
                        <button
                            onClick={() => setDeliveryMethod('delivery')}
                            className={`px-5 py-2 rounded-md transition duration-200 ${deliveryMethod === 'delivery' ? 'bg-primary shadow-lg text-white font-bold' : 'text-gray-600 font-medium hover:bg-white'}`}
                        >
                            Delivery
                        </button>
                        <button
                            onClick={() => setDeliveryMethod('pickup')}
                            className={`px-5 py-2 rounded-md transition duration-200 ${deliveryMethod === 'pickup' ? 'bg-primary shadow-lg text-white font-bold' : 'text-gray-600 font-medium hover:bg-white'}`}
                        >
                            Pickup
                        </button>
            </div>

                    {/* Price/Time Info Box */}
                    <div className="flex items-center space-x-4 text-base text-right">
                        {/* Delivery Fee Box */}
                        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                            <div className="font-bold text-sm">$0 delivery fee</div>
                            <div className="text-xs flex items-center">
                                pricing & fees
                                <Info className="w-3 h-3 ml-1" />
          </div>
          </div>

                        {/* Pickup Time with Dropdown */}
                        <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{pickupInfo.readyTime} min</div>
                            <div className="text-sm text-gray-600 flex items-center">
                                ready for pickup
                                <ArrowUp className="w-4 h-4 ml-1 transform rotate-90" />
        </div>
      </div>
            </div>
          </div>
          
                {/* Main Content - Address and Map */}
                <div className="flex flex-col md:flex-row items-stretch" style={{ gap: '3px' }}>
                    {/* Address and Info - Left Side - Fixed Width */}
                    <div className="w-auto flex flex-col justify-between mb-4 md:mb-0" style={{ minWidth: '200px' }}>
          <div>
                            <h3 className="text-base font-semibold text-gray-900 mb-2">
                                Pick up this order at:
                            </h3>
                            <p className="text-blue-600 underline cursor-pointer hover:text-blue-800 mb-2 text-sm">
                                {pickupInfo.address}
                            </p>
                            <div className="flex items-center text-sm text-gray-600">
                                <Car className="w-4 h-4 mr-1" />
                                <span>{pickupInfo.driveTime} min</span>
                            </div>
          </div>
        </div>

                    {/* Map Container - Right Side - Stretches to fill remaining space */}
                    <div className="flex-1 h-32 rounded-lg overflow-hidden border border-gray-200">
                        <div 
                            ref={mapContainer} 
                            className="w-full h-full"
                            style={{ minHeight: '128px' }}
                        />
              </div>
            </div>
            </div>
        );
    };

    const TripleDipperModal = () => {
        if (!showItemModal || !selectedItem) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex justify-between items-start p-3 border-b border-gray-200">
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">{selectedItem.name}</h2>
                            <p className="text-xs text-gray-600 mb-2">77% (213)</p>
                            <p className="text-xs text-gray-700">Select three appetizers and enjoy! Served with dipping sauces.</p>
              </div>
                        <button
                            onClick={closeItemModal}
                            className="text-gray-400 hover:text-gray-600 text-xl"
                        >
                            ×
                        </button>
            </div>
            
                    {/* Food Image */}
                    <div className="p-3">
                        <img
                            src={selectedItem.image_url || 'https://placehold.co/600x300/CCCCCC/666666?text=Triple+Dipper'}
                            alt={selectedItem.name}
                            className="w-full h-36 object-cover rounded-lg"
                        />
              </div>

                    {/* Recommended Options */}
                    <div className="px-3 pb-2">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-base font-semibold text-gray-900">Your recommended options</h3>
                            <div className="flex space-x-2">
                                <button className="text-gray-400 hover:text-gray-600">‹</button>
                                <button className="text-gray-400 hover:text-gray-600">›</button>
            </div>
          </div>

                        {/* Option #1 (Selected) */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-3 border-2 border-primary">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                        <span className="text-sm font-bold text-gray-900">#1 • Ordered recently by 10+ others</span>
                                        <div className="ml-auto w-4 h-4 border-2 border-primary rounded-full bg-primary/100 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
      </div>
                                    <p className="text-sm text-gray-700 mb-2">
                                        Big Mouth® Bites • Ranch • Bacon Crumbles • Sauteed Onion • American Cheese • Ranch...
                                    </p>
                                    <p className="text-lg font-bold text-gray-900">$16.89</p>
                                </div>
        </div>
      </div>

                        {/* Option #2 (Partially Visible) */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                        <span className="text-sm font-bold text-gray-900">#2 • Ordered recently by others</span>
                                        <div className="ml-auto w-4 h-4 border-2 border-gray-300 rounded-full"></div>
              </div>
                                    <p className="text-sm text-gray-700 mb-2">
                                        Southwestern Eggrolls • Big Mouth® Bites • Ranch...
                                    </p>
                                    <p className="text-lg font-bold text-gray-900">$16.89</p>
            </div>
          </div>
              </div>
            </div>
      
                    {/* Tabs */}
                    <div className="px-3 border-t border-gray-200">
                        <div className="flex space-x-4">
                            <button className="py-2 text-sm font-semibold text-primary border-b-2 border-primary">
                                Order
              </button>
                            <button className="py-2 text-sm font-semibold text-gray-500">
                                Reviews (8)
                            </button>
          </div>
      </div>

                    {/* Order Content */}
                    <div className="px-3 py-2">
                        <h4 className="text-base font-semibold text-gray-900 mb-2">Selection 1</h4>
                        <p className="text-sm text-gray-600 mb-4">Required • Select 1</p>
                        
                        {/* Selection options would go here */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <span className="text-sm font-medium text-gray-900">Big Mouth® Bites</span>
                                <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                </div>
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <span className="text-sm font-medium text-gray-900">Southwestern Eggrolls</span>
                                <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
              </div>
        </div>
      </div>

                    {/* Bottom Action Bar */}
                    <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button 
                                onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                            >
                                −
                            </button>
                            <span className="text-lg font-semibold text-gray-900">{modalQuantity}</span>
                  <button
                                onClick={() => setModalQuantity(modalQuantity + 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                            >
                                +
                  </button>
              </div>
                        <button
                            onClick={addToCartFromModal}
                            className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition duration-200"
                        >
                            Add to cart - ${formatPrice(selectedItem.price_cents * modalQuantity)}
                        </button>
            </div>
        </div>
    </div>
  );
};

    const DealsSection = () => (
        <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Deals & benefits</h2>

            <div className="flex overflow-x-auto space-x-3 pb-2 snap-x snap-mandatory">
                {promos.map(promo => (
                    <div
                        key={promo.id}
                        className="flex-shrink-0 w-[240px] sm:w-[300px] bg-white p-4 rounded-xl shadow-md border border-gray-200 snap-start relative"
                    >
                        <h3 className="text-base font-bold text-primary mb-1">{promo.name}</h3>
                        <p className="text-sm text-gray-500">
                            {promo.description || 
                             (promo.minimum_order_cents ? `Add ${formatPrice(promo.minimum_order_cents)} to apply` : 'Apply at checkout')}
                        </p>
                        <ArrowUp className="w-4 h-4 text-primary absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90" strokeWidth={3} />
                    </div>
                ))}
                {promos.length === 0 && (
                    <div className="flex-shrink-0 w-[300px] bg-white p-4 rounded-xl shadow-md border border-gray-200">
                        <h3 className="text-base font-bold text-gray-500">No active deals right now</h3>
                        <p className="text-sm text-gray-400">Check back soon for special offers!</p>
            </div>
              )}
          </div>
              </div>
            );

    const LeftColumn = () => (
        <div className={`pt-8 ${isMenuFixed
            ? 'hidden lg:block fixed top-1 left-1/2 transform -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:max-w-[calc(25%-1rem)] xl:max-w-[calc((1120px*0.25)-1rem)] w-full max-w-xs lg:w-auto'
            : 'hidden lg:block'}`}>
            <div className="space-y-4">
                {/* Store Info */}
                <div className="text-sm space-y-2">
                    <h3 className="font-bold text-gray-700">Store Info</h3>
                    <p className={`flex items-center space-x-1 font-semibold ${restaurant?.is_open ? 'text-green-600' : 'text-primary'}`}>
                        <Clock className="w-4 h-4" />
                        <span>{restaurant?.is_open ? 'Open Now' : `Closed • Opens at ${restaurant?.opens_at || '9:00 AM'}`}</span>
                    </p>
                    <p className="flex items-center space-x-1 text-gray-600">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>{restaurant?.rating || 4.0} <span className='text-gray-400'>({restaurant?.total_reviews || 0}+)</span> • {(((restaurant?.latitude || 0) - 35) * 100).toFixed(1)} mi</span>
                    </p>
                    <p className="flex items-center space-x-1 text-gray-600">
                        <MapPin className="w-4 h-4 inline-block -mt-1 mr-1 text-red-500" />
                        {restaurant?.cuisine_type}
                    </p>
                    <p className="flex items-center space-x-1 text-gray-600">
                        <Truck className="w-4 h-4 inline-block mr-1 text-green-600" />
                        {formatPrice(restaurant?.delivery_fee_cents || 0)} delivery fee
                    </p>
      </div>

                {/* Full Menu Navigation */}
                <nav className="border-t border-gray-200 pt-4 space-y-1">
                    <h3 className="font-bold text-gray-700 mb-2">Full Menu</h3>

                    <ul className="space-y-1 text-sm">
                        {sidebarLinks.map(link => (
                            <li key={link.id}>
                                <a
                                    href={link.href}
                                    onClick={(e) => { e.preventDefault(); scrollToSection(link.id); }}
                                    className={`block p-2 rounded-lg font-medium transition duration-150 
                                        ${activeSection === link.id
                                            ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary -ml-2 pl-4'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
                </div>
              </div>
            );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading restaurant...</p>
      </div>
              </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-xl text-gray-600">Restaurant not found</p>
                    <button onClick={() => navigate('/restaurants')} className="mt-4 text-primary font-semibold">
                        Back to Restaurants
                    </button>
            </div>
          </div>
  );
    }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header - DoorDash Style */}
      <MobileHeader 
        restaurant={restaurant}
        onBack={() => navigate('/restaurants')}
        onShare={() => {
          if (navigator.share) {
            navigator.share({
              title: restaurant?.name,
              text: `Check out ${restaurant?.name} on Crave'N`,
              url: window.location.href
            });
          }
        }}
      />

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
                  <ChevronLeft className="w-4 h-4" />
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
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary/100 text-white text-xs rounded-full flex items-center justify-center">
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
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                      {cart.length}
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
                      {cart.length > 0 ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {cart.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-gray-900">{item.name}</h4>
                                <p className="text-xs text-gray-600">${(item.price_cents / 100).toFixed(2)}</p>
                              </div>
                              <button 
                                onClick={() => {
                                  setCart(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="text-red-500 hover:text-primary"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <div className="pt-3 border-t">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold">Total: ${(cart.reduce((total, item) => total + (item.price_cents * item.quantity), 0) / 100).toFixed(2)}</span>
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

      <div className="relative">
        {/* Right Side Navigation - Fixed Overlay */}
        <div 
          className={`hidden lg:block fixed left-0 top-[64px] transition-all duration-300 ease-in-out ${
            (isMenuCompressed && !isMenuHovered) ? 'w-16' : 'w-64'
          } bg-gray-50 border-r border-gray-200 h-[calc(100vh-64px)] z-30 shadow-md`}
          onMouseEnter={() => setIsMenuHovered(true)}
          onMouseLeave={() => setIsMenuHovered(false)}
        >
          <div className="p-4">
            {/* Hamburger Menu Button */}
            <button 
              onClick={toggleMenuCompression}
              className="w-full flex items-center justify-center p-2 mb-4 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {(!isMenuCompressed || isMenuHovered) && (
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Browse</h3>
            )}
            
            <nav className="space-y-1">
              {navCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <category.icon className="w-5 h-5 flex-shrink-0" />
                  {(!isMenuCompressed || isMenuHovered) && (
                    <span className="font-medium">{category.label}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {showMobileNav && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
            <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <button 
                    onClick={() => setShowMobileNav(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
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

        {/* Main Content */}
        <div className="flex-1 relative">
          <div className="bg-gray-50 min-h-screen font-sans text-gray-800 antialiased" style={{
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility'
          }}>
            <div className="max-w-7xl mx-auto">
                       {/* --- Mobile Hero Section (DoorDash Style) --- */}
                       <div className="lg:hidden">
                         {/* Hero Image */}
                         <div className="relative h-48">
                           <img
                             src={restaurant.header_image_url || restaurant.image_url || 'https://placehold.co/600x300/A31D24/ffffff?text=Restaurant'}
                             alt={restaurant.name}
                             className="w-full h-full object-cover"
                           />
                         </div>
                         
                         {/* Restaurant Info Card - Overlapping (DoorDash signature style) */}
                         <div className="mx-4 -mt-8 bg-white rounded-2xl shadow-xl p-4 relative z-10 border border-gray-100">
                           <div className="flex items-start space-x-3 mb-3">
                             <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-gray-100">
                               <img 
                                 src={restaurant.logo_url || restaurant.image_url || 'https://placehold.co/64x64/CCCCCC/666666?text=Logo'} 
                                 alt={restaurant.name}
                                 className="w-full h-full object-cover"
                                 onError={(e) => { e.currentTarget.src = "https://placehold.co/64x64/CCCCCC/666666?text=Logo"; }}
                               />
                             </div>
                             <div className="flex-1 min-w-0">
                               <h2 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{restaurant.name}</h2>
                               <div className="flex items-center space-x-1 text-sm text-gray-600 mb-1">
                                 <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                 <span className="font-semibold">{restaurant.rating || 4.5}</span>
                                 <span>({restaurant.total_reviews || 0}+)</span>
                                 <span className="text-gray-400">•</span>
                                 <span className="truncate">{restaurant.cuisine_type}</span>
                               </div>
                               <div className="flex items-center text-xs text-gray-500 space-x-2">
                                 <div className="flex items-center space-x-1">
                                   <Clock className="w-3 h-3 flex-shrink-0" />
                                   <span>{restaurant.min_delivery_time}-{restaurant.max_delivery_time} min</span>
                                 </div>
                                 <span className="text-gray-400">•</span>
                                 <div className="flex items-center space-x-1">
                                   <Truck className="w-3 h-3 flex-shrink-0" />
                                   <span>{formatPrice(restaurant.delivery_fee_cents || 0)}</span>
                                 </div>
                               </div>
                             </div>
                           </div>

                           {/* Delivery/Pickup Toggle - Mobile */}
                           <div className="flex gap-2 mt-4">
                             <button
                               onClick={() => setDeliveryMethod('delivery')}
                               className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                                 deliveryMethod === 'delivery'
                                   ? 'bg-black text-white'
                                   : 'bg-gray-100 text-gray-600'
                               }`}
                             >
                               <Truck className="w-4 h-4 inline mr-1" />
                               Delivery
                             </button>
                             <button
                               onClick={() => setDeliveryMethod('pickup')}
                               className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                                 deliveryMethod === 'pickup'
                                   ? 'bg-black text-white'
                                   : 'bg-gray-100 text-gray-600'
                               }`}
                             >
                               <Store className="w-4 h-4 inline mr-1" />
                               Pickup
                             </button>
                           </div>
                         </div>

                         {/* Sticky Category Tabs - Mobile */}
                         <div className="sticky top-12 z-40 bg-white border-b border-gray-200 overflow-x-auto scrollbar-hide -mx-4 px-4">
                           <div className="flex space-x-2 py-3">
                             {featuredItems.length > 0 && (
                               <button
                                 onClick={() => scrollToSection('featured')}
                                 className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                   activeSection === 'featured'
                                     ? 'bg-black text-white'
                                     : 'bg-gray-100 text-gray-700'
                                 }`}
                               >
                                 ⭐ Featured
                               </button>
                             )}
                             {mostOrderedItems.length > 0 && (
                               <button
                                 onClick={() => scrollToSection('most-ordered')}
                                 className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                   activeSection === 'most-ordered'
                                     ? 'bg-black text-white'
                                     : 'bg-gray-100 text-gray-700'
                                 }`}
                               >
                                 🔥 Most Ordered
                               </button>
                             )}
                             {categories.map(category => (
                               <button
                                 key={category.id}
                                 onClick={() => scrollToSection(category.id)}
                                 className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                   activeSection === category.id
                                     ? 'bg-black text-white'
                                     : 'bg-gray-100 text-gray-700'
                                 }`}
                               >
                                 {category.name}
                               </button>
                             ))}
                           </div>
                         </div>

                         {/* Mobile Menu Items - Compact List */}
                         <div className="px-4 py-6 space-y-6">
                           {/* Featured Items - Mobile */}
                           {featuredItems.length > 0 && (
                             <section id="featured-mobile" className="scroll-mt-24">
                               <h2 className="text-xl font-bold text-gray-900 mb-4">Featured Items</h2>
                               <div className="space-y-3">
                                 {featuredItems.map(item => (
                                   <div
                                     key={item.id}
                                     onClick={() => openItemModal(item)}
                                     className="flex gap-3 bg-white rounded-xl border border-gray-200 p-3 active:bg-gray-50 transition-colors"
                                   >
                                     <div className="flex-1 min-w-0">
                                       <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                                       <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                                       <div className="flex items-center justify-between">
                                         <span className="text-base font-bold text-gray-900">{formatPrice(item.price_cents)}</span>
                                         <div className="flex items-center space-x-1">
                                           {item.is_vegetarian && <Leaf className="w-4 h-4 text-green-600" />}
                                           {item.chef_recommended && <ChefHat className="w-4 h-4 text-orange-500" />}
                                         </div>
                                       </div>
                                     </div>
                                     {item.image_url && (
                                       <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
                                         <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100/CCCCCC/666666?text=Item"; }} />
                                         <button
                                           onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                           className="absolute bottom-1 right-1 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                                         >
                                           <Plus className="w-4 h-4 text-primary" />
                                         </button>
                                       </div>
                                     )}
                                   </div>
                                 ))}
                               </div>
                             </section>
                           )}

                           {/* Most Ordered - Mobile */}
                           {mostOrderedItems.length > 0 && (
                             <section id="most-ordered-mobile" className="scroll-mt-24">
                               <h2 className="text-xl font-bold text-gray-900 mb-4">Most Ordered</h2>
                               <div className="space-y-3">
                                 {mostOrderedItems.map(item => (
                                   <div
                                     key={item.id}
                                     onClick={() => openItemModal(item)}
                                     className="flex gap-3 bg-white rounded-xl border border-gray-200 p-3 active:bg-gray-50 transition-colors"
                                   >
                                     <div className="flex-1 min-w-0">
                                       <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                                       <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                                       <div className="flex items-center justify-between">
                                         <span className="text-base font-bold text-gray-900">{formatPrice(item.price_cents)}</span>
                                         <div className="flex items-center space-x-1">
                                           {item.is_vegetarian && <Leaf className="w-4 h-4 text-green-600" />}
                                           {item.chef_recommended && <ChefHat className="w-4 h-4 text-orange-500" />}
                                         </div>
                                       </div>
                                     </div>
                                     {item.image_url && (
                                       <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
                                         <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100/CCCCCC/666666?text=Item"; }} />
                                         <button
                                           onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                           className="absolute bottom-1 right-1 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                                         >
                                           <Plus className="w-4 h-4 text-primary" />
                                         </button>
                                       </div>
                                     )}
                                   </div>
                                 ))}
                               </div>
                             </section>
                           )}

                           {/* Category Sections - Mobile */}
                           {categories.map(category => {
                             const items = getItemsByCategory(category.id);
                             if (items.length === 0) return null;
                             
                             return (
                               <section key={category.id} id={`${category.id}-mobile`} className="scroll-mt-24">
                                 <h2 className="text-xl font-bold text-gray-900 mb-4">{category.name}</h2>
                                 <div className="space-y-3">
                                   {items.map(item => (
                                     <div
                                       key={item.id}
                                       onClick={() => openItemModal(item)}
                                       className="flex gap-3 bg-white rounded-xl border border-gray-200 p-3 active:bg-gray-50 transition-colors"
                                     >
                                       <div className="flex-1 min-w-0">
                                         <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                                         <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                                         <div className="flex items-center justify-between">
                                           <span className="text-base font-bold text-gray-900">{formatPrice(item.price_cents)}</span>
                                           <div className="flex items-center space-x-1">
                                             {item.is_vegetarian && <Leaf className="w-4 h-4 text-green-600" />}
                                             {item.chef_recommended && <ChefHat className="w-4 h-4 text-orange-500" />}
                                           </div>
                                         </div>
                                       </div>
                                       {item.image_url && (
                                         <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
                                           <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100/CCCCCC/666666?text=Item"; }} />
                                           <button
                                             onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                             className="absolute bottom-1 right-1 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                                           >
                                             <Plus className="w-4 h-4 text-primary" />
                                           </button>
                                         </div>
                                       )}
                                     </div>
                                   ))}
                                 </div>
                               </section>
                             );
                           })}
                         </div>
                       </div>

                       {/* --- Desktop Header Image Banner --- */}
                       <div className="hidden lg:block relative h-64 overflow-hidden rounded-b-xl shadow-lg" style={{
                           boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                       }}>
                    <img
                        src={restaurant.header_image_url || restaurant.image_url || 'https://placehold.co/1200x400/A31D24/ffffff?text=Restaurant'}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
            style={{
                            imageRendering: 'crisp-edges'
                        }}
                        onError={(e) => { e.currentTarget.src = "https://placehold.co/1200x400/A31D24/ffffff?text=Restaurant"; }}
                    />

                           {/* Back Button */}
                           <button
                               onClick={() => navigate('/restaurants')}
                               className="absolute top-4 left-4 bg-white rounded-md p-2 shadow-lg hover:bg-gray-100 transition"
                           >
                               <ChevronLeft className="w-4 h-4" />
                           </button>

                           {/* Status Bar Overlay */}
                           <div className="absolute bottom-0 left-0 right-0 h-10 bg-white flex items-center px-4 shadow-lg">
                               <p className="text-sm font-medium text-gray-700 flex-1">
                                   <span className={restaurant.is_open ? 'text-green-700' : 'text-primary'}>
                                       {restaurant.is_open ? 'Open Now' : 'Closed'}
                                   </span> • {restaurant.min_delivery_time}-{restaurant.max_delivery_time} min
                               </p>
              </div>
            </div>
        </div>
        
            {/* --- Main Content Layout - Desktop Only --- */}
            <main className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                       {/* --- Restaurant Name & Search Bar --- */}
                       <div className="mb-6 flex items-center justify-between">
                           <div className="flex items-center space-x-4">
                               {/* Restaurant Logo */}
                               <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 shadow-md">
                                   <img 
                                       src={restaurant.logo_url || restaurant.image_url || 'https://placehold.co/64x64/CCCCCC/666666?text=Logo'} 
                                       alt={`${restaurant.name} logo`}
                                       className="w-full h-full object-cover"
                                       onError={(e) => {
                                           (e.target as HTMLImageElement).onerror = null;
                                           (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/CCCCCC/666666?text=Logo';
                                       }}
                                   />
                               </div>
                               <h1 className="text-3xl font-extrabold text-gray-900" style={{
                                   letterSpacing: '-0.025em',
                                   lineHeight: '1.1'
                               }}>{restaurant.name}</h1>
                           </div>
                           <div className="relative w-80">
                               <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                               <input
                                   type="text"
                                   placeholder={`Search ${restaurant.name}`}
                                   value={searchQuery}
                                   onChange={(e) => setSearchQuery(e.target.value)}
                                   className="w-full py-2 pl-10 pr-3 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-primary transition"
                               />
      </div>
              </div>

                {/* --- Two-Column Layout --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT: Sticky Store Info and Menu Sidebar */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-4" style={{ top: '32px' }}>
                            <LeftColumn />
    </div>
          </div>
          
                    {/* RIGHT: Delivery Tabs, Price/Time, and Scrollable Menu Content */}
                    <div className="lg:col-span-9 min-w-0">
                               {/* Delivery Tabs and Price/Time (Sticky Top Bar) - Only for Delivery */}
                               {deliveryMethod === 'delivery' && (
                                   <div ref={tabsRef} className="sticky top-0 bg-gray-50 pt-4 pb-6 z-20 border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                                       <div className="flex justify-between items-center space-x-6">
                                           {/* Delivery/Pickup Tabs */}
                                           <div className="flex border border-gray-300 rounded-lg p-0.5 bg-gray-100 text-sm font-semibold transition duration-300">
                                               <button
                                                   onClick={() => setDeliveryMethod('delivery')}
                                                   className={`px-5 py-2 rounded-md transition duration-200 ${deliveryMethod === 'delivery' ? 'bg-primary shadow-lg text-white font-bold' : 'text-gray-600 font-medium hover:bg-white'}`}
                                               >
                                                   Delivery
                                               </button>
                                               <button
                                                   onClick={() => setDeliveryMethod('pickup')}
                                                   className={`px-5 py-2 rounded-md transition duration-200 ${(deliveryMethod as string) === 'pickup' ? 'bg-primary shadow-lg text-white font-bold' : 'text-gray-600 font-medium hover:bg-white'}`}
                                               >
                                                   Pickup
                                               </button>
            </div>
            
                                           {/* Price/Time Info Box */}
                                           <div className="flex items-center space-x-4 text-base text-right">
                                               {/* Delivery Fee Box */}
                                               <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                                                   <div className="font-bold text-sm">
                                                       {formatPrice(restaurant.delivery_fee_cents)} delivery fee
                                                   </div>
                                                   <div className="text-xs flex items-center">
                                                       pricing & fees
                                                       <Info className="w-3 h-3 ml-1" />
                                                   </div>
              </div>
              
                                               {/* Delivery Time */}
                                               <div className="text-right">
                                                   <div className="text-lg font-bold text-gray-900">
                                                       {restaurant.min_delivery_time}-{restaurant.max_delivery_time}
                </div>
                                                   <div className="text-sm text-gray-600">
                                                       delivery time
              </div>
            </div>
          </div>
                                       </div>
                                   </div>
                               )}

                               {/* Pickup Interface - Show when pickup is selected */}
                               {deliveryMethod === 'pickup' && <PickupInterface />}

                               {/* Deals & Benefits */}
                               <section id="deals" className="pt-2">
                                   <DealsSection />
                               </section>


                        {/* Reviews Section */}
                        <section id="reviews" className="mb-10 pt-20 -mt-20">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Reviews</h2>
                                    <p className="text-sm text-gray-600">3k+ ratings • 80+ public reviews</p>
              </div>
                                <div className="flex items-center space-x-2">
                                    <button className="text-sm font-semibold text-primary hover:text-primary">
                                        Add Review
                                    </button>
                                    <div className="flex space-x-1">
                                        <button 
                                            onClick={scrollReviewsLeft}
                                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={scrollReviewsRight}
                                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                                        >
                                            <ChevronLeft className="w-4 h-4 rotate-180" />
                                        </button>
          </div>
        </div>
      </div>

                            <div className="flex space-x-6">
                                {/* Overall Rating Card */}
                                <div className="flex-shrink-0 w-48 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                                    <div className="flex flex-col items-center">
                                        {/* Circular Rating Display */}
                                        <div className="relative w-24 h-24 mb-4">
                                            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                                                {/* Background circle */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    stroke="#e5e7eb"
                                                    strokeWidth="8"
                                                    fill="none"
                                                />
                                                {/* Progress circle */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    stroke="#fbbf24"
                                                    strokeWidth="8"
                                                    fill="none"
                                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.88)}`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-2xl font-bold text-gray-900">4.4</span>
                                                <Star className="w-4 h-4 text-gray-400 mt-1" />
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 text-center">of 5 stars</p>
                                    </div>
        </div>

                                {/* Individual Review Cards - Horizontal Scroll */}
                                <div className="flex space-x-4 overflow-x-hidden pb-4 snap-x snap-mandatory" ref={reviewsScrollRef}>
                                    {/* Review Card 1 */}
                                    <div className="flex-shrink-0 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 snap-start">
                                        <div className="flex items-start space-x-3 mb-3">
                                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                M
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-1">
                                                    <span className="font-semibold text-gray-900">Marcus T</span>
                                                    <ChevronLeft className="w-3 h-3 text-gray-400 rotate-90" />
                                                </div>
                                                <p className="text-xs text-gray-600">Regular Customer • 12 orders</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className="flex space-x-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                                ))}
                                            </div>
                                            <span className="text-sm text-gray-500">11/15/23</span>
                                            <span className="text-sm text-gray-500">• Craven order</span>
                                        </div>
                                        <p className="text-sm text-gray-700">
                                            This place never disappoints! <span className="font-semibold">Classic Burger</span> is always fresh and the delivery is super quick. Highly recommend!
                </p>
              </div>
              
                                    {/* Review Card 2 */}
                                    <div className="flex-shrink-0 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 snap-start">
                                        <div className="flex items-start space-x-3 mb-3">
                                            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                S
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-1">
                                                    <span className="font-semibold text-gray-900">Sarah K</span>
                                                    <ChevronLeft className="w-3 h-3 text-gray-400 rotate-90" />
                                                </div>
                                                <p className="text-xs text-gray-600">Food Lover • 8 reviews</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className="flex space-x-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                                ))}
                                            </div>
                                            <span className="text-sm text-gray-500">10/28/23</span>
                                            <span className="text-sm text-gray-500">• Craven order</span>
                                        </div>
                                        <p className="text-sm text-gray-700">
                                            Amazing food! <span className="font-semibold">Chicken Sandwich</span> was perfectly cooked and the <span className="font-semibold">seasoned fries</span> were incredible. Will definitely order again!
                                        </p>
                </div>
                
                                    {/* Review Card 3 */}
                                    <div className="flex-shrink-0 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 snap-start">
                                        <div className="flex items-start space-x-3 mb-3">
                                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                D
              </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-1">
                                                    <span className="font-semibold text-gray-900">David M</span>
                                                    <ChevronLeft className="w-3 h-3 text-gray-400 rotate-90" />
            </div>
                                                <p className="text-xs text-gray-600">New Customer • 3 orders</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className="flex space-x-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
          ))}
        </div>
                                            <span className="text-sm text-gray-500">12/02/23</span>
                                            <span className="text-sm text-gray-500">• Craven order</span>
                                        </div>
                                        <p className="text-sm text-gray-700">
                                            First time ordering and I'm impressed! <span className="font-semibold">Fish Sandwich</span> was crispy and fresh. The <span className="font-semibold">onion rings</span> were the perfect side. Great value!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                               {/* Featured Items */}
                               {featuredItems.length > 0 && (
                                   <section id="featured" className="mb-8 pt-20 -mt-20">
                                       <h2 className="text-2xl font-bold text-gray-800 mb-4">Featured Items</h2>
                                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                           {featuredItems.map(item => (
                                               <MenuItemCard key={item.id} item={item} />
          ))}
            </div>
                                       <div className='mt-6 border-t border-gray-200'></div>
                                   </section>
                               )}

                               {/* Most Ordered */}
                               {mostOrderedItems.length > 0 && (
                                   <section id="most-ordered" className="mb-8 pt-20 -mt-20">
                                       <h2 className="text-2xl font-bold text-gray-800 mb-4">Most Ordered</h2>
                                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                           {mostOrderedItems.map(item => (
                                               <MenuItemCard key={item.id} item={item} />
                                           ))}
              </div>
                                       <div className='mt-6 border-t border-gray-200'></div>
                                   </section>
                               )}

                               {/* Category Sections */}
                               {categories.map(category => {
                                   const items = getItemsByCategory(category.id);
                                   if (items.length === 0) return null;

                                   return (
                                       <section key={category.id} id={category.id} className="mb-8 pt-20 -mt-20">
                                           <h2 className="text-2xl font-bold text-gray-800 mb-4">{category.name}</h2>
                                           {category.description && (
                                               <p className="text-gray-600 mb-4">{category.description}</p>
                                           )}
                                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                               {items.map(item => (
                                                   <MenuItemCard key={item.id} item={item} />
                                               ))}
            </div>
                                           <div className='mt-6 border-t border-gray-200'></div>
                                       </section>
                                   );
                               })}
            </div>
          </div>
            </main>

                   {/* Floating Cart Button - Mobile (DoorDash Style) */}
                   {cart.length > 0 && (
                       <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50 pb-safe">
                           <button
                               onClick={() => navigate('/checkout')}
                               className="w-full bg-primary text-white rounded-full py-4 px-6 shadow-2xl flex items-center justify-between active:scale-[0.98] transition-all duration-200"
                           >
                               <div className="flex items-center space-x-3">
                                   <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                       <span className="text-sm font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                                   </div>
                                   <span className="font-bold text-lg">View Cart</span>
                               </div>
                               <span className="font-bold text-lg">
                                   ${(cart.reduce((sum, item) => sum + item.quantity * item.price_cents, 0) / 100).toFixed(2)}
                               </span>
                           </button>
                       </div>
                   )}

                   {/* Floating Cart Button - Desktop */}
                   {cart.length > 0 && showCartButton && (
                       <div 
                         className="hidden lg:block fixed bottom-4 right-4 z-50 transition-all duration-500 ease-in-out"
                         style={{
                           opacity: showCartButton ? 1 : 0,
                           transform: showCartButton ? 'translateY(0)' : 'translateY(20px)'
                         }}
                       >
                           <button
                               onClick={() => navigate('/checkout')}
                               className="bg-primary text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 hover:bg-primary/90 transition-all duration-200"
                           >
                               <ShoppingCart className="w-5 h-5" />
                               <span className="font-semibold text-base">Cart ({cart.length})</span>
                           </button>
        </div>
                   )}

            <style>{`
                html { scroll-behavior: smooth; }
                .snap-x > * {
                    scroll-snap-align: start;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .pb-safe {
                    padding-bottom: env(safe-area-inset-bottom);
                }
            `}</style>
            
                   {/* Triple Dipper Modal */}
                   <TripleDipperModal />

                   {/* Mapbox CSS */}
                   <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantMenuPage;