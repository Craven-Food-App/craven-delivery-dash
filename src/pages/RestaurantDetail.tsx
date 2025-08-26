import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Clock, Truck, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string;
  delivery_fee_cents: number;
  min_delivery_time: number;
  max_delivery_time: number;
  rating: number;
  image_url: string;
  address: string;
  city: string;
  state: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url: string;
  is_available: boolean;
  preparation_time: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const RestaurantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
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
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (restaurantError) throw restaurantError;

      // Fetch menu items
      const { data: menuData, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", id)
        .eq("is_available", true)
        .order("display_order");

      if (menuError) throw menuError;

      setRestaurant(restaurantData);
      setMenuItems(menuData || []);
    } catch (error) {
      console.error("Error fetching restaurant data:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurant data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      } else {
        return prevCart.filter(cartItem => cartItem.id !== itemId);
      }
    });
  };

  const getCartItemQuantity = (itemId: string) => {
    const item = cart.find(cartItem => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price_cents * item.quantity), 0);
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
            <h1 className="text-2xl font-bold mb-4">Restaurant not found</h1>
            <Link to="/">
              <Button>Go back to home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link to="/" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to restaurants
        </Link>

        {/* Restaurant header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <img
                src={restaurant.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop"}
                alt={restaurant.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
            <div className="md:w-2/3">
              <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
              <p className="text-muted-foreground mb-4">{restaurant.description}</p>
              
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-medium">{restaurant.rating}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{restaurant.min_delivery_time}-{restaurant.max_delivery_time} min</span>
                </div>
                <div className="flex items-center">
                  <Truck className="h-4 w-4 mr-1" />
                  <span>{restaurant.delivery_fee_cents === 0 ? "Free delivery" : `$${(restaurant.delivery_fee_cents / 100).toFixed(2)} delivery`}</span>
                </div>
              </div>

              <Badge variant="secondary" className="mb-2">
                {restaurant.cuisine_type}
              </Badge>
              
              <p className="text-sm text-muted-foreground">
                {restaurant.address}, {restaurant.city}, {restaurant.state}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu items */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Menu</h2>
            {menuItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No menu items available at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {menuItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <div className="flex items-center gap-2">
                              {item.is_vegetarian && <Badge variant="outline" className="text-green-600 border-green-600">Vegetarian</Badge>}
                              {item.is_vegan && <Badge variant="outline" className="text-green-700 border-green-700">Vegan</Badge>}
                              {item.is_gluten_free && <Badge variant="outline" className="text-blue-600 border-blue-600">Gluten Free</Badge>}
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm mb-3">{item.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="font-semibold text-lg">${(item.price_cents / 100).toFixed(2)}</span>
                              <span className="text-sm text-muted-foreground">~{item.preparation_time} min</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getCartItemQuantity(item.id) > 0 ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="font-medium px-2">{getCartItemQuantity(item.id)}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addToCart(item)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button onClick={() => addToCart(item)}>
                                  Add to Cart
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        {item.image_url && (
                          <div className="ml-4">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Your Order</CardTitle>
                <CardDescription>
                  {cart.length === 0 ? "Your cart is empty" : `${cart.length} item${cart.length > 1 ? 's' : ''} in cart`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Add items from the menu to get started</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            ${(item.price_cents / 100).toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-2 text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addToCart(item)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span>Subtotal:</span>
                        <span className="font-medium">${(getCartTotal() / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span>Delivery:</span>
                        <span className="font-medium">
                          {restaurant.delivery_fee_cents === 0 ? "Free" : `$${(restaurant.delivery_fee_cents / 100).toFixed(2)}`}
                        </span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Total:</span>
                          <span>${((getCartTotal() + restaurant.delivery_fee_cents) / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button className="w-full" size="lg">
                      Proceed to Checkout
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;