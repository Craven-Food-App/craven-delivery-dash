import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Trash2, Search, ShoppingCart, User, MapPin, CreditCard, LogOut, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MenuItemModal } from './MenuItemModal';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url?: string;
  category_id?: string;
  is_available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  preparation_time: number;
}

interface CartItem extends MenuItem {
  quantity: number;
  special_instructions?: string;
  modifiers?: SelectedModifier[];
}

interface SelectedModifier {
  id: string;
  name: string;
  price_cents: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  special_instructions?: string;
}

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  role: string;
  restaurant_id: string;
}

interface ModernPOSProps {
  restaurantId: string;
  employee: Employee;
  onLogout: () => void;
}

export const ModernPOS: React.FC<ModernPOSProps> = ({ restaurantId, employee, onLogout }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'phone_payment'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMenuCategories();
    fetchMenuItems();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [restaurantId]);

  const fetchMenuCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('id, name')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setCategories([
        { id: 'all', name: 'All Items' },
        ...(data || [])
      ]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          menu_categories!left(name)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error loading menu",
        description: "Could not load menu items. Please refresh and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: MenuItem, quantity: number = 1, modifiers: SelectedModifier[] = [], specialInstructions?: string) => {
    const cartItem: CartItem = {
      ...item,
      quantity,
      special_instructions: specialInstructions,
      modifiers
    };
    
    setCart(prevCart => [...prevCart, cartItem]);
    
    toast({
      title: "Added to cart",
      description: `${quantity}x ${item.name} added to cart`,
    });
  };

  const quickAddToCart = (item: MenuItem) => {
    setSelectedMenuItem(item);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const updateSpecialInstructions = (itemId: string, instructions: string) => {
    setCart(cart.map(item =>
      item.id === itemId ? { ...item, special_instructions: instructions } : item
    ));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => {
      const itemPrice = item.price_cents;
      const modifiersPrice = item.modifiers?.reduce((modSum, mod) => modSum + mod.price_cents, 0) || 0;
      return sum + ((itemPrice + modifiersPrice) * item.quantity);
    }, 0);
    const tax = Math.round(subtotal * 0.08); // 8% tax
    const deliveryFee = orderType === 'delivery' ? 299 : 0; // $2.99 delivery fee
    const total = subtotal + tax + deliveryFee;

    return {
      subtotal,
      tax,
      deliveryFee,
      total
    };
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to the cart before placing an order.",
        variant: "destructive"
      });
      return;
    }

    if (!customerInfo.name || !customerInfo.phone) {
      toast({
        title: "Missing customer information",
        description: "Please provide customer name and phone number.",
        variant: "destructive"
      });
      return;
    }

    if (orderType === 'delivery' && !customerInfo.address) {
      toast({
        title: "Missing delivery address",
        description: "Please provide a delivery address for delivery orders.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const totals = calculateTotals();

      // Create order record using the orders table with proper structure
      const orderData = {
        restaurant_id: restaurantId,
        subtotal_cents: totals.subtotal,
        delivery_fee_cents: totals.deliveryFee,
        tax_cents: totals.tax,
        total_cents: totals.total,
        order_status: paymentMethod === 'cash' ? 'confirmed' : 'pending_payment',
        payment_status: paymentMethod === 'cash' ? 'paid' : 'pending',
        payment_method: paymentMethod,
        order_type: orderType,
        delivery_address: orderType === 'delivery' ? {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email || '',
          address: customerInfo.address || '',
          city: customerInfo.city || '',
          state: customerInfo.state || '',
          zip_code: customerInfo.zip_code || '',
          special_instructions: customerInfo.special_instructions || ''
        } : null,
        estimated_delivery_time: new Date(Date.now() + (orderType === 'delivery' ? 45 : 20) * 60000).toISOString(),
        customer_info: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email || null
        }
      };

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Checkout error:', orderError);
        throw orderError;
      }

      // Create order items for detailed tracking
      const orderItems = cart.map(item => ({
        order_id: newOrder.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_cents: item.price_cents + (item.modifiers?.reduce((sum, mod) => sum + mod.price_cents, 0) || 0),
        special_instructions: item.special_instructions || null,
        modifiers: item.modifiers || []
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items error:', itemsError);
        // Don't fail the whole order if items fail to insert
      }

      toast({
        title: "Order placed successfully!",
        description: `Order #${newOrder.id.slice(-8)} has been created. ${
          orderType === 'delivery' ? 'Estimated delivery: 45 minutes' : 'Ready for pickup in 20 minutes'
        }. Payment: ${paymentMethod.toUpperCase()}`
      });

      // Reset form
      setCart([]);
      setCustomerInfo({ name: '', phone: '' });
      setSearchQuery('');

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: "Something went wrong placing the order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading POS System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      {/* Header */}
      <div className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">POS</h1>
              <p className="text-sm text-muted-foreground">Point of Sale System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{employee.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{employee.role} • {employee.employee_id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{currentTime.toLocaleTimeString()}</p>
              <p className="text-xs text-muted-foreground">{currentTime.toLocaleDateString()}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 h-[calc(100vh-100px)]">
        {/* Menu Items - Left Side */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search */}
          <Card className="border-0 shadow-lg bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg border-0 bg-muted/50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Tabs */}
          <Card className="border-0 shadow-lg bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap min-w-fit"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Menu Grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
              {filteredMenuItems.map((item) => (
                <Card 
                  key={item.id} 
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-card/95 backdrop-blur-sm overflow-hidden hover:scale-105"
                  onClick={() => quickAddToCart(item)}
                >
                  <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="font-bold shadow-lg">
                        ${(item.price_cents / 100).toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-bold text-sm mb-1 line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Order Summary & Customer Info - Right Side */}
        <div className="lg:col-span-2 space-y-4 flex flex-col h-full">
          {/* Customer Information */}
          <Card className="border-0 shadow-lg bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Customer Information</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="customerName" className="text-xs font-medium">Name *</Label>
                  <Input
                    id="customerName"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    placeholder="Customer name"
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone" className="text-xs font-medium">Phone *</Label>
                  <Input
                    id="customerPhone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    placeholder="Phone number"
                    className="h-10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Order Type</Label>
                  <Select value={orderType} onValueChange={(value: 'delivery' | 'pickup') => setOrderType(value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">🏪 Pickup</SelectItem>
                      <SelectItem value="delivery">🚗 Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Payment</Label>
                  <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="card">💳 Card</SelectItem>
                      <SelectItem value="phone_payment">📱 Phone Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {orderType === 'delivery' && (
                <div>
                  <Label htmlFor="address" className="text-xs font-medium">Delivery Address *</Label>
                  <Input
                    id="address"
                    value={customerInfo.address || ''}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    placeholder="Street address"
                    className="h-10"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          <Card className="border-0 shadow-lg bg-card/95 backdrop-blur-sm flex-1 flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Order Summary</h3>
                <Badge variant="secondary" className="ml-auto">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </Badge>
              </div>
              
              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-muted-foreground text-center">
                    Tap menu items to add them to the order
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 mb-4">
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.id} className="bg-muted/30 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-sm">{item.name}</h5>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, 0)}
                              className="h-auto p-1 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-bold min-w-[2rem] text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-sm font-bold">
                              ${((item.price_cents * item.quantity) / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Separator className="mb-4" />

                  {/* Totals */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${(totals.subtotal / 100).toFixed(2)}</span>
                    </div>
                    {orderType === 'delivery' && (
                      <div className="flex justify-between text-sm">
                        <span>Delivery Fee</span>
                        <span>${(totals.deliveryFee / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>${(totals.tax / 100).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${(totals.total / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting || cart.length === 0}
                    className="w-full h-14 text-lg font-bold"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Place Order • $${(totals.total / 100).toFixed(2)}`
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedMenuItem && (
        <MenuItemModal
          item={selectedMenuItem}
          onClose={() => setSelectedMenuItem(null)}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
};