import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, Clock, Truck, Plus, Minus, ShoppingCart, X, 
  ChevronLeft, Utensils, Heart, Share2, MapPin, Phone,
  Navigation, MessageCircle, CheckCircle, Filter, Search, ChefHat, Leaf,
  Info, ArrowUp, Timer, Flame
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast as showToast } from 'sonner';

// Types remain the same
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

// Simplified Button Component for delivery app
const DeliveryButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = '',
  icon = null,
  fullWidth = false,
  style = {}
}: {
  children: any;
  onClick: any;
  variant?: string;
  size?: string;
  disabled?: boolean;
  className?: string;
  icon?: any;
  fullWidth?: boolean;
  style?: React.CSSProperties;
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    borderRadius: '12px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    width: fullWidth ? '100%' : 'auto',
    gap: '8px'
  };

  const variants = {
    primary: {
      background: '#FF6B35',
      color: 'white',
      boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)'
    },
    secondary: {
      background: '#f8f9fa',
      color: '#495057',
      border: '1px solid #e9ecef'
    },
    outline: {
      background: 'transparent',
      color: '#FF6B35',
      border: '1px solid #FF6B35'
    },
    ghost: {
      background: 'transparent',
      color: '#6c757d',
      border: 'none'
    }
  };

  const sizes = {
    sm: { fontSize: '14px', padding: '8px 16px', minHeight: '36px' },
    md: { fontSize: '16px', padding: '12px 20px', minHeight: '44px' },
    lg: { fontSize: '18px', padding: '16px 24px', minHeight: '52px' }
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
    >
      {icon && icon}
      {children}
    </button>
  );
};

// Mobile-first Card Component
const DeliveryCard = ({
  children,
  className = '',
  style = {},
  onClick
}: {
  children: any;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}) => {
  return (
    <div
      style={{ 
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        ...style
      }}
      className={className}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
        }
      }}
    >
      {children}
    </div>
  );
};

