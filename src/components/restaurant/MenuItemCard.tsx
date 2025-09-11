import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Heart } from 'lucide-react';

interface MenuItemCardProps {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url?: string;
  category: string;
  is_available: boolean;
  dietary_info?: string[];
  onAddToCart: (id: string) => void;
  onCustomize?: (item: any) => void;
}

const MenuItemCard = ({
  id,
  name,
  description,
  price_cents,
  image_url,
  category,
  is_available,
  dietary_info,
  onAddToCart,
  onCustomize
}: MenuItemCardProps) => {
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 group">
      <CardContent className="p-0">
        <div className="flex gap-4 p-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {name}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-muted-foreground leading-relaxed text-sm">
              {description}
            </p>
            
            {dietary_info && dietary_info.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {dietary_info.map((info) => (
                  <Badge 
                    key={info} 
                    variant="outline" 
                    className="text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    {info}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <span className="text-2xl font-bold text-foreground">
                {formatPrice(price_cents)}
              </span>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => onAddToCart(id)}
                  disabled={!is_available}
                  size="sm"
                  variant="outline"
                  className="border-primary/20 hover:bg-primary/10 text-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Quick Add
                </Button>
                
                {onCustomize && (
                  <Button 
                    onClick={() => onCustomize({
                      id, name, description, price_cents, image_url, 
                      category, is_available, dietary_info
                    })}
                    disabled={!is_available}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Customize
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {image_url && (
            <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden group-hover:shadow-lg transition-shadow">
              <img
                src={image_url}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuItemCard;