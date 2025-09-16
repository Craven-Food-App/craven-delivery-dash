import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMenuItemFavorites } from '@/hooks/useMenuItemFavorites';
import { Star, Clock, MapPin, Heart, ShoppingCart, Plus, Minus, ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MenuItemCard from './MenuItemCard';
import CartSummary from './CartSummary';
import { CartSidebar } from './CartSidebar';
import { MenuItemModal } from './MenuItemModal';
import MenuFilters, { FilterOptions } from './MenuFilters';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';

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
  const isMobile = useIsMobile();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [user, setUser] = useState(null);
  
  // Category scrolling refs
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Menu item favorites  
  const { toggleFavorite, isFavorite } = useMenuItemFavorites();
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [0, 50],
    dietary: { vegetarian: false, vegan: false, glutenFree: false },
    availability: true,
    rating: 0,
    preparationTime: 60,
  });

  useEffect(() => {
    if (id) {
      fetchRestaurantData();
      fetchMenuItems();
    }
  }, [id]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const fetchRestaurantData = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id!)
        .maybeSingle();

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
      // Fetch real menu items from the database
      const { data: items, error } = await supabase
        .from('menu_items')
        .select(`
          id,
          name,
          description,
          price_cents,
          image_url,
          is_available,
          is_vegetarian,
          is_vegan,
          is_gluten_free,
          category_id,
          menu_categories!inner(name)
        `)
        .eq('restaurant_id', id)
        .eq('is_available', true)
        .order('display_order');

      if (error) throw error;

      // Transform the data to match our interface
      const transformedItems: MenuItem[] = (items || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price_cents: item.price_cents,
        image_url: item.image_url,
        category: item.menu_categories?.name || 'Uncategorized',
        is_available: item.is_available,
        dietary_info: [
          ...(item.is_vegetarian ? ['Vegetarian'] : []),
          ...(item.is_vegan ? ['Vegan'] : []),
          ...(item.is_gluten_free ? ['Gluten Free'] : [])
        ].filter(Boolean)
      }));

      setMenuItems(transformedItems);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive"
      });
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
    
    // Apply filters
    const matchesPrice = item.price_cents >= filters.priceRange[0] * 100 && 
                        (filters.priceRange[1] >= 50 || item.price_cents <= filters.priceRange[1] * 100);
    
    const matchesDietary = (!filters.dietary.vegetarian || item.dietary_info?.includes('Vegetarian')) &&
                          (!filters.dietary.vegan || item.dietary_info?.includes('Vegan')) &&
                          (!filters.dietary.glutenFree || item.dietary_info?.includes('Gluten Free'));
    
    const matchesAvailability = !filters.availability || item.is_available;
    
    return matchesCategory && matchesSearch && matchesPrice && matchesDietary && matchesAvailability;
  });

  const addToCart = (item: MenuItem, quantity: number = 1, modifiers: any[] = [], specialInstructions?: string) => {
    if (!item) return;
    
    const modifiersPrice = modifiers.reduce((sum, mod) => sum + mod.price_cents, 0);
    const itemTotalPrice = item.price_cents + modifiersPrice;
    
    setCart(prev => {
      const cartItemId = `${item.id}-${JSON.stringify(modifiers.map(m => m.id).sort())}`;
      const existing = prev.find(cartItem => cartItem.id === cartItemId);
      
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === cartItemId
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }
      
      return [...prev, {
        id: cartItemId,
        name: item.name,
        price_cents: itemTotalPrice,
        quantity,
        image_url: item.image_url,
        modifiers: modifiers.map(m => ({ name: m.name, price_cents: m.price_cents })),
        special_instructions: specialInstructions
      }];
    });
    
    toast({
      title: "Added to cart",
      description: `${item.name}${modifiers.length > 0 ? ' with customizations' : ''} has been added to your cart`
    });
  };

  // Keep the old addToCart for backwards compatibility with MenuItemCard
  const addToCartSimple = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    addToCart(item, 1, [], '');
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

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items before checkout",
        variant: "destructive"
      });
      return;
    }

    try {
      const subtotal = cart.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
      const deliveryFee = restaurant?.delivery_fee_cents || 0;
      const total = subtotal + deliveryFee;

      // Try to use logged-in user email, fallback to guest
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || 'guest@example.com';
      const customerInfo = {
        name: user?.email?.split('@')[0] || 'Guest',
        email,
        phone: '',
        deliveryAddress: '',
        specialInstructions: ''
      };

      const orderId = (self?.crypto && 'randomUUID' in self.crypto) ? self.crypto.randomUUID() : `order_${Date.now()}`;

      // For CashApp demo, we'll simulate the flow
      // In production, you would show PaymentOptions component and handle accordingly
      const isCashAppDemo = Math.random() > 0.5; // 50% chance to demo CashApp
      
      if (isCashAppDemo) {
        const { data, error } = await supabase.functions.invoke('create-cashapp-payment', {
          body: {
            orderTotal: total,
            customerInfo,
            orderId
          }
        });

        if (error) throw error;

        toast({
          title: 'CashApp Payment',
          description: 'Redirecting to CashApp...',
        });

        // In a real app, you would redirect to CashApp or show QR code
        setTimeout(() => {
          window.location.href = data.paymentData.redirectUrl;
        }, 2000);
      } else {
        // Use Stripe payment
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: {
            orderTotal: total,
            customerInfo,
            orderId
          }
        });

        if (error) throw error;
        if (!data?.url) throw new Error('No checkout URL returned');

        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout failed',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const computeTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
    const tax = Math.round(subtotal * 0.08);
    const deliveryFee = deliveryMethod === 'delivery' ? (restaurant?.delivery_fee_cents || 0) : 0;
    const total = subtotal + tax + deliveryFee;
    return { subtotal, tax, deliveryFee, total };
  };

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
              
              <MenuFilters 
                onFiltersChange={setFilters}
                className="bg-background/50 backdrop-blur-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="flex md:flex-wrap gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(category);
                    // Scroll to category section
                    if (category !== 'all' && categoryRefs.current[category]) {
                      categoryRefs.current[category]?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                      });
                    }
                  }}
                  className="whitespace-nowrap capitalize flex-shrink-0 min-w-fit"
                >
                  {category === 'all' ? 'All Items' : category}
                </Button>
              ))}
            </div>

            {/* Menu Items */}
            <div className="space-y-8">
              {filteredItems.length === 0 ? (
                <Card className="p-12 text-center border-border/50">
                  <p className="text-muted-foreground text-lg mb-2">No items found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or category filter
                  </p>
                </Card>
              ) : selectedCategory === 'all' ? (
                // Group by category when showing all items
                categories.filter(cat => cat !== 'all').map((category) => {
                  const categoryItems = filteredItems.filter(item => item.category.toLowerCase() === category.toLowerCase());
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <div key={category} ref={el => categoryRefs.current[category] = el}>
                      <h2 className="text-2xl font-bold mb-4 capitalize">{category}</h2>
                      <div className="space-y-4">
                        {categoryItems.map((item) => (
                          <MenuItemCard
                            key={item.id}
                            {...item}
                            restaurantId={restaurant?.id}
                            onAddToCart={() => addToCartSimple(item.id)}
                            onCustomize={(item) => setSelectedItem(item)}
                            onToggleFavorite={() => toggleFavorite(item.id)}
                            isFavorite={isFavorite(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                // Show filtered items for specific category
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      {...item}
                      restaurantId={restaurant?.id}
                      onAddToCart={() => addToCartSimple(item.id)}
                      onCustomize={(item) => setSelectedItem(item)}
                      onToggleFavorite={() => toggleFavorite(item.id)}
                      isFavorite={isFavorite(item.id)}
                    />
                  ))}
                </div>
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

          {/* Mobile Cart Drawer */}
          {isCartOpen && (
            <div className="lg:hidden">
              <CartSidebar
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart as any}
                restaurant={{ ...(restaurant as any) }}
                totals={computeTotals() as any}
                deliveryMethod={deliveryMethod}
                onDeliveryMethodChange={setDeliveryMethod}
                onUpdateQuantity={(itemId, quantity) => {
                  setCart(prev => prev
                    .map(item => item.id === itemId ? { ...item, quantity } : item)
                    .filter(item => item.quantity > 0)
                  );
                }}
                onOrderComplete={() => {
                  setCart([]);
                  setIsCartOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Menu Item Customization Modal */}
      {selectedItem && (
        <MenuItemModal
          item={{
            id: selectedItem.id,
            name: selectedItem.name,
            description: selectedItem.description || '',
            price_cents: selectedItem.price_cents,
            image_url: selectedItem.image_url || '',
            is_vegetarian: selectedItem.dietary_info?.includes('Vegetarian') || false,
            is_vegan: selectedItem.dietary_info?.includes('Vegan') || false,
            is_gluten_free: selectedItem.dietary_info?.includes('Gluten Free') || false,
            preparation_time: 15
          }}
          onClose={() => setSelectedItem(null)}
          onAddToCart={(item, quantity, modifiers, specialInstructions) => {
            const menuItem = {
              ...selectedItem,
              ...item
            };
            addToCart(menuItem, quantity, modifiers, specialInstructions);
          }}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        user={user}
      />
    </div>
  );
};

export default RestaurantMenuPage;