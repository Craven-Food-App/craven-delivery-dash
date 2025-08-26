import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, DollarSign, Upload, X, Image } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  category_id?: string;
  is_available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  image_url?: string;
  allergens?: string[];
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  display_order: number;
}

interface MenuManagementProps {
  restaurantId: string;
}

export const MenuManagement = ({ restaurantId }: MenuManagementProps) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price_cents: 0,
    category_id: "",
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    allergens: [] as string[],
    image_url: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchData();
  }, [restaurantId]);

  const fetchData = async () => {
    try {
      const [categoriesResponse, itemsResponse] = await Promise.all([
        supabase
          .from("menu_categories")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .order("display_order"),
        supabase
          .from("menu_items")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .order("display_order"),
      ]);

      if (categoriesResponse.error) throw categoriesResponse.error;
      if (itemsResponse.error) throw itemsResponse.error;

      setCategories(categoriesResponse.data || []);
      setMenuItems(itemsResponse.data || []);
    } catch (error) {
      console.error("Error fetching menu data:", error);
      toast({
        title: "Error",
        description: "Failed to load menu data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    try {
      const { error } = await supabase
        .from("menu_categories")
        .insert({
          ...newCategory,
          restaurant_id: restaurantId,
          display_order: categories.length,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category added successfully",
      });

      setNewCategory({ name: "", description: "" });
      setIsAddingCategory(false);
      fetchData();
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${restaurantId}/${Date.now()}.${fileExt}`;
      
      console.log('Attempting to upload:', fileName);
      console.log('Restaurant ID:', restaurantId);
      console.log('File size:', file.size);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }
      
      console.log('Upload successful:', uploadData);

      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setNewItem({ ...newItem, image_url: imageUrl });
    }
  };

  const addMenuItem = async () => {
    try {
      const itemData = {
        ...newItem,
        restaurant_id: restaurantId,
        display_order: menuItems.length,
        category_id: newItem.category_id || null, // Convert empty string to null
      };
      
      const { error } = await supabase
        .from("menu_items")
        .insert(itemData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item added successfully",
      });

      setNewItem({
        name: "",
        description: "",
        price_cents: 0,
        category_id: "",
        is_vegetarian: false,
        is_vegan: false,
        is_gluten_free: false,
        allergens: [],
        image_url: "",
      });
      setIsAddingItem(false);
      fetchData();
    } catch (error) {
      console.error("Error adding menu item:", error);
      toast({
        title: "Error",
        description: "Failed to add menu item",
        variant: "destructive",
      });
    }
  };

  const updateMenuItem = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update(item)
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item updated successfully",
      });

      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error("Error updating menu item:", error);
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive",
      });
    }
  };

  const toggleItemAvailability = async (itemId: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: isAvailable })
        .eq("id", itemId);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error("Error updating availability:", error);
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading menu...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="items" className="w-full">
        <TabsList>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Menu Items</h3>
            <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Menu Item</DialogTitle>
                  <DialogDescription>
                    Add a new item to your menu.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="item-name">Name</Label>
                    <Input
                      id="item-name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="item-description">Description</Label>
                    <Textarea
                      id="item-description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="item-price">Price ($)</Label>
                    <Input
                      id="item-price"
                      type="number"
                      step="0.01"
                      value={newItem.price_cents / 100}
                      onChange={(e) => setNewItem({ ...newItem, price_cents: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="item-category">Category</Label>
                    <Select value={newItem.category_id} onValueChange={(value) => setNewItem({ ...newItem, category_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="item-image">Image</Label>
                    <div className="flex flex-col gap-2">
                      <Input
                        id="item-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                      {uploadingImage && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Upload className="h-4 w-4 animate-spin" />
                          Uploading image...
                        </div>
                      )}
                      {newItem.image_url && (
                        <div className="relative">
                          <img
                            src={newItem.image_url}
                            alt="Menu item preview"
                            className="w-24 h-24 object-cover rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => setNewItem({ ...newItem, image_url: "" })}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="vegetarian"
                        checked={newItem.is_vegetarian}
                        onCheckedChange={(checked) => setNewItem({ ...newItem, is_vegetarian: checked })}
                      />
                      <Label htmlFor="vegetarian">Vegetarian</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="vegan"
                        checked={newItem.is_vegan}
                        onCheckedChange={(checked) => setNewItem({ ...newItem, is_vegan: checked })}
                      />
                      <Label htmlFor="vegan">Vegan</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="gluten-free"
                        checked={newItem.is_gluten_free}
                        onCheckedChange={(checked) => setNewItem({ ...newItem, is_gluten_free: checked })}
                      />
                      <Label htmlFor="gluten-free">Gluten Free</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addMenuItem}>Add Item</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {menuItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {item.image_url ? (
                      <div className="flex-shrink-0">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{item.name}</h4>
                        <Badge variant={item.is_available ? "default" : "secondary"}>
                          {item.is_available ? "Available" : "Unavailable"}
                        </Badge>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">{(item.price_cents / 100).toFixed(2)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      <div className="flex gap-2 mt-2">
                        {item.is_vegetarian && <Badge variant="outline">Vegetarian</Badge>}
                        {item.is_vegan && <Badge variant="outline">Vegan</Badge>}
                        {item.is_gluten_free && <Badge variant="outline">Gluten Free</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.is_available}
                        onCheckedChange={(checked) => toggleItemAvailability(item.id, checked)}
                      />
                      <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Edit Item Dialog */}
          {editingItem && (
            <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Menu Item</DialogTitle>
                  <DialogDescription>
                    Update your menu item details.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-item-name">Name</Label>
                    <Input
                      id="edit-item-name"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-item-description">Description</Label>
                    <Textarea
                      id="edit-item-description"
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-item-price">Price ($)</Label>
                    <Input
                      id="edit-item-price"
                      type="number"
                      step="0.01"
                      value={editingItem.price_cents / 100}
                      onChange={(e) => setEditingItem({ ...editingItem, price_cents: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-item-category">Category</Label>
                    <Select 
                      value={editingItem.category_id || ""} 
                      onValueChange={(value) => setEditingItem({ ...editingItem, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-item-image">Image</Label>
                    <div className="flex flex-col gap-2">
                      <Input
                        id="edit-item-image"
                        type="file"
                        accept="image/*"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;

                          if (!file.type.startsWith('image/')) {
                            toast({
                              title: "Error",
                              description: "Please select an image file",
                              variant: "destructive",
                            });
                            return;
                          }

                          const imageUrl = await uploadImage(file);
                          if (imageUrl) {
                            setEditingItem({ ...editingItem, image_url: imageUrl });
                          }
                        }}
                        disabled={uploadingImage}
                      />
                      {uploadingImage && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Upload className="h-4 w-4 animate-spin" />
                          Uploading image...
                        </div>
                      )}
                      {editingItem.image_url && (
                        <div className="relative">
                          <img
                            src={editingItem.image_url}
                            alt="Menu item preview"
                            className="w-24 h-24 object-cover rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => setEditingItem({ ...editingItem, image_url: "" })}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-vegetarian"
                        checked={editingItem.is_vegetarian}
                        onCheckedChange={(checked) => setEditingItem({ ...editingItem, is_vegetarian: checked })}
                      />
                      <Label htmlFor="edit-vegetarian">Vegetarian</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-vegan"
                        checked={editingItem.is_vegan}
                        onCheckedChange={(checked) => setEditingItem({ ...editingItem, is_vegan: checked })}
                      />
                      <Label htmlFor="edit-vegan">Vegan</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-gluten-free"
                        checked={editingItem.is_gluten_free}
                        onCheckedChange={(checked) => setEditingItem({ ...editingItem, is_gluten_free: checked })}
                      />
                      <Label htmlFor="edit-gluten-free">Gluten Free</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingItem(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => updateMenuItem(editingItem)}>
                    Update Item
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Categories</h3>
            <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Category</DialogTitle>
                  <DialogDescription>
                    Add a new category to organize your menu items.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category-name">Name</Label>
                    <Input
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category-description">Description</Label>
                    <Textarea
                      id="category-description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addCategory}>Add Category</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {category.name}
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                  {category.description && (
                    <CardDescription>{category.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};