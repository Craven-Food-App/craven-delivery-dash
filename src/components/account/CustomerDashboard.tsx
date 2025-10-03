import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Package, MapPin, CreditCard, Clock, Star, Heart, Plus, TrendingUp, Award, Zap } from "lucide-react";
import Header from "@/components/Header";
import { AccountSection } from "@/components/account/AccountSection";
import RestaurantGrid from "@/components/RestaurantGrid";
import OrderTrackingBox from "@/components/OrderTrackingBox";
import OrderDetailsModal from "@/components/OrderDetailsModal";

interface Order {
  id: string;
  restaurant_id: string;
  order_status: string;
  total_cents: number;
  created_at: string;
  estimated_delivery_time: string;
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

// Modern Button Component
const ModernButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = '',
  icon = null,
  style = {}
}: {
  children: any;
  onClick?: any;
  variant?: string;
  size?: string;
  disabled?: boolean;
  className?: string;
  icon?: any;
  style?: React.CSSProperties;
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    borderRadius: '12px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
    outline: 'none'
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffb347 100%)',
      color: 'white',
      boxShadow: '0 4px 14px rgba(255, 107, 53, 0.25)'
    },
    secondary: {
      background: 'rgba(255, 107, 53, 0.08)',
      color: '#ff6b35',
      border: '1px solid rgba(255, 107, 53, 0.2)'
    },
    outline: {
      background: 'transparent',
      color: '#ff6b35',
      border: '1px solid rgba(255, 107, 53, 0.3)'
    },
    ghost: {
      background: 'transparent',
      color: '#6b7280',
      border: 'none'
    }
  };

  const sizes = {
    sm: {
      fontSize: '0.875rem',
      padding: '0.5rem 1rem',
      height: '36px'
    },
    md: {
      fontSize: '0.95rem',
      padding: '0.75rem 1.5rem',
      height: '44px'
    },
    lg: {
      fontSize: '1rem',
      padding: '1rem 2rem',
      height: '52px'
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
        if (!disabled && variant === 'primary') {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variant === 'primary') {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(255, 107, 53, 0.25)';
        }
      }}
    >
      {icon && <span style={{ marginRight: children ? '0.5rem' : 0 }}>{icon}</span>}
      {children}
    </button>
  );
};

// Modern Card Component
const ModernCard = ({ children, className = '', style = {}, hoverable = true }) => {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 107, 53, 0.1)',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(255, 107, 53, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...style
      }}
      className={className}
      onMouseEnter={hoverable ? (e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 20px 60px rgba(255, 107, 53, 0.12)';
      } : undefined}
      onMouseLeave={hoverable ? (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 40px rgba(255, 107, 53, 0.08)';
      } : undefined}
    >
      {children}
    </div>
  );
};

// Modern Badge Component
const ModernBadge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: {
      background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%)',
      color: '#ff6b35',
      border: '1px solid rgba(255, 107, 53, 0.2)'
    },
    success: {
      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%)',
      color: '#16a34a',
      border: '1px solid rgba(34, 197, 94, 0.2)'
    },
    warning: {
      background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)',
      color: '#ea580c',
      border: '1px solid rgba(251, 146, 60, 0.2)'
    },
    error: {
      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
      color: '#dc2626',
      border: '1px solid rgba(239, 68, 68, 0.2)'
    }
  };

  return (
    <span
      style={{
        ...variants[variant],
        padding: '0.375rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center'
      }}
      className={className}
    >
      {children}
    </span>
  );
};

