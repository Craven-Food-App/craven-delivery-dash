
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus } from "lucide-react";

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

interface MenuItemModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, specialInstructions?: string) => void;
}

export const MenuItemModal = ({ item, onClose, onAddToCart }: MenuItemModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const handleAddToCart = () => {
    onAddToCart(item, quantity, specialInstructions);
    onClose();
  };

  const totalPrice = (item.price_cents * quantity) / 100;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-left">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
