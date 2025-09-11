
// @ts-nocheck
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, AlertCircle, ChefHat, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  preparation_time: number;
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

interface MenuItemModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, modifiers: SelectedModifier[], specialInstructions?: string) => void;
}

export const MenuItemModal = ({ item, onClose, onAddToCart }: MenuItemModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [modifiers, setModifiers] = useState<SelectedModifier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModifiers = async () => {
      const { data, error } = await supabase
        .from('menu_item_modifiers')
        .select('*')
        .eq('menu_item_id', item.id)
        .eq('is_available', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        setModifiers(data.map(mod => ({ ...mod, selected: false })));
      }
      setLoading(false);
    };

    fetchModifiers();
  }, [item.id]);

  const handleModifierToggle = (modifierId: string, modifierType: string) => {
    setModifiers(prev => {
      if (modifierType === 'size') {
        // For size modifiers, only one can be selected at a time
        return prev.map(mod => 
          mod.modifier_type === 'size'
            ? { ...mod, selected: mod.id === modifierId }
            : mod
        );
      } else {
        // For other modifiers, toggle normally
        return prev.map(mod => 
          mod.id === modifierId 
            ? { ...mod, selected: !mod.selected }
            : mod
        );
      }
    });
  };

  const handleAddToCart = () => {
    // Check if required modifiers are selected
    const requiredModifiers = modifiers.filter(m => m.is_required);
    const selectedRequiredModifiers = requiredModifiers.filter(m => m.selected);
    
    if (requiredModifiers.length > 0 && selectedRequiredModifiers.length === 0) {
      return; // Don't add to cart if required modifiers aren't selected
    }
    
    onAddToCart(item, quantity, modifiers.filter(m => m.selected), specialInstructions);
    onClose();
  };

  // Group modifiers by type
  const modifiersByType = modifiers.reduce((acc, modifier) => {
    if (!acc[modifier.modifier_type]) {
      acc[modifier.modifier_type] = [];
    }
    acc[modifier.modifier_type].push(modifier);
    return acc;
  }, {} as Record<string, SelectedModifier[]>);

  const getModifierTypeIcon = (type: string) => {
    switch (type) {
      case 'size': return '📏';
      case 'addon': return '➕';
      case 'removal': return '➖';
      case 'substitution': return '🔄';
      case 'preparation': return '👨‍🍳';
      default: return '⚙️';
    }
  };

  const getModifierTypeLabel = (type: string) => {
    switch (type) {
      case 'size': return 'Size Options';
      case 'addon': return 'Add-Ons';
      case 'removal': return 'Remove Items';
      case 'substitution': return 'Substitutions';
      case 'preparation': return 'Preparation Style';
      default: return 'Options';
    }
  };

  const selectedModifiers = modifiers.filter(m => m.selected);
  const modifiersPrice = selectedModifiers.reduce((sum, mod) => sum + mod.price_cents, 0);
  const totalPrice = ((item.price_cents + modifiersPrice) * quantity) / 100;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pb-4">
          {item.image_url && (
            <div className="w-full h-48 rounded-lg overflow-hidden">
              <img 
                src={item.image_url} 
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-2">
              {item.is_vegetarian && <Badge variant="secondary" className="text-xs">Vegetarian</Badge>}
              {item.is_vegan && <Badge variant="secondary" className="text-xs">Vegan</Badge>}
              {item.is_gluten_free && <Badge variant="secondary" className="text-xs">Gluten Free</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">
              {item.description}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Prep time: ~{item.preparation_time} minutes
            </p>
          </div>

          {/* Modifiers Section */}
          {!loading && Object.keys(modifiersByType).length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold">Customize Your Order</h3>
              </div>
              
              {Object.entries(modifiersByType)
                .sort(([a], [b]) => {
                  // Sort by importance: size first, then others
                  const order = ['size', 'addon', 'removal', 'substitution', 'preparation'];
                  return order.indexOf(a) - order.indexOf(b);
                })
                .map(([type, typeModifiers]) => (
                  <div key={type} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getModifierTypeIcon(type)}</span>
                      <h4 className="text-sm font-medium text-foreground">
                        {getModifierTypeLabel(type)}
                        {typeModifiers.some(m => m.is_required) && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </h4>
                    </div>
                    
                    {type === 'size' ? (
                      // Radio group for size selection
                      <RadioGroup
                        value={typeModifiers.find(m => m.selected)?.id || ''}
                        onValueChange={(value) => handleModifierToggle(value, 'size')}
                      >
                        {typeModifiers.map((modifier) => (
                          <div key={modifier.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={modifier.id} id={modifier.id} />
                            <Label htmlFor={modifier.id} className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{modifier.name}</span>
                                {modifier.price_cents > 0 && (
                                  <span className="text-sm text-muted-foreground">
                                    +${(modifier.price_cents / 100).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              {modifier.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {modifier.description}
                                </p>
                              )}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      // Checkboxes for other modifier types
                      <div className="space-y-2">
                        {typeModifiers.map((modifier) => (
                          <div key={modifier.id} className="flex items-start space-x-3">
                            <Checkbox
                              id={modifier.id}
                              checked={modifier.selected}
                              onCheckedChange={() => handleModifierToggle(modifier.id, type)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <Label 
                                  htmlFor={modifier.id}
                                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                >
                                  {type === 'removal' && <X className="h-3 w-3 text-destructive" />}
                                  {modifier.name}
                                </Label>
                                {modifier.price_cents > 0 && (
                                  <span className="text-sm text-muted-foreground">
                                    +${(modifier.price_cents / 100).toFixed(2)}
                                  </span>
                                )}
                                {modifier.price_cents < 0 && (
                                  <span className="text-sm text-green-600">
                                    -${Math.abs(modifier.price_cents / 100).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              {modifier.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {modifier.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {type !== Object.keys(modifiersByType)[Object.keys(modifiersByType).length - 1] && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              
              {/* Required modifier warning */}
              {modifiers.some(m => m.is_required && !m.selected) && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <p className="text-xs text-destructive">
                    Please select required options before adding to cart.
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">
              Special Instructions (optional)
            </label>
            <Textarea
              placeholder="Add any special requests..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-lg w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={handleAddToCart} size="lg">
              Add to Cart • ${totalPrice.toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
