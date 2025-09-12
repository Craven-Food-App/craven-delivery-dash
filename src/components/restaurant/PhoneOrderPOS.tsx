import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Trash2, Search, Phone, MapPin, CreditCard, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url?: string;
  category_id?: string;
  is_available: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
  special_instructions?: string;
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

interface PhoneOrderPOSProps {
  restaurantId: string;
}

export const PhoneOrderPOS: React.FC<PhoneOrderPOSProps> = ({ restaurantId }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
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
  const { toast } = useToast();

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
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

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
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
    const subtotal = cart.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);
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

      // Create order
      const orderData = {
        restaurant_id: restaurantId,
        subtotal_cents: totals.subtotal,
        delivery_fee_cents: totals.deliveryFee,
        tax_cents: totals.tax,
        total_cents: totals.total,
        order_status: 'pending',
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
        estimated_delivery_time: new Date(Date.now() + (orderType === 'delivery' ? 45 : 20) * 60000).toISOString()
      };

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: newOrder.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_cents: item.price_cents,
        special_instructions: item.special_instructions || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Order placed successfully!",
        description: `Order #${newOrder.id.slice(-8)} has been created. ${
          orderType === 'delivery' ? 'Estimated delivery: 45 minutes' : 'Ready for pickup in 20 minutes'
        }`
      });

      // Reset form
      setCart([]);
      setCustomerInfo({ name: '', phone: '' });
      setSearchQuery('');

    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error placing order",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return <div className="text-center py-8">Loading menu items...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Menu Items */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Order POS
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMenuItems.map((item) => (
                  <Card key={item.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge variant="outline">${(item.price_cents / 100).toFixed(2)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <Button 
                      onClick={() => addToCart(item)}
                      size="sm" 
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add to Order
                    </Button>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Order Summary & Customer Info */}
      <div className="space-y-4">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerName">Name *</Label>
              <Input
                id="customerName"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone *</Label>
              <Input
                id="customerPhone"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerInfo.email || ''}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                placeholder="Email (optional)"
              />
            </div>
            
            {/* Order Type */}
            <div>
              <Label>Order Type</Label>
              <Select value={orderType} onValueChange={(value: 'delivery' | 'pickup') => setOrderType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Address (if delivery selected) */}
            {orderType === 'delivery' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={customerInfo.address || ''}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={customerInfo.city || ''}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={customerInfo.zip_code || ''}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, zip_code: e.target.value })}
                      placeholder="Zip"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card (In-person)</SelectItem>
                  <SelectItem value="phone_payment">Card (Over Phone)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cart */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No items in cart</p>
            ) : (
              <div className="space-y-4">
                <ScrollArea className="max-h-[300px]">
                  {cart.map((item) => (
                    <div key={item.id} className="border-b pb-3 mb-3 last:border-b-0">
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
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-medium">
                          ${((item.price_cents * item.quantity) / 100).toFixed(2)}
                        </span>
                      </div>
                      <Textarea
                        placeholder="Special instructions..."
                        value={item.special_instructions || ''}
                        onChange={(e) => updateSpecialInstructions(item.id, e.target.value)}
                        className="mt-2 h-20 text-sm"
                      />
                    </div>
                  ))}
                </ScrollArea>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
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
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${(totals.total / 100).toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? "Processing..." : `Place Order • $${(totals.total / 100).toFixed(2)}`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};