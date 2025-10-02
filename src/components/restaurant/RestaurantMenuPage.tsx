import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, Clock, Truck, Plus, Minus, ShoppingCart, TrendingUp, Award, X, 
  ChevronLeft, Utensils, Zap, Heart, Share2, MapPin, Phone, Camera,
  Navigation, MessageCircle, CheckCircle, Filter, Search, ChefHat, Leaf
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast as showToast } from 'sonner';

// Enhanced Types
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
  latitude?: number;
  longitude?: number;
  chef_name?: string;
  established_year?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  display_order: number;
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
  is_featured?: boolean;
  order_count?: number;
  spice_level?: number;
  calories?: number;
  chef_recommended?: boolean;
}

interface CartItem extends MenuItem {
  key: string;
  quantity: number;
  special_instructions?: string;
  modifiers?: any[];
}

// Ultra Modern Button Component
const UltraButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = '',
  icon = null,
  glow = false,
  style = {}
}: {
  children: any;
  onClick: any;
  variant?: string;
  size?: string;
  disabled?: boolean;
  className?: string;
  icon?: any;
  glow?: boolean;
  style?: React.CSSProperties;
}) => {
  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    borderRadius: '32px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    position: 'relative',
    overflow: 'hidden',
    touchAction: 'manipulation',
    transform: 'translateZ(0)',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #a27b4bff 0%, #a27b4bff 25%, #d68a32ff 50%, #f5576c 75%, #4facfe 100%)',
      backgroundSize: '300% 300%',
      animation: 'gradientShift 6s ease infinite',
      color: 'white',
      boxShadow: glow 
        ? '0 0 40px rgba(102, 126, 234, 0.6), 0 20px 40px rgba(0, 0, 0, 0.15)'
        : '0 20px 40px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(102, 126, 234, 0.2)',
      color: '#4a5568',
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
    },
    ghost: {
      background: 'transparent',
      color: '#a27b4bff',
      boxShadow: 'none'
    },
    danger: {
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      color: 'white',
      boxShadow: '0 15px 35px rgba(255, 107, 107, 0.3)'
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(30px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    }
  };

  const sizes = {
    sm: {
      fontSize: '0.9rem',
      padding: '0.75rem 1.5rem',
      minHeight: '44px'
    },
    md: {
      fontSize: '1rem',
      padding: '1rem 2rem',
      minHeight: '52px'
    },
    lg: {
      fontSize: '1.1rem',
      padding: '1.25rem 2.5rem',
      minHeight: '60px'
    },
    xl: {
      fontSize: '1.2rem',
      padding: '1.5rem 3rem',
      minHeight: '68px'
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyles,
        ...variants[variant],
        ...sizes[size],
        opacity: disabled ? 0.6 : 1,
        ...style
      }}
      className={className}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
          if (variant === 'primary') {
            e.currentTarget.style.boxShadow = glow
              ? '0 0 60px rgba(102, 126, 234, 0.8), 0 25px 50px rgba(0, 0, 0, 0.2)'
              : '0 25px 50px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          if (variant === 'primary') {
            e.currentTarget.style.boxShadow = glow
              ? '0 0 40px rgba(102, 126, 234, 0.6), 0 20px 40px rgba(0, 0, 0, 0.15)'
              : '0 20px 40px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
          }
        }
      }}
    >
      {icon && <span style={{ marginRight: children ? '0.75rem' : 0 }}>{icon}</span>}
      {children}
    </button>
  );
};