// Badge Component
const Badge = ({ children, variant = 'default', icon = null }) => {
  const variants = {
    default: { background: '#f8f9fa', color: '#495057' },
    success: { background: '#d4edda', color: '#155724' },
    warning: { background: '#fff3cd', color: '#856404' },
    primary: { background: '#FFE5DB', color: '#FF6B35' },
    featured: { background: '#FF6B35', color: 'white' }
  };

  return (
    <span
      style={{
        ...variants[variant],
        padding: '4px 8px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      {icon && icon}
      {children}
    </span>
  );
};

const RestaurantMenuPage = () => {
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
  const [showHeader, setShowHeader] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRestaurantData();
    }
  }, [id]);

  // Scroll handler for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setShowHeader(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

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

  const scrollToCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <DeliveryCard style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #FF6B35',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h3 style={{ color: '#495057', fontSize: '18px', fontWeight: '600' }}>
            Loading restaurant menu...
          </h3>
        </DeliveryCard>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <DeliveryCard style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: '#495057', fontSize: '24px', marginBottom: '20px' }}>
            Restaurant Not Found
          </h2>
          <DeliveryButton 
            variant="primary" 
            size="lg"
            onClick={() => navigate('/restaurants')}
            icon={<ChevronLeft size={20} />}
            fullWidth
          >
            Back to Restaurants
          </DeliveryButton>
        </DeliveryCard>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#f8f9fa',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Sticky Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'white',
        borderBottom: '1px solid #e9ecef',
        padding: '12px 16px',
        transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '768px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <DeliveryButton
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              icon={<ChevronLeft size={20} />}
              style={{ padding: '8px' }}
            >{""}</DeliveryButton>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{restaurant.name}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>
                {restaurant.min_delivery_time}-{restaurant.max_delivery_time} min
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <DeliveryButton
              variant="ghost"
              size="sm"
              onClick={() => setIsFavorited(!isFavorited)}
              icon={<Heart size={20} fill={isFavorited ? '#FF6B35' : 'none'} color={isFavorited ? '#FF6B35' : '#6c757d'} />}
              style={{ padding: '8px' }}
            >{""}</DeliveryButton>
            <DeliveryButton
              variant="ghost"
              size="sm"
              icon={<Share2 size={20} />}
              style={{ padding: '8px' }}
              onClick={() => {}}
            >{""}</DeliveryButton>
          </div>
        </div>
      </div>

      {/* Restaurant Header */}
      <div style={{ position: 'relative' }}>
        <div style={{
          height: '240px',
          background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${restaurant.image_url || '/placeholder-restaurant.jpg'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <DeliveryButton
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              icon={<ChevronLeft size={24} />}
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.9)', 
                color: '#495057',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                padding: 0
              }}
            >{""}</DeliveryButton>
            <div style={{ display: 'flex', gap: '8px' }}>
              <DeliveryButton
                variant="ghost"
                size="sm"
                onClick={() => setIsFavorited(!isFavorited)}
                icon={<Heart size={20} fill={isFavorited ? '#FF6B35' : 'none'} color={isFavorited ? '#FF6B35' : 'white'} />}
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.9)', 
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  padding: 0
                }}
              >{""}</DeliveryButton>
              <DeliveryButton
                variant="ghost"
                size="sm"
                icon={<Share2 size={20} />}
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.9)', 
                  color: '#495057',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  padding: 0
                }}
                onClick={() => {}}
              >{""}</DeliveryButton>
            </div>
          </div>
          
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              color: 'white'
            }}>
              {restaurant.name}
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.9)',
              margin: 0
            }}>
              {restaurant.cuisine_type} • {restaurant.address}
            </p>
          </div>
        </div>

        {/* Restaurant Info Bar */}
        <DeliveryCard style={{
          margin: '-20px 16px 20px',
          padding: '16px',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <span style={{ fontSize: '16px', fontWeight: '600' }}>{restaurant.rating}</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', margin: 0 }}>{restaurant.total_reviews}+ reviews</p>
            </div>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                <Clock size={16} color="#6c757d" />
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                  {restaurant.min_delivery_time}-{restaurant.max_delivery_time}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', margin: 0 }}>minutes</p>
            </div>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                <Truck size={16} color="#6c757d" />
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                  ${(restaurant.delivery_fee_cents / 100).toFixed(2)}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', margin: 0 }}>delivery</p>
            </div>
          </div>
        </DeliveryCard>
      </div>

      {/* Delivery Method Toggle */}
      <div style={{ padding: '0 16px 20px' }}>
        <DeliveryCard style={{ padding: '8px' }}>
          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden' }}>
            {(['delivery', 'pickup'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setDeliveryMethod(method)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  background: deliveryMethod === method ? '#FF6B35' : 'transparent',
                  color: deliveryMethod === method ? 'white' : '#6c757d',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s ease'
                }}
              >
                {method}
              </button>
            ))}
          </div>
        </DeliveryCard>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ position: 'relative' }}>
          <Search style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            color: '#6c757d'
          }} />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 16px 16px 48px',
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'white',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

            {/* Category Tabs */}
            <div style={{
              position: 'sticky',
              top: showHeader ? '76px' : '0',
              zIndex: 50,
              background: 'white',
              borderBottom: '1px solid #e9ecef',
              padding: '12px 0'
            }}>
              <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                padding: '0 16px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              className="scrollbar-hide"
              >
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => scrollToCategory(category.id)}
                    style={{
                      padding: '8px 16px',
                      border: selectedCategory === category.id ? '2px solid #FF6B35' : '1px solid #e9ecef',
                      borderRadius: '20px',
                      background: selectedCategory === category.id ? '#FFE5DB' : 'white',
                      color: selectedCategory === category.id ? '#FF6B35' : '#6c757d',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      minWidth: 'fit-content'
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
      
      {/* Menu Items */}
      <div style={{ padding: '20px 16px 100px' }}>
        {searchQuery ? (
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#495057'
            }}>
              Search Results ({filteredItems.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} onAddToCart={addToCart} cart={cart} updateCartQuantity={updateCartQuantity} />
              ))}
            </div>
          </div>
        ) : (
          categories.map((category) => {
            const categoryItems = getItemsByCategory(category.id);
            if (categoryItems.length === 0) return null;

            return (
              <div key={category.id} id={`category-${category.id}`} style={{ marginBottom: '32px' }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  color: '#495057'
                }}>
                  {category.name}
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {categoryItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} onAddToCart={addToCart} cart={cart} updateCartQuantity={updateCartQuantity} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '16px',
          right: '16px',
          zIndex: 1000
        }}>
          <DeliveryButton
            variant="primary"
            size="lg"
            onClick={() => setShowCart(true)}
            fullWidth
            style={{
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(255, 107, 53, 0.3)',
              fontSize: '16px',
              fontWeight: '700'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} />
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
              </div>
              <span>${(getCartTotal().total / 100).toFixed(2)}</span>
            </div>
          </DeliveryButton>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <CartModal 
          cart={cart}
          restaurant={restaurant}
          deliveryMethod={deliveryMethod}
          onClose={() => setShowCart(false)}
          updateQuantity={updateCartQuantity}
          removeItem={removeFromCart}
          getCartTotal={getCartTotal}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
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

// Menu Item Card Component
const MenuItemCard = ({ 
  item, 
  onAddToCart,
  cart,
  updateCartQuantity
}: { 
  item: MenuItem; 
  onAddToCart: (item: MenuItem) => void;
  cart: CartItem[];
  updateCartQuantity: (itemId: string, quantity: number) => void;
}) => {
  const cartItem = cart.find(cartItem => cartItem.id === item.id);
  const quantity = cartItem?.quantity || 0;

  return (
    <DeliveryCard style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: '12px', padding: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '8px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#495057',
              margin: '0 0 4px 0',
              lineHeight: 1.3
            }}>
              {item.name}
            </h3>
            
            {/* Badges */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {item.is_vegetarian && (
                <Badge variant="success" icon={<Leaf size={12} />}>Vegetarian</Badge>
              )}
              {item.chef_recommended && (
                <Badge variant="featured" icon={<ChefHat size={12} />}>Chef's Choice</Badge>
              )}
              {item.spice_level && item.spice_level > 0 && (
                <Badge variant="warning" icon={<Flame size={12} />}>
                  Spicy {item.spice_level}
                </Badge>
              )}
            </div>
            
            <p style={{
              fontSize: '14px',
              color: '#6c757d',
              margin: '0 0 12px 0',
              lineHeight: 1.4
            }}>
              {item.description}
            </p>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#FF6B35'
              }}>
                ${(item.price_cents / 100).toFixed(2)}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6c757d', fontSize: '12px' }}>
                  <Timer size={14} />
                  {item.preparation_time}m
                </div>
              </div>
            </div>
          </div>
          
          {/* Add to Cart Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            {quantity > 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '4px'
              }}>
                <DeliveryButton
                  variant="ghost"
                  size="sm"
                  onClick={() => updateCartQuantity(item.id, quantity - 1)}
                  icon={<Minus size={16} />}
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    padding: 0,
                    color: '#FF6B35'
                  }}
                >{""}</DeliveryButton>
                
                <span style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {quantity}
                </span>
                
                <DeliveryButton
                  variant="ghost"
                  size="sm"
                  onClick={() => updateCartQuantity(item.id, quantity + 1)}
                  icon={<Plus size={16} />}
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    padding: 0,
                    color: '#FF6B35'
                  }}
                >{""}</DeliveryButton>
              </div>
            ) : (
              <DeliveryButton
                variant="primary"
                size="sm"
                onClick={() => onAddToCart(item)}
                icon={<Plus size={16} />}
              >
                Add
              </DeliveryButton>
            )}
          </div>
        </div>
        
        {/* Item Image */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '12px',
          background: `url(${item.image_url || '/placeholder-food.jpg'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          flexShrink: 0
        }} />
      </div>
    </DeliveryCard>
  );
};

// Cart Modal Component
const CartModal = ({
  cart,
  restaurant,
  deliveryMethod,
  onClose,
  updateQuantity,
  removeItem,
  getCartTotal
}: {
  cart: CartItem[];
  restaurant: Restaurant;
  deliveryMethod: 'delivery' | 'pickup';
  onClose: () => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  getCartTotal: () => { subtotal: number; deliveryFee: number; tax: number; total: number };
}) => {
  const totals = getCartTotal();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'flex-end',
      padding: '0'
    }}>
      <div style={{
        background: 'white',
        width: '100%',
        maxHeight: '90vh',
        borderRadius: '20px 20px 0 0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Your Order</h2>
          <DeliveryButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            icon={<X size={24} />}
            style={{ padding: '8px' }}
          >{""}</DeliveryButton>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {cart.map((item) => (
            <div key={item.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 0',
              borderBottom: '1px solid #f8f9fa'
            }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                  {item.name}
                </h4>
                <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
                  ${(item.price_cents / 100).toFixed(2)} each
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '4px'
                }}>
                  <DeliveryButton
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    icon={<Minus size={16} />}
                    style={{ width: '32px', height: '32px', padding: 0 }}
                  >{""}</DeliveryButton>
                  
                  <span style={{ fontSize: '16px', fontWeight: '600', minWidth: '20px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  
                  <DeliveryButton
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    icon={<Plus size={16} />}
                    style={{ width: '32px', height: '32px', padding: 0 }}
                  >{""}</DeliveryButton>
                </div>
                
                <span style={{ fontSize: '16px', fontWeight: '600', minWidth: '60px', textAlign: 'right' }}>
                  ${((item.price_cents * item.quantity) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div style={{ padding: '16px', borderTop: '1px solid #e9ecef' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Subtotal</span>
              <span>${(totals.subtotal / 100).toFixed(2)}</span>
            </div>
            {deliveryMethod === 'delivery' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Delivery Fee</span>
                <span>${(totals.deliveryFee / 100).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Tax</span>
              <span>${(totals.tax / 100).toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '18px',
              fontWeight: '700',
              borderTop: '1px solid #e9ecef',
              paddingTop: '8px'
            }}>
              <span>Total</span>
              <span>${(totals.total / 100).toFixed(2)}</span>
            </div>
          </div>
          
          <DeliveryButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => {
              // Navigate to checkout
              showToast.success('Proceeding to checkout...');
            }}
          >
            Proceed to Checkout
          </DeliveryButton>
        </div>
      </div>
    </div>
  );
};

export default RestaurantMenuPage;