import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, Pencil, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantData } from "@/hooks/useRestaurantData";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  category: string;
  is_available: boolean;
  image_url?: string;
}

const MenuManagerDashboard = () => {
  const { restaurant } = useRestaurantData();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurant?.id) {
      fetchMenuItems();
    }
  }, [restaurant?.id]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select(`
          *,
          menu_categories!inner(name)
        `)
        .eq("restaurant_id", restaurant?.id)
        .order("category_id", { ascending: true });

      if (error) throw error;
      
      const itemsWithCategory = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price_cents: item.price_cents,
        category: item.menu_categories?.name || 'Uncategorized',
        is_available: item.is_available,
        image_url: item.image_url,
      }));
      
      setMenuItems(itemsWithCategory);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: !currentStatus })
        .eq("id", itemId);

      if (error) throw error;
      
      setMenuItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, is_available: !currentStatus } : item
        )
      );
      toast.success("Item availability updated");
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    }
  };

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <FileText className="w-10 h-10 animate-pulse text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (menuItems.length === 0) {
    return (
      <div className="space-y-6 pb-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 mb-6">
              <div className="w-full h-full rounded-lg bg-muted flex items-center justify-center">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">We're preparing your menu</h2>
            
            <div className="max-w-md text-center space-y-2">
              <p className="text-sm">
                You'll <span className="text-primary underline">receive an email</span> when your menu is ready to review.
              </p>
              <p className="text-sm">
                Your menu will <span className="text-primary underline">appear here</span> when it's ready.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Menu Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{menuItems.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {menuItems.filter(i => i.is_available).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {categories.map(category => {
          const categoryItems = filteredItems.filter(item => item.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            {!item.is_available && (
                              <Badge variant="secondary">Unavailable</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {item.description}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            ${(item.price_cents / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAvailability(item.id, item.is_available)}
                        >
                          {item.is_available ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MenuManagerDashboard;