// Futuristic Card Component
const FuturisticCard = ({
  children,
  className = '',
  hoverable = true,
  variant = 'default',
  style = {},
  onMouseEnter,
  onMouseLeave
}: {
  children: any;
  className?: string;
  hoverable?: boolean;
  variant?: string;
  style?: React.CSSProperties;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}) => {
  const variants = {
    default: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(30px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(40px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)'
    },
    gradient: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.9) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(102, 126, 234, 0.1)',
      boxShadow: '0 20px 40px rgba(102, 126, 234, 0.1)'
    }
  };

  const baseStyles = {
    borderRadius: '32px',
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
  };

  return (
    <div
      style={{ 
        ...baseStyles, 
        ...variants[variant], 
        ...style 
      }}
      className={className}
      onMouseEnter={onMouseEnter ? onMouseEnter : (e) => {
        if (hoverable) {
          e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 35px 70px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.7)';
        }
      }}
      onMouseLeave={onMouseLeave ? onMouseLeave : (e) => {
        if (hoverable) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = variants[variant].boxShadow;
        }
      }}
    >
      {children}
    </div>
  );
};

// Neon Badge Component
const NeonBadge = ({ children, variant = 'default', icon = null, pulse = false }) => {
  const variants = {
    default: {
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
      color: '#a27b4bff',
      border: '1px solid rgba(102, 126, 234, 0.3)',
      boxShadow: '0 0 20px rgba(102, 126, 234, 0.2)'
    },
    success: {
      background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.15) 0%, rgba(39, 174, 96, 0.15) 100%)',
      color: '#2ecc71',
      border: '1px solid rgba(46, 204, 113, 0.3)',
      boxShadow: '0 0 20px rgba(46, 204, 113, 0.2)'
    },
    featured: {
      background: 'linear-gradient(135deg, #a27b4bff 0%, #d68a32ff 100%)',
      color: 'white',
      border: 'none',
      boxShadow: '0 0 30px rgba(102, 126, 234, 0.5)'
    },
    popular: {
      background: 'linear-gradient(135deg, #d68a32ff 0%, #f5576c 100%)',
      color: 'white',
      border: 'none',
      boxShadow: '0 0 30px rgba(240, 147, 251, 0.5)'
    },
    neon: {
      background: 'transparent',
      color: ' #ff5100ff',
      border: '2px solid #fa773aff',
      boxShadow: '0 0 20px #fa773aff, inset 0 0 20px rgba(0, 245, 255, 0.1)',
      textShadow: '0 0 10px #fa773aff'
    }
  };

  return (
    <span
      style={{
        ...variants[variant],
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '700',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        animation: pulse ? 'pulse 2s infinite' : 'none',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
      }}
    >
      {icon}
      {children}
    </span>
  );
};

const RestaurantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Enhanced Restaurant Images
  const restaurantImages = [
    restaurant?.image_url || '/placeholder-restaurant.jpg',
    '/restaurant-interior.jpg',
    '/restaurant-kitchen.jpg',
    '/restaurant-signature-dish.jpg'
  ];

  useEffect(() => {
    if (id) {
      fetchRestaurantData();
    }
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      
      // Fetch restaurant data
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Fetch categories and menu items
      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', id)
        .order('display_order');

      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', id)
        .eq('is_available', true);

      setCategories(categoriesData || []);
      setMenuItems(
        (menuData || []).map((item: any) => ({
          ...item,
          spice_level: item.spice_level !== undefined && item.spice_level !== null
            ? Number(item.spice_level)
            : undefined
        }))
      );
      
      if (categoriesData?.length > 0) {
        setSelectedCategory(categoriesData[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching restaurant data:', error);
      showToast.error("Failed to load restaurant details");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = useCallback((item: MenuItem, quantity: number = 1) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + quantity }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity, key: item.id }]);
    }
    
    showToast.success(`${item.name} added to cart!`);
  }, [cart]);

  const getCartTotal = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price_cents * item.quantity), 0);
    const deliveryFee = deliveryMethod === 'delivery' ? (restaurant?.delivery_fee_cents || 0) : 0;
    const tax = Math.round(subtotal * 0.08);
    
    return {
      subtotal,
      deliveryFee,
      tax,
      total: subtotal + deliveryFee + tax
    };
  };

  const getItemsByCategory = (categoryId: string) => {
    return menuItems.filter(item => item.category_id === categoryId);
  };

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #a27b4bff 0%, #764ba2 25%, #d68a32ff 50%, #f5576c 75%, #4facfe 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 8s ease infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <FuturisticCard variant="glass" hoverable={false} style={{ padding: '4rem', textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '4px solid transparent',
            borderTop: '4px solid #a27b4bff',
            borderRight: '4px solid #d68a32ff',
            borderRadius: '50%',
            animation: 'spin 1.5s linear infinite',
            margin: '0 auto 2rem'
          }} />
          <h3 style={{ 
            color: 'white', 
            fontSize: '2rem', 
            fontWeight: '800',
            background: 'linear-gradient(135deg, #a27b4bff 0%, #d68a32ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            Loading Experience...
          </h3>
        </FuturisticCard>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #a27b4bff 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <FuturisticCard variant="glass" hoverable={false} style={{ padding: '4rem', textAlign: 'center', maxWidth: '500px' }}>
          <h2 style={{ 
            color: 'white', 
            fontSize: '2.5rem', 
            marginBottom: '2rem',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            Restaurant Not Found
          </h2>
          <UltraButton 
            variant="glass" 
            size="lg"
            onClick={() => navigate('/restaurants')}
            icon={<ChevronLeft style={{ width: '20px', height: '20px' }} />}
          >
            Explore Restaurants
          </UltraButton>
        </FuturisticCard>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Revolutionary Hero Section */}
      <section style={{ 
        position: 'relative', 
        height: '100vh', 
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* Animated Background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.8) 25%, rgba(240, 147, 251, 0.7) 50%, rgba(245, 87, 108, 0.8) 75%, rgba(79, 172, 254, 0.9) 100%),
            url(${restaurantImages[activeImageIndex]})
          `,
          backgroundSize: '400% 400%, cover',
          backgroundPosition: 'center, center',
          animation: 'gradientShift 10s ease infinite',
          filter: 'blur(1px)'
        }} />

        {/* Floating Particles */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
          `,
          animation: 'float 8s ease-in-out infinite'
        }} />
        
        {/* Futuristic Navigation */}
        <div style={{
          position: 'absolute',
          top: '2rem',
          left: '2rem',
          right: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 20
        }}>
          <UltraButton
            variant="glass"
            size="md"
            onClick={() => navigate(-1)}
            icon={<ChevronLeft style={{ width: '24px', height: '24px' }} />}
            style={{ borderRadius: '50%', width: '60px', height: '60px', padding: 0 }}
          >{""}</UltraButton>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <UltraButton
              variant="glass"
              size="md"
              onClick={() => setIsFavorited(!isFavorited)}
              icon={<Heart style={{
                width: '24px',
                height: '24px',
                fill: isFavorited ? '#d68a32ff' : 'transparent',
                color: isFavorited ? '#d68a32ff' : 'white'
              }} />}
              style={{ borderRadius: '50%', width: '60px', height: '60px', padding: 0 }}
            >{""}</UltraButton>
            <UltraButton
              variant="glass"
              size="md"
              icon={<Share2 style={{ width: '24px', height: '24px' }} />}
              style={{ borderRadius: '50%', width: '60px', height: '60px', padding: 0 }}
              onClick={() => {}}
            >{""}</UltraButton>
          </div>
        </div>

        {/* Central Content */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            {restaurant.chef_name && (
              <NeonBadge variant="featured" icon={<ChefHat style={{ width: '16px', height: '16px' }} />}>
                Chef {restaurant.chef_name}
              </NeonBadge>
            )}
            <NeonBadge variant="neon" pulse>
              LIVE NOW
            </NeonBadge>
          </div>
          
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            fontWeight: '900',
            margin: '0 0 2rem 0',
            color: 'white',
            textShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            letterSpacing: '-0.02em',
            lineHeight: 0.9
          }}>
            {restaurant.name}
          </h1>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              padding: '1rem 2rem',
              borderRadius: '25px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Star style={{ width: '28px', height: '28px', fill: '#ffd700', color: '#ffd700' }} />
              <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white' }}>{restaurant.rating}</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem' }}>({restaurant.total_reviews}+)</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              padding: '1rem 2rem',
              borderRadius: '25px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Clock style={{ width: '24px', height: '24px', color: 'white' }} />
              <span style={{ color: 'white', fontSize: '1.1rem', fontWeight: '600' }}>
                {restaurant.min_delivery_time}-{restaurant.max_delivery_time} min
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              padding: '1rem 2rem',
              borderRadius: '25px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Truck style={{ width: '24px', height: '24px', color: 'white' }} />
              <span style={{ color: 'white', fontSize: '1.1rem', fontWeight: '600' }}>
                ${(restaurant.delivery_fee_cents / 100).toFixed(2)} delivery
              </span>
            </div>
          </div>
          
          <p style={{
            fontSize: '1.3rem',
            color: 'rgba(255, 255, 255, 0.9)',
            maxWidth: '700px',
            margin: '0 auto 3rem',
            lineHeight: 1.6,
            fontWeight: '400'
          }}>
            {restaurant.description}
          </p>

          <UltraButton
            variant="primary"
            size="xl"
            glow
            onClick={() => {
              const menuSection = document.getElementById('menu-section');
              menuSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            icon={<Utensils style={{ width: '24px', height: '24px' }} />}
          >
            Explore Menu
          </UltraButton>
        </div>

        {/* Floating Image Indicators */}
        <div style={{
          position: 'absolute',
          bottom: '3rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '1rem',
          zIndex: 20
        }}>
          {restaurantImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveImageIndex(index)}
              style={{
                width: activeImageIndex === index ? '60px' : '16px',
                height: '16px',
                borderRadius: '8px',
                border: 'none',
                background: activeImageIndex === index 
                  ? 'rgba(255, 255, 255, 0.9)' 
                  : 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                backdropFilter: 'blur(10px)'
              }}
            />
          ))}
        </div>
      </section>

      {/* Floating Action Center */}
      <div style={{
        position: 'sticky',
        top: '2rem',
        zIndex: 100,
        margin: '3rem 2rem 0',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <FuturisticCard variant="glass" hoverable={false} style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {['delivery', 'pickup'].map((method) => (
              <UltraButton
                key={method}
                variant={deliveryMethod === method ? 'primary' : 'ghost'}
                size="md"
                onClick={() => setDeliveryMethod(method as 'delivery' | 'pickup')}
                icon={method === 'delivery' ? 
                  <Truck style={{ width: '20px', height: '20px' }} /> : 
                  <MapPin style={{ width: '20px', height: '20px' }} />
                }
                style={{ textTransform: 'capitalize' }}
              >
                {method}
              </UltraButton>
            ))}
            
            <div style={{ width: '1px', height: '40px', background: 'rgba(102, 126, 234, 0.2)' }} />
            
            <UltraButton
              variant={cart.length > 0 ? 'primary' : 'secondary'}
              size="md"
              glow={cart.length > 0}
              onClick={() => setShowCart(true)}
              icon={<ShoppingCart style={{ width: '20px', height: '20px' }} />}
              style={{ position: 'relative' }}
            >
              Cart
              {cart.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: 'linear-gradient(135deg, #d68a32ff 0%, #f5576c 100%)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  boxShadow: '0 0 20px rgba(240, 147, 251, 0.6)'
                }}>
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </UltraButton>
          </div>
        </FuturisticCard>
      </div>

      {/* Advanced Search Interface */}
      <div id="menu-section" style={{
        padding: '3rem 2rem 0',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <FuturisticCard variant="gradient" hoverable={false} style={{ padding: '2rem', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
              <Search style={{
                position: 'absolute',
                left: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                color: '#a27b4bff'
              }} />
              <input
                type="text"
                placeholder="Search magical dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1.25rem 1.5rem 1.25rem 4rem',
                  border: '2px solid rgba(102, 126, 234, 0.2)',
                  borderRadius: '25px',
                  fontSize: '1.1rem',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  color: '#4a5568',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#a27b4bff';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(102, 126, 234, 0.3)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <UltraButton
              variant="secondary"
              size="lg"
              icon={<Filter style={{ width: '20px', height: '20px' }} />}
              onClick={() => {}}
            >
              Filters
            </UltraButton>
          </div>
        </FuturisticCard>
      </div>

      {/* Dynamic Category Navigation */}
      <div style={{
        padding: '0 2rem 3rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          paddingBottom: '1rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {categories.map((category) => (
            <UltraButton
              key={category.id}
              variant={selectedCategory === category.id ? 'primary' : 'secondary'}
              size="md"
              onClick={() => setSelectedCategory(category.id)}
              style={{ 
                whiteSpace: 'nowrap',
                boxShadow: selectedCategory === category.id 
                  ? '0 0 30px rgba(102, 126, 234, 0.4)' 
                  : '0 8px 25px rgba(0, 0, 0, 0.08)'
              }}
            >
              {category.icon && <span style={{ marginRight: '0.5rem' }}>{category.icon}</span>}
              {category.name}
            </UltraButton>
          ))}
        </div>
      </div>

      {/* Revolutionary Menu Display */}
      <div style={{
        padding: '0 2rem 6rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {searchQuery ? (
          <div>
            <h2 style={{
              fontSize: '3rem',
              fontWeight: '900',
              marginBottom: '3rem',
              background: 'linear-gradient(135deg, #a27b4bff 0%, #764ba2 50%, #d68a32ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center'
            }}>
              Search Results ({filteredItems.length})
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '2rem'
            }}>
              {filteredItems.map((item) => (
                <FuturisticMenuCard key={item.id} item={item} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        ) : (
          categories.map((category) => {
            const categoryItems = getItemsByCategory(category.id);
            if (categoryItems.length === 0) return null;

            return (
              <div key={category.id} style={{ marginBottom: '5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2rem',
                  marginBottom: '3rem',
                  flexWrap: 'wrap'
                }}>
                  <h2 style={{
                    fontSize: '3rem',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #ead666ff 0%, #a28f4bff 50%, #fbe493ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textAlign: 'center'
                  }}>
                    {category.icon} {category.name}
                  </h2>
                  <NeonBadge variant="success">
                    {categoryItems.length} dishes
                  </NeonBadge>
                </div>
                
                {category.description && (
                  <p style={{
                    fontSize: '1.2rem',
                    color: '#a27b4bff',
                    marginBottom: '3rem',
                    fontWeight: '500',
                    textAlign: 'center',
                    maxWidth: '600px',
                    margin: '0 auto 3rem'
                  }}>
                    {category.description}
                  </p>
                )}
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                  gap: '2rem'
                }}>
                  {categoryItems.map((item) => (
                    <FuturisticMenuCard key={item.id} item={item} onAddToCart={addToCart} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Cart Summary */}
      {cart.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000
        }}>
          <UltraButton
            variant="primary"
            size="xl"
            glow
            onClick={() => setShowCart(true)}
            icon={<ShoppingCart style={{ width: '28px', height: '28px' }} />}
            style={{
              animation: 'float 3s ease-in-out infinite',
              boxShadow: '0 25px 60px rgba(234, 201, 102, 0.4)'
            }}
          >
            {cart.reduce((sum, item) => sum + item.quantity, 0)} items • ${(getCartTotal().total / 100).toFixed(2)}
          </UltraButton>
        </div>
      )}

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
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

// Futuristic Menu Item Card
const FuturisticMenuCard = ({ item, onAddToCart }: { item: MenuItem; onAddToCart: (item: MenuItem) => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <FuturisticCard
      variant="default"
      style={{ 
        position: 'relative', 
        cursor: 'pointer',
        overflow: 'hidden',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Glow Effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(234, 181, 102, 0.1) 0%, rgba(251, 213, 147, 0.1) 100%)',
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.4s ease'
      }} />

      {/* Premium Badges */}
      <div style={{
        position: 'absolute',
        top: '1.5rem',
        left: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        zIndex: 20
      }}>
        {item.chef_recommended && (
          <NeonBadge variant="featured" icon={<ChefHat style={{ width: '14px', height: '14px' }} />}>
            Chef's Special
          </NeonBadge>
        )}
        {item.is_featured && (
          <NeonBadge variant="popular" icon={<TrendingUp style={{ width: '14px', height: '14px' }} />} pulse>
            Trending
          </NeonBadge>
        )}
      </div>

      {/* Dietary Information */}
      <div style={{
        position: 'absolute',
        top: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        gap: '0.75rem',
        zIndex: 20
      }}>
        {item.is_vegetarian && (
          <div style={{
            background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(46, 204, 113, 0.3)'
          }}>
            <Leaf style={{ width: '18px', height: '18px' }} />
          </div>
        )}
        {item.is_gluten_free && (
          <div style={{
            background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: '800',
            boxShadow: '0 8px 25px rgba(228, 119, 18, 0.3)'
          }}>
            GF
          </div>
        )}
      </div>

      {/* Enhanced Image Container */}
      <div style={{
        height: '250px',
        background: `
          linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%),
          url(${item.image_url || '/placeholder-food.jpg'})
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '25px 25px 0 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Spice Level Indicator */}
        {item.spice_level && item.spice_level > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '1.5rem',
            display: 'flex',
            gap: '4px',
            background: 'rgba(0, 0, 0, 0.6)',
            padding: '0.75rem 1rem',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                style={{
                  fontSize: '1.2rem',
                  opacity: i < item.spice_level! ? 1 : 0.3,
                  filter: i < item.spice_level! ? 'drop-shadow(0 0 8px #ff6b35)' : 'none'
                }}
              >
                🌶️
              </span>
            ))}
          </div>
        )}

        {/* Futuristic Add Button */}
        <UltraButton
          variant="primary"
          size="md"
          glow
          onClick={(e) => {
            e?.stopPropagation();
            onAddToCart(item);
          }}
          icon={<Plus style={{ width: '24px', height: '24px' }} />}
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            right: '1.5rem',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            padding: 0,
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.3s ease'
          }}
        >{""}</UltraButton>
      </div>

      {/* Enhanced Content */}
      <div style={{ padding: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem'
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              color: '#2d3748',
              marginBottom: '0.75rem',
              lineHeight: 1.3
            }}>
              {item.name}
            </h3>
            <p style={{
              color: '#a27b4bff',
              fontSize: '1rem',
              lineHeight: 1.5,
              marginBottom: '1.5rem'
            }}>
              {item.description}
            </p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #a27b4bff 0%, #764ba2 100%)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '25px',
            fontWeight: '800',
            fontSize: '1.3rem',
            marginLeft: '1.5rem',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
          }}>
            ${(item.price_cents / 100).toFixed(2)}
          </div>
        </div>

        {/* Enhanced Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '1.5rem',
          borderTop: '2px solid rgba(102, 126, 234, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            fontSize: '0.95rem',
            color: '#a27b4bff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock style={{ width: '18px', height: '18px' }} />
              {item.preparation_time} min
            </div>
            {item.calories && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap style={{ width: '18px', height: '18px' }} />
                {item.calories} cal
              </div>
            )}
          </div>
          
          <UltraButton
            variant="ghost"
            size="sm"
            icon={<Heart style={{ width: '16px', height: '16px' }} />}
            onClick={(e) => {
              e?.stopPropagation();
              // Handle favorite logic
            }}
          >{""}</UltraButton>
        </div>
      </div>
    </FuturisticCard>
  );
};

export default RestaurantDetail;