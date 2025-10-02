import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, Clock, Truck, Plus, Minus, ShoppingCart, TrendingUp, Award, X, 
  ChevronLeft, Utensils, Zap, Heart, Share2, MapPin, Phone, Camera,
  Navigation, MessageCircle, CheckCircle, Filter, Search, ChefHat, Leaf
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast as showToast } from 'sonner';

// ...existing code...

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
      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 25%, #ff8c00 50%, #ff4500 75%, #ff6347 100%)',
      backgroundSize: '300% 300%',
      animation: 'gradientShift 6s ease infinite',
      color: 'white',
      boxShadow: glow 
        ? '0 0 40px rgba(255, 107, 53, 0.6), 0 20px 40px rgba(0, 0, 0, 0.15)'
        : '0 20px 40px rgba(255, 107, 53, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 107, 53, 0.2)',
      color: '#4a5568',
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
    },
    ghost: {
      background: 'transparent',
      color: '#ff6b35',
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

  // ...existing code...

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyles,
        ...variants[variant],
        ...size[size],
        opacity: disabled ? 0.6 : 1,
        ...style
      }}
      className={className}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
          if (variant === 'primary') {
            e.currentTarget.style.boxShadow = glow
              ? '0 0 60px rgba(255, 107, 53, 0.8), 0 25px 50px rgba(0, 0, 0, 0.2)'
              : '0 25px 50px rgba(255, 107, 53, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          if (variant === 'primary') {
            e.currentTarget.style.boxShadow = glow
              ? '0 0 40px rgba(255, 107, 53, 0.6), 0 20px 40px rgba(0, 0, 0, 0.15)'
              : '0 20px 40px rgba(255, 107, 53, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
          }
        }
      }}
    >
      {icon && <span style={{ marginRight: children ? '0.75rem' : 0 }}>{icon}</span>}
      {children}
    </button>
  );
};

// ...existing code...

// Neon Badge Component
const NeonBadge = ({ children, variant = 'default', icon = null, pulse = false }) => {
  const variants = {
    default: {
      background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(247, 147, 30, 0.15) 100%)',
      color: '#ff6b35',
      border: '1px solid rgba(255, 107, 53, 0.3)',
      boxShadow: '0 0 20px rgba(255, 107, 53, 0.2)'
    },
    success: {
      background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.15) 0%, rgba(39, 174, 96, 0.15) 100%)',
      color: '#2ecc71',
      border: '1px solid rgba(46, 204, 113, 0.3)',
      boxShadow: '0 0 20px rgba(46, 204, 113, 0.2)'
    },
    featured: {
      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
      color: 'white',
      border: 'none',
      boxShadow: '0 0 30px rgba(255, 107, 53, 0.5)'
    },
    popular: {
      background: 'linear-gradient(135deg, #ff8c00 0%, #ff4500 100%)',
      color: 'white',
      border: 'none',
      boxShadow: '0 0 30px rgba(255, 140, 0, 0.5)'
    },
    neon: {
      background: 'transparent',
      color: '#ff6b35',
      border: '2px solid #ff6b35',
      boxShadow: '0 0 20px #ff6b35, inset 0 0 20px rgba(255, 107, 53, 0.1)',
      textShadow: '0 0 10px #ff6b35'
    }
  };

  // ...existing code...
};

const RestaurantDetail = () => {
  const navigate = useNavigate();
  // ...existing code...
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null); // Add this line
  const [isFavorited, setIsFavorited] = useState(false); // Add this line

  // Categories state and logic
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Example: fetch categories (replace with real fetch logic)
  useEffect(() => {
    // Replace this with your actual fetch logic
    setCategories([
      { id: 'starters', name: 'Starters', icon: <Utensils />, description: 'Begin your meal with a bang!' },
      { id: 'mains', name: 'Mains', icon: <ChefHat />, description: 'Hearty and delicious main courses.' },
      { id: 'vegan', name: 'Vegan', icon: <Leaf />, description: 'Plant-based delights.' }
    ]);
    setSelectedCategory('starters');
  }, []);

  // Cart state and logic
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Search query state
  const [searchQuery, setSearchQuery] = useState("");

  // Example addToCart function
  const addToCart = (item: any) => {
    setCart(prevCart => {
      const existing = prevCart.find((i) => i.id === item.id);
      if (existing) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  // Example getCartTotal function
  const getCartTotal = () => {
    const total = cart.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);
    return { total };
  };

  // Add these lines for images
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const restaurantImages = restaurant?.images && Array.isArray(restaurant.images) && restaurant.images.length > 0
    ? restaurant.images
    : ["/placeholder-restaurant.jpg"];

  // Example: Fetch restaurant data and set loading to false when done
  // useEffect(() => {
  //   fetchRestaurantData().then((data) => {
  //     setRestaurant(data);
  //     setLoading(false);
  //   });
  // }, []);

  // Generic Glass Card for Presentational Use
  const GlassCard = ({
    children,
    variant = "glass",
    hoverable = false,
    style = {},
    ...props
  }: {
    children: React.ReactNode;
    variant?: string;
    hoverable?: boolean;
    style?: React.CSSProperties;
  }) => (
    <div
      style={{
        background: variant === "glass"
          ? "rgba(255,255,255,0.1)"
          : "white",
        borderRadius: "25px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        ...(hoverable
          ? {
              transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              cursor: "pointer",
            }
          : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
  
    if (loading) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 25%, #ff8c00 50%, #ff4500 75%, #ff6347 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 8s ease infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <GlassCard variant="glass" hoverable={false} style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              border: '4px solid transparent',
              borderTop: '4px solid #ff6b35',
              borderRight: '4px solid #ff8c00',
              borderRadius: '50%',
              animation: 'spin 1.5s linear infinite',
              margin: '0 auto 2rem'
            }} />
            <h3 style={{ 
              color: 'white', 
              fontSize: '2rem', 
              fontWeight: '800',
              background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              Loading Experience...
            </h3>
          </GlassCard>
        </div>
      );
    }

  if (!restaurant) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <GlassCard variant="glass" hoverable={false} style={{ padding: '4rem', textAlign: 'center', maxWidth: '500px' }}>
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
        </GlassCard>
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
            linear-gradient(135deg, rgba(255, 107, 53, 0.9) 0%, rgba(247, 147, 30, 0.8) 25%, rgba(255, 140, 0, 0.7) 50%, rgba(255, 69, 0, 0.8) 75%, rgba(255, 99, 71, 0.9) 100%),
            url(${restaurantImages[activeImageIndex]})
          `,
          backgroundSize: '400% 400%, cover',
          backgroundPosition: 'center, center',
          animation: 'gradientShift 10s ease infinite',
          filter: 'blur(1px)'
        }} />

        {/* ...existing floating particles code... */}
        
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
                fill: isFavorited ? '#ff6b35' : 'transparent',
                color: isFavorited ? '#ff6b35' : 'white'
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

        {/* ...existing central content code... */}

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
        <GlassCard variant="glass" hoverable={false} style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* ...existing delivery/pickup buttons... */}
            
            <div style={{ width: '1px', height: '40px', background: 'rgba(255, 107, 53, 0.2)' }} />
            
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
                  background: 'linear-gradient(135deg, #ff8c00 0%, #ff4500 100%)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  boxShadow: '0 0 20px rgba(255, 140, 0, 0.6)'
                }}>
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </UltraButton>
          </div>
        </GlassCard>
      </div>

      {/* Advanced Search Interface */}
      <div id="menu-section" style={{
        padding: '3rem 2rem 0',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
      <GlassCard variant="glass" hoverable={false} style={{ padding: '2rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
            <Search style={{
              position: 'absolute',
              left: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '24px',
              color: '#ff6b35'
            }} />
            <input
              type="text"
              placeholder="Search magical dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '1.25rem 1.5rem 1.25rem 4rem',
                border: '2px solid rgba(255, 107, 53, 0.2)',
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
                e.currentTarget.style.borderColor = '#ff6b35';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 107, 53, 0.3)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
      </GlassCard>

      {/* Revolutionary Menu Display */}
      <div style={{
        padding: '0 2rem 6rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {searchQuery ? (
          (() => {
            // Replace this with your actual menu items data source
            const allMenuItems: any[] = []; // Example: fetch or use state for menu items
            const filteredItems = allMenuItems.filter(item =>
              item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            return (
              <div>
                <h2 style={{
                  fontSize: '3rem',
                  fontWeight: '900',
                  marginBottom: '3rem',
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c00 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textAlign: 'center'
                }}>
                  Search Results
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                  gap: '2rem'
                }}>
                  {filteredItems && filteredItems.map((item) => (
                    <FuturisticMenuCard key={item.id} item={item} onAddToCart={addToCart} />
                  ))}
                </div>
              </div>
            );
          })()
        ) : (
          categories && categories.map((category) => {
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
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c00 100%)',
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
                    color: '#ff6b35',
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
              boxShadow: '0 25px 60px rgba(255, 107, 53, 0.4)'
            }}
          >
            {cart.reduce((sum, item) => sum + item.quantity, 0)} items • ${(getCartTotal().total / 100).toFixed(2)}
          </UltraButton>
        </div>
      )}

      {/* ...existing styles... */}
    </div>
  );
};

// Generic Glass Card for Presentational Use
const GlassCard = ({
  children,
  variant = "glass",
  hoverable = false,
  style = {},
  ...props
}: {
  children: React.ReactNode;
  variant?: string;
  hoverable?: boolean;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      background: variant === "glass"
        ? "rgba(255,255,255,0.1)"
        : "white",
      borderRadius: "25px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
  return (
    <GlassCard
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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <FuturisticMenuCard
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
        background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 140, 0, 0.1) 100%)',
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.4s ease'
      }} />

      {/* ...existing badges and dietary information... */}

      {/* Enhanced Image Container */}
      <div style={{
        height: '250px',
        background: `
          linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 140, 0, 0.1) 100%),
          url(${item.image_url || '/placeholder-food.jpg'})
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '25px 25px 0 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* ...existing spice level indicator... */}

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
              color: '#ff6b35',
              fontSize: '1rem',
              lineHeight: 1.5,
              marginBottom: '1.5rem'
            }}>
              {item.description}
            </p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '25px',
            fontWeight: '800',
            fontSize: '1.3rem',
            marginLeft: '1.5rem',
            boxShadow: '0 10px 30px rgba(255, 107, 53, 0.3)'
          }}>
            ${(item.price_cents / 100).toFixed(2)}
          </div>
        </div>
        </div>

        {/* Enhanced Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '1.5rem',
          borderTop: '2px solid rgba(255, 107, 53, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            fontSize: '0.95rem',
            color: '#ff6b35'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock style={{ width: '18px', height: '18px' }} />
              {item.preparation_time} min
            </div>
            {item.calories && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap style={{ width: '18px', height: '18px' }} />
                {item.calories} cal
    </GlassCard>
  );
};
          
/**
 * FuturisticMenuCard component for displaying menu items.
 */
const FuturisticMenuCard = ({ item, onAddToCart }: { item: any, onAddToCart: (item: any) => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        background: "white",
        borderRadius: "25px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Glow Effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 140, 0, 0.1) 100%)',
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.4s ease',
        pointerEvents: 'none'
      }} />

      {/* Enhanced Image Container */}
      <div style={{
        height: '250px',
        background: `
          linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 140, 0, 0.1) 100%),
          url(${item.image_url || '/placeholder-food.jpg'})
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '25px 25px 0 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
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
              color: '#ff6b35',
              fontSize: '1rem',
              lineHeight: 1.5,
              marginBottom: '1.5rem'
            }}>
              {item.description}
            </p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '25px',
            fontWeight: '800',
            fontSize: '1.3rem',
            marginLeft: '1.5rem',
            boxShadow: '0 10px 30px rgba(255, 107, 53, 0.3)'
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
          borderTop: '2px solid rgba(255, 107, 53, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            fontSize: '0.95rem',
            color: '#ff6b35'
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
    </div>
  );
};

/**
 * Helper: getItemsByCategory
 * Replace this with your actual logic to filter menu items by category.
 */
function getItemsByCategory(categoryId: string) {
  // This should filter your menu items by categoryId.
  // Replace with your actual menu items data source.
  return [];
}

export default RestaurantDetail;
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
    </FuturisticMenuCard>
  );
};

export default RestaurantDetail;