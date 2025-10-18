import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RestaurantGrid from '@/components/RestaurantGrid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Filter, Star, Clock, Zap, TrendingUp, ChevronLeft, Plus } from 'lucide-react';
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
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const weeklyDealsScrollRef = useRef<HTMLDivElement>(null);

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

  // Weekly deals scroll functions
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

  const cuisineTypes = [
    { name: 'All Cuisines', value: 'all', color: '#ff6b35', emoji: '🍽️' },
    { name: 'American', value: 'American', color: '#ff8c42', emoji: '🇺🇸' },
    { name: 'Italian', value: 'Italian', color: '#f4845f', emoji: '🍝' },
    { name: 'Chinese', value: 'Chinese', color: '#f27d42', emoji: '🥢' },
    { name: 'Mexican', value: 'Mexican', color: '#ff7518', emoji: '🌮' },
    { name: 'Indian', value: 'Indian', color: '#f97316', emoji: '🍛' },
    { name: 'Japanese', value: 'Japanese', color: '#fb8500', emoji: '🍣' },
    { name: 'Thai', value: 'Thai', color: '#ff9500', emoji: '🌶️' },
    { name: 'Mediterranean', value: 'Mediterranean', color: '#ffb700', emoji: '🫒' },
    { name: 'Fast Food', value: 'Fast Food', color: '#f4a261', emoji: '🍟' },
    { name: 'Pizza', value: 'Pizza', color: '#e76f51', emoji: '🍕' },
    { name: 'Burgers', value: 'Burgers', color: '#e85a4f', emoji: '🍔' },
    { name: 'Seafood', value: 'Seafood', color: '#d2691e', emoji: '🦐' },
    { name: 'Vegetarian', value: 'Vegetarian', color: '#ff8500', emoji: '🥗' }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffb700 100%)' 
    }}>
      <Header />
      
      {/* Modern Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
        backdropFilter: 'blur(15px)',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        padding: '4rem 0'
      }}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.9) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '2rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              What Are You Crave'n
            </h1>
            
            {/* Glassmorphism Search Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(25px)',
              borderRadius: '25px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '2.5rem',
              boxShadow: '0 25px 50px rgba(255, 107, 53, 0.15)'
            }}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Search Input */}
                <div className="lg:col-span-5 relative">
                  <div style={{
                    position: 'relative',
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(255, 107, 53, 0.15)',
                    border: '2px solid rgba(255, 183, 0, 0.3)'
                  }}>
                    <Search style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '20px',
                      height: '20px',
                      color: '#d2691e'
                    }} />
                    <Input 
                      placeholder="Search restaurants, dishes..." 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      style={{
                        paddingLeft: '3rem',
                        height: '3.5rem',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '1rem',
                        color: '#8b4513'
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()} 
                    />
                  </div>
                </div>
                
                {/* Location Input */}
                <div className="lg:col-span-4 relative">
                  <div style={{
                    position: 'relative',
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(255, 107, 53, 0.15)',
                    border: '2px solid rgba(255, 183, 0, 0.3)'
                  }}>
                    <MapPin style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '20px',
                      height: '20px',
                      color: '#d2691e'
                    }} />
                    <Input 
                      placeholder="Enter your address..." 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)} 
                      style={{
                        paddingLeft: '3rem',
                        height: '3.5rem',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '1rem',
                        color: '#8b4513'
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()} 
                    />
                  </div>
                </div>
                
                {/* Search Button */}
                <div className="lg:col-span-3">
                  <Button 
                    onClick={handleSearch} 
                    style={{
                      width: '100%',
                      height: '3.5rem',
                      background: 'linear-gradient(135deg, #ff6b35 0%, #f97316 50%, #e85a4f 100%)',
                      border: 'none',
                      borderRadius: '18px',
                      fontWeight: '700',
                      fontSize: '1rem',
                      boxShadow: '0 8px 32px rgba(255, 107, 53, 0.4)',
                      transition: 'all 0.3s ease',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 15px 45px rgba(255, 107, 53, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 107, 53, 0.4)';
                    }}
                  >
                    Find Restaurants
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Deals Section */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,248,240,0.95) 100%)',
        backdropFilter: 'blur(15px)',
        padding: '3rem 0',
        borderBottom: '1px solid rgba(255, 183, 0, 0.2)'
      }}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-extrabold text-red-700 mb-2">WEEKLY DEALS</h2>
              <p className="text-lg text-gray-600">At select restaurants • Orders $12+</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-800 transition duration-200">
                See All
              </Button>
              <div className="flex space-x-2">
                <button 
                  onClick={scrollWeeklyDealsLeft}
                  className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={scrollWeeklyDealsRight}
                  className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition duration-200"
                >
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </button>
              </div>
            </div>
          </div>

          {loadingDeals ? (
            <div className="flex space-x-6 overflow-x-hidden pb-4">
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
            <div className="flex space-x-6 overflow-x-hidden pb-4 snap-x snap-mandatory" ref={weeklyDealsScrollRef}>
              {weeklyDeals.map((restaurant) => {
                // Format promotion details
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
                  <div key={restaurant.id} className="flex-shrink-0 w-80 bg-white rounded-xl shadow-md border border-gray-200 snap-start">
                    <div className="h-48 overflow-hidden">
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
                      <h3 className="font-bold text-gray-900 mb-1">{restaurant.name}</h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                        <span>{restaurant.rating.toFixed(1)} ★ • {restaurant.min_delivery_time}-{restaurant.max_delivery_time} min</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        ${(restaurant.delivery_fee_cents / 100).toFixed(2)} delivery fee
                      </p>
                      <p className="text-xs text-gray-500 mb-2">Sponsored</p>
                      <div className="flex items-center text-red-700 font-semibold">
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
      </section>

      {/* Modern Cuisine Selection */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,248,240,0.95) 100%)',
        backdropFilter: 'blur(15px)',
        padding: '3rem 0',
        borderBottom: '1px solid rgba(255, 183, 0, 0.2)'
      }}>
        <div className="container mx-auto px-4">
          <h3 style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '2rem',
            background: 'linear-gradient(135deg, #ff6b35 0%, #f97316 50%, #e85a4f 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Browse by Cuisine
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1.5rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {cuisineTypes.map((cuisine) => (
              <button
                key={cuisine.value}
                onClick={() => setCuisineFilter(cuisine.value)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '2rem 1rem',
                  borderRadius: '25px',
                  border: cuisineFilter === cuisine.value ? `3px solid ${cuisine.color}` : '3px solid transparent',
                  background: cuisineFilter === cuisine.value 
                    ? `linear-gradient(135deg, ${cuisine.color}20 0%, ${cuisine.color}30 100%)`
                    : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,248,240,0.8) 100%)',
                  backdropFilter: 'blur(15px)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  boxShadow: cuisineFilter === cuisine.value 
                    ? `0 15px 40px ${cuisine.color}40`
                    : '0 8px 25px rgba(255, 107, 53, 0.1)',
                  transform: cuisineFilter === cuisine.value ? 'translateY(-8px) scale(1.05)' : 'translateY(0) scale(1)',
                  minHeight: '140px'
                }}
                onMouseEnter={(e) => {
                  if (cuisineFilter !== cuisine.value) {
                    e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                    e.currentTarget.style.boxShadow = `0 12px 35px ${cuisine.color}25`;
                    e.currentTarget.style.background = `linear-gradient(135deg, ${cuisine.color}15 0%, ${cuisine.color}25 100%)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (cuisineFilter !== cuisine.value) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.1)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,248,240,0.8) 100%)';
                  }
                }}
              >
                <span style={{ 
                  fontSize: '3rem', 
                  marginBottom: '0.75rem',
                  filter: 'drop-shadow(0 2px 4px rgba(255, 107, 53, 0.2))'
                }}>
                  {cuisine.emoji}
                </span>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: cuisineFilter === cuisine.value ? cuisine.color : '#8b4513',
                  textAlign: 'center',
                  textShadow: '0 1px 2px rgba(255, 107, 53, 0.1)'
                }}>
                  {cuisine.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section style={{ 
        background: 'linear-gradient(135deg, #fff8f0 0%, #ffeee6 100%)', 
        minHeight: '50vh' 
      }} ref={resultsRef}>
        <div className="container mx-auto px-4 py-8">
          {/* Modern Filter Bar */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,248,240,0.9) 100%)',
            backdropFilter: 'blur(15px)',
            borderRadius: '25px',
            padding: '2rem',
            marginBottom: '3rem',
            border: '2px solid rgba(255, 183, 0, 0.2)',
            boxShadow: '0 15px 50px rgba(255, 107, 53, 0.1)'
          }}>
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,248,240,0.8) 100%)',
                    border: '2px solid rgba(255, 183, 0, 0.3)',
                    borderRadius: '15px',
                    height: '3.5rem',
                    fontSize: '1rem',
                    color: '#8b4513',
                    fontWeight: '600'
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d2691e' }}>
                        <Star style={{ width: '16px', height: '16px' }} />
                        Highest Rated
                      </div>
                    </SelectItem>
                    <SelectItem value="delivery_time">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff8500' }}>
                        <Zap style={{ width: '16px', height: '16px' }} />
                        Fastest Delivery
                      </div>
                    </SelectItem>
                    <SelectItem value="delivery_fee">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff6b35' }}>
                        <span>💰</span>
                        Lowest Delivery Fee
                      </div>
                    </SelectItem>
                    <SelectItem value="newest">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f97316' }}>
                        <TrendingUp style={{ width: '16px', height: '16px' }} />
                        Trending
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: '2px solid rgba(255, 183, 0, 0.4)',
                    borderRadius: '15px',
                    height: '3.5rem',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,248,240,0.8) 100%)',
                    fontWeight: '600',
                    color: '#d2691e',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b35 0%, #f97316 100%)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,248,240,0.8) 100%)';
                    e.currentTarget.style.color = '#d2691e';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Filter style={{ width: '16px', height: '16px' }} />
                  More Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Featured Restaurants Section */}
          <div style={{ marginBottom: '4rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2.5rem'
            }}>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #ff6b35 0%, #f97316 50%, #e85a4f 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Featured Restaurants
              </h2>
              <Badge style={{
                background: 'linear-gradient(135deg, #ff6b35 0%, #f97316 50%, #e85a4f 100%)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '25px',
                fontWeight: '700',
                fontSize: '1rem',
                boxShadow: '0 8px 25px rgba(255, 107, 53, 0.3)'
              }}>
                🔥 Trending
              </Badge>
            </div>
            
            <div style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '2rem',
              paddingBottom: '1rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              <style>
                {`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}
              </style>
              {/* Featured Restaurant Cards */}
              {[
                { name: 'Pizza Palace', emoji: '🍕', color: '#ff6b35', discount: '30% OFF', rating: 4.8, reviews: 300, cuisine: 'Italian', deliveryTime: '25-35 min' },
                { name: 'Fresh Bowl', emoji: '🥗', color: '#ff8500', discount: 'Healthy Choice', rating: 4.9, reviews: 150, cuisine: 'Vegetarian', deliveryTime: '20-30 min' },
                { name: 'Taco Fiesta', emoji: '🌮', color: '#f97316', discount: '🆕 New', rating: 4.7, reviews: 250, cuisine: 'Mexican', deliveryTime: '30-40 min' },
                { name: 'Burger Zone', emoji: '🍔', color: '#e85a4f', discount: '20% OFF', rating: 4.6, reviews: 420, cuisine: 'American', deliveryTime: '15-25 min' },
                { name: 'Sushi Express', emoji: '🍣', color: '#fb8500', discount: 'Fresh Daily', rating: 4.9, reviews: 180, cuisine: 'Japanese', deliveryTime: '35-45 min' },
                { name: 'Curry House', emoji: '🍛', color: '#f97316', discount: 'Spice Level 🌶️', rating: 4.5, reviews: 320, cuisine: 'Indian', deliveryTime: '25-35 min' },
                { name: 'Golden Dragon', emoji: '🥢', color: '#f27d42', discount: 'Family Pack', rating: 4.7, reviews: 290, cuisine: 'Chinese', deliveryTime: '20-30 min' },
                { name: 'Mediterranean Grill', emoji: '🫒', color: '#ffb700', discount: 'Healthy & Fresh', rating: 4.8, reviews: 210, cuisine: 'Mediterranean', deliveryTime: '30-40 min' },
                { name: 'Thai Spice', emoji: '🌶️', color: '#ff9500', discount: 'Authentic Flavors', rating: 4.6, reviews: 340, cuisine: 'Thai', deliveryTime: '25-35 min' },
                { name: 'Seafood Shack', emoji: '🦐', color: '#d2691e', discount: 'Catch of the Day', rating: 4.4, reviews: 195, cuisine: 'Seafood', deliveryTime: '40-50 min' }
              ].map((restaurant, index) => (
                <div
                  key={index}
                  style={{
                    minWidth: '320px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,248,240,0.9) 100%)',
                    borderRadius: '30px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 70px rgba(255, 107, 53, 0.15)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    border: '2px solid rgba(255, 183, 0, 0.2)',
                    backdropFilter: 'blur(15px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-15px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 35px 90px rgba(255, 107, 53, 0.25)';
                    e.currentTarget.style.border = `2px solid ${restaurant.color}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 25px 70px rgba(255, 107, 53, 0.15)';
                    e.currentTarget.style.border = '2px solid rgba(255, 183, 0, 0.2)';
                  }}
                >
                  <div style={{
                    background: `linear-gradient(135deg, ${restaurant.color}20 0%, ${restaurant.color}30 100%)`,
                    padding: '2.5rem',
                    position: 'relative'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{
                        width: '5rem',
                        height: '5rem',
                        background: `linear-gradient(135deg, ${restaurant.color}30 0%, ${restaurant.color}50 100%)`,
                        borderRadius: '25px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        boxShadow: `0 8px 25px ${restaurant.color}40`
                      }}>
                        {restaurant.emoji}
                      </div>
                      <div>
                        <h3 style={{
                          fontSize: '1.3rem',
                          fontWeight: '800',
                          color: '#8b4513',
                          marginBottom: '0.5rem'
                        }}>
                          {restaurant.name}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.3rem'
                        }}>
                          <Star style={{
                            width: '16px',
                            height: '16px',
                            fill: '#ffb700',
                            color: '#ffb700'
                          }} />
                          <span style={{
                            fontSize: '0.9rem',
                            color: '#d2691e',
                            fontWeight: '600'
                          }}>
                            {restaurant.rating} ({restaurant.reviews}+)
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Clock style={{
                            width: '14px',
                            height: '14px',
                            color: '#a0522d'
                          }} />
                          <span style={{
                            fontSize: '0.8rem',
                            color: '#a0522d',
                            fontWeight: '500'
                          }}>
                            {restaurant.deliveryTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge style={{
                      background: `linear-gradient(135deg, ${restaurant.color} 0%, ${restaurant.color}dd 100%)`,
                      color: 'white',
                      borderRadius: '15px',
                      padding: '0.75rem 1.5rem',
                      fontWeight: '700',
                      marginBottom: '1rem',
                      boxShadow: `0 6px 20px ${restaurant.color}40`,
                      fontSize: '0.85rem'
                    }}>
                      {restaurant.discount}
                    </Badge>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#a0522d',
                      fontWeight: '500'
                    }}>
                      {restaurant.cuisine} • Free delivery on orders over $25
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results Header */}
          {(searchQuery || location || cuisineFilter !== 'all') && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #ff6b35 0%, #f97316 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1rem'
              }}>
                {searchQuery ? `Results for "${searchQuery}"` : 'Restaurants Near You'}
              </h2>
              {location && (
                <p style={{
                  color: '#d2691e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  <MapPin style={{ width: '20px', height: '20px' }} />
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
      </section>

      <Footer />
    </div>
  );
};

export default Restaurants;