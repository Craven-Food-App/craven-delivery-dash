
// @ts-nocheck
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Minus, Plus } from "lucide-react";
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

  const handleModifierToggle = (modifierId: string) => {
    setModifiers(prev => 
      prev.map(mod => 
        mod.id === modifierId 
          ? { ...mod, selected: !mod.selected }
          : mod
      )
    );
  };

  const handleAddToCart = () => {
    onAddToCart(item, quantity, modifiers.filter(m => m.selected), specialInstructions);
    onClose();
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
          {!loading && modifiers.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-3 block">
                Customize Your Order
              </label>
              <div className="space-y-3">
                {modifiers.map((modifier) => (
                  <div key={modifier.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={modifier.id}
                      checked={modifier.selected}
                      onCheckedChange={() => handleModifierToggle(modifier.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <label 
                          htmlFor={modifier.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {modifier.name}
                        </label>
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
                    </div>
                  </div>
                ))}
              </div>
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