const CustomerDashboard = () => {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Record<string, Restaurant>>({});
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get the tab from URL parameters, default to "orders"
  const tabFromUrl = searchParams.get('tab') || 'orders';

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

      // Fetch user's orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch restaurant details for orders
      if (ordersData && ordersData.length > 0) {
        const restaurantIds = [...new Set(ordersData.map(order => order.restaurant_id))];
        const { data: restaurantsData, error: restaurantsError } = await supabase
          .from("restaurants")
          .select("id, name, image_url")
          .in("id", restaurantIds);

        if (restaurantsError) throw restaurantsError;
        
        const restaurantsMap = {};
        restaurantsData?.forEach(restaurant => {
          restaurantsMap[restaurant.id] = restaurant;
        });
        setRestaurants(restaurantsMap);
      }

      // Fetch favorites
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
          .map(fav => fav.restaurants as FavoriteRestaurant);
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      case 'preparing': 
      case 'ready': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fff5f0 0%, #ffedd5 100%)'
      }}>
        <Header />
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh'
        }}>
          <ModernCard hoverable={false} style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '3px solid transparent',
              borderTop: '3px solid #ff6b35',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1.5rem'
            }} />
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#ff6b35',
              marginBottom: '0.5rem'
            }}>
              Loading Dashboard
            </h3>
            <p style={{ color: '#6b7280' }}>Please wait while we fetch your data...</p>
          </ModernCard>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fff5f0 0%, #ffedd5 100%)',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <Header />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Hero Section */}
        <div style={{
          marginBottom: '3rem',
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 179, 71, 0.1) 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 107, 53, 0.15)'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffb347 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem'
          }}>
            Welcome Back!
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Manage your orders, track deliveries, and discover your favorite restaurants
          </p>
        </div>

        {/* Modern Tabs */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '0.5rem',
            border: '1px solid rgba(255, 107, 53, 0.1)',
            gap: '0.25rem'
          }}>
            {[
              { value: 'orders', label: 'Order History', icon: Package },
              { value: 'active', label: 'Active Orders', icon: Clock },
              { value: 'favorites', label: 'Favorites', icon: Heart },
              { value: 'account', label: 'Account', icon: User }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = tabFromUrl === tab.value;
              
              return (
                <button
                  key={tab.value}
                  onClick={() => navigate(`?tab=${tab.value}`)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: isActive 
                      ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)' 
                      : 'transparent',
                    color: isActive ? 'white' : '#6b7280',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? '0 4px 14px rgba(255, 107, 53, 0.3)' : 'none'
                  }}
                >
                  <Icon style={{ width: '18px', height: '18px' }} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {tabFromUrl === 'orders' && (
          <ModernCard style={{ padding: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                padding: '1rem',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Package style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '0.25rem'
                }}>
                  Order History
                </h2>
                <p style={{ color: '#6b7280' }}>
                  View and track all your past orders
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'rgba(255, 107, 53, 0.05)',
                borderRadius: '16px',
                border: '2px dashed rgba(255, 107, 53, 0.2)'
              }}>
                <Package style={{
                  width: '64px',
                  height: '64px',
                  color: '#ff6b35',
                  margin: '0 auto 1.5rem'
                }} />
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#ff6b35',
                  marginBottom: '0.5rem'
                }}>
                  No orders yet
                </h3>
                <p style={{
                  color: '#6b7280',
                  marginBottom: '2rem'
                }}>
                  Start exploring restaurants and place your first order
                </p>
                <ModernButton
                  variant="primary"
                  onClick={() => navigate("/")}
                  icon={<TrendingUp style={{ width: '18px', height: '18px' }} />}
                >
                  Browse Restaurants
                </ModernButton>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map((order) => {
                  const restaurant = restaurants[order.restaurant_id];
                  return (
                    <div
                      key={order.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        border: '1px solid rgba(255, 107, 53, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {restaurant?.image_url && (
                          <img
                            src={restaurant.image_url}
                            alt={restaurant.name}
                            style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '12px',
                              objectFit: 'cover',
                              border: '2px solid rgba(255, 107, 53, 0.1)'
                            }}
                          />
                        )}
                        <div>
                          <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: '#1f2937',
                            marginBottom: '0.25rem'
                          }}>
                            {restaurant?.name || 'Unknown Restaurant'}
                          </h3>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            marginBottom: '0.25rem'
                          }}>
                            {formatDate(order.created_at)}
                          </p>
                          <p style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#ff6b35'
                          }}>
                            {formatPrice(order.total_cents)}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <ModernBadge variant={getStatusVariant(order.order_status)}>
                          {getStatusText(order.order_status)}
                        </ModernBadge>
                        <ModernButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrderDetails(order.id)}
                        >
                          View Details
                        </ModernButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ModernCard>
        )}

        {tabFromUrl === 'active' && (
          <ModernCard style={{ padding: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                padding: '1rem',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '0.25rem'
                }}>
                  Active Orders
                </h2>
                <p style={{ color: '#6b7280' }}>
                  Track your current orders in real-time
                </p>
              </div>
            </div>

            {orders.filter(order => !['delivered', 'cancelled'].includes(order.order_status)).length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'rgba(255, 107, 53, 0.05)',
                borderRadius: '16px',
                border: '2px dashed rgba(255, 107, 53, 0.2)'
              }}>
                <Clock style={{
                  width: '64px',
                  height: '64px',
                  color: '#ff6b35',
                  margin: '0 auto 1.5rem'
                }} />
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#ff6b35',
                  marginBottom: '0.5rem'
                }}>
                  No active orders
                </h3>
                <p style={{
                  color: '#6b7280',
                  marginBottom: '2rem'
                }}>
                  Place an order to track it here
                </p>
                <ModernButton
                  variant="primary"
                  onClick={() => navigate("/")}
                  icon={<Zap style={{ width: '18px', height: '18px' }} />}
                >
                  Order Now
                </ModernButton>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders
                  .filter(order => !['delivered', 'cancelled'].includes(order.order_status))
                  .map((order) => {
                    const restaurant = restaurants[order.restaurant_id];
                    return (
                      <div
                        key={order.id}
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 179, 71, 0.05) 100%)',
                          borderRadius: '16px',
                          padding: '1.5rem',
                          border: '2px solid rgba(255, 107, 53, 0.2)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, #ff6b35 0%, #f7931e 50%, #ffb347 100%)',
                          animation: 'pulse 2s infinite'
                        }} />
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '1rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {restaurant?.image_url && (
                              <img
                                src={restaurant.image_url}
                                alt={restaurant.name}
                                style={{
                                  width: '60px',
                                  height: '60px',
                                  borderRadius: '12px',
                                  objectFit: 'cover',
                                  border: '2px solid rgba(255, 107, 53, 0.3)'
                                }}
                              />
                            )}
                            <div>
                              <h3 style={{
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                color: '#1f2937',
                                marginBottom: '0.25rem'
                              }}>
                                {restaurant?.name || 'Unknown Restaurant'}
                              </h3>
                              <p style={{
                                fontSize: '0.875rem',
                                color: '#6b7280'
                              }}>
                                Order #{order.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                          
                          <ModernBadge variant={getStatusVariant(order.order_status)}>
                            {getStatusText(order.order_status)}
                          </ModernBadge>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <p style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: '#ff6b35'
                          }}>
                            {formatPrice(order.total_cents)}
                          </p>
                          <ModernButton
                            variant="primary"
                            size="sm"
                            onClick={() => handleTrackOrder(order.id)}
                            icon={<MapPin style={{ width: '16px', height: '16px' }} />}
                          >
                            Track Order
                          </ModernButton>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </ModernCard>
        )}

        {tabFromUrl === 'favorites' && (
          <ModernCard style={{ padding: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                padding: '1rem',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Heart style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '0.25rem'
                }}>
                  Favorite Restaurants
                </h2>
                <p style={{ color: '#6b7280' }}>
                  Your saved restaurants for quick access
                </p>
              </div>
            </div>

            {favorites.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'rgba(255, 107, 53, 0.05)',
                borderRadius: '16px',
                border: '2px dashed rgba(255, 107, 53, 0.2)'
              }}>
                <Heart style={{
                  width: '64px',
                  height: '64px',
                  color: '#ff6b35',
                  margin: '0 auto 1.5rem'
                }} />
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#ff6b35',
                  marginBottom: '0.5rem'
                }}>
                  No favorites yet
                </h3>
                <p style={{
                  color: '#6b7280',
                  marginBottom: '2rem'
                }}>
                  Discover and save your favorite restaurants
                </p>
                <ModernButton
                  variant="primary"
                  onClick={() => navigate("/")}
                  icon={<Award style={{ width: '18px', height: '18px' }} />}
                >
                  Explore Restaurants
                </ModernButton>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {favorites.map((restaurant) => (
                  <ModernCard key={restaurant.id} style={{ overflow: 'hidden', position: 'relative' }}>
                    <button
                      onClick={() => removeFavorite(restaurant.id)}
                      style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10,
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fee2e2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                      }}
                    >
                      <Heart style={{ width: '18px', height: '18px', fill: '#ef4444', color: '#ef4444' }} />
                    </button>

                    {restaurant.image_url && (
                      <img
                        src={restaurant.image_url}
                        alt={restaurant.name}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                    
                    <div style={{ padding: '1.5rem' }}>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '0.5rem'
                      }}>
                        {restaurant.name}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginBottom: '1rem'
                      }}>
                        {restaurant.cuisine_type}
                      </p>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Star style={{ width: '16px', height: '16px', fill: '#fbbf24', color: '#fbbf24' }} />
                          <span style={{ fontWeight: '600', color: '#1f2937' }}>{restaurant.rating}</span>
                        </div>
                        <span style={{ color: '#6b7280' }}>
                          ${(restaurant.delivery_fee_cents / 100).toFixed(2)} delivery
                        </span>
                      </div>
                      
                      <ModernButton
                        variant="primary"
                        size="md"
                        onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                        style={{ width: '100%' }}
                      >
                        Order Now
                      </ModernButton>
                    </div>
                  </ModernCard>
                ))}
              </div>
            )}
          </ModernCard>
        )}

        {tabFromUrl === 'account' && (
          <ModernCard style={{ padding: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                padding: '1rem',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '0.25rem'
                }}>
                  Account Settings
                </h2>
                <p style={{ color: '#6b7280' }}>
                  Manage your profile and preferences
                </p>
              </div>
            </div>
            <AccountSection />
          </ModernCard>
        )}
      </div>

      {/* Order Tracking Box */}
      {trackingOrderId && (
        <OrderTrackingBox 
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
        />
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal 
        isOpen={detailsOrderId !== null}
        onClose={() => setDetailsOrderId(null)}
        orderId={detailsOrderId || ''}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default CustomerDashboard;