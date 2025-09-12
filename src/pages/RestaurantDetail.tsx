
// @ts-nocheck
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Star, Clock, Truck, Plus, Minus, ShoppingCart, TrendingUp, Award } from "lucide-react";
import Header from "@/components/Header";
import { MenuItemModal } from "@/components/restaurant/MenuItemModal";
import { CartSidebar } from "@/components/restaurant/CartSidebar";

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
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  display_order: number;
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
}

interface Modifier {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  modifier_type: string;
  is_required: boolean;
}

interface SelectedModifier extends Modifier {
  selected: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
  special_instructions?: string;
  modifiers?: SelectedModifier[];
}

const RestaurantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchRestaurantData();
    }
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      // Fetch restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id!)
        .eq("is_active", true)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Fetch menu categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", id!)
        .eq("is_active", true)
        .order("display_order");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", id!)
        .eq("is_available", true)
        .order("display_order");

      if (itemsError) throw itemsError;
      setMenuItems(itemsData || []);

      // Fetch featured items
      const { data: featuredData, error: featuredError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", id!)
        .eq("is_available", true)
        .eq("is_featured", true)
        .limit(6);

      if (featuredError) throw featuredError;
      setFeaturedItems(featuredData || []);

      // Fetch popular items (top ordered items)
      const { data: popularData, error: popularError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", id!)
        .eq("is_available", true)
        .gt("order_count", 0)
        .order("order_count", { ascending: false })
        .limit(6);

      if (popularError) throw popularError;
      setPopularItems(popularData || []);

    } catch (error) {
      console.error("Error fetching restaurant data:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurant information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem, quantity: number = 1, modifiers: SelectedModifier[] = [], specialInstructions?: string) => {
    const modifiersKey = modifiers.map(m => m.id).sort().join(',');
    const existingItem = cart.find(cartItem => 
      cartItem.id === item.id && 
      (cartItem.modifiers?.map(m => m.id).sort().join(',') || '') === modifiersKey
    );
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id && 
        (cartItem.modifiers?.map(m => m.id).sort().join(',') || '') === modifiersKey
          ? { ...cartItem, quantity: cartItem.quantity + quantity, special_instructions: specialInstructions }
          : cartItem
      ));
    } else {
      const newCartItem: CartItem = {
        ...item,
        quantity,
        special_instructions: specialInstructions,
        modifiers: modifiers.filter(m => m.selected)
      };
      setCart([...cart, newCartItem]);
    }

    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart`,
    });
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const getCartTotal = () => {
    const subtotal = cart.reduce((total, item) => {
      const itemTotal = item.price_cents * item.quantity;
      const modifiersTotal = (item.modifiers || []).reduce((modSum, mod) => modSum + (mod.price_cents * item.quantity), 0);
      return total + itemTotal + modifiersTotal;
    }, 0);
    const deliveryFee = deliveryMethod === 'delivery' ? (restaurant?.delivery_fee_cents || 0) : 0;
    const tax = Math.round(subtotal * 0.08); // 8% tax
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

  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading restaurant...</div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Restaurant Not Found</h1>
            <p className="text-muted-foreground">The restaurant you're looking for doesn't exist or is not available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Restaurant Header */}
      <div className="relative h-48 md:h-64 lg:h-80">
        {restaurant.image_url ? (
          <img 
            src={restaurant.image_url} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-lg">No image available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Restaurant Info Section */}
      <div className="container mx-auto px-4 py-4 md:py-6">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">{restaurant.name}</h1>
        <p className="text-base md:text-lg mb-4 text-muted-foreground">{restaurant.description}</p>
        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{restaurant.rating.toFixed(1)} ({restaurant.total_reviews} reviews)</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{restaurant.min_delivery_time}-{restaurant.max_delivery_time} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-4 w-4" />
            <span>${(restaurant.delivery_fee_cents / 100).toFixed(2)} delivery</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-4 md:pb-6 flex gap-4 md:gap-6 overflow-x-hidden">
        {/* Menu Content */}
        <div className="flex-1 min-w-0">
          {/* Category Navigation */}
          <Card className="mb-4 md:mb-6 sticky top-4 z-10">
            <CardContent className="p-3 md:p-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant="ghost"
                    size="sm"
                    className="whitespace-nowrap flex-shrink-0 text-sm md:text-base h-9 md:h-10 px-3 md:px-4 touch-manipulation"
                    onClick={() => scrollToCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Featured Items Section */}
          {featuredItems.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Featured Items</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {featuredItems.map((item) => (
                  <Card key={`featured-${item.id}`} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer touch-manipulation">
                    <CardContent className="p-0" onClick={() => setSelectedItem(item)}>
                      <div className="flex min-w-0">
                        <div className="flex-1 p-3 md:p-4 min-w-0">
                          <div className="flex items-start justify-between min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="font-semibold text-base md:text-lg break-words">{item.name}</h3>
                                <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">Featured</Badge>
                                <div className="flex gap-1 flex-wrap">
                                  {item.is_vegetarian && <Badge variant="secondary" className="text-xs">Vegetarian</Badge>}
                                  {item.is_vegan && <Badge variant="secondary" className="text-xs">Vegan</Badge>}
                                  {item.is_gluten_free && <Badge variant="secondary" className="text-xs">Gluten Free</Badge>}
                                </div>
                              </div>
                              <p className="text-muted-foreground text-sm mb-3 line-clamp-2 break-words">
                                {item.description}
                              </p>
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-lg font-bold">
                                  ${(item.price_cents / 100).toFixed(2)}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItem(item);
                                  }}
                                  className="ml-4 flex-shrink-0 h-9 px-3 touch-manipulation"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        {item.image_url && (
                          <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 flex-shrink-0">
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Separator className="mt-8" />
            </div>
          )}

          {/* Popular Items Section */}
          {popularItems.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Most Popular</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {popularItems.map((item) => (
                  <Card key={`popular-${item.id}`} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer touch-manipulation">
                    <CardContent className="p-0" onClick={() => setSelectedItem(item)}>
                      <div className="flex min-w-0">
                        <div className="flex-1 p-3 md:p-4 min-w-0">
                          <div className="flex items-start justify-between min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="font-semibold text-base md:text-lg break-words">{item.name}</h3>
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                  {item.order_count} orders
                                </Badge>
                                <div className="flex gap-1 flex-wrap">
                                  {item.is_vegetarian && <Badge variant="secondary" className="text-xs">Vegetarian</Badge>}
                                  {item.is_vegan && <Badge variant="secondary" className="text-xs">Vegan</Badge>}
                                  {item.is_gluten_free && <Badge variant="secondary" className="text-xs">Gluten Free</Badge>}
                                </div>
                              </div>
                              <p className="text-muted-foreground text-sm mb-3 line-clamp-2 break-words">
                                {item.description}
                              </p>
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-lg font-bold">
                                  ${(item.price_cents / 100).toFixed(2)}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItem(item);
                                  }}
                                  className="ml-4 flex-shrink-0 h-9 px-3 touch-manipulation"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        {item.image_url && (
                          <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 flex-shrink-0">
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Separator className="mt-8" />
            </div>
          )}

          {/* Menu Categories and Items */}
          {categories.map((category) => {
            const categoryItems = getItemsByCategory(category.id);
            if (categoryItems.length === 0) return null;

            return (
              <div key={category.id} id={`category-${category.id}`} className="mb-8">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">{category.name}</h2>
                  {category.description && (
                    <p className="text-muted-foreground mt-1">{category.description}</p>
                  )}
                </div>

                <div className="space-y-4">
                  {categoryItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-0" onClick={() => setSelectedItem(item)}>
                        <div className="flex min-w-0">
                          <div className="flex-1 p-4 min-w-0">
                            <div className="flex items-start justify-between min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3 className="font-semibold text-lg break-words">{item.name}</h3>
                                  <div className="flex gap-1 flex-wrap">
                                    {item.is_vegetarian && <Badge variant="secondary" className="text-xs">Vegetarian</Badge>}
                                    {item.is_vegan && <Badge variant="secondary" className="text-xs">Vegan</Badge>}
                                    {item.is_gluten_free && <Badge variant="secondary" className="text-xs">Gluten Free</Badge>}
                                  </div>
                                </div>
                                <p className="text-muted-foreground text-sm mb-3 line-clamp-2 break-words">
                                  {item.description}
                                </p>
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span className="text-lg font-bold">
                                    ${(item.price_cents / 100).toFixed(2)}
                                  </span>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedItem(item);
                                    }}
                                    className="ml-4 flex-shrink-0"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                          {item.image_url && (
                            <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {categories.indexOf(category) < categories.length - 1 && (
                  <Separator className="mt-8" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 max-w-[90vw]">
          <Button
            size="lg"
            onClick={() => setShowCart(true)}
            className="rounded-full shadow-lg text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3"
          >
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            <span className="truncate">
              {cart.reduce((total, item) => total + item.quantity, 0)} items • ${(getCartTotal().total / 100).toFixed(2)}
            </span>
          </Button>
        </div>
      )}

      {/* Menu Item Modal */}
      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        restaurant={restaurant}
          totals={getCartTotal()}
          deliveryMethod={deliveryMethod}
          onDeliveryMethodChange={setDeliveryMethod}
          onUpdateQuantity={updateCartItemQuantity}
          onOrderComplete={() => setCart([])} // Clear cart after order
      />
    </div>
  );
};

export default RestaurantDetail;
