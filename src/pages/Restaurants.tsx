import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RestaurantGrid from '@/components/RestaurantGrid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Filter, Star, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
const Restaurants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [cuisineFilter, setCuisineFilter] = useState(searchParams.get('cuisine') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (location) params.set('location', location);
    if (cuisineFilter && cuisineFilter !== 'all') params.set('cuisine', cuisineFilter);
    if (sortBy !== 'rating') params.set('sort', sortBy);
    setSearchParams(params);
  }, [searchQuery, location, cuisineFilter, sortBy, setSearchParams]);
  const handleSearch = () => {
    // Search is handled by the useEffect above
  };
  const cuisineTypes = [{
    name: 'All Cuisines',
    value: 'all',
    color: 'bg-primary',
    emoji: '🍽️'
  }, {
    name: 'American',
    value: 'American',
    color: 'bg-red-500',
    emoji: '🇺🇸'
  }, {
    name: 'Italian',
    value: 'Italian',
    color: 'bg-green-500',
    emoji: '🍝'
  }, {
    name: 'Chinese',
    value: 'Chinese',
    color: 'bg-yellow-500',
    emoji: '🥢'
  }, {
    name: 'Mexican',
    value: 'Mexican',
    color: 'bg-orange-500',
    emoji: '🌮'
  }, {
    name: 'Indian',
    value: 'Indian',
    color: 'bg-amber-500',
    emoji: '🍛'
  }, {
    name: 'Japanese',
    value: 'Japanese',
    color: 'bg-pink-500',
    emoji: '🍣'
  }, {
    name: 'Thai',
    value: 'Thai',
    color: 'bg-lime-500',
    emoji: '🌶️'
  }, {
    name: 'Mediterranean',
    value: 'Mediterranean',
    color: 'bg-blue-500',
    emoji: '🫒'
  }, {
    name: 'Fast Food',
    value: 'Fast Food',
    color: 'bg-purple-500',
    emoji: '🍟'
  }, {
    name: 'Pizza',
    value: 'Pizza',
    color: 'bg-red-600',
    emoji: '🍕'
  }, {
    name: 'Burgers',
    value: 'Burgers',
    color: 'bg-yellow-600',
    emoji: '🍔'
  }, {
    name: 'Seafood',
    value: 'Seafood',
    color: 'bg-cyan-500',
    emoji: '🦐'
  }, {
    name: 'Vegetarian',
    value: 'Vegetarian',
    color: 'bg-emerald-500',
    emoji: '🥗'
  }];
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-6 md:py-8 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6">
              What Are You Crave'n
            </h1>
            
            {/* Search Section */}
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
                  {/* Search Input */}
                  <div className="lg:col-span-5 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search restaurants, dishes..." 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)} 
                      className="pl-10 h-11 md:h-12 border-border/50 focus:ring-2 focus:ring-primary/20 text-base" 
                      onKeyPress={e => e.key === 'Enter' && handleSearch()} 
                    />
                  </div>
                  
                  {/* Location Input */}
                  <div className="lg:col-span-4 relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Enter your address..." 
                      value={location} 
                      onChange={e => setLocation(e.target.value)} 
                      className="pl-10 h-11 md:h-12 border-border/50 focus:ring-2 focus:ring-primary/20 text-base" 
                      onKeyPress={e => e.key === 'Enter' && handleSearch()} 
                    />
                  </div>
                  
                  {/* Search Button */}
                  <div className="lg:col-span-3">
                    <Button onClick={handleSearch} className="w-full h-11 md:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base">
                      Find Restaurants
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Cuisine Bubbles Section */}
      <section className="py-3 md:py-4 bg-muted/20 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {cuisineTypes.map(cuisine => <button key={cuisine.value} onClick={() => setCuisineFilter(cuisine.value)} className={`
                  relative flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium
                  transition-all duration-300 hover-scale border-2 min-h-[44px] touch-manipulation
                  ${cuisineFilter === cuisine.value ? `${cuisine.color} text-white border-white shadow-lg` : 'bg-background text-foreground border-border hover:border-primary/50'}
                `}>
                <span className="text-base md:text-lg">{cuisine.emoji}</span>
                <span className="whitespace-nowrap">{cuisine.name}</span>
                {cuisineFilter === cuisine.value && <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />}
              </button>)}
          </div>
        </div>
      </section>

      {/* Filters and Results */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4 md:mb-6 p-3 md:p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-background border-border/50 h-11 md:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Highest Rated
                    </div>
                  </SelectItem>
                  <SelectItem value="delivery_time">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Fastest Delivery
                    </div>
                  </SelectItem>
                  <SelectItem value="delivery_fee">
                    <div className="flex items-center gap-2">
                      <span>💰</span>
                      Lowest Delivery Fee
                    </div>
                  </SelectItem>
                  <SelectItem value="newest">
                    <div className="flex items-center gap-2">
                      <span>🆕</span>
                      Newest
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Additional Filters Button */}
              <Button variant="outline" className="flex items-center gap-2 border-border/50 h-11 md:h-10 touch-manipulation">
                <Filter className="h-4 w-4" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Popular Restaurants Near You Section */}
          <div className="mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                
                
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 pulse">
                🔥 Trending
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Promotional Cards */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🍕</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Pizza Palace</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">4.8 (300+ reviews)</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="destructive" className="mb-2">30% OFF</Badge>
                  <p className="text-sm text-muted-foreground">Free delivery on orders over $25</p>
                </CardContent>
              </Card>

              <Card className="border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🥗</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Fresh Bowl</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">4.9 (150+ reviews)</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-700 mb-2">Healthy Choice</Badge>
                  <p className="text-sm text-muted-foreground">Farm-to-table ingredients</p>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🌮</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Taco Fiesta</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">4.7 (250+ reviews)</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-orange-500 text-white mb-2">🆕 New</Badge>
                  <p className="text-sm text-muted-foreground">Authentic Mexican flavors</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Results Header */}
          {(searchQuery || location || cuisineFilter) && <div className="mb-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {searchQuery ? `Results for "${searchQuery}"` : 'Restaurants Near You'}
              </h2>
              {location && <p className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivering to: {location}
                </p>}
            </div>}

          {/* Restaurant Grid */}
          <RestaurantGrid 
            searchQuery={searchQuery} 
            deliveryAddress={location} 
            cuisineFilter={cuisineFilter}
          />
        </div>
      </section>

      <Footer />
    </div>;
};
export default Restaurants;