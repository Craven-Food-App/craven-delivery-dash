
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CustomerOrderForm } from "./CustomerOrderForm";

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

interface CartItem {
  id: string;
  name: string;
  price_cents: number;
  quantity: number;
  special_instructions?: string;
  modifiers?: SelectedModifier[];
}

interface Restaurant {
  name: string;
  delivery_fee_cents: number;
  min_delivery_time: number;
  max_delivery_time: number;
  latitude?: number;
  longitude?: number;
  address: string;
  city: string;
  state: string;
}

interface CartTotals {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  restaurant: Restaurant & { id: string };
  totals: CartTotals;
  deliveryMethod: 'delivery' | 'pickup';
  onDeliveryMethodChange: (method: 'delivery' | 'pickup') => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onOrderComplete: () => void;
}

export const CartSidebar = ({ 
  isOpen, 
  onClose, 
  cart, 
  restaurant, 
  totals, 
  deliveryMethod,
  onDeliveryMethodChange,
  onUpdateQuantity,
  onOrderComplete 
}: CartSidebarProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const { toast } = useToast();

  const handleCheckout = () => {
    setShowOrderForm(true);
  };

  const handleOrderSubmit = async (customerInfo: any) => {
    setIsProcessing(true);
    
    try {
      // Create customer order with pending payment
      const orderData = {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        restaurant_id: restaurant.id,
        order_items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price_cents: item.price_cents,
          modifiers: item.modifiers?.map(mod => ({
            id: mod.id,
            name: mod.name,
            price_cents: mod.price_cents
          })) || [],
          special_instructions: item.special_instructions
        })),
        subtotal_cents: totals.subtotal,
        delivery_fee_cents: totals.deliveryFee,
        tax_cents: totals.tax,
        total_cents: totals.total,
        delivery_method: deliveryMethod,
        delivery_address: customerInfo.deliveryAddress,
        special_instructions: customerInfo.specialInstructions,
        order_status: 'pending',
        payment_status: 'pending',
        estimated_pickup_time: new Date(Date.now() + restaurant.min_delivery_time * 60000).toISOString(),
        estimated_delivery_time: deliveryMethod === 'delivery' 
          ? new Date(Date.now() + restaurant.max_delivery_time * 60000).toISOString() 
          : null
      };

      // Create customer order
      const { data: customerOrder, error: orderError } = await supabase
        .from('customer_orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create Stripe payment session
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          orderTotal: totals.total,
          customerInfo,
          orderId: customerOrder.id
        }
      });

      if (paymentError) throw paymentError;

      // Store session ID for later verification
      await supabase
        .from('customer_orders')
        .update({ stripe_session_id: paymentData.session_id })
        .eq('id', customerOrder.id);

      // For delivery orders, create delivery order entry
      if (deliveryMethod === 'delivery') {
        const pickupLat = restaurant.latitude || 40.7128;
        const pickupLng = restaurant.longitude || -74.0060;
        const dropoffLat = pickupLat + (Math.random() - 0.5) * 0.01;
        const dropoffLng = pickupLng + (Math.random() - 0.5) * 0.01;
        
        const distance = Math.random() * 8 + 2;
        const payout = Math.round((distance * 2.5 + 3) * 100);

        await supabase.from('delivery_orders').insert({
          customer_order_id: customerOrder.id,
          pickup_address: `${restaurant.address}, ${restaurant.city}, ${restaurant.state}`,
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          dropoff_address: customerInfo.deliveryAddress,
          dropoff_lat: dropoffLat,
          dropoff_lng: dropoffLng,
          distance_km: distance,
          payout_cents: payout,
          status: 'pending',
          restaurant_id: restaurant.id,
          pickup_name: restaurant.name,
          dropoff_name: customerInfo.name
        });
      }

      // Redirect to Stripe Checkout
      window.location.href = paymentData.url;
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error placing order",
        description: "Please try again or contact the restaurant directly.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Add some delicious items to get started!</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col max-h-screen overflow-hidden">
        <SheetHeader>
          <SheetTitle>Your Cart • {restaurant.name}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                     <div>
                       <h4 className="font-medium">{item.name}</h4>
                       {item.modifiers && item.modifiers.length > 0 && (
                         <div className="mt-1">
                           {item.modifiers.map((modifier) => (
                             <div key={modifier.id} className="flex items-center justify-between text-sm text-muted-foreground">
                               <span>• {modifier.name}</span>
                               {modifier.price_cents > 0 && (
                                 <span>+${(modifier.price_cents / 100).toFixed(2)}</span>
                               )}
                             </div>
                           ))}
                         </div>
                       )}
                       {item.special_instructions && (
                         <p className="text-sm text-muted-foreground mt-1">
                           Note: {item.special_instructions}
                         </p>
                       )}
                     </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onUpdateQuantity(item.id, 0)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-medium w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                     <span className="font-medium">
                       ${(((item.price_cents + (item.modifiers?.reduce((sum, mod) => sum + mod.price_cents, 0) || 0)) * item.quantity) / 100).toFixed(2)}
                     </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 space-y-4">
          {/* Delivery/Pickup Selection */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Order Type</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={deliveryMethod === 'delivery' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onDeliveryMethodChange('delivery')}
                className="flex flex-col items-center py-3 h-auto"
              >
                <Truck className="h-4 w-4 mb-1" />
                <span className="text-xs">Delivery</span>
                <span className="text-xs text-muted-foreground">
                  {restaurant.min_delivery_time}-{restaurant.max_delivery_time} min
                </span>
              </Button>
              <Button
                variant={deliveryMethod === 'pickup' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onDeliveryMethodChange('pickup')}
                className="flex flex-col items-center py-3 h-auto"
              >
                <div className="h-4 w-4 mb-1 flex items-center justify-center">
                  <div className="w-3 h-3 bg-current rounded-full" />
                </div>
                <span className="text-xs">Pickup</span>
                <span className="text-xs text-muted-foreground">
                  15-25 min
                </span>
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${(totals.subtotal / 100).toFixed(2)}</span>
            </div>
            {deliveryMethod === 'delivery' && (
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

          <div className="text-sm text-muted-foreground text-center">
            {deliveryMethod === 'delivery' 
              ? `Estimated delivery: ${restaurant.min_delivery_time}-${restaurant.max_delivery_time} minutes`
              : 'Ready for pickup in 15-25 minutes'
            }
          </div>

          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : `Place Order • $${(totals.total / 100).toFixed(2)}`}
          </Button>
        </div>

        <CustomerOrderForm
          isOpen={showOrderForm}
          onClose={() => setShowOrderForm(false)}
          onSubmit={handleOrderSubmit}
          deliveryMethod={deliveryMethod}
          isProcessing={isProcessing}
          orderTotal={totals.total}
        />
      </SheetContent>
    </Sheet>
  );
};
