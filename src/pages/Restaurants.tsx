import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RestaurantGrid from '@/components/RestaurantGrid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Filter, Star, Clock, Zap, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Restaurants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [cuisineFilter, setCuisineFilter] = useState(searchParams.get('cuisine') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
  const resultsRef = useRef<HTMLDivElement | null>(null);

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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Featured Restaurant Cards */}
              {[
                { name: 'Pizza Palace', emoji: '🍕', color: '#ff6b35', discount: '30% OFF', rating: 4.8, reviews: 300 },
                { name: 'Fresh Bowl', emoji: '🥗', color: '#ff8500', discount: 'Healthy Choice', rating: 4.9, reviews: 150 },
                { name: 'Taco Fiesta', emoji: '🌮', color: '#f97316', discount: '🆕 New', rating: 4.7, reviews: 250 }
              ].map((restaurant, index) => (
                <div
                  key={index}
                  style={{
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
                          fontSize: '1.5rem',
                          fontWeight: '800',
                          color: '#8b4513',
                          marginBottom: '0.5rem'
                        }}>
                          {restaurant.name}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Star style={{
                            width: '18px',
                            height: '18px',
                            fill: '#ffb700',
                            color: '#ffb700'
                          }} />
                          <span style={{
                            fontSize: '1rem',
                            color: '#d2691e',
                            fontWeight: '600'
                          }}>
                            {restaurant.rating} ({restaurant.reviews}+ reviews)
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
                      boxShadow: `0 6px 20px ${restaurant.color}40`
                    }}>
                      {restaurant.discount}
                    </Badge>
                    <p style={{
                      fontSize: '1rem',
                      color: '#a0522d',
                      fontWeight: '500'
                    }}>
                      Free delivery on orders over $25
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