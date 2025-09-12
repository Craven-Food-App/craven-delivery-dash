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

  const cuisineTypes = [
    'All Cuisines',
    'American',
    'Italian',
    'Chinese',
    'Mexican',
    'Indian',
    'Japanese',
    'Thai',
    'Mediterranean',
    'Fast Food',
    'Pizza',
    'Burgers',
    'Seafood',
    'Vegetarian'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Discover Amazing Restaurants
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Find your next favorite meal from the best restaurants in your area
            </p>
            
            {/* Search Section */}
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Search Input */}
                  <div className="md:col-span-5 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search restaurants, dishes, or cuisines..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 border-border/50 focus:ring-2 focus:ring-primary/20"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  
                  {/* Location Input */}
                  <div className="md:col-span-4 relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter your address..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10 h-12 border-border/50 focus:ring-2 focus:ring-primary/20"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  
                  {/* Search Button */}
                  <div className="md:col-span-3">
                    <Button 
                      onClick={handleSearch}
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                      Find Restaurants
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Filters and Results */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8 p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Cuisine Filter */}
              <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue placeholder="All Cuisines" />
                </SelectTrigger>
                <SelectContent>
                  {cuisineTypes.map((cuisine) => (
                    <SelectItem 
                      key={cuisine} 
                      value={cuisine === 'All Cuisines' ? 'all' : cuisine}
                    >
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-background border-border/50">
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
              <Button variant="outline" className="flex items-center gap-2 border-border/50">
                <Filter className="h-4 w-4" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Promoted Restaurants Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold text-foreground">Featured Restaurants</h2>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Promoted
              </Badge>
            </div>
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Special Offers Available
                    </h3>
                    <p className="text-muted-foreground">
                      Discover restaurants with exclusive deals and promotions
                    </p>
                  </div>
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    🎉 Limited Time
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Header */}
          {(searchQuery || location || cuisineFilter) && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {searchQuery ? `Results for "${searchQuery}"` : 'Restaurants Near You'}
              </h2>
              {location && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivering to: {location}
                </p>
              )}
            </div>
          )}

          {/* Restaurant Grid */}
          <RestaurantGrid 
            searchQuery={searchQuery}
            deliveryAddress={location}
          />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Restaurants;