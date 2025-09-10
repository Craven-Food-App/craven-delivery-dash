import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Star, Clock, MapPin, Heart, ShoppingCart, Plus, Minus, ArrowLeft, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MenuItemCard from './MenuItemCard';
import CartSummary from './CartSummary';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url?: string;
  category: string;
  is_available: boolean;
  dietary_info?: string[];
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  logo_url?: string;
  cuisine_type: string;
  rating: number;
  delivery_fee_cents: number;
  min_delivery_time: number;
  max_delivery_time: number;
  address: string;
}

interface CartItem {
  id: string;
  name: string;
  price_cents: number;
  quantity: number;
  image_url?: string;
}

const RestaurantMenuPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id) {
      fetchRestaurantData();
      fetchMenuItems();
    }
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast({
        title: "Error",
        description: "Failed to load restaurant information",
        variant: "destructive"
      });
    }
  };

  const fetchMenuItems = async () => {
    try {
      // Mock data for now - replace with actual menu items query when table exists
      const mockItems: MenuItem[] = [
        {
          id: '1',
          name: 'Margherita Pizza',
          description: 'Fresh tomatoes, mozzarella, basil, and olive oil',
          price_cents: 1899,
          category: 'Pizza',
          is_available: true,
          image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400',
          dietary_info: ['Vegetarian']
        },
        {
          id: '2', 
          name: 'Pepperoni Pizza',
          description: 'Tomato sauce, mozzarella, pepperoni',
          price_cents: 2199,
          category: 'Pizza',
          is_available: true,
          image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'
        },
        {
          id: '3',
          name: 'Caesar Salad',
          description: 'Romaine lettuce, parmesan, croutons, caesar dressing',
          price_cents: 1299,
          category: 'Salads',
          is_available: true,
          image_url: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=400',
          dietary_info: ['Vegetarian']
        }
      ];
      setMenuItems(mockItems);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, {
        id: item.id,
        name: item.name,
        price_cents: item.price_cents,
        quantity: 1,
        image_url: item.image_url
      }];
    });
    
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart`
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const handleCheckout = () => {
    toast({
      title: "Checkout",
      description: "Proceeding to checkout..."
    });
    // Add checkout logic here
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Restaurant not found</p>
          <Link to="/" className="text-primary hover:underline mt-2 inline-block">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to restaurants</span>
          </Link>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="relative"
            onClick={() => setIsCartOpen(!isCartOpen)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            {cart.length > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Restaurant Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${restaurant.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200'})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
        
        <div className="relative h-full flex items-end">
          <div className="container mx-auto px-4 pb-8">
            <div className="flex items-end gap-4">
              {restaurant.logo_url && (
                <div className="w-20 h-20 rounded-xl border-4 border-white shadow-lg bg-white p-2 flex-shrink-0">
                  <img
                    src={restaurant.logo_url}
                    alt={`${restaurant.name} logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              
              <div className="text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{restaurant.name}</h1>
                <p className="text-white/90 mb-2">{restaurant.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-400" />
                    <span>{restaurant.rating.toFixed(1)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{restaurant.min_delivery_time}-{restaurant.max_delivery_time} min</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{formatPrice(restaurant.delivery_fee_cents)} delivery</span>
                  </div>
                  
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {restaurant.cuisine_type}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Menu Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 backdrop-blur-sm border-border/50"
                />
              </div>
              
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-background/50 backdrop-blur-sm">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap capitalize"
                >
                  {category === 'all' ? 'All Items' : category}
                </Button>
              ))}
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              {filteredItems.length === 0 ? (
                <Card className="p-12 text-center border-border/50">
                  <p className="text-muted-foreground text-lg mb-2">No items found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or category filter
                  </p>
                </Card>
              ) : (
                filteredItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    {...item}
                    onAddToCart={addToCart}
                  />
                ))
              )}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className={`lg:col-span-1 ${isCartOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-24">
              <CartSummary
                items={cart}
                deliveryFee={restaurant?.delivery_fee_cents || 0}
                onUpdateQuantity={updateQuantity}
                onCheckout={handleCheckout}
                className="border-border/50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantMenuPage;