import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Trash2, User, MapPin, CreditCard } from 'lucide-react';
import { AddressAutocomplete } from '@/components/common/AddressAutocomplete';

interface CartItem {
  id: string;
  name: string;
  price_cents: number;
  quantity: number;
  special_instructions?: string;
  modifiers?: { id: string; name: string; price_cents: number }[];
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
  addressCoordinates?: { lat: number; lng: number };
}

interface MobilePOSCartProps {
  cart: CartItem[];
  customerInfo: CustomerInfo;
  orderType: 'delivery' | 'pickup';
  paymentMethod: 'cash' | 'card' | 'phone_payment';
  isValidAddress: boolean;
  isSubmitting: boolean;
  totals: {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    total: number;
  };
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateInstructions: (itemId: string, instructions: string) => void;
  onCustomerInfoChange: (info: Partial<CustomerInfo>) => void;
  onOrderTypeChange: (type: 'delivery' | 'pickup') => void;
  onPaymentMethodChange: (method: 'cash' | 'card' | 'phone_payment') => void;
  onAddressSelect: (address: any) => void;
  onValidAddressChange: (valid: boolean) => void;
  onSubmit: () => void;
}

export const MobilePOSCart: React.FC<MobilePOSCartProps> = ({
  cart,
  customerInfo,
  orderType,
  paymentMethod,
  isValidAddress,
  isSubmitting,
  totals,
  onUpdateQuantity,
  onUpdateInstructions,
  onCustomerInfoChange,
  onOrderTypeChange,
  onPaymentMethodChange,
  onAddressSelect,
  onValidAddressChange,
  onSubmit
}) => {
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          size="lg" 
          className="fixed bottom-20 right-4 z-50 rounded-full h-14 w-14 shadow-2xl"
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            {cartItemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {cartItemCount}
              </Badge>
            )}
          </div>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[90vh] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({cartItemCount} {cartItemCount === 1 ? 'item' : 'items'})
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-180px)]">
          <div className="p-4 space-y-6">
            {/* Order Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={orderType === 'pickup' ? 'default' : 'outline'}
                    onClick={() => onOrderTypeChange('pickup')}
                    className="w-full"
                  >
                    Pickup
                  </Button>
                  <Button
                    variant={orderType === 'delivery' ? 'default' : 'outline'}
                    onClick={() => onOrderTypeChange('delivery')}
                    className="w-full"
                  >
                    Delivery
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={customerInfo.name}
                    onChange={(e) => onCustomerInfoChange({ name: e.target.value })}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={customerInfo.phone}
                    onChange={(e) => onCustomerInfoChange({ phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label>Email (Optional)</Label>
                  <Input
                    type="email"
                    value={customerInfo.email || ''}
                    onChange={(e) => onCustomerInfoChange({ email: e.target.value })}
                    placeholder="customer@email.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            {orderType === 'delivery' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AddressAutocomplete
                    value={customerInfo.address || ''}
                    onChange={(value, coordinates) => {
                      onAddressSelect({ address: value, coordinates });
                    }}
                    onValidAddress={onValidAddressChange}
                    required={true}
                    placeholder="123 Main St, City, State 12345"
                  />
                  <div>
                    <Label>Delivery Instructions (Optional)</Label>
                    <Textarea
                      value={customerInfo.special_instructions || ''}
                      onChange={(e) => onCustomerInfoChange({ special_instructions: e.target.value })}
                      placeholder="Gate code, door color, etc."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cart Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Cart is empty</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${(item.price_cents / 100).toFixed(2)}
                            {item.modifiers && item.modifiers.length > 0 && (
                              <span className="block text-xs">
                                + {item.modifiers.map(m => m.name).join(', ')}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {item.special_instructions && (
                        <p className="text-xs text-muted-foreground italic">
                          Note: {item.special_instructions}
                        </p>
                      )}
                      <Separator />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={paymentMethod} onValueChange={(v: any) => onPaymentMethodChange(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="phone_payment">Phone Payment</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${(totals.subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>${(totals.tax / 100).toFixed(2)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee:</span>
                    <span>${(totals.deliveryFee / 100).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${(totals.total / 100).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Submit Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || cart.length === 0}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {isSubmitting ? 'Processing...' : `Place Order - $${(totals.total / 100).toFixed(2)}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
